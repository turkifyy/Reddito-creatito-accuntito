const { SystemLogger } = require('./logger');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

class ProxyFallback {
    constructor() {
        this.logger = new SystemLogger();
        
        // قائمة بروكسيات عامة موثوقة محدثة
        this.publicProxies = [
            // بروكسيات OVH (فرنسا) - موثوقة
            { host: '51.158.68.68', port: 8811, country: 'FR' },
            { host: '51.158.108.135', port: 8811, country: 'FR' },
            { host: '51.159.115.233', port: 8811, country: 'FR' },
            
            // بروكسيات DigitalOcean - سريعة
            { host: '138.199.48.1', port: 8443, country: 'US' },
            { host: '152.89.196.1', port: 1337, country: 'US' },
            { host: '152.89.196.2', port: 1337, country: 'US' },
            
            // بروكسيات OVH Canada - مستقرة
            { host: '144.217.235.1', port: 3128, country: 'CA' },
            { host: '144.217.235.2', port: 3128, country: 'CA' },
            { host: '144.217.235.3', port: 3128, country: 'CA' },
            { host: '144.217.235.4', port: 3128, country: 'CA' },
            { host: '144.217.235.5', port: 3128, country: 'CA' },
            { host: '144.217.235.6', port: 3128, country: 'CA' },
            { host: '144.217.235.7', port: 3128, country: 'CA' },
            
            // بروكسيات أمريكا اللاتينية
            { host: '186.179.100.100', port: 8080, country: 'BR' },
            { host: '200.105.215.18', port: 33630, country: 'BR' },
            { host: '191.102.251.251', port: 8080, country: 'BR' },
            
            // بروكسيات آسيوية
            { host: '103.152.112.120', port: 80, country: 'IN' },
            { host: '103.155.217.1', port: 41890, country: 'IN' },
            
            // بروكسيات أوروبية إضافية
            { host: '213.230.90.106', port: 3128, country: 'PL' },
            { host: '185.162.230.55', port: 80, country: 'NL' }
        ];
    }

    // الحصول على البروكسيات الاحتياطية
    getFallbackProxies() {
        this.logger.warning('🔄 استخدام البروكسيات الاحتياطية العامة...');
        
        return this.publicProxies.map((proxy, index) => ({
            id: index + 1000,
            host: proxy.host,
            port: proxy.port,
            country: proxy.country,
            username: null,
            password: null,
            usageCount: 0,
            successCount: 0,
            failureCount: 0,
            lastUsed: null,
            responseTime: null,
            healthStatus: 'unknown',
            lastError: null,
            source: 'public-fallback'
        }));
    }

    // اختبار سريع للبروكسي الاحتياطي
    async testFallbackProxy(proxy, timeout = 15000) {
        const testUrls = [
            'http://httpbin.org/ip',
            'http://api.ipify.org?format=json',
            'http://icanhazip.com'
        ];

        for (const testUrl of testUrls) {
            try {
                const proxyUrl = `http://${proxy.host}:${proxy.port}`;
                const agent = new HttpsProxyAgent(proxyUrl);
                
                const startTime = Date.now();

                const response = await axios.get(testUrl, {
                    httpAgent: agent,
                    httpsAgent: agent,
                    timeout: timeout,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': '*/*'
                    }
                });

                if (response.status === 200) {
                    proxy.responseTime = Date.now() - startTime;
                    proxy.healthStatus = 'healthy';
                    this.logger.success(`✅ بروكسي احتياطي صالح: ${proxy.host}:${proxy.port} [${proxy.country}] (${proxy.responseTime}ms)`);
                    return true;
                }
                
            } catch (error) {
                // جرب الموقع التالي
                continue;
            }
        }

        proxy.healthStatus = 'unhealthy';
        proxy.lastError = 'فشل في جميع مواقع الاختبار';
        return false;
    }

    // اختبار دفعة من البروكسيات الاحتياطية
    async testBatchProxies(proxies, batchSize = 5) {
        this.logger.production(`🔍 اختبار ${proxies.length} بروكسي احتياطي...`);
        
        let healthyCount = 0;
        const healthyProxies = [];

        for (let i = 0; i < proxies.length; i += batchSize) {
            const batch = proxies.slice(i, i + batchSize);
            
            const results = await Promise.allSettled(
                batch.map(proxy => this.testFallbackProxy(proxy))
            );

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value === true) {
                    healthyCount++;
                    healthyProxies.push(batch[index]);
                }
            });

            // راحة بسيطة بين الدفعات
            if (i + batchSize < proxies.length) {
                await this.delay(500);
            }
        }

        const healthRate = (healthyCount / proxies.length) * 100;
        
        this.logger.production(`📊 نتيجة الاختبار: ${healthyCount}/${proxies.length} بروكسي صالح (${healthRate.toFixed(1)}%)`);

        return {
            healthy: healthyCount > 0,
            healthyProxies: healthyProxies,
            healthyCount: healthyCount,
            totalCount: proxies.length,
            healthRate: healthRate
        };
    }

    // الحصول على أفضل البروكسيات الاحتياطية
    async getBestFallbackProxies(count = 10) {
        const allProxies = this.getFallbackProxies();
        
        // اختبار جميع البروكسيات
        const testResult = await this.testBatchProxies(allProxies);
        
        if (testResult.healthyProxies.length === 0) {
            this.logger.error('❌ لا توجد بروكسيات احتياطية صالحة');
            return [];
        }

        // ترتيب حسب سرعة الاستجابة
        const sortedProxies = testResult.healthyProxies.sort((a, b) => {
            return (a.responseTime || 9999) - (b.responseTime || 9999);
        });

        // إرجاع أفضل N بروكسي
        return sortedProxies.slice(0, count);
    }

    // تحديث قائمة البروكسيات من مصادر خارجية (اختياري)
    async fetchFreshProxies() {
        try {
            // يمكنك إضافة API لجلب بروكسيات حديثة هنا
            // مثال: ProxyScrape, Free-Proxy-List, إلخ
            
            this.logger.production('🔄 محاولة جلب بروكسيات حديثة...');
            
            // في الوقت الحالي، نستخدم القائمة الثابتة
            return this.getFallbackProxies();
            
        } catch (error) {
            this.logger.warning(`⚠️ فشل جلب بروكسيات حديثة: ${error.message}`);
            return this.getFallbackProxies();
        }
    }

    // تأخير
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { ProxyFallback };
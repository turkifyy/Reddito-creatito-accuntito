const { SystemLogger } = require('./logger');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

class ProxyManager {
    constructor() {
        this.logger = new SystemLogger();
        this.proxies = [];
        this.currentProxyIndex = 0;
        this.healthChecked = false;
        this.maxRetries = 3;
        this.testTimeout = 25000; // 25 ثانية للبروكسيات البطيئة
        
        // بروكسيات احتياطية موثوقة للإنتاج
        this.fallbackProxies = [
            { host: '138.199.48.1', port: 8443 },
            { host: '152.89.196.1', port: 1337 },
            { host: '152.89.196.2', port: 1337 },
            { host: '144.217.235.1', port: 3128 },
            { host: '144.217.235.2', port: 3128 },
            { host: '144.217.235.3', port: 3128 },
            { host: '144.217.235.4', port: 3128 },
            { host: '144.217.235.5', port: 3128 },
            { host: '144.217.235.6', port: 3128 },
            { host: '144.217.235.7', port: 3128 },
            { host: '51.158.68.68', port: 8811 },
            { host: '186.179.100.100', port: 8080 },
            { host: '200.105.215.18', port: 33630 }
        ];
    }

    // تحميل البروكسيات من البيئة مع فول باك ذكي
    async loadProductionProxies() {
        try {
            const proxiesText = process.env.PROXY_LIST;
            let userProxies = [];

            // محاولة تحميل بروكسيات المستخدم
            if (proxiesText && proxiesText.trim()) {
                this.logger.production('📡 تحميل بروكسيات المستخدم...');
                
                const proxyLines = proxiesText.split('\n')
                    .filter(line => line.trim())
                    .map(line => line.trim());

                userProxies = proxyLines.map((line, index) => {
                    const parts = line.split(':');
                    
                    if (parts.length < 2) {
                        this.logger.warning(`⚠️ تنسيق غير صالح: ${line}`);
                        return null;
                    }

                    return {
                        id: index + 1,
                        host: parts[0].trim(),
                        port: parseInt(parts[1].trim()) || 8080,
                        username: parts[2] ? parts[2].trim() : null,
                        password: parts[3] ? parts[3].trim() : null,
                        usageCount: 0,
                        successCount: 0,
                        failureCount: 0,
                        lastUsed: null,
                        responseTime: null,
                        healthStatus: 'unknown',
                        lastError: null,
                        source: 'user'
                    };
                }).filter(proxy => proxy !== null);
            }

            // إضافة البروكسيات الاحتياطية
            const fallbackList = this.fallbackProxies.map((proxy, index) => ({
                id: userProxies.length + index + 1000,
                host: proxy.host,
                port: proxy.port,
                username: null,
                password: null,
                usageCount: 0,
                successCount: 0,
                failureCount: 0,
                lastUsed: null,
                responseTime: null,
                healthStatus: 'unknown',
                lastError: null,
                source: 'fallback'
            }));

            // دمج القوائم
            this.proxies = [...userProxies, ...fallbackList];

            if (this.proxies.length === 0) {
                throw new Error('لا توجد بروكسيات متاحة للتحميل');
            }

            this.logger.production(`✅ تم تحميل ${this.proxies.length} بروكسي (${userProxies.length} مستخدم + ${fallbackList.length} احتياطي)`);
            
            // خلط البروكسيات لتوزيع أفضل
            this.proxies = this.shuffleArray(this.proxies);
            
            return true;

        } catch (error) {
            this.logger.error(`❌ خطأ في تحميل البروكسيات: ${error.message}`);
            
            // استخدام الاحتياطي فقط في حالة الفشل التام
            if (this.proxies.length === 0) {
                this.logger.warning('🔄 استخدام البروكسيات الاحتياطية فقط...');
                this.proxies = this.fallbackProxies.map((proxy, index) => ({
                    id: index + 1,
                    host: proxy.host,
                    port: proxy.port,
                    username: null,
                    password: null,
                    usageCount: 0,
                    successCount: 0,
                    failureCount: 0,
                    lastUsed: null,
                    responseTime: null,
                    healthStatus: 'unknown',
                    lastError: null,
                    source: 'fallback'
                }));
            }
            
            return this.proxies.length > 0;
        }
    }

    // اختبار صحة البروكسي بطرق متعددة
    async testProxyHealth(proxy, retryCount = 0) {
        const testUrls = [
            'http://httpbin.org/ip',
            'http://api.ipify.org?format=json',
            'http://ipinfo.io/json',
            'http://icanhazip.com',
            'http://checkip.amazonaws.com'
        ];

        for (const testUrl of testUrls) {
            try {
                const proxyUrl = proxy.username && proxy.password
                    ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
                    : `http://${proxy.host}:${proxy.port}`;

                const agent = new HttpsProxyAgent(proxyUrl);
                const startTime = Date.now();

                const response = await axios.get(testUrl, {
                    httpAgent: agent,
                    httpsAgent: agent,
                    timeout: this.testTimeout,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json, text/plain, */*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Connection': 'keep-alive'
                    },
                    validateStatus: (status) => status === 200
                });

                if (response.status === 200 && response.data) {
                    proxy.responseTime = Date.now() - startTime;
                    proxy.lastError = null;
                    proxy.healthStatus = 'healthy';
                    proxy.lastHealthCheck = new Date().toISOString();
                    return true;
                }
                
            } catch (error) {
                // محاولة الموقع التالي
                continue;
            }
        }

        // إذا فشلت جميع المواقع، حاول مرة أخرى
        if (retryCount < this.maxRetries) {
            await this.delay(2000);
            return this.testProxyHealth(proxy, retryCount + 1);
        }

        proxy.lastError = 'فشل في جميع مواقع الاختبار بعد عدة محاولات';
        proxy.healthStatus = 'unhealthy';
        proxy.responseTime = null;
        return false;
    }

    // التحقق من صحة البروكسيات مع نظام مرن
    async validateProxies() {
        try {
            await this.loadProductionProxies();
            
            if (this.proxies.length === 0) {
                return { 
                    healthy: false, 
                    error: 'لا توجد بروكسيات متاحة للاختبار',
                    healthRate: '0%',
                    healthyCount: 0,
                    sampleSize: 0
                };
            }

            // اختبار عينة معقولة
            const sampleSize = Math.min(15, this.proxies.length);
            const sampleProxies = this.getRandomProxies(sampleSize);
            
            this.logger.production(`🔍 التحقق من صحة ${sampleSize} بروكسي...`);
            
            let healthyCount = 0;
            const testPromises = [];

            // اختبار متوازي محدود (5 في وقت واحد)
            const batchSize = 5;
            for (let i = 0; i < sampleProxies.length; i += batchSize) {
                const batch = sampleProxies.slice(i, i + batchSize);
                
                const batchResults = await Promise.allSettled(
                    batch.map(proxy => this.testProxyHealth(proxy))
                );

                batchResults.forEach((result, index) => {
                    const proxy = batch[index];
                    const isHealthy = result.status === 'fulfilled' && result.value === true;
                    
                    if (isHealthy) {
                        healthyCount++;
                        this.logger.success(`✅ بروكسي صالح: ${proxy.host}:${proxy.port} (${proxy.responseTime}ms) [${proxy.source}]`);
                    } else {
                        this.logger.warning(`❌ بروكسي فاشل: ${proxy.host}:${proxy.port} [${proxy.source}]`);
                    }
                });

                // راحة بسيطة بين الدفعات
                if (i + batchSize < sampleProxies.length) {
                    await this.delay(1000);
                }
            }

            const healthRate = (healthyCount / sampleSize) * 100;
            this.healthChecked = true;

            // نظام مرن للتقييم
            const minHealthRate = 5; // 5% كحد أدنى للإنتاج
            
            if (healthyCount === 0) {
                return {
                    healthy: false,
                    healthRate: '0%',
                    error: '⚠️ لا توجد بروكسيات صالحة - سيتم المحاولة مع جميع البروكسيات',
                    healthyCount: 0,
                    sampleSize: sampleSize,
                    warning: true
                };
            }
            
            if (healthRate >= minHealthRate) {
                return { 
                    healthy: true, 
                    healthRate: `${healthRate.toFixed(1)}%`,
                    message: `✅ تم العثور على ${healthyCount} بروكسي صالح من ${sampleSize}`,
                    sampleSize: sampleSize,
                    healthyCount: healthyCount
                };
            } else {
                return { 
                    healthy: true, // نسمح بالمتابعة
                    healthRate: `${healthRate.toFixed(1)}%`,
                    warning: `⚠️ نسبة منخفضة: ${healthyCount} بروكسي صالح فقط - سيتم المحاولة`,
                    sampleSize: sampleSize,
                    healthyCount: healthyCount
                };
            }

        } catch (error) {
            this.logger.error(`❌ خطأ في التحقق: ${error.message}`);
            return { 
                healthy: true, // نسمح بالمتابعة حتى مع الأخطاء
                error: `تحذير: ${error.message} - سيتم المحاولة مع البروكسيات المتاحة`,
                healthRate: 'غير معروف',
                warning: true
            };
        }
    }

    // الحصول على بروكسي بنظام دائري ذكي
    getNextProxy() {
        if (this.proxies.length === 0) {
            throw new Error('لا توجد بروكسيات متاحة');
        }

        // فلتر البروكسيات الصالحة أولاً
        const healthyProxies = this.proxies.filter(p => p.healthStatus === 'healthy');
        
        let proxy;
        if (healthyProxies.length > 0) {
            // استخدام البروكسيات الصالحة فقط
            const sortedHealthy = healthyProxies.sort((a, b) => {
                // ترتيب حسب الأقل استخداماً والأسرع
                if (a.usageCount !== b.usageCount) {
                    return a.usageCount - b.usageCount;
                }
                return (a.responseTime || 9999) - (b.responseTime || 9999);
            });
            
            proxy = sortedHealthy[0];
        } else {
            // استخدام أي بروكسي متاح
            this.currentProxyIndex = this.currentProxyIndex % this.proxies.length;
            proxy = this.proxies[this.currentProxyIndex];
            this.currentProxyIndex++;
        }

        // تحديث إحصائيات الاستخدام
        proxy.usageCount++;
        proxy.lastUsed = new Date().toISOString();

        return proxy;
    }

    // الحصول على بروكسيات عشوائية
    getRandomProxies(count) {
        const shuffled = this.shuffleArray([...this.proxies]);
        return shuffled.slice(0, count);
    }

    // خلط المصفوفة
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // تسجيل نجاح البروكسي
    recordSuccess(proxy) {
        if (proxy) {
            proxy.successCount++;
            proxy.healthStatus = 'healthy';
            proxy.lastError = null;
        }
    }

    // تسجيل فشل البروكسي
    recordFailure(proxy, error) {
        if (proxy) {
            proxy.failureCount++;
            proxy.lastError = error?.message || 'خطأ غير معروف';
            
            // وضع علامة غير صالح بعد 3 فشل متتالي
            if (proxy.failureCount >= 3) {
                proxy.healthStatus = 'unhealthy';
            }
        }
    }

    // الحصول على إحصائيات البروكسيات
    getProxyStats() {
        const stats = {
            total: this.proxies.length,
            healthy: this.proxies.filter(p => p.healthStatus === 'healthy').length,
            unhealthy: this.proxies.filter(p => p.healthStatus === 'unhealthy').length,
            unknown: this.proxies.filter(p => p.healthStatus === 'unknown').length,
            userProxies: this.proxies.filter(p => p.source === 'user').length,
            fallbackProxies: this.proxies.filter(p => p.source === 'fallback').length,
            totalUsage: this.proxies.reduce((sum, p) => sum + p.usageCount, 0),
            totalSuccess: this.proxies.reduce((sum, p) => sum + p.successCount, 0),
            totalFailure: this.proxies.reduce((sum, p) => sum + p.failureCount, 0)
        };

        stats.successRate = stats.totalUsage > 0 
            ? ((stats.totalSuccess / stats.totalUsage) * 100).toFixed(1) + '%'
            : '0%';

        return stats;
    }

    // تأخير
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // إعادة تعيين إحصائيات البروكسي
    resetProxyStats(proxy) {
        if (proxy) {
            proxy.usageCount = 0;
            proxy.successCount = 0;
            proxy.failureCount = 0;
            proxy.healthStatus = 'unknown';
            proxy.lastError = null;
        }
    }

    // تنظيف البروكسيات الفاشلة
    async cleanupFailedProxies() {
        const beforeCount = this.proxies.length;
        
        // إزالة البروكسيات التي فشلت أكثر من 10 مرات
        this.proxies = this.proxies.filter(proxy => proxy.failureCount < 10);
        
        const removedCount = beforeCount - this.proxies.length;
        
        if (removedCount > 0) {
            this.logger.production(`🧹 تم إزالة ${removedCount} بروكسي فاشل`);
        }

        // إعادة التحقق إذا أصبح العدد قليلاً
        if (this.proxies.length < 5) {
            this.logger.warning('⚠️ عدد البروكسيات قليل - إعادة التحميل...');
            await this.loadProductionProxies();
        }
    }
}

module.exports = { ProxyManager };
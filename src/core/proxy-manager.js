const { SystemLogger } = require('./logger');

class ProxyManager {
    constructor() {
        this.logger = new SystemLogger();
        this.proxies = [];
        this.proxyStats = new Map();
        this.healthChecked = false;
    }

    async loadProductionProxies() {
        try {
            const proxiesText = process.env.PROXY_LIST;
            if (!proxiesText) {
                throw new Error('قائمة البروكسيات غير موجودة');
            }

            const proxyLines = proxiesText.split('\n')
                .filter(line => line.trim())
                .map(line => line.trim());

            if (proxyLines.length === 0) {
                throw new Error('قائمة البروكسيات فارغة');
            }

            this.proxies = proxyLines.map((line, index) => {
                const parts = line.split(':');
                if (parts.length < 2) {
                    this.logger.warning(`⚠️ تنسيق بروكسي غير صالح: ${line}`);
                    return null;
                }

                return {
                    id: index + 1,
                    host: parts[0].trim(),
                    port: parseInt(parts[1].trim()) || 8080,
                    // لا يوجد username/password للبروكسيات العامة
                    username: null,
                    password: null,
                    usageCount: 0,
                    successCount: 0,
                    failureCount: 0,
                    lastUsed: null,
                    responseTime: null,
                    lastHealthCheck: null,
                    healthStatus: 'unknown',
                    lastError: null
                };
            }).filter(proxy => proxy !== null); // إزالة البروكسيات غير الصالحة

            this.logger.production(`✅ تم تحميل ${this.proxies.length} بروكسي عام للإنتاج`);
            return true;

        } catch (error) {
            this.logger.error(`❌ فشل تحميل البروكسيات: ${error.message}`);
            throw error;
        }
    }

    async validateProxies() {
        try {
            await this.loadProductionProxies();
            
            if (this.proxies.length === 0) {
                return { 
                    healthy: false, 
                    error: 'لا توجد بروكسيات متاحة' 
                };
            }

            this.logger.production(`🔍 التحقق من صحة ${Math.min(15, this.proxies.length)} بروكسي عشوائي...`);
            
            let healthyCount = 0;
            const sampleSize = Math.min(15, this.proxies.length);
            const sampleProxies = this.getRandomProxies(sampleSize);
            
            const healthChecks = sampleProxies.map(async (proxy) => {
                const isHealthy = await this.testProxyHealth(proxy);
                proxy.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
                proxy.lastHealthCheck = new Date().toISOString();
                
                if (isHealthy) healthyCount++;
                await this.delay(500); // تأخير أقل بين الاختبارات
            });

            await Promise.allSettled(healthChecks);

            const healthRate = (healthyCount / sampleSize) * 100;
            this.healthChecked = true;
            
            if (healthRate >= 30) { // تخفيض الحد الأدنى للبروكسيات العامة
                return { 
                    healthy: true, 
                    healthRate: `${healthRate.toFixed(1)}%`,
                    message: `نسبة البروكسيات السليمة: ${healthRate.toFixed(1)}%`,
                    sampleSize: sampleSize,
                    healthyCount: healthyCount,
                    totalProxies: this.proxies.length
                };
            } else {
                return { 
                    healthy: false, 
                    healthRate: `${healthRate.toFixed(1)}%`,
                    error: `نسبة البروكسيات السليمة منخفضة: ${healthRate.toFixed(1)}%`
                };
            }

        } catch (error) {
            return { 
                healthy: false, 
                error: `فشل تحقق البروكسيات: ${error.message}` 
            };
        }
    }

    async testProxyHealth(proxy) {
        try {
            const { HttpsProxyAgent } = require('https-proxy-agent');
            const axios = require('axios');
            
            const agent = new HttpsProxyAgent(`http://${proxy.host}:${proxy.port}`);

            const startTime = Date.now();
            const response = await axios.get('http://httpbin.org/ip', {
                httpsAgent: agent,
                timeout: 25000 // زيادة الوقت للبروكسيات العامة
            });

            proxy.responseTime = Date.now() - startTime;
            proxy.lastError = null;
            return response.status === 200;
            
        } catch (error) {
            proxy.lastError = error.message;
            proxy.responseTime = null;
            return false;
        }
    }

    async getProductionProxy() {
        if (this.proxies.length === 0) {
            throw new Error('لا توجد بروكسيات متاحة');
        }

        const proxy = this.selectOptimalProxy();
        proxy.usageCount++;
        proxy.lastUsed = new Date().toISOString();
        
        this.logger.production(`🔄 استخدام البروكسي #${proxy.id}: ${proxy.host}:${proxy.port}`);
        
        return proxy;
    }

    selectOptimalProxy() {
        // خوارزمية متطورة لاختيار البروكسي
        const weightedProxies = this.proxies.map(proxy => {
            let weight = 100; // وزن أساسي
            
            // تقليل وزن البروكسيات الفاشلة مؤخراً
            if (proxy.failureCount > 0) {
                weight -= (proxy.failureCount * 15); // تخفيف العقوبة
            }
            
            // زيادة وزن البروكسيات الناجحة
            if (proxy.successCount > 0) {
                weight += (proxy.successCount * 12);
            }
            
            // تقليل وزن البروكسيات المستخدمة حديثاً
            if (proxy.lastUsed) {
                const minutesSinceUse = (new Date() - new Date(proxy.lastUsed)) / (1000 * 60);
                if (minutesSinceUse < 3) { // تقليل وقت التبريد
                    weight -= 25;
                }
            }
            
            // تفضيل البروكسيات السليمة
            if (this.healthChecked) {
                if (proxy.healthStatus === 'healthy') {
                    weight += 40;
                } else if (proxy.healthStatus === 'unhealthy') {
                    weight -= 50;
                }
            }
            
            // تفضيل البروكسيات السريعة
            if (proxy.responseTime && proxy.responseTime < 5000) {
                weight += 30;
            } else if (proxy.responseTime && proxy.responseTime > 15000) {
                weight -= 20;
            }
            
            // إعطاء فرصة للبروكسيات غير المستخدمة
            if (proxy.usageCount === 0) {
                weight += 60;
            }
            
            return { 
                proxy, 
                weight: Math.max(1, weight) // وزن أدنى لضمان الاستخدام
            };
        });

        const totalWeight = weightedProxies.reduce((sum, item) => sum + item.weight, 0);
        
        if (totalWeight === 0) {
            // إذا كانت جميع الأوزان صفر، استخدم عشوائي بسيط
            return this.proxies[Math.floor(Math.random() * this.proxies.length)];
        }

        let random = Math.random() * totalWeight;
        
        for (const item of weightedProxies) {
            random -= item.weight;
            if (random <= 0) {
                return item.proxy;
            }
        }
        
        return this.proxies[0];
    }

    getRandomProxies(count) {
        const shuffled = [...this.proxies].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    async recordProxySuccess(proxy) {
        proxy.successCount++;
        proxy.healthStatus = 'healthy';
        proxy.lastError = null;
        this.logger.success(`✅ بروكسي #${proxy.id} نجح في المهمة`);
    }

    async recordProxyFailure(proxy, error) {
        proxy.failureCount++;
        
        if (error.includes('timeout') || error.includes('ECONNREFUSED') || error.includes('socket')) {
            proxy.healthStatus = 'unhealthy';
        }
        
        proxy.lastError = error.substring(0, 100);
        this.logger.warning(`⚠️ بروكسي #${proxy.id} فشل: ${error.substring(0, 100)}`);
    }

    getStats() {
        const totalProxies = this.proxies.length;
        const usedProxies = this.proxies.filter(p => p.usageCount > 0).length;
        const successfulProxies = this.proxies.filter(p => p.successCount > 0).length;
        const healthyProxies = this.proxies.filter(p => p.healthStatus === 'healthy').length;
        
        const successRate = totalProxies > 0 ? 
            (successfulProxies / totalProxies * 100).toFixed(1) : 0;

        const healthRate = totalProxies > 0 ? 
            (healthyProxies / totalProxies * 100).toFixed(1) : 0;

        return {
            totalProxies,
            usedProxies,
            successfulProxies,
            healthyProxies,
            successRate: `${successRate}%`,
            healthRate: `${healthRate}%`,
            healthStatus: healthRate >= 25 ? 'مقبول' : 'ضعيف'
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { ProxyManager };

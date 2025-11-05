const { SeleniumManager } = require('./core/selenium-manager');
const { GoogleSheetsManager } = require('./core/google-sheets-manager');
const { ProxyManager } = require('./core/proxy-manager');
const { SystemLogger } = require('./core/logger');

class RedditProductionSystem {
    constructor() {
        this.logger = new SystemLogger();
        this.seleniumManager = new SeleniumManager();
        this.sheetsManager = new GoogleSheetsManager();
        this.proxyManager = new ProxyManager();
        this.dailyTarget = 100;
        this.accountsCreated = 0;
        this.sessionStartTime = new Date();
        this.totalAttempts = 0;
        this.proxyStats = new Map();
    }

    async initializeProduction() {
        try {
            this.logger.production('🚀 تهيئة نظام الإنتاج مع Proxies عامة...');
            
            // التحقق من جميع المكونات
            await this.validateProductionEnvironment();
            
            // بدء جلسة جديدة في Google Sheets
            await this.sheetsManager.startNewSession(this.sessionStartTime);
            
            this.logger.production('✅ نظام الإنتاج جاهز للتشغيل');
            return true;
            
        } catch (error) {
            this.logger.error(`❌ فشل تهيئة الإنتاج: ${error.message}`);
            process.exit(1);
        }
    }

    async validateProductionEnvironment() {
        this.logger.production('🔍 التحقق من بيئة الإنتاج...');

        // 1. التحقق من Proxies
        this.logger.production('📡 التحقق من البروكسيات...');
        const proxyStatus = await this.proxyManager.validateProxies();
        if (!proxyStatus.healthy) {
            throw new Error(`Proxies غير صالحة: ${proxyStatus.error}`);
        }
        this.logger.success(`✅ ${proxyStatus.message}`);

        // 2. التحقق من Google Sheets
        this.logger.production('📊 التحقق من Google Sheets...');
        const sheetsStatus = await this.sheetsManager.validateConnection();
        if (!sheetsStatus.connected) {
            throw new Error(`Google Sheets غير متصل: ${sheetsStatus.error}`);
        }
        this.logger.success('✅ تم الاتصال بـ Google Sheets بنجاح');

        // 3. التحقق من Selenium
        this.logger.production('🤖 التحقق من Selenium...');
        const seleniumStatus = await this.seleniumManager.validateEnvironment();
        if (!seleniumStatus.ready) {
            throw new Error(`Selenium غير جاهز: ${seleniumStatus.error}`);
        }
        this.logger.success('✅ Selenium جاهز للتشغيل');

        this.logger.production('✅ جميع الخدمات جاهزة للإنتاج');
    }

    async startProductionCycle() {
        try {
            this.logger.production(`🎯 بدء دورة الإنتاج - الهدف: ${this.dailyTarget} حساب`);
            
            let cycle = 0;
            const maxCycles = 300;

            while (this.accountsCreated < this.dailyTarget && cycle < maxCycles) {
                cycle++;
                this.totalAttempts++;
                
                this.logger.production(`🔄 الدورة ${cycle} - النجاحات: ${this.accountsCreated}/${this.dailyTarget}`);
                
                const result = await this.executeProductionCycle(cycle);
                
                if (result.success) {
                    this.accountsCreated++;
                    
                    // حفظ البيانات في Google Sheets
                    await this.sheetsManager.saveAccountData(result);
                    
                    // تحديث إحصائيات البروكسي
                    await this.updateProxyPerformance(result.proxy, true);
                    
                    this.logger.success(`✅ حساب ${this.accountsCreated} مكتمل: ${result.username}`);
                } else {
                    // تسجيل فشل البروكسي
                    await this.updateProxyPerformance(result.proxy, false);
                }

                // حفظ إحصائيات البروكسيات كل 10 دورات
                if (cycle % 10 === 0) {
                    await this.saveProxyPerformance();
                }

                // تأخير ذكي بين الدورات
                if (this.accountsCreated < this.dailyTarget) {
                    const delay = this.calculateSmartDelay(this.accountsCreated, this.totalAttempts);
                    this.logger.production(`⏰ انتظار ${delay/1000} ثانية للدورة التالية...`);
                    await this.delay(delay);
                }
            }

            // حفظ إحصائيات البروكسيات النهائية
            await this.saveProxyPerformance();
            await this.finalizeProduction();
            
        } catch (error) {
            this.logger.error(`💥 خطأ حرج في الإنتاج: ${error.message}`);
            await this.emergencyShutdown();
        }
    }

    async executeProductionCycle(cycleNumber) {
        const proxy = await this.proxyManager.getProductionProxy();
        
        try {
            this.logger.production(`🌐 استخدام البروكسي: ${proxy.host}:${proxy.port}`);
            this.logger.production(`📧 استخدام besttemporaryemail.com - البريد: ${emailData.email}`);
            // إنشاء حساب باستخدام Selenium
            const accountResult = await this.seleniumManager.createRedditAccount(proxy);
            
            if (accountResult.success) {
                await this.proxyManager.recordProxySuccess(proxy);
                
                return {
                    success: true,
                    ...accountResult,
                    proxy: `${proxy.host}:${proxy.port}`,
                    cycle: cycleNumber,
                    session_id: this.sessionStartTime.getTime().toString()
                };
            } else {
                await this.proxyManager.recordProxyFailure(proxy, accountResult.error);
                return accountResult;
            }
            
        } catch (error) {
            await this.proxyManager.recordProxyFailure(proxy, error.message);
            return {
                success: false,
                error: error.message,
                cycle: cycleNumber
            };
        }
    }

    async updateProxyPerformance(proxyAddress, success) {
        try {
            if (!this.proxyStats.has(proxyAddress)) {
                this.proxyStats.set(proxyAddress, {
                    proxy: proxyAddress,
                    usageCount: 0,
                    successCount: 0,
                    failureCount: 0,
                    lastUsed: new Date().toISOString()
                });
            }

            const stats = this.proxyStats.get(proxyAddress);
            stats.usageCount++;
            stats.lastUsed = new Date().toISOString();

            if (success) {
                stats.successCount++;
            } else {
                stats.failureCount++;
            }

        } catch (error) {
            this.logger.warning(`⚠️ فشل تحديث إحصائيات البروكسي: ${error.message}`);
        }
    }

    async saveProxyPerformance() {
        try {
            if (this.proxyStats.size === 0) return;

            this.logger.production('📈 حفظ إحصائيات أداء البروكسيات...');
            
            const proxyData = [];
            for (const [proxyAddress, stats] of this.proxyStats) {
                const successRate = stats.usageCount > 0 ? 
                    ((stats.successCount / stats.usageCount) * 100).toFixed(1) : 0;

                proxyData.push([
                    stats.proxy,
                    stats.usageCount,
                    stats.successCount,
                    stats.failureCount,
                    `${successRate}%`,
                    stats.lastUsed,
                    'N/A', // Avg_Response_Time - يمكن إضافته لاحقاً
                    successRate >= 50 ? 'جيد' : 'ضعيف'
                ]);
            }

            await this.sheetsManager.saveProxyPerformance(proxyData);
            this.logger.success(`✅ تم حفظ إحصائيات ${proxyData.length} بروكسي`);

        } catch (error) {
            this.logger.error(`❌ فشل حفظ إحصائيات البروكسيات: ${error.message}`);
        }
    }

    calculateSmartDelay(successCount, totalAttempts) {
        const successRate = successCount / totalAttempts;
        
        if (successRate > 0.4) {
            return 180000; // 3 دقائق - الأداء ممتاز
        } else if (successRate > 0.25) {
            return 240000; // 4 دقائق - الأداء جيد
        } else {
            return 300000; // 5 دقائق - الأداء يحتاج تحسين
        }
    }

    async finalizeProduction() {
        const successRate = (this.accountsCreated / this.totalAttempts * 100).toFixed(1);
        
        // حفظ التقرير النهائي
        await this.sheetsManager.saveProductionReport({
            date: new Date().toISOString().split('T')[0],
            target: this.dailyTarget,
            created: this.accountsCreated,
            attempts: this.totalAttempts,
            successRate: successRate,
            session_id: this.sessionStartTime.getTime().toString(),
            end_time: new Date().toISOString(),
            proxies_used: this.proxyStats.size
        });
        await this.saveProxyPerformance();
        
        this.logger.production('📊 تقرير الإنتاج النهائي');
        this.logger.production(`✅ الحسابات الناجحة: ${this.accountsCreated}`);
        this.logger.production(`🔄 إجمالي المحاولات: ${this.totalAttempts}`);
        this.logger.production(`📈 نسبة النجاح: ${successRate}%`);
        this.logger.production(`🌐 البروكسيات المستخدمة: ${this.proxyStats.size}`);
        
        if (this.accountsCreated >= this.dailyTarget) {
            this.logger.success(`🎉 تم تحقيق الهدف اليومي! ${this.accountsCreated}/${this.dailyTarget}`);
        } else {
            this.logger.warning(`⚠️ لم يتم تحقيق الهدف الكامل: ${this.accountsCreated}/${this.dailyTarget}`);
        }
    }

    async emergencyShutdown() {
        this.logger.error('🛑 إيقاف طارئ للنظام');
        
        // محاولة حفظ البيانات المتبقية
        try {
            await this.saveProxyPerformance();
            await this.sheetsManager.saveEmergencyState({
                accounts_created: this.accountsCreated,
                total_attempts: this.totalAttempts,
                error_time: new Date().toISOString(),
                proxies_used: this.proxyStats.size
            });
        } catch (error) {
            this.logger.error(`💥 فشل حتى في حفظ حالة الطوارئ: ${error.message}`);
        }
        
        process.exit(1);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// التشغيل في بيئة الإنتاج
if (require.main === module) {
    const productionSystem = new RedditProductionSystem();
    
    productionSystem.initializeProduction()
        .then(() => productionSystem.startProductionCycle())
        .catch(error => {
            console.error('💥 فشل تشغيل نظام الإنتاج:', error);
            process.exit(1);
        });
}

module.exports = RedditProductionSystem;

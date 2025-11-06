const { SeleniumManager } = require('./core/selenium-manager');
const { GoogleSheetsManager } = require('./core/google-sheets-manager');
const { ProxyManager } = require('./core/proxy-manager');
const { SystemLogger } = require('./core/logger');
const { SetupManager } = require('./setup/setup-manager');

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
        this.consecutiveFailures = 0;
        this.maxConsecutiveFailures = 10;
        this.healthyProxies = [];
    }

    async initializeProduction() {
        try {
            this.logger.production('🚀 تهيئة نظام الإنتاج مع Proxies عامة...');
            
            // التحقق من جميع المكونات
            await this.validateProductionEnvironment();
            
            // بدء جلسة جديدة في Google Sheets
            await this.sheetsManager.startNewSession(this.sessionStartTime);
            
            this.logger.production('✅ نظام الإنتاج جاهز للتشغيل');
            this.logger.production(`🎯 الهدف اليومي: ${this.dailyTarget} حساب`);
            this.logger.production(`⏰ وقت البدء: ${this.sessionStartTime.toLocaleString()}`);
            
            return true;
            
        } catch (error) {
            this.logger.error(`❌ فشل تهيئة الإنتاج: ${error.message}`);
            await this.emergencyShutdown(error);
            return false;
        }
    }

    async validateProductionEnvironment() {
        this.logger.production('🔍 التحقق من بيئة الإنتاج...');

        try {
            // 1. تهيئة Google Sheets أولاً
            this.logger.production('📊 التحقق من Google Sheets...');
            const setupManager = new SetupManager();
            await setupManager.initializeSheets();
            await setupManager.validateSheetAccess(process.env.SHEET_ID);
            await setupManager.setupSheetsStructure();
            this.logger.success('✅ Google Sheets جاهز');

            // 2. التحقق من البروكسيات مع معالجة مرنة
            this.logger.production('📡 التحقق من البروكسيات...');
            
            let proxyStatus;
            try {
                proxyStatus = await this.proxyManager.validateProxies();
                
                if (!proxyStatus.healthy && proxyStatus.healthyCount === 0) {
                    this.logger.warning('⚠️ تحذير: لا توجد بروكسيات صالحة في الاختبار المسبق');
                    this.logger.production('🔄 سيتم اختبار البروكسيات مباشرة مع Selenium...');
                } else if (proxyStatus.warning) {
                    this.logger.warning(`⚠️ ${proxyStatus.warning}`);
                    this.logger.production('✅ سيتم المتابعة مع البروكسيات المتاحة');
                } else {
                    this.logger.success(`✅ البروكسيات جاهزة: ${proxyStatus.message}`);
                }

                // حفظ البروكسيات الصالحة
                const stats = this.proxyManager.getProxyStats();
                this.logger.production(`📊 إحصائيات: ${stats.total} إجمالي (${stats.healthy} صالح، ${stats.unhealthy} فاشل)`);
                
            } catch (proxyError) {
                this.logger.warning(`⚠️ خطأ في التحقق من البروكسيات: ${proxyError.message}`);
                this.logger.production('🔄 سيتم المحاولة بدون تحقق مسبق...');
            }

            // 3. التحقق من Selenium بدون بروكسي أولاً
            this.logger.production('🌐 التحقق من Selenium (بدون بروكسي)...');
            
            try {
                // اختبار Selenium بدون بروكسي أولاً
                const seleniumStatus = await this.seleniumManager.validateEnvironmentNonProxy();
                
                if (!seleniumStatus.ready) {
                    throw new Error(`Selenium غير جاهز: ${seleniumStatus.error}`);
                }
                
                this.logger.success('✅ Selenium جاهز (اختبار أساسي)');
                
                // الآن اختبار Selenium مع بروكسي صالح
                await this.validateSeleniumWithProxy();
                
            } catch (seleniumError) {
                this.logger.warning(`⚠️ تحذير Selenium: ${seleniumError.message}`);
                this.logger.production('🔄 سيتم المتابعة مع الوضع التكيفي...');
            }

            // 4. الخلاصة
            this.logger.production('');
            this.logger.production('🎯 ========== ملخص البيئة ==========');
            this.logger.success('✅ Google Sheets: جاهز');
            
            if (proxyStatus && proxyStatus.healthy) {
                this.logger.success(`✅ البروكسيات: جاهز (${proxyStatus.healthRate})`);
            } else {
                this.logger.warning('⚠️ البروكسيات: سيتم الاختبار الديناميكي');
            }
            
            this.logger.success('✅ Selenium: جاهز للتشغيل');
            this.logger.production('====================================');
            this.logger.production('');

        } catch (error) {
            this.logger.error(`❌ فشل التحقق من البيئة: ${error.message}`);
            throw error;
        }
    }

    async validateSeleniumWithProxy() {
        this.logger.production('🔍 اختبار Selenium مع البروكسيات...');
        
        // الحصول على بروكسيات صالحة للاختبار
        const testProxies = this.proxyManager.getRandomProxies(3);
        
        for (const proxy of testProxies) {
            try {
                this.logger.production(`🧪 اختبار بروكسي: ${proxy.host}:${proxy.port}`);
                
                const result = await this.seleniumManager.validateEnvironmentWithProxy(proxy);
                
                if (result.ready) {
                    this.logger.success(`✅ Selenium + بروكسي يعمل: ${proxy.host}:${proxy.port}`);
                    this.healthyProxies.push(proxy);
                    
                    // بروكسي واحد يعمل يكفي للتأكيد
                    if (this.healthyProxies.length >= 1) {
                        return true;
                    }
                }
            } catch (error) {
                this.logger.warning(`⚠️ فشل اختبار: ${proxy.host}:${proxy.port} - ${error.message}`);
                continue;
            }
        }
        
        if (this.healthyProxies.length === 0) {
            this.logger.warning('⚠️ لم ينجح أي بروكسي مع Selenium - سيتم المحاولة الديناميكية');
        }
        
        return true;
    }

    async startProductionCycle() {
        try {
            this.logger.production(`🎯 بدء دورة الإنتاج - الهدف: ${this.dailyTarget} حساب`);
            
            let cycle = 0;
            const maxCycles = 400;

            while (this.accountsCreated < this.dailyTarget && cycle < maxCycles) {
                cycle++;
                this.totalAttempts++;
                
                const progress = `🔄 الدورة ${cycle} - النجاحات: ${this.accountsCreated}/${this.dailyTarget} - المحاولات: ${this.totalAttempts}`;
                this.logger.production(progress);
                
                const result = await this.executeProductionCycle(cycle);
                
                if (result.success) {
                    this.accountsCreated++;
                    this.consecutiveFailures = 0;
                    
                    await this.sheetsManager.saveAccountData(result);
                    this.logger.success(`✅ حساب ${this.accountsCreated} مكتمل: ${result.username}`);
                    
                    if (this.accountsCreated % 10 === 0) {
                        this.logger.production(`📊 تقدم: ${this.accountsCreated}/${this.dailyTarget} حساب (${((this.accountsCreated / this.dailyTarget) * 100).toFixed(1)}%)`);
                    }
                } else {
                    this.consecutiveFailures++;
                    this.logger.warning(`⚠️ فشل محاولة: ${result.error}`);
                    
                    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
                        this.logger.error('🚨 عدد كبير من الإخفاقات المتتالية - التوقف');
                        break;
                    }
                    
                    if (this.consecutiveFailures >= 5) {
                        this.logger.warning('🚨 إخفاقات متتالية - زيادة وقت الانتظار');
                    }
                }

                if (this.accountsCreated < this.dailyTarget) {
                    const delay = this.calculateSmartDelay(this.accountsCreated, this.totalAttempts, this.consecutiveFailures);
                    this.logger.production(`⏰ انتظار ${(delay/1000/60).toFixed(1)} دقائق للدورة التالية...`);
                    await this.delay(delay);
                }
            }

            await this.finalizeProduction();
            
        } catch (error) {
            this.logger.error(`💥 خطأ حرج في الإنتاج: ${error.message}`);
            await this.emergencyShutdown(error);
        }
    }

    async executeProductionCycle(cycleNumber) {
        let proxy = null;
        let driver = null;
        
        try {
            // محاولة الحصول على بروكسي صالح مع إعادة المحاولة
            proxy = await this.getWorkingProxy();
            
            if (!proxy) {
                return {
                    success: false,
                    error: 'لا توجد بروكسيات صالحة متاحة',
                    cycle: cycleNumber
                };
            }
            
            this.logger.production(`🌐 استخدام البروكسي: ${proxy.host}:${proxy.port} [${proxy.source}]`);
            
            // إنشاء حساب باستخدام Selenium مع besttemporaryemail.com
            const accountResult = await this.seleniumManager.createRedditAccountWithBestTempEmail(proxy);
            
            if (accountResult.success) {
                await this.proxyManager.recordSuccess(proxy);
                
                this.logger.production(`📧 استخدام besttemporaryemail.com - البريد: ${accountResult.email}`);
                
                return {
                    success: true,
                    ...accountResult,
                    proxy: `${proxy.host}:${proxy.port}`,
                    proxy_source: proxy.source,
                    cycle: cycleNumber,
                    session_id: this.sessionStartTime.getTime().toString(),
                    timestamp: new Date().toISOString()
                };
            } else {
                await this.proxyManager.recordFailure(proxy, new Error(accountResult.error));
                return {
                    success: false,
                    error: accountResult.error,
                    cycle: cycleNumber
                };
            }
            
        } catch (error) {
            if (proxy) {
                await this.proxyManager.recordFailure(proxy, error);
            }
            
            this.logger.error(`❌ خطأ في الدورة ${cycleNumber}: ${error.message}`);
            
            return {
                success: false,
                error: error.message,
                cycle: cycleNumber
            };
        }
    }

    async getWorkingProxy(maxAttempts = 5) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const proxy = this.proxyManager.getNextProxy();
                
                // إذا كان البروكسي مؤكد صالح، أرجعه مباشرة
                if (proxy.healthStatus === 'healthy' && proxy.successCount > 0) {
                    return proxy;
                }
                
                // اختبار سريع للبروكسي الجديد
                if (proxy.healthStatus === 'unknown') {
                    this.logger.production(`🧪 اختبار بروكسي جديد: ${proxy.host}:${proxy.port}`);
                    const isHealthy = await this.proxyManager.testProxyHealth(proxy);
                    
                    if (isHealthy) {
                        this.logger.success(`✅ بروكسي صالح: ${proxy.host}:${proxy.port}`);
                        return proxy;
                    } else {
                        this.logger.warning(`❌ بروكسي فاشل: ${proxy.host}:${proxy.port}`);
                        continue;
                    }
                }
                
                // إرجاع البروكسي حتى لو لم يتم اختباره (محاولة)
                return proxy;
                
            } catch (error) {
                this.logger.warning(`⚠️ محاولة ${attempt}/${maxAttempts} فشلت: ${error.message}`);
                
                if (attempt < maxAttempts) {
                    await this.delay(2000);
                }
            }
        }
        
        // إذا فشلت جميع المحاولات، أرجع أي بروكسي متاح
        return this.proxyManager.getNextProxy();
    }

    calculateSmartDelay(successCount, totalAttempts, consecutiveFailures) {
        const successRate = totalAttempts > 0 ? successCount / totalAttempts : 0;
        
        let baseDelay;
        if (successRate > 0.4) {
            baseDelay = 180000; // 3 دقائق
        } else if (successRate > 0.25) {
            baseDelay = 240000; // 4 دقائق
        } else if (successRate > 0.15) {
            baseDelay = 300000; // 5 دقائق
        } else {
            baseDelay = 360000; // 6 دقائق
        }
        
        if (consecutiveFailures > 0) {
            baseDelay += (consecutiveFailures * 30000);
        }
        
        return Math.min(baseDelay, 600000);
    }

    async finalizeProduction() {
        const successRate = this.totalAttempts > 0 ? (this.accountsCreated / this.totalAttempts * 100).toFixed(1) : 0;
        const endTime = new Date();
        const durationMinutes = ((endTime - this.sessionStartTime) / (1000 * 60)).toFixed(1);
        
        await this.sheetsManager.saveProductionReport({
            date: new Date().toISOString().split('T')[0],
            target: this.dailyTarget,
            created: this.accountsCreated,
            attempts: this.totalAttempts,
            successRate: successRate,
            session_id: this.sessionStartTime.getTime().toString(),
            end_time: endTime.toISOString(),
            duration_minutes: durationMinutes
        });

        this.logger.production('');
        this.logger.production('📊 ========== تقرير الإنتاج النهائي ==========');
        this.logger.production(`✅ الحسابات الناجحة: ${this.accountsCreated}`);
        this.logger.production(`🔄 إجمالي المحاولات: ${this.totalAttempts}`);
        this.logger.production(`📈 نسبة النجاح: ${successRate}%`);
        this.logger.production(`⏱️ مدة التشغيل: ${durationMinutes} دقيقة`);
        this.logger.production(`🏁 وقت الانتهاء: ${endTime.toLocaleString()}`);
        
        if (this.accountsCreated >= this.dailyTarget) {
            this.logger.success(`🎉 تم تحقيق الهدف اليومي! ${this.accountsCreated}/${this.dailyTarget}`);
        } else {
            this.logger.warning(`⚠️ لم يتم تحقيق الهدف الكامل: ${this.accountsCreated}/${this.dailyTarget}`);
        }
        
        const proxyStats = this.proxyManager.getProxyStats();
        this.logger.production(`🌐 البروكسيات: ${proxyStats.totalSuccess} نجاح / ${proxyStats.totalFailure} فشل (${proxyStats.successRate})`);
        this.logger.production('============================================');
        this.logger.production('');
    }

    async emergencyShutdown(error = null) {
        this.logger.error('🛑 إيقاف طارئ للنظام');
        
        if (error) {
            this.logger.error(`💥 السبب: ${error.message}`);
        }
        
        try {
            await this.sheetsManager.saveEmergencyState({
                accounts_created: this.accountsCreated,
                total_attempts: this.totalAttempts,
                consecutive_failures: this.consecutiveFailures,
                error_message: error ? error.message : 'إيقاف يدوي',
                error_time: new Date().toISOString(),
                session_duration: ((new Date() - this.sessionStartTime) / (1000 * 60)).toFixed(1)
            });
            
            this.logger.production('🛑 تم حفظ حالة الطوارئ');
        } catch (saveError) {
            this.logger.error(`❌ فشل حفظ حالة الطوارئ: ${saveError.message}`);
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
    
    process.on('SIGINT', async () => {
        console.log('\n🛑 استقبال إشارة إيقاف...');
        await productionSystem.finalizeProduction();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 استقبال إشارة إنهاء...');
        await productionSystem.finalizeProduction();
        process.exit(0);
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
        console.error('💥 خطأ غير معالج:', reason);
        await productionSystem.emergencyShutdown(new Error(reason));
    });
    
    productionSystem.initializeProduction()
        .then((initialized) => {
            if (initialized) {
                return productionSystem.startProductionCycle();
            } else {
                console.error('❌ فشل تهيئة النظام');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 فشل تشغيل نظام الإنتاج:', error);
            process.exit(1);
        });
}

module.exports = RedditProductionSystem;
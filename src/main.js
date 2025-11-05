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
        this.consecutiveFailures = 0;
        this.maxConsecutiveFailures = 10;
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
            await this.emergencyShutdown();
        }
    }

    async validateProductionEnvironment() {
        this.logger.production('🔍 التحقق من بيئة الإنتاج...');

        // التحقق من Proxies
        this.logger.production('📡 التحقق من البروكسيات...');
        const proxyStatus = await this.proxyManager.validateProxies();
        if (!proxyStatus.healthy) {
            throw new Error(`Proxies غير صالحة: ${proxyStatus.error}`);
        }
        this.logger.success(`✅ ${proxyStatus.message}`);

        // التحقق من Google Sheets
        this.logger.production('📊 التحقق من Google Sheets...');
        const sheetsStatus = await this.sheetsManager.validateConnection();
        if (!sheetsStatus.connected) {
            throw new Error(`Google Sheets غير متصل: ${sheetsStatus.error}`);
        }
        this.logger.success('✅ تم الاتصال بـ Google Sheets');

        // التحقق من Selenium
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
            const maxCycles = 400; // زيادة الحد الأقصى لمرونة أكثر

            while (this.accountsCreated < this.dailyTarget && cycle < maxCycles) {
                cycle++;
                this.totalAttempts++;
                
                const progress = `🔄 الدورة ${cycle} - النجاحات: ${this.accountsCreated}/${this.dailyTarget} - المحاولات: ${this.totalAttempts}`;
                this.logger.production(progress);
                
                const result = await this.executeProductionCycle(cycle);
                
                if (result.success) {
                    this.accountsCreated++;
                    this.consecutiveFailures = 0; // إعادة تعيين الفشل المتتالي
                    
                    await this.sheetsManager.saveAccountData(result);
                    this.logger.success(`✅ حساب ${this.accountsCreated} مكتمل: ${result.username}`);
                    
                    // إرسال تحديث كل 10 حسابات
                    if (this.accountsCreated % 10 === 0) {
                        this.logger.production(`📊 تقدم: ${this.accountsCreated}/${this.dailyTarget} حساب (${((this.accountsCreated / this.dailyTarget) * 100).toFixed(1)}%)`);
                    }
                } else {
                    this.consecutiveFailures++;
                    this.logger.warning(`⚠️ فشل محاولة: ${result.error}`);
                    
                    // إذا كانت إخفاقات متتالية كثيرة، زيادة وقت الانتظار
                    if (this.consecutiveFailures >= 5) {
                        this.logger.warning('🚨 إخفاقات متتالية - زيادة وقت الانتظار');
                    }
                }

                // تأخير ذكي بين الدورات
                if (this.accountsCreated < this.dailyTarget) {
                    const delay = this.calculateSmartDelay(this.accountsCreated, this.totalAttempts, this.consecutiveFailures);
                    this.logger.production(`⏰ انتظار ${(delay/1000/60).toFixed(1)} دقائق للدورة التالية...`);
                    await this.delay(delay);
                }
            }

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
            
            // إنشاء حساب باستخدام Selenium
            const accountResult = await this.seleniumManager.createRedditAccount(proxy);
            
            if (accountResult.success) {
                await this.proxyManager.recordProxySuccess(proxy);
                
                // ✅ إضافة السطر المطلوب هنا
                this.logger.production(`📧 استخدام besttemporaryemail.com - البريد: ${accountResult.email}`);
                
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

    calculateSmartDelay(successCount, totalAttempts, consecutiveFailures) {
        const successRate = totalAttempts > 0 ? successCount / totalAttempts : 0;
        
        // قاعدة التأخير بناءً على نسبة النجاح
        let baseDelay;
        if (successRate > 0.4) {
            baseDelay = 180000; // 3 دقائق - الأداء ممتاز
        } else if (successRate > 0.25) {
            baseDelay = 240000; // 4 دقائق - الأداء جيد
        } else if (successRate > 0.15) {
            baseDelay = 300000; // 5 دقائق - الأداء مقبول
        } else {
            baseDelay = 360000; // 6 دقائق - الأداء ضعيف
        }
        
        // زيادة التأخير في حالة الإخفاقات المتتالية
        if (consecutiveFailures > 0) {
            baseDelay += (consecutiveFailures * 30000); // 30 ثانية إضافية لكل فشل متتالي
        }
        
        // حد أقصى للتأخير (10 دقائق)
        return Math.min(baseDelay, 600000);
    }

    async finalizeProduction() {
        const successRate = this.totalAttempts > 0 ? (this.accountsCreated / this.totalAttempts * 100).toFixed(1) : 0;
        const endTime = new Date();
        const durationMinutes = ((endTime - this.sessionStartTime) / (1000 * 60)).toFixed(1);
        
        // حفظ التقرير النهائي
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

        // عرض التقرير النهائي
        this.logger.production('📊 تقرير الإنتاج النهائي');
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
        
        // إحصائيات البروكسيات
        const proxyStats = this.proxyManager.getStats();
        this.logger.production(`🌐 إحصائيات البروكسيات: ${proxyStats.usedProxies}/${proxyStats.totalProxies} مستخدم (${proxyStats.successRate} نجاح)`);
    }

    async emergencyShutdown() {
        this.logger.error('🛑 إيقاف طارئ للنظام');
        
        try {
            await this.sheetsManager.saveEmergencyState({
                accounts_created: this.accountsCreated,
                total_attempts: this.totalAttempts,
                consecutive_failures: this.consecutiveFailures,
                error_time: new Date().toISOString(),
                session_duration: ((new Date() - this.sessionStartTime) / (1000 * 60)).toFixed(1)
            });
        } catch (error) {
            this.logger.error(`❌ فشل حفظ حالة الطوارئ: ${error.message}`);
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
    
    // معالجة إشارات الإيقاف
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
    
    // بدء النظام
    productionSystem.initializeProduction()
        .then((initialized) => {
            if (initialized) {
                return productionSystem.startProductionCycle();
            }
        })
        .catch(error => {
            console.error('💥 فشل تشغيل نظام الإنتاج:', error);
            process.exit(1);
        });
}

module.exports = RedditProductionSystem;

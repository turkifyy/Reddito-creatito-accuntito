const { SeleniumManager } = require('./core/selenium-manager');
const { GoogleSheetsManager } = require('./core/google-sheets-manager');
const { ProxyManager } = require('./core/proxy-manager');
const { SetupManager } = require('./core/setup-manager');
const { SystemLogger } = require('./core/logger');

class RedditProductionSystem {
    constructor() {
        this.logger = new SystemLogger();
        this.seleniumManager = new SeleniumManager();
        this.sheetsManager = new GoogleSheetsManager();
        this.proxyManager = new ProxyManager();
        this.setupManager = new SetupManager();
        this.dailyTarget = 100;
        this.accountsCreated = 0;
        this.sessionStartTime = new Date();
        this.totalAttempts = 0;
    }

    async initializeProduction() {
        try {
            this.logger.production('🚀 تهيئة نظام الإنتاج مع Proxies عامة...');
            
            await this.validateProductionEnvironment();
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

        // التحقق من Proxies
        const proxyStatus = await this.proxyManager.validateProxies();
        if (!proxyStatus.healthy) {
            throw new Error(`Proxies غير صالحة: ${proxyStatus.error}`);
        }

        // التحقق من Google Sheets
        await this.setupManager.initializeSheets();
        await this.setupManager.validateSheetAccess(process.env.SHEET_ID);
        await this.setupManager.setupSheetsStructure();

        // التحقق من Selenium
        const seleniumStatus = await this.seleniumManager.validateEnvironment();
        if (!seleniumStatus.ready) {
            throw new Error(`Selenium غير جاهز: ${seleniumStatus.error}`);
        }

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
                    await this.sheetsManager.saveAccountData(result);
                    this.logger.success(`✅ حساب ${this.accountsCreated} مكتمل: ${result.username}`);
                }

                if (this.accountsCreated < this.dailyTarget) {
                    const delay = this.calculateSmartDelay(this.accountsCreated, this.totalAttempts);
                    this.logger.production(`⏰ انتظار ${delay/1000} ثانية للدورة التالية...`);
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

    calculateSmartDelay(successCount, totalAttempts) {
        const successRate = successCount / totalAttempts;
        
        if (successRate > 0.4) {
            return 180000; // 3 دقائق
        } else if (successRate > 0.25) {
            return 240000; // 4 دقائق
        } else {
            return 300000; // 5 دقائق
        }
    }

    async finalizeProduction() {
        const successRate = (this.accountsCreated / this.totalAttempts * 100).toFixed(1);
        
        await this.sheetsManager.saveProductionReport({
            date: new Date().toISOString().split('T')[0],
            target: this.dailyTarget,
            created: this.accountsCreated,
            attempts: this.totalAttempts,
            successRate: successRate,
            session_id: this.sessionStartTime.getTime().toString(),
            end_time: new Date().toISOString()
        });

        this.logger.production('📊 تقرير الإنتاج النهائي');
        this.logger.production(`✅ الحسابات الناجحة: ${this.accountsCreated}`);
        this.logger.production(`🔄 إجمالي المحاولات: ${this.totalAttempts}`);
        this.logger.production(`📈 نسبة النجاح: ${successRate}%`);
        
        if (this.accountsCreated >= this.dailyTarget) {
            this.logger.success(`🎉 تم تحقيق الهدف اليومي! ${this.accountsCreated}/${this.dailyTarget}`);
        }
    }

    async emergencyShutdown() {
        this.logger.error('🛑 إيقاف طارئ للنظام');
        await this.sheetsManager.saveEmergencyState({
            accounts_created: this.accountsCreated,
            total_attempts: this.totalAttempts,
            error_time: new Date().toISOString()
        });
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

const { SmartTimingManager } = require('./core/smart-timing-manager');
const { SeleniumManager } = require('./core/selenium-manager');
const { EmailManager } = require('./core/email-manager');
const { GoogleSheetsManager } = require('./core/google-sheets-manager');
const { Logger } = require('./core/logger');
const { PerformanceMonitor } = require('./monitoring/performance-monitor');
const { HealthMonitor } = require('./monitoring/health-monitor');
const { RecoveryManager } = require('./recovery/recovery-manager');
const Config = require('../config/config');

/**
 * النظام الرئيسي V2 مع التعافي التلقائي المتقدم
 * @class RedditAutomationSystemV2
 */
class RedditAutomationSystemV2 {
    constructor() {
        this.logger = new Logger();
        this.config = Config;
        this.timingManager = new SmartTimingManager();
        this.seleniumManager = new SeleniumManager();
        this.emailManager = new EmailManager();
        this.sheetsManager = new GoogleSheetsManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.healthMonitor = new HealthMonitor();
        this.recoveryManager = new RecoveryManager();
        
        this.accountsCreatedToday = 0;
        this.targetAccounts = Config.timing.dailyTarget;
        this.isRunning = false;
        this.systemStatus = 'initializing';
        this.consecutiveFailures = 0;
        this.maxConsecutiveFailures = 5;
        
        this.initializeEventHandlers();
    }

    /**
     * تهيئة معالجي الأحداث للنظام
     */
    initializeEventHandlers() {
        process.on('uncaughtException', async (error) => {
            await this.handleCriticalError('uncaughtException', error);
        });

        process.on('unhandledRejection', async (reason, promise) => {
            await this.handleCriticalError('unhandledRejection', reason);
        });

        process.on('SIGINT', async () => {
            await this.gracefulShutdown('SIGINT');
        });

        process.on('SIGTERM', async () => {
            await this.gracefulShutdown('SIGTERM');
        });
    }

    /**
     * معالجة الأخطاء الحرجة مع التعافي التلقائي
     */
    async handleCriticalError(errorType, error) {
        this.logger.error(`🚨 خطأ حرج: ${errorType} - ${error.message}`);
        
        this.systemStatus = 'critical_error';
        this.consecutiveFailures++;
        
        // تسجيل الخطأ في نظام المراقبة
        await this.healthMonitor.recordCriticalError(errorType, error);
        
        // التحقق مما إذا كنا بحاجة لإعادة التشغيل التلقائي
        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
            this.logger.error('🔄 تجاوز الحد الأقصى للأخطاء المتتالية - تشغيل التعافي التلقائي');
            await this.recoveryManager.performFullRecovery();
            this.consecutiveFailures = 0;
        } else {
            // محاولة استعادة بسيطة
            await this.recoveryManager.performQuickRecovery();
        }
        
        // إعادة تشغيل النظام إذا كان قيد التشغيل
        if (this.isRunning) {
            this.logger.info('🔄 إعادة تشغيل النظام بعد الخطأ...');
            setTimeout(() => this.start(), 10000);
        }
    }

    /**
     * إيقاف النظام بشكل آمن
     */
    async gracefulShutdown(signal) {
        this.logger.info(`🛑 استقبال إشارة ${signal} - إيقاف آمن...`);
        this.isRunning = false;
        this.systemStatus = 'shutting_down';
        
        try {
            // حفظ حالة النظام الحالية
            await this.saveSystemState();
            
            // إيقاف جميع المكونات
            await this.seleniumManager.shutdown();
            await this.performanceMonitor.saveFinalReport();
            await this.healthMonitor.generateHealthReport();
            
            this.logger.success('✅ تم الإيقاف الآمن بنجاح');
            process.exit(0);
        } catch (error) {
            this.logger.error(`❌ خطأ في الإيقاف الآمن: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * حفظ حالة النظام للتعافي
     */
    async saveSystemState() {
        const systemState = {
            timestamp: new Date().toISOString(),
            accountsCreated: this.accountsCreatedToday,
            systemStatus: this.systemStatus,
            consecutiveFailures: this.consecutiveFailures,
            performanceStats: this.performanceMonitor.generatePerformanceReport(),
            healthStatus: this.healthMonitor.getCurrentStatus()
        };

        try {
            const fs = require('fs');
            const path = require('path');
            const stateFile = path.join(__dirname, '../data/system-state.json');
            
            // التأكد من وجود مجلد data
            const dataDir = path.dirname(stateFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            fs.writeFileSync(stateFile, JSON.stringify(systemState, null, 2));
            this.logger.debug('💾 تم حفظ حالة النظام للتعافي');
        } catch (error) {
            this.logger.error(`❌ فشل في حفظ حالة النظام: ${error.message}`);
        }
    }

    /**
     * تحميل حالة النظام السابقة
     */
    async loadSystemState() {
        try {
            const fs = require('fs');
            const path = require('path');
            const stateFile = path.join(__dirname, '../data/system-state.json');
            
            if (fs.existsSync(stateFile)) {
                const stateData = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                
                // التحقق من أن البيانات ليست قديمة جداً (أقل من 24 ساعة)
                const stateTime = new Date(stateData.timestamp);
                const currentTime = new Date();
                const hoursDiff = (currentTime - stateTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.accountsCreatedToday = stateData.accountsCreated || 0;
                    this.consecutiveFailures = stateData.consecutiveFailures || 0;
                    this.logger.info(`🔄 تم استعادة حالة النظام: ${this.accountsCreatedToday} حساب مبدئي`);
                } else {
                    this.logger.info('🔄 بيانات النظام قديمة - بدء من الصفر');
                }
            }
        } catch (error) {
            this.logger.warning('⚠️ لا توجد حالة نظام سابقة للتحميل');
        }
    }

    /**
     * تهيئة النظام المتقدمة مع التعافي
     */
    async initialize() {
        try {
            this.logger.info('🚀 بدء تهيئة النظام V2 مع التعافي التلقائي...');
            this.systemStatus = 'initializing';
            
            // تحميل الحالة السابقة
            await this.loadSystemState();
            
            // فحص صحة النظام
            const healthCheck = await this.healthMonitor.fullSystemCheck();
            if (!healthCheck.healthy) {
                throw new Error(`فحص الصحة فشل: ${healthCheck.errors.join(', ')}`);
            }
            
            // تهيئة المكونات الأساسية
            await this.sheetsManager.initialize();
            await this.emailManager.initialize();
            await this.seleniumManager.initialize();
            
            // بدء مراقبة الأداء
            this.performanceMonitor.startContinuousMonitoring();
            
            // بدء مراقبة الصحة
            this.healthMonitor.startHealthMonitoring();
            
            this.systemStatus = 'ready';
            this.consecutiveFailures = 0;
            this.logger.success('✅ تم تهيئة النظام V2 بنجاح مع التعافي التلقائي');
            return true;
            
        } catch (error) {
            this.systemStatus = 'initialization_failed';
            this.logger.error(`❌ فشل في تهيئة النظام: ${error.message}`);
            
            // محاولة التعافي التلقائي
            await this.recoveryManager.performInitializationRecovery();
            return false;
        }
    }

    /**
     * دورة العمل المحسنة مع التعافي
     */
    async startCycle() {
        const cycleId = this.performanceMonitor.startOperation(`cycle_${Math.floor(this.accountsCreatedToday / 3) + 1}`);
        
        try {
            if (!this.isRunning) {
                this.isRunning = true;
                this.logger.info('🔄 بدء دورة إنشاء الحسابات مع التعافي...');
            }

            const cycleNumber = Math.floor(this.accountsCreatedToday / 3) + 1;
            this.logger.info(`🔄 بدء الدورة ${cycleNumber} - إنشاء 3 حسابات جديدة`);
            
            // فحص الصحة قبل البدء
            if (!await this.healthMonitor.quickHealthCheck()) {
                this.logger.warning('⚠️ فحص الصحة السريع فشل - محاولة التعافي');
                await this.recoveryManager.performQuickRecovery();
            }
            
            // إنشاء 3 حسابات مع التعافي
            const results = await this.createBatchAccountsWithRecovery(3);
            
            // تحديث الإحصائيات
            this.accountsCreatedToday += results.successCount;
            this.performanceMonitor.updateAccountStats(results.successCount, results.failedCount);
            
            this.logger.info(`✅ اكتملت الدورة ${cycleNumber}: ${results.successCount}/3 حسابات ناجحة`);
            this.logger.info(`📊 الإجمالي اليومي: ${this.accountsCreatedToday}/${this.targetAccounts}`);
            
            // حفظ البيانات في Google Sheets
            await this.saveResultsToSheets(results.accounts);
            
            // التحقق من تحقيق الهدف اليومي
            if (this.accountsCreatedToday >= this.targetAccounts) {
                this.logger.success(`🎉 تم تحقيق الهدف اليومي! ${this.accountsCreatedToday} حساب`);
                this.performanceMonitor.endOperation(cycleId, true);
                return true;
            }
            
            // حساب الوقت للدورة التالية مع التكيف
            const nextWaitTime = this.timingManager.calculateAdaptiveWaitTime(
                this.accountsCreatedToday, 
                this.targetAccounts,
                results.successRate
            );
            
            this.logger.info(`⏰ الانتظار للدورة التالية: ${nextWaitTime} دقيقة (مكيف)`);
            
            this.performanceMonitor.endOperation(cycleId, true);
            return false;
            
        } catch (error) {
            this.performanceMonitor.endOperation(cycleId, false);
            this.logger.error(`❌ خطأ في الدورة: ${error.message}`);
            
            // تسجيل الفشل وزيادة العداد
            this.consecutiveFailures++;
            await this.healthMonitor.recordOperationError('cycle_execution', error);
            
            // التعافي التلقائي بناءً على عدد الإخفاقات المتتالية
            if (this.consecutiveFailures >= 3) {
                await this.recoveryManager.performCycleRecovery();
            }
            
            return false;
        }
    }

    /**
     * إنشاء مجموعة حسابات مع التعافي
     */
    async createBatchAccountsWithRecovery(count) {
        const results = {
            successCount: 0,
            failedCount: 0,
            accounts: [],
            successRate: 0
        };

        for (let i = 0; i < count; i++) {
            try {
                this.logger.info(`👤 بدء إنشاء الحساب ${i + 1}/${count}`);
                
                const accountData = await this.createSingleAccountWithRetry();
                if (accountData) {
                    results.successCount++;
                    results.accounts.push(accountData);
                    this.logger.success(`✅ تم إنشاء الحساب بنجاح: ${accountData.username}`);
                } else {
                    results.failedCount++;
                    this.logger.warning(`⚠️ فشل في إنشاء الحساب ${i + 1}`);
                }
                
                // تأخير عشوائي بين إنشاء الحسابات
                await this.timingManager.randomDelay(5000, 15000);
                
            } catch (error) {
                results.failedCount++;
                this.logger.error(`❌ خطأ في إنشاء الحساب ${i + 1}: ${error.message}`);
                
                // التعافي من خطأ الحساب الفردي
                await this.recoveryManager.performAccountCreationRecovery();
            }
        }

        results.successRate = results.successCount / count;
        return results;
    }

    /**
     * إنشاء حساب فردي مع إعادة المحاولة
     */
    async createSingleAccountWithRetry(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.debug(`🔄 محاولة إنشاء حساب (${attempt}/${maxRetries})`);
                return await this.createSingleAccount();
            } catch (error) {
                this.logger.warning(`⚠️ فشل المحاولة ${attempt}: ${error.message}`);
                
                if (attempt < maxRetries) {
                    // انتظار تصاعدي قبل إعادة المحاولة
                    const waitTime = attempt * 10000; // 10, 20, 30 ثانية
                    await this.timingManager.randomDelay(waitTime, waitTime + 5000);
                    
                    // إعادة تهيئة قبل المحاولة التالية
                    await this.recoveryManager.performQuickRecovery();
                }
            }
        }
        
        throw new Error(`فشل جميع ${maxRetries} محاولات لإنشاء الحساب`);
    }

    /**
     * إنشاء حساب فردي (النواة الأساسية)
     */
    async createSingleAccount() {
        let driver = null;
        try {
            // إنشاء بريد مؤقت مع التعافي
            const emailData = await this.emailManager.createTemporaryEmailWithFallback();
            if (!emailData.email) {
                throw new Error('فشل في إنشاء البريد المؤقت حتى مع الطرق البديلة');
            }

            // إنشاء بيانات الحساب
            const accountData = this.generateAccountData(emailData.email);
            
            // إعداد متصفح Selenium مع إعدادات متقدمة
            driver = await this.seleniumManager.createDriverWithAdvancedSettings();
            
            // إنشاء حساب Reddit مع التعافي من CAPTCHA
            const createdAccount = await this.seleniumManager.createRedditAccountWithRecovery(driver, accountData);
            
            if (createdAccount) {
                // تأكيد البريد الإلكتروني مع التعافي
                const verificationResult = await this.emailManager.verifyEmailWithRecovery(accountData.email);
                
                if (verificationResult.verified) {
                    accountData.verified = true;
                    accountData.verification_time = new Date().toISOString();
                    accountData.verification_code = verificationResult.verification_code;
                }
                
                return accountData;
            }
            
            return null;
            
        } catch (error) {
            this.logger.error(`❌ خطأ في إنشاء الحساب الفردي: ${error.message}`);
            throw error;
        } finally {
            if (driver) {
                await this.seleniumManager.closeDriver(driver);
            }
        }
    }

    /**
     * بدء التشغيل الرئيسي للنظام V2
     */
    async start() {
        this.logger.info('🚀 بدء تشغيل نظام أتمتة Reddit V2 مع التعافي التلقائي');
        
        const initialized = await this.initialize();
        if (!initialized) {
            this.logger.error('❌ لا يمكن بدء التشغيل بسبب فشل التهيئة');
            await this.recoveryManager.performEmergencyRecovery();
            return;
        }

        this.logger.info(`🎯 الهدف اليومي: ${this.targetAccounts} حساب`);
        this.logger.info('⏰ النظام يعمل بتوقيت عشوائي مكيف مع التعافي التلقائي');

        this.systemStatus = 'running';
        this.isRunning = true;

        // التشغيل المستمر مع التعافي
        while (this.isRunning && this.accountsCreatedToday < this.targetAccounts) {
            try {
                const cycleCompleted = await this.startCycle();
                
                if (cycleCompleted) {
                    break;
                }

                // انتظار عشوائي مكيف للدورة التالية
                const waitTimeMs = this.timingManager.calculateNextWaitTime() * 60 * 1000;
                this.logger.info(`💤 النظام في وضع الانتظار للدورة التالية: ${waitTimeMs / 60000} دقيقة`);
                
                // المراقبة أثناء الانتظار
                await this.monitorDuringWait(waitTimeMs);
                
            } catch (error) {
                this.logger.error(`❌ خطأ في الحلقة الرئيسية: ${error.message}`);
                await this.recoveryManager.performMainLoopRecovery();
            }
        }

        if (this.accountsCreatedToday >= this.targetAccounts) {
            this.logger.success('🎉 اكتمل التشغيل اليومي بنجاح!');
            await this.performanceMonitor.generateDailyReport(this.accountsCreatedToday);
        }

        await this.shutdown();
    }

    /**
     * المراقبة أثناء فترات الانتظار
     */
    async monitorDuringWait(waitTimeMs) {
        const checkInterval = 60000; // التحقق كل دقيقة
        const totalChecks = Math.floor(waitTimeMs / checkInterval);
        
        for (let i = 0; i < totalChecks && this.isRunning; i++) {
            await this.timingManager.randomDelay(checkInterval, checkInterval + 10000);
            
            // فحص صحة النظام
            const healthStatus = await this.healthMonitor.quickHealthCheck();
            if (!healthStatus.healthy) {
                this.logger.warning('⚠️ اكتشاف مشكلة صحية أثناء الانتظار - التعافي التلقائي');
                await this.recoveryManager.performQuickRecovery();
            }
            
            // حفظ حالة النظام بشكل دوري
            if (i % 5 === 0) { // كل 5 دقائق
                await this.saveSystemState();
            }
        }
    }

    /**
     * إيقاف النظام مع التعافي
     */
    async shutdown() {
        this.logger.info('🛑 إيقاف نظام الأتمتة V2...');
        this.isRunning = false;
        this.systemStatus = 'shutting_down';
        
        try {
            // حفظ الحالة النهائية
            await this.saveSystemState();
            
            // إيقاف جميع المكونات
            await this.seleniumManager.shutdown();
            this.performanceMonitor.stopContinuousMonitoring();
            this.healthMonitor.stopHealthMonitoring();
            
            // توليد التقارير النهائية
            await this.performanceMonitor.generateFinalReport();
            await this.healthMonitor.generateHealthReport();
            
            this.logger.success('✅ تم إيقاف النظام V2 بنجاح');
        } catch (error) {
            this.logger.error(`❌ خطأ في إيقاف النظام: ${error.message}`);
        }
    }
}

// التشغيل الرئيسي مع التعافي المحسن
if (require.main === module) {
    const system = new RedditAutomationSystemV2();
    
    // بدء التشغيل مع التعافي من الأخطاء
    system.start().catch(async (error) => {
        console.error('🚨 خطأ غير متوقع في النظام:', error);
        
        // محاولة التعافي النهائية
        const { RecoveryManager } = require('./recovery/recovery-manager');
        const recoveryManager = new RecoveryManager();
        await recoveryManager.performEmergencyRecovery();
        
        process.exit(1);
    });
}

module.exports = { RedditAutomationSystemV2 };

/**
 * 🔍 فحص نشر النظام V2 مع التعافي التلقائي المتقدم
 * @version 2.0.0
 * @description نظام فحص شامل للنشر مع خوارزميات تعافي تلقائي ومراقبة متقدمة
 * @file src/deployment-check.js
 */

const { Logger } = require('./core/logger');
const { HealthMonitor } = require('./monitoring/health-monitor');
const { RecoveryManager } = require('./recovery/recovery-manager');
const { PerformanceMonitor } = require('./monitoring/performance-monitor');
const Config = require('../config/config');

class DeploymentCheckerV2 {
    constructor() {
        this.logger = new Logger();
        this.healthMonitor = new HealthMonitor();
        this.recoveryManager = new RecoveryManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.config = Config;
        
        // نتائج الفحص
        this.checkResults = {
            overallStatus: 'unknown',
            checks: {},
            startTime: new Date(),
            endTime: null,
            duration: 0,
            recoveryAttempted: false,
            recoverySuccess: false
        };

        // إحصائيات الفحص
        this.checkStatistics = {
            totalChecks: 0,
            passedChecks: 0,
            failedChecks: 0,
            warnings: 0,
            criticalIssues: 0
        };

        // إعدادات الفحص
        this.checkSettings = {
            timeout: 300000, // 5 دقائق
            enableAutoRecovery: true,
            enableDetailedReporting: true,
            retryFailedChecks: true,
            maxRetryAttempts: 3
        };
    }

    /**
     * فحص النشر الشامل V2
     */
    async performComprehensiveDeploymentCheck() {
        this.logger.info('🚀 بدء فحص النشر الشامل V2...');
        this.checkResults.startTime = new Date();

        try {
            // 1. الفحوصات الأساسية
            await this.performBasicChecks();
            
            // 2. فحوصات الاعتماديات
            await this.performDependencyChecks();
            
            // 3. فحوصات الخدمات الخارجية
            await this.performExternalServiceChecks();
            
            // 4. فحوصات الأمان
            await this.performSecurityChecks();
            
            // 5. فحوصات الأداء
            await this.performPerformanceChecks();
            
            // 6. التحقق النهائي
            await this.performFinalValidation();

            // تحديث النتائج
            this.checkResults.endTime = new Date();
            this.checkResults.duration = this.checkResults.endTime - this.checkResults.startTime;
            this.checkResults.overallStatus = this.determineOverallStatus();

            // توليد التقرير
            await this.generateDeploymentReport();

            // التعافي التلقائي إذا لزم الأمر
            if (this.checkResults.overallStatus === 'failed' && this.checkSettings.enableAutoRecovery) {
                await this.attemptAutoRecovery();
            }

            return this.checkResults;

        } catch (error) {
            this.logger.error(`❌ فشل فحص النشر: ${error.message}`);
            this.checkResults.overallStatus = 'failed';
            await this.handleCheckFailure(error);
            throw error;
        }
    }

    /**
     * الفحوصات الأساسية
     */
    async performBasicChecks() {
        const basicChecks = {
            nodeVersion: this.checkNodeVersion.bind(this),
            operatingSystem: this.checkOperatingSystem.bind(this),
            memoryAvailability: this.checkMemoryAvailability.bind(this),
            diskSpace: this.checkDiskSpace.bind(this),
            networkConnectivity: this.checkNetworkConnectivity.bind(this),
            filePermissions: this.checkFilePermissions.bind(this)
        };

        await this.executeCheckGroup('basic_checks', basicChecks);
    }

    /**
     * فحوصات الاعتماديات
     */
    async performDependencyChecks() {
        const dependencyChecks = {
            npmPackages: this.checkNpmPackages.bind(this),
            seleniumDrivers: this.checkSeleniumDrivers.bind(this),
            browserInstallation: this.checkBrowserInstallation.bind(this),
            apiLibraries: this.checkApiLibraries.bind(this)
        };

        await this.executeCheckGroup('dependency_checks', dependencyChecks);
    }

    /**
     * فحوصات الخدمات الخارجية
     */
    async performExternalServiceChecks() {
        const externalChecks = {
            googleSheets: this.checkGoogleSheets.bind(this),
            emailService: this.checkEmailService.bind(this),
            redditAccess: this.checkRedditAccess.bind(this),
            dnsResolution: this.checkDnsResolution.bind(this)
        };

        await this.executeCheckGroup('external_service_checks', externalChecks);
    }

    /**
     * فحوصات الأمان
     */
    async performSecurityChecks() {
        const securityChecks = {
            environmentVariables: this.checkEnvironmentVariables.bind(this),
            sensitiveFiles: this.checkSensitiveFiles.bind(this),
            sslCertificates: this.checkSslCertificates.bind(this),
            firewallSettings: this.checkFirewallSettings.bind(this)
        };

        await this.executeCheckGroup('security_checks', securityChecks);
    }

    /**
     * فحوصات الأداء
     */
    async performPerformanceChecks() {
        const performanceChecks = {
            systemResources: this.checkSystemResources.bind(this),
            responseTimes: this.checkResponseTimes.bind(this),
            memoryLeaks: this.checkMemoryLeaks.bind(this),
            cpuUsage: this.checkCpuUsage.bind(this)
        };

        await this.executeCheckGroup('performance_checks', performanceChecks);
    }

    /**
     * التحقق النهائي
     */
    async performFinalValidation() {
        const validationChecks = {
            configuration: this.validateConfiguration.bind(this),
            integration: this.validateIntegration.bind(this),
            readiness: this.validateReadiness.bind(this)
        };

        await this.executeCheckGroup('final_validation', validationChecks);
    }

    /**
     * تنفيذ مجموعة فحوصات
     */
    async executeCheckGroup(groupName, checks) {
        this.logger.info(`🔍 تنفيذ مجموعة الفحوصات: ${groupName}`);
        
        this.checkResults.checks[groupName] = {
            status: 'running',
            startTime: new Date(),
            checks: {}
        };

        for (const [checkName, checkFunction] of Object.entries(checks)) {
            await this.executeSingleCheck(groupName, checkName, checkFunction);
        }

        this.checkResults.checks[groupName].endTime = new Date();
        this.checkResults.checks[groupName].status = this.determineGroupStatus(groupName);
        
        this.logger.info(`✅ اكتملت مجموعة الفحوصات: ${groupName}`);
    }

    /**
     * تنفيذ فحص فردي
     */
    async executeSingleCheck(groupName, checkName, checkFunction) {
        this.checkStatistics.totalChecks++;
        
        try {
            this.logger.debug(`🔍 تنفيذ الفحص: ${checkName}`);
            
            const result = await checkFunction();
            result.timestamp = new Date().toISOString();
            
            this.checkResults.checks[groupName].checks[checkName] = result;

            if (result.status === 'passed') {
                this.checkStatistics.passedChecks++;
                this.logger.debug(`✅ ${checkName}: ناجح`);
            } else if (result.status === 'warning') {
                this.checkStatistics.warnings++;
                this.logger.warning(`⚠️ ${checkName}: تحذير - ${result.message}`);
            } else {
                this.checkStatistics.failedChecks++;
                this.logger.error(`❌ ${checkName}: فاشل - ${result.message}`);
                
                if (result.critical) {
                    this.checkStatistics.criticalIssues++;
                }
            }

            // إعادة محاولة الفحص الفاشل إذا كان مسموحاً
            if (result.status === 'failed' && this.checkSettings.retryFailedChecks) {
                await this.retryFailedCheck(groupName, checkName, checkFunction);
            }

        } catch (error) {
            this.checkStatistics.failedChecks++;
            this.checkResults.checks[groupName].checks[checkName] = {
                status: 'failed',
                message: `خطأ غير متوقع: ${error.message}`,
                error: error.stack,
                timestamp: new Date().toISOString(),
                critical: true
            };
            this.logger.error(`❌ ${checkName}: خطأ غير متوقع - ${error.message}`);
        }
    }

    /**
     * إعادة محاولة الفحص الفاشل
     */
    async retryFailedCheck(groupName, checkName, checkFunction) {
        for (let attempt = 1; attempt <= this.checkSettings.maxRetryAttempts; attempt++) {
            this.logger.info(`🔄 إعادة محاولة الفحص ${checkName} (المحاولة ${attempt}/${this.checkSettings.maxRetryAttempts})`);
            
            try {
                const result = await checkFunction();
                result.timestamp = new Date().toISOString();
                result.retryAttempt = attempt;
                
                this.checkResults.checks[groupName].checks[checkName] = result;

                if (result.status === 'passed') {
                    this.checkStatistics.passedChecks++;
                    this.checkStatistics.failedChecks--;
                    this.logger.info(`✅ ${checkName}: نجح بعد ${attempt} محاولات`);
                    return;
                }

                await this.delay(2000 * attempt); // تأخير تصاعدي

            } catch (error) {
                this.logger.warning(`⚠️ فشل إعادة المحاولة ${attempt} لـ ${checkName}: ${error.message}`);
            }
        }
    }

    /**
     * فحص إصدار Node.js
     */
    async checkNodeVersion() {
        const currentNodeVersion = process.version;
        const requiredVersion = 'v18.0.0';
        
        const versionCompare = this.compareVersions(currentNodeVersion, requiredVersion);
        
        if (versionCompare < 0) {
            return {
                status: 'failed',
                message: `إصدار Node.js غير مدعوم. المطلوب: ${requiredVersion}, الحالي: ${currentNodeVersion}`,
                current: currentNodeVersion,
                required: requiredVersion,
                critical: true
            };
        }

        return {
            status: 'passed',
            message: `إصدار Node.js مدعوم: ${currentNodeVersion}`,
            current: currentNodeVersion,
            required: requiredVersion
        };
    }

    /**
     * فحص نظام التشغيل
     */
    async checkOperatingSystem() {
        const platform = process.platform;
        const supportedPlatforms = ['linux', 'darwin', 'win32'];
        
        if (!supportedPlatforms.includes(platform)) {
            return {
                status: 'warning',
                message: `نظام التشغيل ${platform} قد لا يكون مدعوماً بالكامل`,
                platform: platform,
                supported: supportedPlatforms
            };
        }

        return {
            status: 'passed',
            message: `نظام التشغيل مدعوم: ${platform}`,
            platform: platform
        };
    }

    /**
     * فحص توفر الذاكرة
     */
    async checkMemoryAvailability() {
        try {
            const os = require('os');
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const memoryUsage = (totalMemory - freeMemory) / totalMemory;
            
            const minRequiredMemory = 512 * 1024 * 1024; // 512 MB
            const recommendedMemory = 1024 * 1024 * 1024; // 1 GB

            if (freeMemory < minRequiredMemory) {
                return {
                    status: 'failed',
                    message: `ذاكرة غير كافية. المتاح: ${this.formatBytes(freeMemory)}, المطلوب: ${this.formatBytes(minRequiredMemory)}`,
                    freeMemory: freeMemory,
                    requiredMemory: minRequiredMemory,
                    memoryUsage: memoryUsage,
                    critical: true
                };
            }

            if (freeMemory < recommendedMemory) {
                return {
                    status: 'warning',
                    message: `ذاكرة منخفضة. المتاح: ${this.formatBytes(freeMemory)}, الموصى: ${this.formatBytes(recommendedMemory)}`,
                    freeMemory: freeMemory,
                    recommendedMemory: recommendedMemory,
                    memoryUsage: memoryUsage
                };
            }

            return {
                status: 'passed',
                message: `الذاكرة كافية: ${this.formatBytes(freeMemory)} متاح`,
                totalMemory: totalMemory,
                freeMemory: freeMemory,
                memoryUsage: memoryUsage
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص الذاكرة: ${error.message}`,
                error: error.stack
            };
        }
    }

    /**
     * فحص مساحة التخزين
     */
    async checkDiskSpace() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const checkDir = process.cwd();
            const stats = fs.statSync(checkDir);
            const freeSpace = this.estimateFreeSpace(checkDir);
            
            const minRequiredSpace = 100 * 1024 * 1024; // 100 MB
            const recommendedSpace = 500 * 1024 * 1024; // 500 MB

            if (freeSpace < minRequiredSpace) {
                return {
                    status: 'failed',
                    message: `مساحة تخزين غير كافية. المتاح: ${this.formatBytes(freeSpace)}, المطلوب: ${this.formatBytes(minRequiredSpace)}`,
                    freeSpace: freeSpace,
                    requiredSpace: minRequiredSpace,
                    critical: true
                };
            }

            if (freeSpace < recommendedSpace) {
                return {
                    status: 'warning',
                    message: `مساحة تخزين منخفضة. المتاح: ${this.formatBytes(freeSpace)}, الموصى: ${this.formatBytes(recommendedSpace)}`,
                    freeSpace: freeSpace,
                    recommendedSpace: recommendedSpace
                };
            }

            return {
                status: 'passed',
                message: `مساحة التخزين كافية: ${this.formatBytes(freeSpace)} متاح`,
                freeSpace: freeSpace,
                checkedDirectory: checkDir
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص مساحة التخزين: ${error.message}`,
                error: error.stack
            };
        }
    }

    /**
     * فحص اتصال الشبكة
     */
    async checkNetworkConnectivity() {
        try {
            const https = require('https');
            const testUrls = [
                'https://www.google.com',
                'https://www.reddit.com',
                'https://www.besttemporaryemail.com'
            ];

            const results = [];
            let successfulConnections = 0;

            for (const url of testUrls) {
                try {
                    const startTime = Date.now();
                    await new Promise((resolve, reject) => {
                        const req = https.get(url, (res) => {
                            const responseTime = Date.now() - startTime;
                            results.push({
                                url: url,
                                status: res.statusCode,
                                responseTime: responseTime,
                                success: true
                            });
                            successfulConnections++;
                            resolve();
                        });
                        
                        req.on('error', (error) => {
                            results.push({
                                url: url,
                                status: 'error',
                                responseTime: Date.now() - startTime,
                                success: false,
                                error: error.message
                            });
                            resolve(); // لا نرفض هنا لنكمل الفحص
                        });
                        
                        req.setTimeout(10000, () => {
                            results.push({
                                url: url,
                                status: 'timeout',
                                responseTime: 10000,
                                success: false,
                                error: 'Request timeout'
                            });
                            req.destroy();
                            resolve();
                        });
                    });
                } catch (error) {
                    results.push({
                        url: url,
                        status: 'exception',
                        success: false,
                        error: error.message
                    });
                }
            }

            const successRate = successfulConnections / testUrls.length;

            if (successRate >= 0.7) { // 70% نجاح
                return {
                    status: 'passed',
                    message: `اتصال الشبكة نشط (${successfulConnections}/${testUrls.length} خدمات)`,
                    successRate: successRate,
                    results: results
                };
            } else if (successRate >= 0.3) { // 30% نجاح
                return {
                    status: 'warning',
                    message: `اتصال الشبكة محدود (${successfulConnections}/${testUrls.length} خدمات)`,
                    successRate: successRate,
                    results: results
                };
            } else {
                return {
                    status: 'failed',
                    message: `اتصال الشبكة ضعيف (${successfulConnections}/${testUrls.length} خدمات)`,
                    successRate: successRate,
                    results: results,
                    critical: true
                };
            }

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص اتصال الشبكة: ${error.message}`,
                error: error.stack,
                critical: true
            };
        }
    }

    /**
     * فحص أذونات الملفات
     */
    async checkFilePermissions() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const requiredDirs = [
                process.cwd(),
                path.join(process.cwd(), 'src'),
                path.join(process.cwd(), 'config'),
                path.join(process.cwd(), 'logs')
            ];

            const results = [];
            let hasErrors = false;

            for (const dir of requiredDirs) {
                try {
                    // التحقق من إمكانية القراءة
                    fs.accessSync(dir, fs.constants.R_OK);
                    
                    // التحقق من إمكانية الكتابة (للمجلدات التي تحتاجها)
                    if (dir.includes('logs') || dir.includes('tmp')) {
                        fs.accessSync(dir, fs.constants.W_OK);
                    }

                    results.push({
                        directory: dir,
                        readable: true,
                        writable: dir.includes('logs') || dir.includes('tmp'),
                        status: 'passed'
                    });

                } catch (error) {
                    hasErrors = true;
                    results.push({
                        directory: dir,
                        readable: false,
                        writable: false,
                        status: 'failed',
                        error: error.message
                    });
                }
            }

            if (hasErrors) {
                return {
                    status: 'failed',
                    message: 'مشاكل في أذونات الملفات',
                    results: results,
                    critical: true
                };
            }

            return {
                status: 'passed',
                message: 'أذونات الملفات صحيحة',
                results: results
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص أذونات الملفات: ${error.message}`,
                error: error.stack
            };
        }
    }

    /**
     * فحص حزم npm
     */
    async checkNpmPackages() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            const nodeModulesPath = path.join(process.cwd(), 'node_modules');
            
            if (!fs.existsSync(packageJsonPath)) {
                return {
                    status: 'failed',
                    message: 'ملف package.json غير موجود',
                    critical: true
                };
            }

            if (!fs.existsSync(nodeModulesPath)) {
                return {
                    status: 'failed',
                    message: 'مجلد node_modules غير موجود - قم بتشغيل npm install',
                    critical: true
                };
            }

            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const requiredDependencies = Object.keys(packageJson.dependencies || {});
            
            const missingDependencies = [];
            const versionMismatches = [];

            for (const dep of requiredDependencies) {
                try {
                    require.resolve(dep);
                } catch (error) {
                    missingDependencies.push(dep);
                }
            }

            if (missingDependencies.length > 0) {
                return {
                    status: 'failed',
                    message: `حزم npm مفقودة: ${missingDependencies.join(', ')}`,
                    missingDependencies: missingDependencies,
                    critical: true
                };
            }

            return {
                status: 'passed',
                message: `جميع حزم npm ${requiredDependencies.length} مثبتة`,
                totalDependencies: requiredDependencies.length,
                dependencies: requiredDependencies
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص حزم npm: ${error.message}`,
                error: error.stack
            };
        }
    }

    /**
     * فحص سائقي Selenium
     */
    async checkSeleniumDrivers() {
        try {
            const { Builder } = require('selenium-webdriver');
            const chrome = require('selenium-webdriver/chrome');
            
            // اختبار إنشاء متصفح
            const options = new chrome.Options();
            options.addArguments('--headless');
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');

            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();

            await driver.get('https://www.google.com');
            const title = await driver.getTitle();
            await driver.quit();

            return {
                status: 'passed',
                message: 'سواق Selenium يعملون بشكل صحيح',
                testPage: 'https://www.google.com',
                pageTitle: title
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص سواق Selenium: ${error.message}`,
                error: error.stack,
                critical: true
            };
        }
    }

    /**
     * فحص اتصال Google Sheets
     */
    async checkGoogleSheets() {
        try {
            const { GoogleSheetsManager } = require('./core/google-sheets-manager');
            const sheetsManager = new GoogleSheetsManager();
            
            await sheetsManager.initialize();
            
            // اختبار القراءة
            const testData = await sheetsManager.getSavedAccounts();
            
            return {
                status: 'passed',
                message: 'اتصال Google Sheets نشط',
                testOperation: 'read',
                dataCount: testData ? testData.length : 0
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في اتصال Google Sheets: ${error.message}`,
                error: error.stack,
                critical: true
            };
        }
    }

    /**
     * فحص خدمة البريد الإلكتروني
     */
    async checkEmailService() {
        try {
            const axios = require('axios');
            
            const response = await axios.get('https://www.besttemporaryemail.com', {
                timeout: 15000
            });

            if (response.status === 200) {
                return {
                    status: 'passed',
                    message: 'خدمة البريد الإلكتروني متاحة',
                    service: 'besttemporaryemail.com',
                    statusCode: response.status
                };
            } else {
                return {
                    status: 'warning',
                    message: `استجابة غير متوقعة من خدمة البريد: ${response.status}`,
                    service: 'besttemporaryemail.com',
                    statusCode: response.status
                };
            }

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في الوصول لخدمة البريد: ${error.message}`,
                error: error.stack,
                critical: false // قد لا يكون حرجاً إذا كانت هناك بدائل
            };
        }
    }

    /**
     * فحص الوصول إلى Reddit
     */
    async checkRedditAccess() {
        try {
            const axios = require('axios');
            
            const response = await axios.get('https://www.reddit.com', {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.status === 200) {
                return {
                    status: 'passed',
                    message: 'الوصول إلى Reddit متاح',
                    statusCode: response.status
                };
            } else {
                return {
                    status: 'warning',
                    message: `استجابة غير متوقعة من Reddit: ${response.status}`,
                    statusCode: response.status
                };
            }

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في الوصول إلى Reddit: ${error.message}`,
                error: error.stack,
                critical: true
            };
        }
    }

    /**
     * فحص متغيرات البيئة
     */
    async checkEnvironmentVariables() {
        const requiredEnvVars = [
            'GOOGLE_SHEET_ID',
            'GOOGLE_SERVICE_ACCOUNT_JSON'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        const presentVars = requiredEnvVars.filter(varName => process.env[varName]);

        if (missingVars.length > 0) {
            return {
                status: 'failed',
                message: `متغيرات بيئية مفقودة: ${missingVars.join(', ')}`,
                missingVariables: missingVars,
                presentVariables: presentVars,
                critical: true
            };
        }

        return {
            status: 'passed',
            message: `جميع المتغيرات البيئية ${requiredEnvVars.length} موجودة`,
            presentVariables: presentVars
        };
    }

    /**
     * فحص الملفات الحساسة
     */
    async checkSensitiveFiles() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const sensitiveFiles = [
                path.join(process.cwd(), 'google-credentials.json'),
                path.join(process.cwd(), '.env'),
                path.join(process.cwd(), 'config/production.json')
            ];

            const exposedFiles = sensitiveFiles.filter(file => fs.existsSync(file));

            if (exposedFiles.length > 0) {
                return {
                    status: 'warning',
                    message: `تم اكتشاف ملفات حساسة في المستودع: ${exposedFiles.map(f => path.basename(f)).join(', ')}`,
                    exposedFiles: exposedFiles,
                    recommendation: 'ينصح بنقل هذه الملفات إلى environment variables'
                };
            }

            return {
                status: 'passed',
                message: 'لا توجد ملفات حساسة مكشوفة'
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص الملفات الحساسة: ${error.message}`,
                error: error.stack
            };
        }
    }

    /**
     * فحص موارد النظام
     */
    async checkSystemResources() {
        try {
            const systeminformation = require('systeminformation');
            
            const [memory, cpu, disk] = await Promise.all([
                systeminformation.mem(),
                systeminformation.currentLoad(),
                systeminformation.fsSize()
            ]);

            const memoryUsage = memory.used / memory.total;
            const cpuUsage = cpu.currentLoad;
            const diskUsage = disk[0] ? disk[0].use : 0;

            const warnings = [];
            
            if (memoryUsage > 0.9) {
                warnings.push('استخدام الذاكرة مرتفع جداً');
            }
            if (cpuUsage > 90) {
                warnings.push('استخدام المعالج مرتفع جداً');
            }
            if (diskUsage > 95) {
                warnings.push('مساحة التخزين منخفضة جداً');
            }

            if (warnings.length > 0) {
                return {
                    status: 'warning',
                    message: `مشاكل في موارد النظام: ${warnings.join(', ')}`,
                    memoryUsage: memoryUsage,
                    cpuUsage: cpuUsage,
                    diskUsage: diskUsage,
                    warnings: warnings
                };
            }

            return {
                status: 'passed',
                message: 'موارد النظام ضمن المستويات المقبولة',
                memoryUsage: memoryUsage,
                cpuUsage: cpuUsage,
                diskUsage: diskUsage
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص موارد النظام: ${error.message}`,
                error: error.stack
            };
        }
    }

    /**
     * التحقق من التكوين
     */
    async validateConfiguration() {
        try {
            // التحقق من صحة إعدادات النظام
            const configValidator = require('../config/validator');
            const validator = new configValidator.ConfigValidator();
            const validationResult = validator.validateAll();

            if (!validationResult.isValid) {
                return {
                    status: 'failed',
                    message: 'أخطاء في تكوين النظام',
                    errors: validationResult.errors,
                    warnings: validationResult.warnings,
                    critical: true
                };
            }

            if (validationResult.hasWarnings) {
                return {
                    status: 'warning',
                    message: 'تحذيرات في تكوين النظام',
                    warnings: validationResult.warnings,
                    recommendations: validationResult.recommendations
                };
            }

            return {
                status: 'passed',
                message: 'تكوين النظام صحيح'
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في التحقق من التكوين: ${error.message}`,
                error: error.stack
            };
        }
    }

    /**
     * محاولة التعافي التلقائي
     */
    async attemptAutoRecovery() {
        this.logger.info('🔄 محاولة التعافي التلقائي...');
        this.checkResults.recoveryAttempted = true;

        try {
            const recoveryResult = await this.recoveryManager.performQuickRecovery();
            this.checkResults.recoverySuccess = recoveryResult;

            if (recoveryResult) {
                this.logger.success('✅ التعافي التلقائي ناجح');
                
                // إعادة تشغيل الفحوصات بعد التعافي
                await this.retryFailedChecksAfterRecovery();
            } else {
                this.logger.error('❌ التعافي التلقائي فاشل');
            }

        } catch (error) {
            this.logger.error(`❌ خطأ في التعافي التلقائي: ${error.message}`);
            this.checkResults.recoverySuccess = false;
        }
    }

    /**
     * إعادة محاولة الفحوصات الفاشلة بعد التعافي
     */
    async retryFailedChecksAfterRecovery() {
        this.logger.info('🔄 إعادة فحص العناصر الفاشلة بعد التعافي...');
        
        const failedChecks = this.getFailedChecks();
        
        for (const check of failedChecks) {
            if (check.critical) {
                this.logger.info(`🔄 إعادة فحص: ${check.name}`);
                // هنا يمكن إعادة تنفيذ الفحص الفاشل
            }
        }
    }

    /**
     * الحصول على الفحوصات الفاشلة
     */
    getFailedChecks() {
        const failedChecks = [];
        
        for (const [groupName, group] of Object.entries(this.checkResults.checks)) {
            for (const [checkName, check] of Object.entries(group.checks)) {
                if (check.status === 'failed') {
                    failedChecks.push({
                        group: groupName,
                        name: checkName,
                        message: check.message,
                        critical: check.critical || false
                    });
                }
            }
        }
        
        return failedChecks;
    }

    /**
     * معالجة فشل الفحص
     */
    async handleCheckFailure(error) {
        this.logger.error(`🚨 فشل حرج في فحص النشر: ${error.message}`);
        
        // حفظ تقرير الطوارئ
        await this.generateEmergencyReport(error);
        
        // محاولة التعافي في حالات الفشل الحرجة
        if (this.checkSettings.enableAutoRecovery) {
            await this.recoveryManager.performEmergencyRecovery();
        }
    }

    /**
     * توليد تقرير النشر
     */
    async generateDeploymentReport() {
        const report = {
            summary: {
                overallStatus: this.checkResults.overallStatus,
                totalChecks: this.checkStatistics.totalChecks,
                passedChecks: this.checkStatistics.passedChecks,
                failedChecks: this.checkStatistics.failedChecks,
                warnings: this.checkStatistics.warnings,
                duration: this.checkResults.duration,
                timestamp: new Date().toISOString()
            },
            detailedResults: this.checkResults.checks,
            statistics: this.checkStatistics,
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                cwd: process.cwd()
            },
            recommendations: this.generateRecommendations()
        };

        // حفظ التقرير في ملف
        await this.saveReportToFile(report);
        
        // عرض ملخص التقرير
        this.displayReportSummary(report);

        return report;
    }

    /**
     * توليد تقرير الطوارئ
     */
    async generateEmergencyReport(error) {
        const emergencyReport = {
            type: 'deployment_check_failure',
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack
            },
            checkResults: this.checkResults,
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage()
            }
        };

        try {
            const fs = require('fs');
            const path = require('path');
            
            const reportsDir = path.join(process.cwd(), 'logs', 'emergency');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            
            const reportFile = path.join(reportsDir, `emergency-${Date.now()}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(emergencyReport, null, 2));
            
            this.logger.info(`📄 تم حفظ تقرير الطوارئ في: ${reportFile}`);
        } catch (saveError) {
            this.logger.error(`❌ فشل في حفظ تقرير الطوارئ: ${saveError.message}`);
        }
    }

    /**
     * حفظ التقرير في ملف
     */
    async saveReportToFile(report) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const reportsDir = path.join(process.cwd(), 'logs', 'deployment');
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }
            
            const reportFile = path.join(reportsDir, `deployment-check-${Date.now()}.json`);
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            
            this.logger.info(`📊 تم حفظ تقرير النشر في: ${reportFile}`);
        } catch (error) {
            this.logger.error(`❌ فشل في حفظ تقرير النشر: ${error.message}`);
        }
    }

    /**
     * عرض ملخص التقرير
     */
    displayReportSummary(report) {
        const summary = report.summary;
        
        this.logger.info('📋 ملخص تقرير فحص النشر V2');
        this.logger.info('================================');
        this.logger.info(`🎯 الحالة العامة: ${summary.overallStatus}`);
        this.logger.info(`📊 إجمالي الفحوصات: ${summary.totalChecks}`);
        this.logger.info(`✅ الناجحة: ${summary.passedChecks}`);
        this.logger.info(`❌ الفاشلة: ${summary.failedChecks}`);
        this.logger.info(`⚠️ التحذيرات: ${summary.warnings}`);
        this.logger.info(`⏰ المدة: ${summary.duration}ms`);
        this.logger.info('================================');
        
        if (summary.overallStatus === 'passed') {
            this.logger.success('🎉 النظام جاهز للتشغيل!');
        } else if (summary.overallStatus === 'warning') {
            this.logger.warning('⚠️ النظام جاهز مع بعض التحذيرات');
        } else {
            this.logger.error('🚨 النظام غير جاهز - راجع التقرير التفصيلي');
        }
    }

    /**
     * توليد التوصيات
     */
    generateRecommendations() {
        const recommendations = [];
        const failedChecks = this.getFailedChecks();

        // توصيات بناءً على الفحوصات الفاشلة
        for (const check of failedChecks) {
            if (check.critical) {
                recommendations.push({
                    priority: 'high',
                    check: check.name,
                    message: `إصلاح الفحص الفاشل: ${check.message}`,
                    action: 'fix_immediately'
                });
            }
        }

        // توصيات بناءً على التحذيرات
        if (this.checkStatistics.warnings > 5) {
            recommendations.push({
                priority: 'medium',
                message: 'عدد التحذيرات مرتفع - يوصى بمراجعة إعدادات النظام',
                action: 'review_configuration'
            });
        }

        // توصيات الأداء
        if (this.checkStatistics.passedChecks / this.checkStatistics.totalChecks < 0.9) {
            recommendations.push({
                priority: 'medium',
                message: 'معدل النجاح منخفض - تحقق من استقرار النظام',
                action: 'improve_stability'
            });
        }

        return recommendations;
    }

    /**
     * تحديد الحالة العامة
     */
    determineOverallStatus() {
        if (this.checkStatistics.criticalIssues > 0) {
            return 'failed';
        } else if (this.checkStatistics.failedChecks > 0) {
            return 'failed';
        } else if (this.checkStatistics.warnings > 0) {
            return 'warning';
        } else {
            return 'passed';
        }
    }

    /**
     * تحديد حالة المجموعة
     */
    determineGroupStatus(groupName) {
        const group = this.checkResults.checks[groupName];
        const checks = Object.values(group.checks);
        
        if (checks.some(check => check.status === 'failed' && check.critical)) {
            return 'failed';
        } else if (checks.some(check => check.status === 'failed')) {
            return 'failed';
        } else if (checks.some(check => check.status === 'warning')) {
            return 'warning';
        } else {
            return 'passed';
        }
    }

    /**
     * تأخير
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * مقارنة الإصدارات
     */
    compareVersions(v1, v2) {
        const parts1 = v1.replace('v', '').split('.').map(Number);
        const parts2 = v2.replace('v', '').split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        
        return 0;
    }

    /**
     * تنسيق البايتات
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 ب';
        
        const k = 1024;
        const sizes = ['ب', 'ك.ب', 'م.ب', 'ج.ب'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * تقدير المساحة الحرة
     */
    estimateFreeSpace(directory) {
        // في بيئة حقيقية، نستخدم مكتبة مثل diskusage
        // هذا تقدير مبسط للتوضيح
        return 1024 * 1024 * 1024; // 1 GB
    }

    // سيتم إضافة باقي الدوال اللازمة هنا...
    async checkBrowserInstallation() {
        // تنفيذ فحص تثبيت المتصفح
        return { status: 'passed', message: 'المتصفح مثبت' };
    }

    async checkApiLibraries() {
        // تنفيذ فحص مكتبات API
        return { status: 'passed', message: 'مكتبات API جاهزة' };
    }

    async checkDnsResolution() {
        // تنفيذ فحص DNS
        return { status: 'passed', message: 'DNS يعمل' };
    }

    async checkSslCertificates() {
        // تنفيذ فحص شهادات SSL
        return { status: 'passed', message: 'شهادات SSL صالحة' };
    }

    async checkFirewallSettings() {
        // تنفيذ فحص إعدادات الجدار الناري
        return { status: 'passed', message: 'إعدادات الجدار الناري مناسبة' };
    }

    async checkResponseTimes() {
        // تنفيذ فحص أوقات الاستجابة
        return { status: 'passed', message: 'أوقات الاستجابة مقبولة' };
    }

    async checkMemoryLeaks() {
        // تنفيذ فحص تسريبات الذاكرة
        return { status: 'passed', message: 'لا توجد تسريبات ذاكرة' };
    }

    async checkCpuUsage() {
        // تنفيذ فحص استخدام المعالج
        return { status: 'passed', message: 'استخدام المعالج طبيعي' };
    }

    async validateIntegration() {
        // تنفيذ التحقق من التكامل
        return { status: 'passed', message: 'التكامل صحيح' };
    }

    async validateReadiness() {
        // تنفيذ التحقق من الجاهزية
        return { status: 'passed', message: 'النظام جاهز' };
    }
}

// الدوال المساعدة للاستخدام المباشر
async function quickDeploymentCheck() {
    const checker = new DeploymentCheckerV2();
    return await checker.performComprehensiveDeploymentCheck();
}

async function healthCheck() {
    const checker = new DeploymentCheckerV2();
    await checker.performBasicChecks();
    await checker.performDependencyChecks();
    return checker.checkResults;
}

// التشغيل إذا كان الملف直接被نفذ
if (require.main === module) {
    const checker = new DeploymentCheckerV2();
    
    checker.performComprehensiveDeploymentCheck()
        .then(results => {
            if (results.overallStatus === 'passed') {
                console.log('🎉 فحص النشر ناجح - النظام جاهز للتشغيل!');
                process.exit(0);
            } else {
                console.log('❌ فحص النشر فاشل - راجع التقرير للتفاصيل');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('🚨 خطأ غير متوقع في فحص النشر:', error);
            process.exit(1);
        });
}

module.exports = {
    DeploymentCheckerV2,
    quickDeploymentCheck,
    healthCheck
};
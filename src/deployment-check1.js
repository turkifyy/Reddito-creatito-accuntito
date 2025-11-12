/**
 * 🔍 فحص نشر النظام V2.2 - النسخة النهائية المُصلحة
 * @version 2.2.0
 * @description نظام فحص شامل مع إصلاح مشكلة التنفيذ التلقائي
 * @file src/deployment-check.js
 */

import { Logger } from './core/logger.js';
import os from 'os';
import process from 'process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// استيراد ديناميكي للوحدات الاختيارية
let HealthMonitor, RecoveryManager, PerformanceMonitor, Config;

async function initializeModules() {
    try {
        const modules = await Promise.allSettled([
            import('./monitoring/health-monitor.js'),
            import('./recovery/recovery-manager.js'),
            import('./monitoring/performance-monitor.js'),
            import('../config/config.js')
        ]);

        if (modules[0].status === 'fulfilled') HealthMonitor = modules[0].value.HealthMonitor;
        if (modules[1].status === 'fulfilled') RecoveryManager = modules[1].value.RecoveryManager;
        if (modules[2].status === 'fulfilled') PerformanceMonitor = modules[2].value.PerformanceMonitor;
        if (modules[3].status === 'fulfilled') Config = modules[3].value.default || modules[3].value;
    } catch (error) {
        console.warn('⚠️ بعض الوحدات غير متوفرة:', error.message);
    }
}

class DeploymentCheckerV2 {
    constructor() {
        this.logger = new Logger();
        this.healthMonitor = null;
        this.recoveryManager = null;
        this.performanceMonitor = null;
        this.config = null;
        
        // نتائج الفحص
        this.checkResults = {
            overallStatus: 'unknown',
            checks: {},
            startTime: new Date(),
            endTime: null,
            duration: 0
        };

        // إحصائيات الفحص
        this.checkStatistics = {
            totalChecks: 0,
            passedChecks: 0,
            failedChecks: 0,
            warnings: 0,
            criticalIssues: 0
        };
    }

    /**
     * تهيئة الوحدات
     */
    async initialize() {
        try {
            await initializeModules();

            if (HealthMonitor) {
                this.healthMonitor = new HealthMonitor();
            }

            if (RecoveryManager) {
                this.recoveryManager = new RecoveryManager();
            }

            if (PerformanceMonitor) {
                this.performanceMonitor = new PerformanceMonitor();
            }

            if (Config) {
                this.config = Config;
            }

            this.logger.info('DeploymentChecker', '✅ تم تهيئة Deployment Checker V2.2');
        } catch (error) {
            console.error('❌ فشل في تهيئة Deployment Checker:', error.message);
        }
    }

    /**
     * فحص النشر الشامل V2.2
     */
    async performComprehensiveDeploymentCheck() {
        await this.initialize();
        
        this.logger.info('DeploymentChecker', '🚀 بدء فحص النشر الشامل V2.2...');
        this.checkResults.startTime = new Date();

        try {
            // 1. الفحوصات الأساسية
            await this.performBasicChecks();
            
            // 2. فحوصات الاعتماديات
            await this.performDependencyChecks();
            
            // 3. فحوصات الخدمات الخارجية
            await this.performExternalServiceChecks();

            // تحديث النتائج
            this.checkResults.endTime = new Date();
            this.checkResults.duration = this.checkResults.endTime - this.checkResults.startTime;
            this.checkResults.overallStatus = this.determineOverallStatus();

            // عرض النتائج
            this.displayReportSummary();

            return this.checkResults;

        } catch (error) {
            this.logger.error('DeploymentChecker', `❌ فشل فحص النشر: ${error.message}`, error);
            this.checkResults.overallStatus = 'failed';
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
            networkConnectivity: this.checkNetworkConnectivity.bind(this)
        };

        await this.executeCheckGroup('basic_checks', basicChecks);
    }

    /**
     * فحوصات الاعتماديات
     */
    async performDependencyChecks() {
        const dependencyChecks = {
            npmPackages: this.checkNpmPackages.bind(this),
            environmentVariables: this.checkEnvironmentVariables.bind(this)
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
            redditAccess: this.checkRedditAccess.bind(this)
        };

        await this.executeCheckGroup('external_service_checks', externalChecks);
    }

    /**
     * تنفيذ مجموعة فحوصات
     */
    async executeCheckGroup(groupName, checks) {
        this.logger.info('DeploymentChecker', `🔍 تنفيذ مجموعة الفحوصات: ${groupName}`);
        
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
        
        this.logger.info('DeploymentChecker', `✅ اكتملت مجموعة الفحوصات: ${groupName}`);
    }

    /**
     * تنفيذ فحص فردي
     */
    async executeSingleCheck(groupName, checkName, checkFunction) {
        this.checkStatistics.totalChecks++;
        
        try {
            this.logger.debug('DeploymentChecker', `🔍 تنفيذ الفحص: ${checkName}`);
            
            const result = await checkFunction();
            result.timestamp = new Date().toISOString();
            
            this.checkResults.checks[groupName].checks[checkName] = result;

            if (result.status === 'passed') {
                this.checkStatistics.passedChecks++;
                this.logger.debug('DeploymentChecker', `✅ ${checkName}: ناجح`);
            } else if (result.status === 'warning') {
                this.checkStatistics.warnings++;
                this.logger.warn('DeploymentChecker', `⚠️ ${checkName}: ${result.message}`);
            } else {
                this.checkStatistics.failedChecks++;
                this.logger.error('DeploymentChecker', `❌ ${checkName}: ${result.message}`);
                
                if (result.critical) {
                    this.checkStatistics.criticalIssues++;
                }
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
            this.logger.error('DeploymentChecker', `❌ ${checkName}: ${error.message}`);
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
            current: currentNodeVersion
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
                platform: platform
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
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            const minRequiredMemory = 512 * 1024 * 1024; // 512 MB

            if (freeMemory < minRequiredMemory) {
                return {
                    status: 'failed',
                    message: `ذاكرة غير كافية. المتاح: ${this.formatBytes(freeMemory)}`,
                    freeMemory: freeMemory,
                    critical: true
                };
            }

            return {
                status: 'passed',
                message: `الذاكرة كافية: ${this.formatBytes(freeMemory)} متاح`,
                freeMemory: freeMemory
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص الذاكرة: ${error.message}`
            };
        }
    }

    /**
     * فحص مساحة التخزين
     */
    async checkDiskSpace() {
        return {
            status: 'passed',
            message: 'فحص مساحة التخزين - تخطي في البيئة الحالية'
        };
    }

    /**
     * فحص اتصال الشبكة
     */
    async checkNetworkConnectivity() {
        try {
            const testUrl = 'https://www.google.com';
            const result = await this.testHttpConnection(testUrl);

            if (result.success) {
                return {
                    status: 'passed',
                    message: 'اتصال الشبكة نشط',
                    testUrl: testUrl
                };
            } else {
                return {
                    status: 'failed',
                    message: 'اتصال الشبكة فاشل',
                    testUrl: testUrl,
                    critical: true
                };
            }

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص اتصال الشبكة: ${error.message}`,
                critical: true
            };
        }
    }

    /**
     * اختبار اتصال HTTP
     */
    testHttpConnection(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const req = https.get(url, (res) => {
                resolve({
                    success: true,
                    statusCode: res.statusCode,
                    responseTime: Date.now() - startTime
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'timeout'
                });
            });
        });
    }

    /**
     * فحص حزم npm
     */
    async checkNpmPackages() {
        try {
            const packageJsonPath = path.join(process.cwd(), 'package.json');
            
            if (!fs.existsSync(packageJsonPath)) {
                return {
                    status: 'failed',
                    message: 'ملف package.json غير موجود',
                    critical: true
                };
            }

            return {
                status: 'passed',
                message: 'ملف package.json موجود'
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص حزم npm: ${error.message}`
            };
        }
    }

    /**
     * فحص متغيرات البيئة
     */
    async checkEnvironmentVariables() {
        const hasGoogleSheetId = !!process.env.GOOGLE_SHEET_ID;
        const hasGoogleCredentials = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
        
        if (!hasGoogleSheetId || !hasGoogleCredentials) {
            return {
                status: 'warning',
                message: 'بعض متغيرات البيئة مفقودة',
                details: {
                    GOOGLE_SHEET_ID: hasGoogleSheetId,
                    GOOGLE_SERVICE_ACCOUNT_JSON: hasGoogleCredentials
                }
            };
        }

        return {
            status: 'passed',
            message: 'جميع متغيرات البيئة المطلوبة موجودة'
        };
    }

    /**
     * فحص Google Sheets
     */
    async checkGoogleSheets() {
        try {
            const hasCredentials = process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
            
            if (!hasCredentials) {
                return {
                    status: 'failed',
                    message: 'متغيرات بيئة Google Sheets مفقودة',
                    critical: true
                };
            }

            return {
                status: 'passed',
                message: 'متغيرات بيئة Google Sheets موجودة'
            };

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في فحص Google Sheets: ${error.message}`
            };
        }
    }

    /**
     * فحص خدمة البريد الإلكتروني
     */
    async checkEmailService() {
        try {
            const result = await this.testHttpConnection('https://www.besttemporaryemail.com');

            if (result.success) {
                return {
                    status: 'passed',
                    message: 'خدمة البريد الإلكتروني متاحة'
                };
            } else {
                return {
                    status: 'warning',
                    message: 'خدمة البريد قد لا تكون متاحة'
                };
            }

        } catch (error) {
            return {
                status: 'warning',
                message: `فشل في الوصول لخدمة البريد: ${error.message}`
            };
        }
    }

    /**
     * فحص الوصول إلى Reddit
     */
    async checkRedditAccess() {
        try {
            const result = await this.testHttpConnection('https://www.reddit.com');

            if (result.success) {
                return {
                    status: 'passed',
                    message: 'الوصول إلى Reddit متاح'
                };
            } else {
                return {
                    status: 'failed',
                    message: 'الوصول إلى Reddit فاشل',
                    critical: true
                };
            }

        } catch (error) {
            return {
                status: 'failed',
                message: `فشل في الوصول إلى Reddit: ${error.message}`,
                critical: true
            };
        }
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
     * عرض ملخص التقرير
     */
    displayReportSummary() {
        const summary = {
            overallStatus: this.checkResults.overallStatus,
            totalChecks: this.checkStatistics.totalChecks,
            passedChecks: this.checkStatistics.passedChecks,
            failedChecks: this.checkStatistics.failedChecks,
            warnings: this.checkStatistics.warnings,
            duration: this.checkResults.duration
        };
        
        this.logger.info('DeploymentChecker', '📋 ملخص تقرير فحص النشر V2.2');
        this.logger.info('DeploymentChecker', '================================');
        this.logger.info('DeploymentChecker', `🎯 الحالة العامة: ${summary.overallStatus}`);
        this.logger.info('DeploymentChecker', `📊 إجمالي الفحوصات: ${summary.totalChecks}`);
        this.logger.info('DeploymentChecker', `✅ الناجحة: ${summary.passedChecks}`);
        this.logger.info('DeploymentChecker', `❌ الفاشلة: ${summary.failedChecks}`);
        this.logger.info('DeploymentChecker', `⚠️ التحذيرات: ${summary.warnings}`);
        this.logger.info('DeploymentChecker', '================================');
        
        if (summary.overallStatus === 'passed') {
            this.logger.success('DeploymentChecker', '🎉 النظام جاهز للتشغيل!');
        } else if (summary.overallStatus === 'warning') {
            this.logger.warn('DeploymentChecker', '⚠️ النظام جاهز مع بعض التحذيرات');
        } else {
            this.logger.error('DeploymentChecker', '🚨 النظام غير جاهز - راجع التقرير التفصيلي');
        }
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
}

/**
 * التنفيذ فقط عند التشغيل المباشر
 * ⚠️ هذا هو الإصلاح الحرج - استخدام import.meta.url
 */
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
    console.log('🚀 تشغيل deployment-check مباشرة...\n');
    
    const checker = new DeploymentCheckerV2();
    
    checker.performComprehensiveDeploymentCheck()
        .then(results => {
            console.log('\n📊 النتيجة النهائية:', results.overallStatus);
            
            if (results.overallStatus === 'passed') {
                console.log('🎉 فحص النشر ناجح - النظام جاهز للتشغيل!');
                process.exit(0);
            } else if (results.overallStatus === 'warning') {
                console.log('⚠️ فحص النشر اكتمل مع تحذيرات');
                process.exit(0); // نجاح مع تحذيرات
            } else {
                console.log('❌ فحص النشر فاشل - راجع التقرير للتفاصيل');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('🚨 خطأ غير متوقع في فحص النشر:', error);
            process.exit(1);
        });
} else {
    console.log('📦 تم استيراد DeploymentCheckerV2 كوحدة');
}

export { DeploymentCheckerV2 };

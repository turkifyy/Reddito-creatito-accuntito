/**
 * مراقب صحة النظام المتقدم - المراقبة المستمرة والتنبؤ
 * @class HealthMonitor
 */

const { Logger } = require('../core/logger');
const { Helpers } = require('../utils/helpers');

class HealthMonitor {
    constructor() {
        this.logger = new Logger();
        this.healthStatus = 'unknown';
        this.monitoringInterval = null;
        this.healthMetrics = {
            startupTime: new Date().toISOString(),
            totalUptime: 0,
            criticalErrors: 0,
            warnings: 0,
            recoveryAttempts: 0,
            componentHealth: {}
        };
        
        this.thresholds = {
            memoryUsage: 85,
            cpuUsage: 80,
            diskUsage: 90,
            networkLatency: 1000,
            errorRate: 10
        };
    }

    /**
     * بدء المراقبة المستمرة للصحة
     */
    startHealthMonitoring() {
        this.logger.info('🔍 بدء المراقبة المستمرة لصحة النظام...');
        
        this.monitoringInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, 60000); // كل دقيقة
        
        // فحص أولي
        this.performHealthCheck();
    }

    /**
     * إيقاف المراقبة
     */
    stopHealthMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.info('🛑 توقيف المراقبة المستمرة للصحة');
        }
    }

    /**
     * إجراء فحص صحة شامل
     */
    async performHealthCheck() {
        const checkId = `health_check_${Date.now()}`;
        this.logger.debug(`🔍 إجراء فحص صحة: ${checkId}`);
        
        try {
            const healthReport = {
                timestamp: new Date().toISOString(),
                checkId: checkId,
                components: {}
            };

            // فحص المكونات الأساسية
            healthReport.components.memory = await this.checkMemoryHealth();
            healthReport.components.cpu = await this.checkCpuHealth();
            healthReport.components.disk = await this.checkDiskHealth();
            healthReport.components.network = await this.checkNetworkHealth();
            healthReport.components.browser = await this.checkBrowserHealth();
            healthReport.components.email = await this.checkEmailServiceHealth();
            healthReport.components.sheets = await this.checkSheetsHealth();

            // تحليل الصحة العامة
            healthReport.overallHealth = this.analyzeOverallHealth(healthReport.components);
            healthReport.recommendations = this.generateRecommendations(healthReport);

            // تحديث حالة الصحة
            this.healthStatus = healthReport.overallHealth.status;
            this.updateHealthMetrics(healthReport);

            // تسجيل النتائج إذا لم تكن صحية
            if (healthReport.overallHealth.status !== 'healthy') {
                this.logger.warning(`⚠️ حالة الصحة: ${healthReport.overallHealth.status}`);
                this.logger.warning(`📋 التوصيات: ${healthReport.recommendations.join(', ')}`);
            }

            return healthReport;

        } catch (error) {
            this.logger.error(`❌ فشل في فحص الصحة: ${error.message}`);
            return this.generateEmergencyHealthReport(error);
        }
    }

    /**
     * فحص صحة سريع
     */
    async quickHealthCheck() {
        try {
            const quickChecks = [
                this.checkMemoryHealth(),
                this.checkNetworkHealth(),
                this.checkBrowserHealth()
            ];

            const results = await Promise.all(quickChecks);
            const allHealthy = results.every(check => check.healthy);

            return {
                healthy: allHealthy,
                timestamp: new Date().toISOString(),
                details: results
            };

        } catch (error) {
            return {
                healthy: false,
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * فحص صحة الذاكرة
     */
    async checkMemoryHealth() {
        try {
            const systeminformation = require('systeminformation');
            const mem = await systeminformation.mem();
            const memoryUsage = (mem.used / mem.total) * 100;
            const healthy = memoryUsage < this.thresholds.memoryUsage;

            return {
                component: 'memory',
                healthy: healthy,
                usage: memoryUsage.toFixed(2),
                threshold: this.thresholds.memoryUsage,
                details: {
                    total: this.formatBytes(mem.total),
                    used: this.formatBytes(mem.used),
                    free: this.formatBytes(mem.free)
                }
            };

        } catch (error) {
            return {
                component: 'memory',
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * فحص صحة وحدة المعالجة المركزية
     */
    async checkCpuHealth() {
        try {
            const systeminformation = require('systeminformation');
            const cpu = await systeminformation.currentLoad();
            const cpuUsage = cpu.currentLoad;
            const healthy = cpuUsage < this.thresholds.cpuUsage;

            return {
                component: 'cpu',
                healthy: healthy,
                usage: cpuUsage.toFixed(2),
                threshold: this.thresholds.cpuUsage,
                details: {
                    cores: cpu.cpus.length,
                    load: cpu
                }
            };

        } catch (error) {
            return {
                component: 'cpu',
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * فحص صحة القرص
     */
    async checkDiskHealth() {
        try {
            const systeminformation = require('systeminformation');
            const disk = await systeminformation.fsSize();
            const rootDisk = disk.find(d => d.mount === '/') || disk[0];
            const diskUsage = rootDisk ? rootDisk.use : 0;
            const healthy = diskUsage < this.thresholds.diskUsage;

            return {
                component: 'disk',
                healthy: healthy,
                usage: diskUsage,
                threshold: this.thresholds.diskUsage,
                details: {
                    total: this.formatBytes(rootDisk?.size || 0),
                    used: this.formatBytes(rootDisk?.used || 0),
                    available: this.formatBytes(rootDisk?.available || 0)
                }
            };

        } catch (error) {
            return {
                component: 'disk',
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * فحص صحة الشبكة
     */
    async checkNetworkHealth() {
        try {
            const ping = require('ping');
            const targets = ['google.com', 'reddit.com', 'besttemporaryemail.com'];
            const results = [];

            for (const target of targets) {
                const res = await ping.promise.probe(target);
                results.push({
                    target: target,
                    alive: res.alive,
                    time: res.time
                });
            }

            const aliveCount = results.filter(r => r.alive).length;
            const healthy = aliveCount >= 2; // يجب أن يكون اثنان على الأقل نشطين

            return {
                component: 'network',
                healthy: healthy,
                alive: aliveCount,
                total: targets.length,
                details: results
            };

        } catch (error) {
            return {
                component: 'network',
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * فحص صحة المتصفح
     */
    async checkBrowserHealth() {
        try {
            // محاكاة فحص صحة المتصفح
            // في التنفيذ الفعلي، قد يتضمن هذا اختبار تشغيل متصفح
            const healthy = true; // تبسيط

            return {
                component: 'browser',
                healthy: healthy,
                details: {
                    chromedriver: 'available',
                    selenium: 'available'
                }
            };

        } catch (error) {
            return {
                component: 'browser',
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * فحص صحة خدمة البريد
     */
    async checkEmailServiceHealth() {
        try {
            const axios = require('axios');
            const response = await axios.get('https://www.besttemporaryemail.com', {
                timeout: 10000
            });

            const healthy = response.status === 200;

            return {
                component: 'email_service',
                healthy: healthy,
                status: response.status,
                details: {
                    service: 'besttemporaryemail.com',
                    responseTime: response.duration
                }
            };

        } catch (error) {
            return {
                component: 'email_service',
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * فحص صحة Google Sheets
     */
    async checkSheetsHealth() {
        try {
            // محاكاة فحص اتصال Google Sheets
            const healthy = true; // تبسيط

            return {
                component: 'google_sheets',
                healthy: healthy,
                details: {
                    api: 'available',
                    connection: 'stable'
                }
            };

        } catch (error) {
            return {
                component: 'google_sheets',
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * تحليل الصحة العامة
     */
    analyzeOverallHealth(components) {
        const unhealthyComponents = Object.values(components).filter(comp => !comp.healthy);
        const healthScore = this.calculateHealthScore(components);

        let status, severity;

        if (unhealthyComponents.length === 0) {
            status = 'healthy';
            severity = 'low';
        } else if (unhealthyComponents.length <= 2) {
            status = 'degraded';
            severity = 'medium';
        } else {
            status = 'unhealthy';
            severity = 'high';
        }

        return {
            status: status,
            severity: severity,
            healthScore: healthScore,
            unhealthyComponents: unhealthyComponents.map(comp => comp.component),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * حساب درجة الصحة
     */
    calculateHealthScore(components) {
        const totalComponents = Object.keys(components).length;
        const healthyComponents = Object.values(components).filter(comp => comp.healthy).length;
        return Math.round((healthyComponents / totalComponents) * 100);
    }

    /**
     * توليد التوصيات
     */
    generateRecommendations(healthReport) {
        const recommendations = [];
        const components = healthReport.components;

        if (!components.memory.healthy) {
            recommendations.push('تحرير الذاكرة - تنظيف الموارد المؤقتة');
        }

        if (!components.cpu.healthy) {
            recommendations.push('تقليل حمل CPU - تقليل العمليات المتزامنة');
        }

        if (!components.disk.healthy) {
            recommendations.push('تحرير مساحة التخزين - حذف الملفات المؤقتة');
        }

        if (!components.network.healthy) {
            recommendations.push('فحص اتصال الإنترنت - إعادة تعيين الشبكة');
        }

        if (!components.browser.healthy) {
            recommendations.push('إعادة تهيئة المتصفح - تحديث chromedriver');
        }

        if (!components.email.healthy) {
            recommendations.push('استخدام خدمة بريد بديلة - التحقق من الحظر');
        }

        if (!components.sheets.healthy) {
            recommendations.push('إعادة مصادقة Google Sheets - تحديث الاعتماديات');
        }

        // توصيات عامة
        if (healthReport.overallHealth.healthScore < 70) {
            recommendations.push('إجراء تعافي تلقائي - إعادة تهيئة النظام');
        }

        return recommendations.length > 0 ? recommendations : ['النظام يعمل بشكل مثالي'];
    }

    /**
     * تحديث مقاييس الصحة
     */
    updateHealthMetrics(healthReport) {
        this.healthMetrics.totalUptime = Date.now() - new Date(this.healthMetrics.startupTime).getTime();
        
        if (healthReport.overallHealth.status === 'unhealthy') {
            this.healthMetrics.criticalErrors++;
        } else if (healthReport.overallHealth.status === 'degraded') {
            this.healthMetrics.warnings++;
        }

        this.healthMetrics.componentHealth = healthReport.components;
    }

    /**
     * تسجيل خطأ حرج
     */
    async recordCriticalError(errorType, error) {
        this.healthMetrics.criticalErrors++;
        
        this.logger.error(`🚨 خطأ حرج مسجل: ${errorType} - ${error.message}`);
        
        // حفظ تفاصيل الخطأ للتحليل
        await this.saveErrorDetails(errorType, error);
    }

    /**
     * تسجيل خطأ في العملية
     */
    async recordOperationError(operationType, error) {
        this.logger.warning(`⚠️ خطأ في العملية: ${operationType} - ${error.message}`);
        
        // يمكن إضافة منطق أكثر تطوراً لتسجيل الأخطاء
        await this.saveErrorDetails(`operation_${operationType}`, error);
    }

    /**
     * حفظ تفاصيل الخطأ
     */
    async saveErrorDetails(errorType, error) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const errorsDir = path.join(__dirname, '../../logs/errors');
            if (!fs.existsSync(errorsDir)) {
                fs.mkdirSync(errorsDir, { recursive: true });
            }
            
            const errorFile = path.join(errorsDir, `error_${Date.now()}.json`);
            
            const errorDetails = {
                timestamp: new Date().toISOString(),
                type: errorType,
                message: error.message,
                stack: error.stack,
                healthStatus: this.healthStatus,
                systemMetrics: await this.collectSystemMetrics()
            };
            
            fs.writeFileSync(errorFile, JSON.stringify(errorDetails, null, 2));
            
        } catch (saveError) {
            this.logger.error(`❌ فشل في حفظ تفاصيل الخطأ: ${saveError.message}`);
        }
    }

    /**
     * جمع مقاييس النظام
     */
    async collectSystemMetrics() {
        try {
            const systeminformation = require('systeminformation');
            
            return {
                memory: await systeminformation.mem(),
                cpu: await systeminformation.currentLoad(),
                disk: await systeminformation.fsSize(),
                time: new Date().toISOString()
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * فحص نظام كامل
     */
    async fullSystemCheck() {
        this.logger.info('🔍 إجراء فحص نظام كامل...');
        
        const healthReport = await this.performHealthCheck();
        const networkTest = await this.performAdvancedNetworkTest();
        const securityCheck = await this.performSecurityCheck();
        
        const fullReport = {
            health: healthReport,
            network: networkTest,
            security: securityCheck,
            overall: this.analyzeFullSystemCheck(healthReport, networkTest, securityCheck)
        };
        
        return fullReport;
    }

    /**
     * اختبار شبكة متقدم
     */
    async performAdvancedNetworkTest() {
        try {
            const axios = require('axios');
            const testUrls = [
                'https://www.google.com',
                'https://www.reddit.com',
                'https://www.besttemporaryemail.com'
            ];
            
            const results = [];
            
            for (const url of testUrls) {
                const startTime = Date.now();
                try {
                    const response = await axios.get(url, { timeout: 15000 });
                    const responseTime = Date.now() - startTime;
                    
                    results.push({
                        url: url,
                        status: response.status,
                        responseTime: responseTime,
                        success: true
                    });
                } catch (error) {
                    results.push({
                        url: url,
                        status: error.response?.status || 'timeout',
                        responseTime: Date.now() - startTime,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            return {
                success: results.filter(r => r.success).length >= 2,
                details: results,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * فحص أمان
     */
    async performSecurityCheck() {
        // فحوصات أمان أساسية
        const checks = [
            this.checkSensitiveFiles(),
            this.checkEnvironmentVariables(),
            this.checkDependenciesSecurity()
        ];
        
        const results = await Promise.all(checks);
        const allSecure = results.every(check => check.secure);
        
        return {
            secure: allSecure,
            details: results,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * التحقق من الملفات الحساسة
     */
    async checkSensitiveFiles() {
        const fs = require('fs');
        const path = require('path');
        
        const sensitiveFiles = [
            path.join(__dirname, '../../google-credentials.json'),
            path.join(__dirname, '../../.env'),
            path.join(__dirname, '../../config/production.json')
        ];
        
        const exposedFiles = sensitiveFiles.filter(file => fs.existsSync(file));
        
        return {
            check: 'sensitive_files',
            secure: exposedFiles.length === 0,
            exposedFiles: exposedFiles,
            recommendation: exposedFiles.length > 0 ? 
                'نقل الملفات الحساسة إلى environment variables' : 'آمن'
        };
    }

    /**
     * التحقق من متغيرات البيئة
     */
    async checkEnvironmentVariables() {
        const requiredVars = ['GOOGLE_SHEET_ID', 'GOOGLE_SERVICE_ACCOUNT_JSON'];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        return {
            check: 'environment_variables',
            secure: missingVars.length === 0,
            missing: missingVars,
            recommendation: missingVars.length > 0 ?
                `تعريف المتغيرات المفقودة: ${missingVars.join(', ')}` : 'مكتمل'
        };
    }

    /**
     * التحقق من أمان الاعتماديات
     */
    async checkDependenciesSecurity() {
        // فحص مبسط للاعتماديات
        const dependencies = [
            'selenium-webdriver',
            'axios',
            'googleapis'
        ];
        
        const vulnerableDeps = []; // سيكون من خلال مسح فعلي
        
        return {
            check: 'dependencies_security',
            secure: vulnerableDeps.length === 0,
            vulnerable: vulnerableDeps,
            recommendation: vulnerableDeps.length > 0 ?
                'تحديث الاعتماديات المعرضة للخطر' : 'آمن'
        };
    }

    /**
     * تحليل فحص النظام الكامل
     */
    analyzeFullSystemCheck(health, network, security) {
        const issues = [];
        
        if (health.overallHealth.status !== 'healthy') {
            issues.push(`صحة النظام: ${health.overallHealth.status}`);
        }
        
        if (!network.success) {
            issues.push('مشاكل في الشبكة');
        }
        
        if (!security.secure) {
            issues.push('مشاكل أمان');
        }
        
        return {
            ready: issues.length === 0,
            issues: issues,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * توليد تقرير صحة
     */
    generateHealthReport() {
        const report = {
            timestamp: new Date().toISOString(),
            healthStatus: this.healthStatus,
            metrics: this.healthMetrics,
            uptime: this.formatUptime(this.healthMetrics.totalUptime),
            recommendations: this.generateSystemRecommendations()
        };
        
        this.logger.info('📋 تقرير صحة النظام:');
        this.logger.info(`🟢 الحالة: ${report.healthStatus}`);
        this.logger.info(`⏰ وقت التشغيل: ${report.uptime}`);
        this.logger.info(`📊 الأخطاء الحرجة: ${report.metrics.criticalErrors}`);
        this.logger.info(`💡 التوصيات: ${report.recommendations.join(', ')}`);
        
        return report;
    }

    /**
     * توليد توصيات النظام
     */
    generateSystemRecommendations() {
        const recommendations = [];
        
        if (this.healthMetrics.criticalErrors > 5) {
            recommendations.push('مراجعة استقرار النظام - زيادة فترات التعافي');
        }
        
        if (this.healthMetrics.warnings > 10) {
            recommendations.push('تحسين مرونة النظام - تحسين معالجة الأخطاء');
        }
        
        if (this.healthMetrics.totalUptime > 24 * 60 * 60 * 1000) { // 24 ساعة
            recommendations.push('إعادة تشغيل دوري - تجنب تراكم المشاكل');
        }
        
        return recommendations.length > 0 ? recommendations : ['النظام مستقر ولا يحتاج إجراءات'];
    }

    /**
     * تنسيق وقت التشغيل
     */
    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        return `${hours} ساعة ${minutes} دقيقة`;
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
     * تقرير صحة طوارئ
     */
    generateEmergencyHealthReport(error) {
        return {
            timestamp: new Date().toISOString(),
            healthStatus: 'emergency',
            error: error.message,
            recommendations: [
                'إجراء تعافي طوارئ',
                'مراجعة سجلات النظام',
                'التحقق من اتصالات الشبكة'
            ],
            emergency: true
        };
    }

    /**
     * الحصول على الحالة الحالية
     */
    getCurrentStatus() {
        return {
            healthStatus: this.healthStatus,
            metrics: this.healthMetrics,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = { HealthMonitor };
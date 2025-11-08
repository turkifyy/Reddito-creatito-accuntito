/**
 * 📊 مراقب الأداء المتقدم V2 مع التعافي التلقائي والتحليلات الذكية
 * @version 2.0.0
 * @description نظام مراقبة أداء شامل مع خوارزميات تحليل وتنبؤ واستعادة تلقائية
 * @class PerformanceMonitor
 */

import { Logger } from '../core/logger.js';
import { HealthMonitor } from './health-monitor.js';
import { RecoveryManager } from '../recovery/recovery-manager.js';
import Config from '../../config/config.js';
import os from 'os';
import process from 'process';

class PerformanceMonitor {
    constructor() {
        this.logger = new Logger();
        this.healthMonitor = new HealthMonitor();
        this.recoveryManager = new RecoveryManager();
        this.config = Config.monitoring.performance;

        // قاعدة بيانات المقاييس
        this.metrics = {
            // مقاييس الحسابات
            accounts: {
                created: 0,
                failed: 0,
                verified: 0,
                pending: 0,
                successRate: 1.0,
                hourlyRate: 0,
                dailyTarget: Config.timing.dailyTarget
            },

            // مقاييس الوقت
            timing: {
                averageCreationTime: 0,
                fastestCreation: Infinity,
                slowestCreation: 0,
                totalRuntime: 0,
                cyclesCompleted: 0,
                averageCycleTime: 0
            },

            // مقاييس النظام
            system: {
                memoryUsage: 0,
                cpuUsage: 0,
                diskUsage: 0,
                networkLatency: 0,
                uptime: 0,
                processUptime: 0
            },

            // مقاييس الأخطاء والتعافي
            recovery: {
                totalRecoveries: 0,
                successfulRecoveries: 0,
                recoverySuccessRate: 1.0,
                lastRecoveryTime: null,
                recoveryTimeAverage: 0
            },

            // مقاييس التحديات
            challenges: {
                captchaEncounters: 0,
                browserCrashes: 0,
                networkErrors: 0,
                serviceErrors: 0,
                totalErrors: 0,
                errorRate: 0
            }
        };

        // السجلات التاريخية
        this.historicalData = {
            accounts: [],
            timing: [],
            system: [],
            recovery: [],
            challenges: [],
            performanceScores: [],
            maxDataPoints: 1000
        };

        // خوارزميات التحليل
        this.analysisAlgorithms = {
            trendAnalysis: this.trendAnalysis.bind(this),
            anomalyDetection: this.anomalyDetection.bind(this),
            performancePrediction: this.performancePrediction.bind(this),
            correlationAnalysis: this.correlationAnalysis.bind(this),
            patternRecognition: this.patternRecognition.bind(this)
        };

        // تنبيهات الأداء
        this.alerts = {
            active: [],
            history: [],
            thresholds: this.config.alertThresholds
        };

        // التعافي التلقائي
        this.autoRecovery = {
            enabled: true,
            triggers: [],
            lastRecoveryAttempt: null,
            recoveryCooldown: 300000 // 5 دقائق
        };

        // التحليلات المتقدمة
        this.advancedAnalytics = {
            performanceBaseline: null,
            degradationDetection: false,
            predictiveModel: null,
            optimizationSuggestions: []
        };

        this.initialize();
    }

    /**
     * تهيئة مراقب الأداء المتقدم
     */
    async initialize() {
        this.logger.info('📊 تهيئة مراقب الأداء المتقدم V2...');

        try {
            // تحميل البيانات التاريخية
            await this.loadHistoricalData();

            // إنشاء خط أساسي للأداء
            await this.establishPerformanceBaseline();

            // بدء المراقبة المستمرة
            this.startContinuousMonitoring();

            // بدء تحليلات الوقت الحقيقي
            this.startRealTimeAnalytics();

            this.logger.success('✅ تم تهيئة مراقب الأداء المتقدم V2 بنجاح');
        } catch (error) {
            this.logger.error(`❌ فشل في تهيئة مراقب الأداء: ${error.message}`);
            throw error;
        }
    }

    /**
     * بدء المراقبة المستمرة
     */
    startContinuousMonitoring() {
        // مراقبة الموارد كل 30 ثانية
        this.systemMonitoringInterval = setInterval(() => {
            this.collectSystemMetrics();
            this.checkPerformanceThresholds();
            this.runHealthChecks();
        }, 30000);

        // التحليلات المتقدمة كل دقيقة
        this.analyticsInterval = setInterval(() => {
            this.runAdvancedAnalytics();
            this.generatePerformanceInsights();
            this.cleanupOldData();
        }, 60000);

        // التقارير التلقائية كل 5 دقائق
        this.reportingInterval = setInterval(() => {
            this.generateAutoReports();
            this.checkAutoRecovery();
        }, 300000);

        this.logger.debug('🔍 بدء المراقبة المستمرة للأداء');
    }

    /**
     * بدء تحليلات الوقت الحقيقي
     */
    startRealTimeAnalytics() {
        this.realTimeAnalytics = {
            lastMinuteMetrics: [],
            lastHourTrends: [],
            dailyPatterns: [],
            realTimeAlerts: []
        };

        this.logger.debug('📈 بدء تحليلات الوقت الحقيقي');
    }

    /**
     * جمع مقاييس النظام
     */
    async collectSystemMetrics() {
        try {
            const systemMetrics = await this.getSystemMetrics();
            
            this.metrics.system = {
                ...this.metrics.system,
                ...systemMetrics
            };

            // تحديث البيانات التاريخية
            this.historicalData.system.push({
                timestamp: new Date().toISOString(),
                ...systemMetrics
            });

            // الحفاظ على حجم البيانات
            this.maintainDataSize();

        } catch (error) {
            this.logger.error(`❌ فشل في جمع مقاييس النظام: ${error.message}`);
        }
    }

    /**
     * الحصول على مقاييس النظام المتقدمة
     */
    async getSystemMetrics() {
        return new Promise((resolve) => {
            const startTime = Date.now();

            // استخدام نظام المعلومات
            const systemInfo = {
                memoryUsage: this.getMemoryUsage(),
                cpuUsage: this.getCpuUsage(),
                diskUsage: this.getDiskUsage(),
                networkLatency: this.getNetworkLatency(),
                uptime: os.uptime(),
                processUptime: process.uptime(),
                loadAverage: os.loadavg(),
                freeMemory: os.freemem(),
                totalMemory: os.totalmem()
            };

            // حساب الاستخدامات
            const memoryUsage = (systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory;
            const cpuUsage = systemInfo.loadAverage[0] / os.cpus().length;

            resolve({
                memoryUsage: Math.round(memoryUsage * 100),
                cpuUsage: Math.round(cpuUsage * 100),
                diskUsage: systemInfo.diskUsage,
                networkLatency: systemInfo.networkLatency,
                uptime: systemInfo.uptime,
                processUptime: systemInfo.processUptime,
                loadAverage: systemInfo.loadAverage[0],
                collectionTime: Date.now() - startTime
            });
        });
    }

    /**
     * الحصول على استخدام الذاكرة
     */
    getMemoryUsage() {
        try {
            const used = process.memoryUsage();
            return {
                rss: Math.round(used.rss / 1024 / 1024),
                heapTotal: Math.round(used.heapTotal / 1024 / 1024),
                heapUsed: Math.round(used.heapUsed / 1024 / 1024),
                external: Math.round(used.external / 1024 / 1024)
            };
        } catch (error) {
            return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 };
        }
    }

    /**
     * الحصول على استخدام المعالج
     */
    getCpuUsage() {
        try {
            const cpus = os.cpus();
            let totalIdle = 0, totalTick = 0;

            cpus.forEach(cpu => {
                for (let type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });

            return {
                usage: Math.round(100 - (100 * totalIdle / totalTick)),
                cores: cpus.length,
                model: cpus[0]?.model || 'Unknown'
            };
        } catch (error) {
            return { usage: 0, cores: 0, model: 'Unknown' };
        }
    }

    /**
     * الحصول على استخدام القرص
     */
    getDiskUsage() {
        // تنفيذ مبسط - في الإنتاج الحقيقي نستخدم مكتبة مثل systeminformation
        return {
            used: 0,
            free: 0,
            total: 0,
            usage: 0
        };
    }

    /**
     * الحصول على زمن الشبكة
     */
    getNetworkLatency() {
        // تنفيذ مبسط - في الإنتاج الحقيقي نقوم بقياس زمن الاستجابة
        return 0;
    }

    /**
     * تحديث إحصائيات الحسابات
     */
    updateAccountStats(successCount = 0, failedCount = 0) {
        this.metrics.accounts.created += successCount + failedCount;
        this.metrics.accounts.failed += failedCount;
        
        // حساب معدل النجاح
        const total = this.metrics.accounts.created;
        this.metrics.accounts.successRate = total > 0 ? 
            (this.metrics.accounts.created - this.metrics.accounts.failed) / total : 1.0;

        // حساب المعدل بالساعة
        this.calculateHourlyRate();

        // تحديث البيانات التاريخية
        this.historicalData.accounts.push({
            timestamp: new Date().toISOString(),
            created: this.metrics.accounts.created,
            failed: this.metrics.accounts.failed,
            successRate: this.metrics.accounts.successRate,
            hourlyRate: this.metrics.accounts.hourlyRate
        });

        // التحقق من التنبيهات
        this.checkAccountAlerts();
    }

    /**
     * حساب المعدل بالساعة
     */
    calculateHourlyRate() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));

        // حساب الحسابات المنشأة في الساعة الماضية
        const recentAccounts = this.historicalData.accounts.filter(entry => 
            new Date(entry.timestamp) > oneHourAgo
        );

        if (recentAccounts.length > 0) {
            const first = recentAccounts[0];
            const last = recentAccounts[recentAccounts.length - 1];
            const accountsCreated = last.created - first.created;
            const timeDiff = (new Date(last.timestamp) - new Date(first.timestamp)) / (1000 * 60 * 60);
            
            this.metrics.accounts.hourlyRate = timeDiff > 0 ? accountsCreated / timeDiff : 0;
        }
    }

    /**
     * تحديث إحصائيات الوقت
     */
    updateTimingStats(cycleTime, creationTime) {
        this.metrics.timing.cyclesCompleted++;
        this.metrics.timing.totalRuntime += cycleTime;
        this.metrics.timing.averageCycleTime = this.metrics.timing.totalRuntime / this.metrics.timing.cyclesCompleted;

        // تحديث وقت الإنشاء
        if (creationTime > 0) {
            this.metrics.timing.fastestCreation = Math.min(this.metrics.timing.fastestCreation, creationTime);
            this.metrics.timing.slowestCreation = Math.max(this.metrics.timing.slowestCreation, creationTime);
            
            // متوسط وقت الإنشاء المتحرك
            const previousAverage = this.metrics.timing.averageCreationTime;
            const totalCreations = this.metrics.accounts.created;
            this.metrics.timing.averageCreationTime = 
                (previousAverage * (totalCreations - 1) + creationTime) / totalCreations;
        }

        // تحديث البيانات التاريخية
        this.historicalData.timing.push({
            timestamp: new Date().toISOString(),
            cycleTime,
            creationTime,
            averageCreationTime: this.metrics.timing.averageCreationTime,
            cyclesCompleted: this.metrics.timing.cyclesCompleted
        });
    }

    /**
     * تسجيل خطأ في النظام
     */
    recordError(errorType, component, details = {}) {
        this.metrics.challenges.totalErrors++;

        switch (errorType) {
            case 'captcha':
                this.metrics.challenges.captchaEncounters++;
                break;
            case 'browser_crash':
                this.metrics.challenges.browserCrashes++;
                break;
            case 'network':
                this.metrics.challenges.networkErrors++;
                break;
            case 'service':
                this.metrics.challenges.serviceErrors++;
                break;
        }

        // حساب معدل الخطأ
        const totalOperations = this.metrics.accounts.created + this.metrics.challenges.totalErrors;
        this.metrics.challenges.errorRate = totalOperations > 0 ? 
            this.metrics.challenges.totalErrors / totalOperations : 0;

        // تحديث البيانات التاريخية
        this.historicalData.challenges.push({
            timestamp: new Date().toISOString(),
            errorType,
            component,
            details,
            totalErrors: this.metrics.challenges.totalErrors,
            errorRate: this.metrics.challenges.errorRate
        });

        // التحقق من تنبيهات الأخطاء
        this.checkErrorAlerts();
    }

    /**
     * تسجيل عملية تعافي
     */
    recordRecovery(recoveryType, success, duration, details = {}) {
        this.metrics.recovery.totalRecoveries++;
        
        if (success) {
            this.metrics.recovery.successfulRecoveries++;
        }

        this.metrics.recovery.recoverySuccessRate = 
            this.metrics.recovery.totalRecoveries > 0 ?
            this.metrics.recovery.successfulRecoveries / this.metrics.recovery.totalRecoveries : 1.0;

        this.metrics.recovery.lastRecoveryTime = new Date().toISOString();

        // متوسط وقت التعافي المتحرك
        const previousAverage = this.metrics.recovery.recoveryTimeAverage;
        const totalRecoveries = this.metrics.recovery.totalRecoveries;
        this.metrics.recovery.recoveryTimeAverage = 
            (previousAverage * (totalRecoveries - 1) + duration) / totalRecoveries;

        // تحديث البيانات التاريخية
        this.historicalData.recovery.push({
            timestamp: new Date().toISOString(),
            recoveryType,
            success,
            duration,
            details,
            totalRecoveries: this.metrics.recovery.totalRecoveries,
            successRate: this.metrics.recovery.recoverySuccessRate
        });

        // تسجيل محفز التعافي التلقائي
        if (success && this.autoRecovery.enabled) {
            this.recordRecoveryTrigger(recoveryType, duration, details);
        }
    }

    /**
     * تسجيل محفز التعافي
     */
    recordRecoveryTrigger(recoveryType, duration, details) {
        this.autoRecovery.triggers.push({
            timestamp: new Date().toISOString(),
            recoveryType,
            duration,
            details,
            effectiveness: this.calculateRecoveryEffectiveness(details)
        });

        // الحفاظ على حجم قائمة المحفزات
        if (this.autoRecovery.triggers.length > 100) {
            this.autoRecovery.triggers = this.autoRecovery.triggers.slice(-100);
        }
    }

    /**
     * حساب فعالية التعافي
     */
    calculateRecoveryEffectiveness(details) {
        let effectiveness = 0.5; // أساسي

        if (details.errorBefore && details.errorAfter) {
            const errorReduction = details.errorBefore - details.errorAfter;
            effectiveness = 0.5 + (errorReduction * 0.5);
        }

        if (details.performanceImprovement) {
            effectiveness = Math.max(effectiveness, details.performanceImprovement);
        }

        return Math.min(1, Math.max(0, effectiveness));
    }

    /**
     * التحقق من عتبات الأداء
     */
    checkPerformanceThresholds() {
        const thresholds = this.config.alertThresholds;
        const alerts = [];

        // التحقق من معدل النجاح
        if (this.metrics.accounts.successRate < thresholds.successRate) {
            alerts.push({
                level: 'high',
                type: 'success_rate_low',
                message: `معدل النجاح منخفض: ${(this.metrics.accounts.successRate * 100).toFixed(1)}%`,
                value: this.metrics.accounts.successRate,
                threshold: thresholds.successRate
            });
        }

        // التحقق من معدل الخطأ
        if (this.metrics.challenges.errorRate > thresholds.errorRate) {
            alerts.push({
                level: 'high',
                type: 'error_rate_high',
                message: `معدل الخطأ مرتفع: ${(this.metrics.challenges.errorRate * 100).toFixed(1)}%`,
                value: this.metrics.challenges.errorRate,
                threshold: thresholds.errorRate
            });
        }

        // التحقق من وقت الإنشاء
        if (this.metrics.timing.averageCreationTime > thresholds.accountCreationTime) {
            alerts.push({
                level: 'medium',
                type: 'creation_time_high',
                message: `وقت الإنشاء مرتفع: ${(this.metrics.timing.averageCreationTime / 1000).toFixed(1)}s`,
                value: this.metrics.timing.averageCreationTime,
                threshold: thresholds.accountCreationTime
            });
        }

        // التحقق من استخدام الذاكرة
        if (this.metrics.system.memoryUsage > 85) {
            alerts.push({
                level: 'medium',
                type: 'memory_usage_high',
                message: `استخدام الذاكرة مرتفع: ${this.metrics.system.memoryUsage}%`,
                value: this.metrics.system.memoryUsage,
                threshold: 85
            });
        }

        // التحقق من استخدام المعالج
        if (this.metrics.system.cpuUsage > 80) {
            alerts.push({
                level: 'medium',
                type: 'cpu_usage_high',
                message: `استخدام المعالج مرتفع: ${this.metrics.system.cpuUsage}%`,
                value: this.metrics.system.cpuUsage,
                threshold: 80
            });
        }

        // معالجة التنبيهات
        alerts.forEach(alert => this.processAlert(alert));
    }

    /**
     * معالجة التنبيه
     */
    processAlert(alert) {
        // التحقق من عدم وجود تنبيه مكرر
        const existingAlert = this.alerts.active.find(a => 
            a.type === alert.type && a.value === alert.value
        );

        if (!existingAlert) {
            this.alerts.active.push({
                ...alert,
                id: this.generateAlertId(),
                timestamp: new Date().toISOString(),
                acknowledged: false
            });

            this.logger.warning(`⚠️ ${alert.message}`);

            // تنبيهات عالية المستوى تتطلب إجراء فوري
            if (alert.level === 'high') {
                this.triggerImmediateAction(alert);
            }
        }
    }

    /**
     * إجراء فوري للتنبيهات عالية المستوى
     */
    triggerImmediateAction(alert) {
        switch (alert.type) {
            case 'success_rate_low':
                this.logger.error('🚨 معدل النجاح منخفض بشكل خطير - تشغيل التعافي التلقائي');
                this.triggerAutoRecovery('low_success_rate', alert);
                break;

            case 'error_rate_high':
                this.logger.error('🚨 معدل الخطأ مرتفع بشكل خطير - تشغيل التعافي التلقائي');
                this.triggerAutoRecovery('high_error_rate', alert);
                break;

            case 'memory_usage_high':
                this.logger.warning('🧠 استخدام الذاكرة مرتفع - تنظيف الذاكرة');
                this.cleanupMemory();
                break;
        }
    }

    /**
     * تشغيل التعافي التلقائي
     */
    async triggerAutoRecovery(reason, alert) {
        // التحقق من وقت التبريد
        const now = Date.now();
        if (this.autoRecovery.lastRecoveryAttempt && 
            (now - this.autoRecovery.lastRecoveryAttempt < this.autoRecovery.recoveryCooldown)) {
            this.logger.debug('⏳ التعافي التلقائي في وقت التبريد - تخطي');
            return;
        }

        this.autoRecovery.lastRecoveryAttempt = now;

        try {
            this.logger.info(`🔄 تشغيل التعافي التلقائي بسبب: ${reason}`);

            let recoveryType = 'quick';
            
            // تحديد نوع التعافي بناءً على السبب
            if (reason.includes('high_error_rate') || reason.includes('low_success_rate')) {
                recoveryType = 'full';
            }

            // تنفيذ التعافي
            const success = await this.recoveryManager.performRecovery(recoveryType, {
                reason,
                alert,
                metrics: this.getCurrentMetrics()
            });

            // تسجيل النتيجة
            this.recordRecovery(`auto_${recoveryType}`, success, 0, {
                reason,
                alert: alert.type,
                metricsBefore: this.getCurrentMetrics()
            });

            if (success) {
                this.logger.success('✅ التعافي التلقائي ناجح');
            } else {
                this.logger.error('❌ التعافي التلقائي فاشل');
            }

        } catch (error) {
            this.logger.error(`❌ خطأ في التعافي التلقائي: ${error.message}`);
            this.recordRecovery('auto_failed', false, 0, { error: error.message });
        }
    }

    /**
     * تنظيف الذاكرة
     */
    cleanupMemory() {
        try {
            if (global.gc) {
                global.gc();
                this.logger.debug('🧹 تم تنظيف ذاكرة Garbage Collection');
            }

            // تنظيف البيانات التاريخية القديمة
            this.cleanupOldData();

            this.logger.debug('✅ تم تنظيف الذاكرة');
        } catch (error) {
            this.logger.warning(`⚠️ فشل في تنظيف الذاكرة: ${error.message}`);
        }
    }

    /**
     * التحقق من تنبيهات الحسابات
     */
    checkAccountAlerts() {
        const progress = this.metrics.accounts.created / this.metrics.accounts.dailyTarget;

        // تنبيه التقدم البطيء
        if (progress < 0.5 && this.metrics.system.uptime > 12 * 60 * 60) { // بعد 12 ساعة
            this.processAlert({
                level: 'medium',
                type: 'slow_progress',
                message: `التقدم بطيء: ${(progress * 100).toFixed(1)}% بعد 12 ساعة`,
                value: progress,
                threshold: 0.5
            });
        }

        // تنبيه الهدف المتحقق
        if (progress >= 1.0) {
            this.processAlert({
                level: 'low',
                type: 'target_achieved',
                message: `🎉 تم تحقيق الهدف اليومي: ${this.metrics.accounts.created} حساب`,
                value: progress,
                threshold: 1.0
            });
        }
    }

    /**
     * التحقق من تنبيهات الأخطاء
     */
    checkErrorAlerts() {
        // تنبيه تكرر الأخطاء
        const recentErrors = this.historicalData.challenges.filter(entry => 
            new Date(entry.timestamp) > new Date(Date.now() - 30 * 60 * 1000) // 30 دقيقة
        );

        if (recentErrors.length > 10) {
            this.processAlert({
                level: 'high',
                type: 'error_flood',
                message: `فيضان أخطاء: ${recentErrors.length} خطأ في 30 دقيقة`,
                value: recentErrors.length,
                threshold: 10
            });
        }
    }

    /**
     * تشغيل التحليلات المتقدمة
     */
    runAdvancedAnalytics() {
        try {
            // تحليل الاتجاهات
            const trends = this.analysisAlgorithms.trendAnalysis();

            // كشف الشذوذ
            const anomalies = this.analysisAlgorithms.anomalyDetection();

            // التنبؤ بالأداء
            const predictions = this.analysisAlgorithms.performancePrediction();

            // تحليل الارتباط
            const correlations = this.analysisAlgorithms.correlationAnalysis();

            // تحديث التحليلات
            this.advancedAnalytics = {
                ...this.advancedAnalytics,
                trends,
                anomalies,
                predictions,
                correlations,
                lastAnalysis: new Date().toISOString()
            };

            // توليد توصيات التحسين
            this.generateOptimizationSuggestions();

        } catch (error) {
            this.logger.error(`❌ فشل في التحليلات المتقدمة: ${error.message}`);
        }
    }

    /**
     * تحليل الاتجاهات
     */
    trendAnalysis() {
        if (this.historicalData.accounts.length < 10) {
            return { available: false, message: 'بيانات غير كافية' };
        }

        const recentData = this.historicalData.accounts.slice(-24); // آخر 24 نقطة

        const successRates = recentData.map(d => d.successRate);
        const hourlyRates = recentData.map(d => d.hourlyRate);

        return {
            available: true,
            successRateTrend: this.calculateTrend(successRates),
            hourlyRateTrend: this.calculateTrend(hourlyRates),
            stability: this.calculateStability(successRates),
            confidence: this.calculateConfidence(recentData)
        };
    }

    /**
     * كشف الشذوذ
     */
    anomalyDetection() {
        const anomalies = [];

        // كشف الشذوذ في معدل النجاح
        const successRates = this.historicalData.accounts.map(d => d.successRate);
        const successAnomalies = this.detectStatisticalAnomalies(successRates);
        
        successAnomalies.forEach(anomaly => {
            anomalies.push({
                type: 'success_rate_anomaly',
                timestamp: this.historicalData.accounts[anomaly.index]?.timestamp,
                value: anomaly.value,
                severity: anomaly.severity
            });
        });

        // كشف الشذوذ في وقت الإنشاء
        const creationTimes = this.historicalData.timing.map(d => d.creationTime);
        const timeAnomalies = this.detectStatisticalAnomalies(creationTimes);

        timeAnomalies.forEach(anomaly => {
            anomalies.push({
                type: 'creation_time_anomaly',
                timestamp: this.historicalData.timing[anomaly.index]?.timestamp,
                value: anomaly.value,
                severity: anomaly.severity
            });
        });

        return anomalies;
    }

    /**
     * التنبؤ بالأداء
     */
    performancePrediction() {
        if (this.historicalData.accounts.length < 20) {
            return { available: false, message: 'بيانات غير كافية للتنبؤ' };
        }

        const recentSuccessRates = this.historicalData.accounts
            .slice(-20)
            .map(d => d.successRate);

        const recentHourlyRates = this.historicalData.accounts
            .slice(-20)
            .map(d => d.hourlyRate);

        return {
            available: true,
            predictedSuccessRate: this.predictNextValue(recentSuccessRates),
            predictedHourlyRate: this.predictNextValue(recentHourlyRates),
            confidence: 0.75, // ثقة متوسطة
            timeframe: 'next_hour'
        };
    }

    /**
     * تحليل الارتباط
     */
    correlationAnalysis() {
        if (this.historicalData.accounts.length < 10 || this.historicalData.system.length < 10) {
            return { available: false };
        }

        // أخذ العينات الأخيرة
        const sampleSize = Math.min(
            this.historicalData.accounts.length,
            this.historicalData.system.length,
            50
        );

        const successRates = this.historicalData.accounts.slice(-sampleSize).map(d => d.successRate);
        const memoryUsage = this.historicalData.system.slice(-sampleSize).map(d => d.memoryUsage);
        const cpuUsage = this.historicalData.system.slice(-sampleSize).map(d => d.cpuUsage);

        return {
            available: true,
            successRateMemoryCorrelation: this.calculateCorrelation(successRates, memoryUsage),
            successRateCpuCorrelation: this.calculateCorrelation(successRates, cpuUsage),
            memoryCpuCorrelation: this.calculateCorrelation(memoryUsage, cpuUsage)
        };
    }

    /**
     * توليد توصيات التحسين
     */
    generateOptimizationSuggestions() {
        const suggestions = [];

        // تحليل معدل النجاح
        if (this.metrics.accounts.successRate < 0.8) {
            suggestions.push({
                priority: 'high',
                category: 'success_rate',
                message: 'معدل النجاح منخفض - فحص إستراتيجية إنشاء الحسابات',
                action: 'review_creation_strategy',
                impact: 'high'
            });
        }

        // تحليل وقت الإنشاء
        if (this.metrics.timing.averageCreationTime > 120000) { // أكثر من 2 دقيقة
            suggestions.push({
                priority: 'medium',
                category: 'performance',
                message: 'وقت إنشاء الحسابات طويل - تحسين إجراءات التسجيل',
                action: 'optimize_registration_flow',
                impact: 'medium'
            });
        }

        // تحليل استخدام الموارد
        if (this.metrics.system.memoryUsage > 80) {
            suggestions.push({
                priority: 'medium',
                category: 'resources',
                message: 'استخدام الذاكرة مرتفع - تنظيف الموارد المؤقتة',
                action: 'cleanup_resources',
                impact: 'medium'
            });
        }

        this.advancedAnalytics.optimizationSuggestions = suggestions;
    }

    /**
     * توليد تقرير الأداء الشامل
     */
    generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.getPerformanceSummary(),
            metrics: this.getCurrentMetrics(),
            analytics: this.advancedAnalytics,
            alerts: {
                active: this.alerts.active,
                recent: this.alerts.history.slice(-10)
            },
            recommendations: this.advancedAnalytics.optimizationSuggestions,
            historicalTrends: this.getHistoricalTrends(),
            systemHealth: this.healthMonitor.getCurrentStatus()
        };

        // حساب درجة الأداء الإجمالية
        report.performanceScore = this.calculateOverallPerformanceScore();

        return report;
    }

    /**
     * الحصول على ملخص الأداء
     */
    getPerformanceSummary() {
        return {
            accountsCreated: this.metrics.accounts.created,
            successRate: this.metrics.accounts.successRate,
            hourlyRate: this.metrics.accounts.hourlyRate,
            dailyProgress: this.metrics.accounts.created / this.metrics.accounts.dailyTarget,
            totalRuntime: this.metrics.timing.totalRuntime,
            systemUptime: this.metrics.system.uptime,
            totalErrors: this.metrics.challenges.totalErrors,
            totalRecoveries: this.metrics.recovery.totalRecoveries
        };
    }

    /**
     * الحصول على المقاييس الحالية
     */
    getCurrentMetrics() {
        return JSON.parse(JSON.stringify(this.metrics)); // نسخة عميقة
    }

    /**
     * الحصول على الاتجاهات التاريخية
     */
    getHistoricalTrends() {
        return {
            successRate: this.historicalData.accounts.slice(-24).map(d => d.successRate),
            hourlyRate: this.historicalData.accounts.slice(-24).map(d => d.hourlyRate),
            errorRate: this.historicalData.challenges.slice(-24).map(d => d.errorRate),
            memoryUsage: this.historicalData.system.slice(-24).map(d => d.memoryUsage)
        };
    }

    /**
     * حساب درجة الأداء الإجمالية
     */
    calculateOverallPerformanceScore() {
        const weights = {
            successRate: 0.4,
            hourlyRate: 0.3,
            errorRate: 0.2,
            systemHealth: 0.1
        };

        const successScore = this.metrics.accounts.successRate;
        const hourlyScore = Math.min(this.metrics.accounts.hourlyRate / 10, 1); // تطبيع
        const errorScore = 1 - this.metrics.challenges.errorRate;
        const healthScore = this.metrics.system.memoryUsage < 80 ? 1 : 0.5;

        return (
            successScore * weights.successRate +
            hourlyScore * weights.hourlyRate +
            errorScore * weights.errorRate +
            healthScore * weights.systemHealth
        );
    }

    /**
     * توليد التقارير التلقائية
     */
    generateAutoReports() {
        const report = this.generatePerformanceReport();

        // حفظ التقرير في السجل
        this.historicalData.performanceScores.push({
            timestamp: report.timestamp,
            score: report.performanceScore,
            summary: report.summary
        });

        // تسجيل التقرير إذا كان هناك مشاكل
        if (report.performanceScore < 0.7 || this.alerts.active.length > 0) {
            this.logger.info('📋 تقرير أداء النظام:', report);
        }
    }

    /**
     * التحقق من التعافي التلقائي
     */
    checkAutoRecovery() {
        if (!this.autoRecovery.enabled) return;

        const now = Date.now();
        const lastRecovery = this.autoRecovery.lastRecoveryAttempt;

        // التحقق من وقت التبريد
        if (lastRecovery && (now - lastRecovery < this.autoRecovery.recoveryCooldown)) {
            return;
        }

        // شروط التعافي التلقائي
        const conditions = [
            this.metrics.accounts.successRate < 0.6,
            this.metrics.challenges.errorRate > 0.3,
            this.metrics.system.memoryUsage > 90,
            this.alerts.active.some(alert => alert.level === 'high')
        ];

        if (conditions.some(condition => condition)) {
            this.triggerAutoRecovery('performance_degradation', {
                type: 'auto_recovery_triggered',
                conditions: conditions.map((c, i) => ({ condition: i, met: c }))
            });
        }
    }

    /**
     * فحوصات الصحة
     */
    runHealthChecks() {
        const health = this.healthMonitor.quickHealthCheck();

        if (!health.healthy) {
            this.processAlert({
                level: 'high',
                type: 'system_health_degraded',
                message: 'صحة النظام متدهورة - فحص المكونات',
                value: 0,
                threshold: 1
            });
        }
    }

    /**
     * تنظيف البيانات القديمة
     */
    cleanupOldData() {
        const now = new Date();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // أسبوع

        // تنظيف جميع البيانات التاريخية
        Object.keys(this.historicalData).forEach(key => {
            if (Array.isArray(this.historicalData[key])) {
                this.historicalData[key] = this.historicalData[key].filter(entry => 
                    new Date(entry.timestamp) > new Date(now.getTime() - maxAge)
                );
            }
        });

        // تنظيف التنبيهات القديمة
        this.alerts.history = [
            ...this.alerts.history,
            ...this.alerts.active.filter(alert => 
                new Date(alert.timestamp) < new Date(now.getTime() - 24 * 60 * 60 * 1000)
            )
        ];

        this.alerts.active = this.alerts.active.filter(alert => 
            new Date(alert.timestamp) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
        );

        this.logger.debug('🧹 تم تنظيف البيانات التاريخية القديمة');
    }

    /**
     * الحفاظ على حجم البيانات
     */
    maintainDataSize() {
        Object.keys(this.historicalData).forEach(key => {
            if (Array.isArray(this.historicalData[key]) && 
                this.historicalData[key].length > this.historicalData.maxDataPoints) {
                this.historicalData[key] = this.historicalData[key].slice(-this.historicalData.maxDataPoints);
            }
        });
    }

    /**
     * إنشاء خط أساسي للأداء
     */
    async establishPerformanceBaseline() {
        // في الإصدار الأولي، نستخدم قيماً افتراضية
        this.advancedAnalytics.performanceBaseline = {
            successRate: 0.85,
            hourlyRate: 4.0,
            creationTime: 90000, // 1.5 دقيقة
            errorRate: 0.1,
            established: new Date().toISOString()
        };

        this.logger.debug('📈 تم إنشاء خط أساسي للأداء');
    }

    /**
     * تحميل البيانات التاريخية
     */
    async loadHistoricalData() {
        try {
            // في الإصدار المستقبلي، يمكن تحميل البيانات من قاعدة بيانات
            this.logger.debug('📊 لا توجد بيانات تاريخية - بدء جديد');
        } catch (error) {
            this.logger.warning(`⚠️ فشل في تحميل البيانات التاريخية: ${error.message}`);
        }
    }

    /**
     * إيقاف المراقبة
     */
    stopMonitoring() {
        if (this.systemMonitoringInterval) {
            clearInterval(this.systemMonitoringInterval);
        }
        if (this.analyticsInterval) {
            clearInterval(this.analyticsInterval);
        }
        if (this.reportingInterval) {
            clearInterval(this.reportingInterval);
        }

        this.logger.info('🛑 تم إيقاف مراقبة الأداء');
    }

    // ============================================
    // 🧮 دوال رياضية مساعدة
    // ============================================

    /**
     * توليد معرف تنبيه فريد
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * حساب الاتجاه
     */
    calculateTrend(data) {
        if (data.length < 2) return 0;

        const x = data.map((_, i) => i);
        const y = data;

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumXX = x.reduce((a, b) => a + b * b, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    /**
     * حساب الاستقرار
     */
    calculateStability(data) {
        if (data.length < 2) return 1;

        const mean = data.reduce((a, b) => a + b) / data.length;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        
        return 1 - (Math.sqrt(variance) / mean);
    }

    /**
     * حساب الثقة
     */
    calculateConfidence(data) {
        return Math.min(1, data.length / 100);
    }

    /**
     * كشف الشذوذ الإحصائي
     */
    detectStatisticalAnomalies(data) {
        if (data.length < 10) return [];

        const mean = data.reduce((a, b) => a + b) / data.length;
        const stdDev = Math.sqrt(data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length);

        const anomalies = [];
        data.forEach((value, index) => {
            const zScore = Math.abs((value - mean) / stdDev);
            if (zScore > 2.5) { // عتبة الشذوذ
                anomalies.push({
                    index,
                    value,
                    zScore,
                    severity: zScore > 3.5 ? 'high' : 'medium'
                });
            }
        });

        return anomalies;
    }

    /**
     * التنبؤ بالقيمة التالية
     */
    predictNextValue(data) {
        if (data.length < 5) return data[data.length - 1] || 0;

        // متوسط متحرك بسيط
        const windowSize = Math.min(5, data.length);
        const recent = data.slice(-windowSize);
        return recent.reduce((a, b) => a + b) / windowSize;
    }

    /**
     * حساب الارتباط
     */
    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length < 2) return 0;

        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumXX = x.reduce((a, b) => a + b * b, 0);
        const sumYY = y.reduce((a, b) => a + b * b, 0);

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

        return denominator !== 0 ? numerator / denominator : 0;
    }

    /**
     * تدمير النظام
     */
    destroy() {
        this.stopMonitoring();
        this.logger.info('🛑 تدمير مراقب الأداء المتقدم V2');
    }
}

export { PerformanceMonitor };

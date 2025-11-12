/**
 * 📊 مراقب الأداء المتقدم V2.1 - إصلاح مشاكل ES Modules
 * @version 2.1.0
 * @description نظام مراقبة أداء شامل مع دعم كامل لـ ES modules
 * @class PerformanceMonitor
 */

import os from 'os';
import process from 'process';

// استيراد ديناميكي للمكتبات لتجنب الأخطاء
let Logger, HealthMonitor, RecoveryManager, Config;

// تهيئة الاستيرادات بشكل آمن
async function initializeImports() {
    try {
        const loggerModule = await import('./logger.js').catch(() => null);
        const healthModule = await import('../monitoring/health-monitor.js').catch(() => null);
        const recoveryModule = await import('../recovery/recovery-manager.js').catch(() => null);
        const configModule = await import('../config/config.js').catch(() => null);

        Logger = loggerModule?.Logger;
        HealthMonitor = healthModule?.HealthMonitor;
        RecoveryManager = recoveryModule?.RecoveryManager;
        Config = configModule?.default || configModule;
    } catch (error) {
        console.warn('⚠️ بعض الوحدات غير متوفرة:', error.message);
    }
}

class PerformanceMonitor {
    constructor() {
        this.initialized = false;
        this.logger = null;
        this.healthMonitor = null;
        this.recoveryManager = null;
        this.config = null;

        // قاعدة بيانات المقاييس
        this.metrics = {
            accounts: {
                created: 0,
                failed: 0,
                verified: 0,
                pending: 0,
                successRate: 1.0,
                hourlyRate: 0,
                dailyTarget: 48
            },
            timing: {
                averageCreationTime: 0,
                fastestCreation: Infinity,
                slowestCreation: 0,
                totalRuntime: 0,
                cyclesCompleted: 0,
                averageCycleTime: 0
            },
            system: {
                memoryUsage: 0,
                cpuUsage: 0,
                diskUsage: 0,
                networkLatency: 0,
                uptime: 0,
                processUptime: 0
            },
            recovery: {
                totalRecoveries: 0,
                successfulRecoveries: 0,
                recoverySuccessRate: 1.0,
                lastRecoveryTime: null,
                recoveryTimeAverage: 0
            },
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

        // إعدادات المراقبة
        this.monitoringIntervals = {
            system: null,
            analytics: null,
            reporting: null
        };

        // تهيئة تلقائية
        this.initializeAsync();
    }

    /**
     * تهيئة غير متزامنة
     */
    async initializeAsync() {
        try {
            console.log('📊 تهيئة مراقب الأداء المتقدم V2.1...');
            
            await initializeImports();
            
            // إنشاء كائنات Logger و HealthMonitor بشكل آمن
            if (Logger) {
                this.logger = new Logger();
            } else {
                this.logger = this.createFallbackLogger();
            }

            if (HealthMonitor) {
                this.healthMonitor = new HealthMonitor();
            }

            if (RecoveryManager) {
                this.recoveryManager = new RecoveryManager();
            }

            if (Config) {
                this.config = Config.monitoring?.performance || {};
            } else {
                this.config = { alertThresholds: {} };
            }

            this.initialized = true;
            this.log('success', '✅ تم تهيئة مراقب الأداء المتقدم V2.1 بنجاح');
            
            // بدء المراقبة
            this.startContinuousMonitoring();

        } catch (error) {
            console.error('❌ فشل في تهيئة مراقب الأداء:', error.message);
            this.initialized = false;
        }
    }

    /**
     * إنشاء logger بديل
     */
    createFallbackLogger() {
        return {
            info: (...args) => console.log('[INFO]', ...args),
            success: (...args) => console.log('[SUCCESS]', ...args),
            warning: (...args) => console.warn('[WARNING]', ...args),
            error: (...args) => console.error('[ERROR]', ...args),
            debug: (...args) => console.log('[DEBUG]', ...args)
        };
    }

    /**
     * دالة تسجيل آمنة
     */
    log(level, message) {
        if (this.logger && typeof this.logger[level] === 'function') {
            this.logger[level]('PerformanceMonitor', message);
        } else {
            console.log(`[${level.toUpperCase()}] PerformanceMonitor: ${message}`);
        }
    }

    /**
     * بدء المراقبة المستمرة
     */
    startContinuousMonitoring() {
        // مراقبة الموارد كل 30 ثانية
        this.monitoringIntervals.system = setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);

        // التحليلات المتقدمة كل دقيقة
        this.monitoringIntervals.analytics = setInterval(() => {
            this.runAdvancedAnalytics();
        }, 60000);

        // التقارير التلقائية كل 5 دقائق
        this.monitoringIntervals.reporting = setInterval(() => {
            this.generateAutoReports();
        }, 300000);

        this.log('debug', '🔍 بدء المراقبة المستمرة للأداء');
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

            this.historicalData.system.push({
                timestamp: new Date().toISOString(),
                ...systemMetrics
            });

            this.maintainDataSize();

        } catch (error) {
            this.log('error', `❌ فشل في جمع مقاييس النظام: ${error.message}`);
        }
    }

    /**
     * الحصول على مقاييس النظام
     */
    async getSystemMetrics() {
        const memoryUsage = this.getMemoryUsage();
        const cpuUsage = this.getCpuUsage();
        
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryPercent = Math.round(((totalMemory - freeMemory) / totalMemory) * 100);

        return {
            memoryUsage: memoryPercent,
            cpuUsage: cpuUsage.usage || 0,
            diskUsage: 0,
            networkLatency: 0,
            uptime: os.uptime(),
            processUptime: process.uptime(),
            loadAverage: os.loadavg()[0],
            freeMemory: freeMemory,
            totalMemory: totalMemory,
            collectionTime: Date.now()
        };
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
     * تحديث إحصائيات الحسابات
     */
    updateAccountStats(successCount = 0, failedCount = 0) {
        this.metrics.accounts.created += successCount + failedCount;
        this.metrics.accounts.failed += failedCount;
        
        const total = this.metrics.accounts.created;
        this.metrics.accounts.successRate = total > 0 ? 
            (this.metrics.accounts.created - this.metrics.accounts.failed) / total : 1.0;

        this.calculateHourlyRate();

        this.historicalData.accounts.push({
            timestamp: new Date().toISOString(),
            created: this.metrics.accounts.created,
            failed: this.metrics.accounts.failed,
            successRate: this.metrics.accounts.successRate,
            hourlyRate: this.metrics.accounts.hourlyRate
        });
    }

    /**
     * حساب المعدل بالساعة
     */
    calculateHourlyRate() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));

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
     * تشغيل التحليلات المتقدمة
     */
    runAdvancedAnalytics() {
        try {
            this.log('debug', '📈 تشغيل التحليلات المتقدمة');
        } catch (error) {
            this.log('error', `❌ فشل في التحليلات: ${error.message}`);
        }
    }

    /**
     * توليد التقارير التلقائية
     */
    generateAutoReports() {
        try {
            const report = this.generatePerformanceReport();
            this.log('debug', '📋 تم توليد تقرير الأداء');
        } catch (error) {
            this.log('error', `❌ فشل في توليد التقرير: ${error.message}`);
        }
    }

    /**
     * توليد تقرير الأداء
     */
    generatePerformanceReport() {
        return {
            timestamp: new Date().toISOString(),
            summary: this.getPerformanceSummary(),
            metrics: this.getCurrentMetrics(),
            performanceScore: this.calculateOverallPerformanceScore()
        };
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
        return JSON.parse(JSON.stringify(this.metrics));
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
        const hourlyScore = Math.min(this.metrics.accounts.hourlyRate / 10, 1);
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
     * تسجيل مقاييس التسجيل
     */
    recordLoggingMetrics(performanceReport) {
        // تنفيذ بسيط - يمكن توسيعه
        this.log('debug', `📊 مقاييس التسجيل: ${JSON.stringify(performanceReport)}`);
    }

    /**
     * إيقاف المراقبة
     */
    stopMonitoring() {
        Object.values(this.monitoringIntervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });

        this.log('info', '🛑 تم إيقاف مراقبة الأداء');
    }

    /**
     * تدمير النظام
     */
    destroy() {
        this.stopMonitoring();
        this.log('info', '🛑 تدمير مراقب الأداء المتقدم V2.1');
    }
}

export { PerformanceMonitor };

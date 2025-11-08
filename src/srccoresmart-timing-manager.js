/**
 * ⏰ مدير التوقيت الذكي المتقدم V2 مع التعافي التلقائي
 * @version 2.0.0
 * @description نظام توقيت ذكي متكامل مع خوارزميات تعافي تلقائي وتكيف ذاتي
 * @class SmartTimingManager
 */

import { Logger } from './logger.js';
import { PerformanceMonitor } from '../monitoring/performance-monitor.js';
import { HealthMonitor } from '../monitoring/health-monitor.js';
import Config from '../../config/config.js';

class SmartTimingManager {
    constructor() {
        this.logger = new Logger();
        this.config = Config.timing;
        this.performanceMonitor = new PerformanceMonitor();
        this.healthMonitor = new HealthMonitor();
        
        // إحصائيات النظام
        this.stats = {
            totalCycles: 0,
            successfulCycles: 0,
            failedCycles: 0,
            totalWaitTime: 0,
            averageWaitTime: 0,
            lastCycleTime: null,
            performanceHistory: [],
            adaptationHistory: []
        };

        // حالة التكيف الحالية
        this.adaptationState = {
            currentPhase: 'early', // early, mid, late
            successRate: 1.0,
            systemHealth: 1.0,
            performanceScore: 1.0,
            lastAdjustment: new Date(),
            adjustmentCount: 0
        };

        // خوارزميات التعافي التلقائي
        this.recoveryAlgorithms = {
            exponentialBackoff: this.exponentialBackoff.bind(this),
            adaptiveRandomization: this.adaptiveRandomization.bind(this),
            patternAvoidance: this.patternAvoidance.bind(this),
            healthBasedAdjustment: this.healthBasedAdjustment.bind(this),
            successRateOptimization: this.successRateOptimization.bind(this)
        };

        // أنماط التوقيت المحظورة
        this.forbiddenPatterns = this.initializeForbiddenPatterns();
        
        // ذاكرة التوقيتات السابقة
        this.timingMemory = {
            recentWaits: [],
            cycleTimes: [],
            performanceMetrics: [],
            maxMemorySize: 100
        };

        this.initialize();
    }

    /**
     * تهيئة نظام التوقيت الذكي
     */
    async initialize() {
        this.logger.info('⏰ تهيئة نظام التوقيت الذكي V2...');
        
        try {
            // تحميل الإحصائيات السابقة إذا كانت موجودة
            await this.loadHistoricalData();
            
            // بدء المراقبة المستمرة
            this.startContinuousMonitoring();
            
            // حساب الحالة الأولية
            this.calculateAdaptationState();
            
            this.logger.success('✅ تم تهيئة نظام التوقيت الذكي V2 بنجاح');
        } catch (error) {
            this.logger.error(`❌ فشل في تهيئة نظام التوقيت: ${error.message}`);
            throw error;
        }
    }

    /**
     * حساب وقت الانتظار التالي مع التعافي التلقائي
     */
    calculateNextWaitTime() {
        const baseWaitTime = this.calculateBaseWaitTime();
        const adaptedWaitTime = this.applyAdaptations(baseWaitTime);
        const recoveredWaitTime = this.applyRecoveryAlgorithms(adaptedWaitTime);
        finalWaitTime = this.applySafetyLimits(recoveredWaitTime);

        // تسجيل القرار للتعلم
        this.recordTimingDecision({
            base: baseWaitTime,
            adapted: adaptedWaitTime,
            recovered: recoveredWaitTime,
            final: finalWaitTime,
            timestamp: new Date().toISOString(),
            state: { ...this.adaptationState },
            factors: this.getAdjustmentFactors()
        });

        this.stats.totalCycles++;
        this.stats.totalWaitTime += finalWaitTime;
        this.stats.averageWaitTime = this.stats.totalWaitTime / this.stats.totalCycles;

        this.logger.debug(`⏰ وقت الانتظار المحسوب: ${finalWaitTime} دقيقة`);
        
        return finalWaitTime;
    }

    /**
     * حساب وقت الانتظار الأساسي
     */
    calculateBaseWaitTime() {
        const { minWaitBetweenCycles, maxWaitBetweenCycles } = this.config.cycleTiming;
        
        // وقت عشوائي بين الحدين
        let baseTime = Math.floor(
            Math.random() * (maxWaitBetweenCycles - minWaitBetweenCycles + 1)
        ) + minWaitBetweenCycles;

        return baseTime;
    }

    /**
     * تطبيق التكيفات الذكية
     */
    applyAdaptations(baseWaitTime) {
        let adaptedTime = baseWaitTime;

        // 1. التكيف بناءً على مرحلة اليوم
        adaptedTime = this.applyPhaseAdaptation(adaptedTime);

        // 2. التكيف بناءً على معدل النجاح
        adaptedTime = this.applySuccessRateAdaptation(adaptedTime);

        // 3. التكيف بناءً على صحة النظام
        adaptedTime = this.applyHealthAdaptation(adaptedTime);

        // 4. التكيف بناءً على الوقت الحقيقي
        adaptedTime = this.applyRealTimeAdaptation(adaptedTime);

        return Math.max(this.config.cycleTiming.minWaitBetweenCycles, adaptedTime);
    }

    /**
     * التكيف بناءً على مرحلة اليوم
     */
    applyPhaseAdaptation(waitTime) {
        const progress = this.calculateDailyProgress();
        const { adaptation } = this.config.cycleTiming;
        let multiplier = 1.0;

        if (progress < 0.25) {
            // المرحلة المبكرة (0-25%)
            multiplier = adaptation.earlyPhaseMultiplier;
            this.adaptationState.currentPhase = 'early';
        } else if (progress < 0.75) {
            // المرحلة المتوسطة (25-75%)
            multiplier = adaptation.midPhaseMultiplier;
            this.adaptationState.currentPhase = 'mid';
        } else {
            // المرحلة المتأخرة (75-100%)
            multiplier = adaptation.latePhaseMultiplier;
            this.adaptationState.currentPhase = 'late';
        }

        return waitTime * multiplier;
    }

    /**
     * التكيف بناءً على معدل النجاح
     */
    applySuccessRateAdaptation(waitTime) {
        const successRate = this.adaptationState.successRate;
        
        if (successRate < 0.7) {
            // معدل نجاح منخفض - زيادة وقت الانتظار
            const adjustment = 1 + (0.7 - successRate); // 1.0 إلى 1.3
            return waitTime * adjustment;
        } else if (successRate > 0.9) {
            // معدل نجاح مرتفع - تقليل وقت الانتظار
            const adjustment = 1 - (successRate - 0.9) * 0.5; // 1.0 إلى 0.95
            return waitTime * Math.max(0.8, adjustment);
        }

        return waitTime;
    }

    /**
     * التكيف بناءً على صحة النظام
     */
    applyHealthAdaptation(waitTime) {
        const healthStatus = this.healthMonitor.getCurrentStatus();
        const systemHealth = healthStatus.healthScore / 100;

        if (systemHealth < 0.7) {
            // صحة النظام منخفضة - زيادة وقت الانتظار للتعافي
            const adjustment = 1 + (0.7 - systemHealth) * 0.5;
            this.logger.warning(`⚠️ صحة النظام منخفضة - زيادة وقت الانتظار بنسبة ${((adjustment - 1) * 100).toFixed(1)}%`);
            return waitTime * adjustment;
        }

        return waitTime;
    }

    /**
     * التكيف بناءً على الوقت الحقيقي
     */
    applyRealTimeAdaptation(waitTime) {
        const now = new Date();
        const currentHour = now.getHours();
        const { realTime } = this.config;

        // تجنب ساعات الذروة إذا مفعل
        if (realTime.avoidPeakHours && realTime.peakHours.includes(currentHour)) {
            const peakMultiplier = 1.3; // زيادة 30% في ساعات الذروة
            this.logger.debug(`🌆 ساعة الذروة ${currentHour}:00 - زيادة وقت الانتظار`);
            return waitTime * peakMultiplier;
        }

        // التكيف مع الليل (تقليل الانتظار)
        if (currentHour >= 23 || currentHour <= 6) {
            const nightMultiplier = 0.8; // تقليل 20% في الليل
            return waitTime * nightMultiplier;
        }

        return waitTime;
    }

    /**
     * تطبيق خوارزميات التعافي التلقائي
     */
    applyRecoveryAlgorithms(waitTime) {
        let recoveredTime = waitTime;

        // تطبيق جميع خوارزميات التعافي
        for (const [algorithmName, algorithm] of Object.entries(this.recoveryAlgorithms)) {
            const originalTime = recoveredTime;
            recoveredTime = algorithm(recoveredTime);
            
            if (originalTime !== recoveredTime) {
                this.logger.debug(`🔄 خوارزمية ${algorithmName}: ${originalTime} → ${recoveredTime}`);
            }
        }

        return recoveredTime;
    }

    /**
     * خوارزمية التراجع الأسية للتعافي
     */
    exponentialBackoff(waitTime) {
        const recentFailures = this.stats.failedCycles;
        
        if (recentFailures > 0) {
            const backoffFactor = Math.pow(1.5, recentFailures); // 1.5^failures
            const maxBackoff = this.config.cycleTiming.maxWaitBetweenCycles * 2;
            
            return Math.min(waitTime * backoffFactor, maxBackoff);
        }

        return waitTime;
    }

    /**
     * خوارزمية العشوائية التكيفية
     */
    adaptiveRandomization(waitTime) {
        const randomnessFactor = 0.2; // 20% عشوائية
        const randomVariation = (Math.random() * randomnessFactor * 2) - randomnessFactor;
        
        return waitTime * (1 + randomVariation);
    }

    /**
     * خوارزمية تجنب الأنماط
     */
    patternAvoidance(waitTime) {
        const recentPattern = this.detectPatterns();
        
        if (recentPattern.detected) {
            this.logger.warning(`🎯 اكتشاف نمط ${recentPattern.type} - تعديل التوقيت`);
            
            // تجنب النمط المكتشف
            const avoidanceFactor = this.calculateAvoidanceFactor(recentPattern);
            return waitTime * avoidanceFactor;
        }

        return waitTime;
    }

    /**
     * خوارزمية التكيف بناءً على الصحة
     */
    healthBasedAdjustment(waitTime) {
        const healthReport = this.healthMonitor.generateHealthReport();
        
        if (healthReport.healthStatus === 'unhealthy') {
            // زيادة كبيرة في وقت الانتظار للتعافي
            const healthMultiplier = 1.5;
            this.logger.warning(`🏥 النظام غير صحي - زيادة وقت الانتظار للتعافي`);
            return waitTime * healthMultiplier;
        } else if (healthReport.healthStatus === 'degraded') {
            // زيادة متوسطة في وقت الانتظار
            const healthMultiplier = 1.2;
            return waitTime * healthMultiplier;
        }

        return waitTime;
    }

    /**
     * خوارزمية تحسين معدل النجاح
     */
    successRateOptimization(waitTime) {
        const targetSuccessRate = 0.85; // الهدف 85%
        const currentSuccessRate = this.adaptationState.successRate;
        
        if (currentSuccessRate < targetSuccessRate - 0.1) {
            // زيادة وقت الانتظار لتحسين النجاح
            const optimization = 1 + (targetSuccessRate - currentSuccessRate);
            return waitTime * optimization;
        } else if (currentSuccessRate > targetSuccessRate + 0.1) {
            // تقليل وقت الانتظار لزيادة الكفاءة
            const optimization = 1 - (currentSuccessRate - targetSuccessRate) * 0.5;
            return waitTime * Math.max(0.7, optimization);
        }

        return waitTime;
    }

    /**
     * تطبيق حدود الأمان
     */
    applySafetyLimits(waitTime) {
        const { minWaitBetweenCycles, maxWaitBetweenCycles } = this.config.cycleTiming;
        
        // الحدود الأساسية
        let safeTime = Math.max(minWaitBetweenCycles, waitTime);
        safeTime = Math.min(maxWaitBetweenCycles * 1.5, safeTime); // حد أقصى مرن

        // منع التكرار السريع
        const minSafeTime = this.calculateMinimumSafeTime();
        safeTime = Math.max(minSafeTime, safeTime);

        return Math.round(safeTime * 10) / 10; // تقريب إلى منزلة عشرية
    }

    /**
     * حساب الحد الأدنى الآمن للوقت
     */
    calculateMinimumSafeTime() {
        const baseMin = this.config.cycleTiming.minWaitBetweenCycles;
        
        // زيادة الحد الأدنى في حالات معينة
        if (this.adaptationState.successRate < 0.6) {
            return baseMin * 1.5;
        }
        
        if (this.stats.failedCycles > 2) {
            return baseMin * 1.3;
        }

        return baseMin;
    }

    /**
     * اكتشاف الأنماط في التوقيتات
     */
    detectPatterns() {
        if (this.timingMemory.recentWaits.length < 5) {
            return { detected: false, type: null, confidence: 0 };
        }

        const recent = this.timingMemory.recentWaits.slice(-5);
        
        // اكتشاف التكرار
        if (this.hasRepetition(recent)) {
            return { 
                detected: true, 
                type: 'repetition', 
                confidence: 0.85 
            };
        }

        // اكتشاف التسلسل
        if (this.hasSequence(recent)) {
            return { 
                detected: true, 
                type: 'sequence', 
                confidence: 0.75 
            };
        }

        // اكتشاف التباعد المنتظم
        if (this.hasRegularSpacing(recent)) {
            return { 
                detected: true, 
                type: 'regular_spacing', 
                confidence: 0.80 
            };
        }

        return { detected: false, type: null, confidence: 0 };
    }

    /**
     * التحقق من وجود تكرار
     */
    hasRepetition(times) {
        const uniqueTimes = new Set(times.map(t => Math.round(t)));
        return uniqueTimes.size < times.length * 0.6;
    }

    /**
     * التحقق من وجود تسلسل
     */
    hasSequence(times) {
        let increasing = true;
        let decreasing = true;

        for (let i = 1; i < times.length; i++) {
            if (times[i] <= times[i - 1]) increasing = false;
            if (times[i] >= times[i - 1]) decreasing = false;
        }

        return increasing || decreasing;
    }

    /**
     * التحقق من التباعد المنتظم
     */
    hasRegularSpacing(times) {
        if (times.length < 3) return false;

        const differences = [];
        for (let i = 1; i < times.length; i++) {
            differences.push(Math.abs(times[i] - times[i - 1]));
        }

        const avgDiff = differences.reduce((a, b) => a + b) / differences.length;
        const variance = differences.reduce((a, b) => a + Math.pow(b - avgDiff, 2), 0) / differences.length;

        return variance < 5; // تباين منخفض = منتظم
    }

    /**
     * حساب عامل تجنب النمط
     */
    calculateAvoidanceFactor(pattern) {
        switch (pattern.type) {
            case 'repetition':
                return 1.3; // زيادة 30% لكسر التكرار
            case 'sequence':
                return 0.7; // تقليل 30% لكسر التسلسل
            case 'regular_spacing':
                return 1.2; // زيادة 20% لكسر الانتظام
            default:
                return 1.1; // زيادة بسيطة افتراضية
        }
    }

    /**
     * تسجيل قرار التوقيت للتعلم
     */
    recordTimingDecision(decision) {
        this.timingMemory.recentWaits.push(decision.final);
        
        // الحفاظ على حجم الذاكرة
        if (this.timingMemory.recentWaits.length > this.timingMemory.maxMemorySize) {
            this.timingMemory.recentWaits.shift();
        }

        this.timingMemory.cycleTimes.push({
            timestamp: decision.timestamp,
            waitTime: decision.final,
            state: decision.state,
            factors: decision.factors
        });

        // تحديث حالة التكيف
        this.updateAdaptationState();
    }

    /**
     * تحديث حالة التكيف
     */
    updateAdaptationState() {
        const performanceReport = this.performanceMonitor.generatePerformanceReport();
        const healthReport = this.healthMonitor.generateHealthReport();

        this.adaptationState.successRate = performanceReport.accounts.successRate / 100;
        this.adaptationState.systemHealth = healthReport.healthScore / 100;
        this.adaptationState.performanceScore = this.calculatePerformanceScore();
        this.adaptationState.lastAdjustment = new Date();
        this.adaptationState.adjustmentCount++;

        // حفظ في السجل
        this.adaptationHistory.push({
            timestamp: new Date().toISOString(),
            state: { ...this.adaptationState },
            performance: performanceReport
        });
    }

    /**
     * حساب درجة الأداء
     */
    calculatePerformanceScore() {
        const performanceReport = this.performanceMonitor.generatePerformanceReport();
        
        const successRate = performanceReport.accounts.successRate / 100;
        const efficiency = performanceReport.accounts.hourlyRate / 10; // تطبيع
        const stability = 1 - (performanceReport.challenges.errors / 100);

        return (successRate * 0.5) + (efficiency * 0.3) + (stability * 0.2);
    }

    /**
     * حساب التقدم اليومي
     */
    calculateDailyProgress() {
        const performanceReport = this.performanceMonitor.generatePerformanceReport();
        const target = this.config.dailyTarget;
        const achieved = performanceReport.dailyProgress.achieved;

        return achieved / target;
    }

    /**
     * الحصول على عوامل التعديل
     */
    getAdjustmentFactors() {
        return {
            phase: this.adaptationState.currentPhase,
            successRate: this.adaptationState.successRate,
            systemHealth: this.adaptationState.systemHealth,
            performanceScore: this.adaptationState.performanceScore,
            progress: this.calculateDailyProgress(),
            timeOfDay: new Date().getHours(),
            recentFailures: this.stats.failedCycles
        };
    }

    /**
     * تأخير عشوائي بين الإجراءات
     */
    async randomDelay(min, max) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // تسجيل التأخير للمراقبة
        this.performanceMonitor.recordDelay(delay);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return delay;
    }

    /**
     * محاكاة الكتابة البشرية
     */
    async humanType(driver, element, text) {
        for (let char of text) {
            await element.sendKeys(char);
            
            // تأخير عشوائي بين الأحرف
            const typingDelay = this.config.randomDelays.betweenActions.min + 
                              Math.random() * (this.config.randomDelays.betweenActions.max - 
                              this.config.randomDelays.betweenActions.min);
            
            await this.randomDelay(typingDelay * 0.1, typingDelay * 0.3);
        }
    }

    /**
     * بدء المراقبة المستمرة
     */
    startContinuousMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.performHealthCheck();
            this.cleanupOldData();
        }, 60000); // كل دقيقة

        this.logger.debug('🔍 بدء المراقبة المستمرة لنظام التوقيت');
    }

    /**
     * إيقاف المراقبة
     */
    stopContinuousMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.debug('🛑 إيقاف المراقبة المستمرة لنظام التوقيت');
        }
    }

    /**
     * فحص صحة النظام
     */
    async performHealthCheck() {
        try {
            const health = await this.healthMonitor.quickHealthCheck();
            
            if (!health.healthy) {
                this.logger.warning('⚠️ فحص صحة نظام التوقيت: يحتاج انتباه');
                this.triggerRecoveryProcedure();
            }
        } catch (error) {
            this.logger.error(`❌ فشل في فحص صحة نظام التوقيت: ${error.message}`);
        }
    }

    /**
     * تشغيل إجراء التعافي
     */
    async triggerRecoveryProcedure() {
        this.logger.info('🔄 تشغيل إجراء التعافي لنظام التوقيت...');
        
        try {
            // إعادة تعيين الإحصائيات المؤقتة
            this.stats.failedCycles = 0;
            
            // تنظيف الذاكرة
            this.timingMemory.recentWaits = [];
            
            // إعادة حساب حالة التكيف
            this.calculateAdaptationState();
            
            this.logger.success('✅ اكتمل إجراء التعافي لنظام التوقيت');
        } catch (error) {
            this.logger.error(`❌ فشل في إجراء التعافي: ${error.message}`);
        }
    }

    /**
     * تنظيف البيانات القديمة
     */
    cleanupOldData() {
        const now = new Date();
        const dayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        // تنظيف سجل التكيف
        this.adaptationHistory = this.adaptationHistory.filter(entry => 
            new Date(entry.timestamp) > dayAgo
        );

        // تنظيف ذاكرة التوقيت
        if (this.timingMemory.cycleTimes.length > this.timingMemory.maxMemorySize) {
            this.timingMemory.cycleTimes = this.timingMemory.cycleTimes.slice(-this.timingMemory.maxMemorySize);
        }

        this.logger.debug('🧹 تم تنظيف بيانات نظام التوقيت القديمة');
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
     * حساب حالة التكيف الأولية
     */
    calculateAdaptationState() {
        // قيم افتراضية للبدء
        this.adaptationState = {
            currentPhase: 'early',
            successRate: 1.0,
            systemHealth: 1.0,
            performanceScore: 1.0,
            lastAdjustment: new Date(),
            adjustmentCount: 0
        };
    }

    /**
     * تهيئة الأنماط المحظورة
     */
    initializeForbiddenPatterns() {
        return [
            { type: 'repetition', description: 'تكرار نفس القيمة' },
            { type: 'sequence', description: 'تسلسل تصاعدي/تنازلي' },
            { type: 'regular_spacing', description: 'تباعد منتظم' },
            { type: 'multiples', description: 'مضاعفات رقم معين' },
            { type: 'time_based', description: 'اعتماد على الوقت الدقيق' }
        ];
    }

    /**
     * تسجيل دورة ناجحة
     */
    recordSuccessfulCycle() {
        this.stats.successfulCycles++;
        this.stats.lastCycleTime = new Date();
        this.updateAdaptationState();
    }

    /**
     * تسجيل دورة فاشلة
     */
    recordFailedCycle() {
        this.stats.failedCycles++;
        this.updateAdaptationState();
    }

    /**
     * توليد تقرير الأداء
     */
    generatePerformanceReport() {
        return {
            timestamp: new Date().toISOString(),
            stats: { ...this.stats },
            adaptation: { ...this.adaptationState },
            memory: {
                recentWaits: this.timingMemory.recentWaits.length,
                cycleTimes: this.timingMemory.cycleTimes.length,
                adaptationHistory: this.adaptationHistory.length
            },
            algorithms: Object.keys(this.recoveryAlgorithms),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * توليد التوصيات
     */
    generateRecommendations() {
        const recommendations = [];
        const successRate = this.adaptationState.successRate;

        if (successRate < 0.7) {
            recommendations.push({
                priority: 'high',
                message: 'معدل النجاح منخفض - زيادة أوقات الانتظار',
                action: 'applySuccessRateAdaptation'
            });
        }

        if (this.stats.failedCycles > 3) {
            recommendations.push({
                priority: 'high',
                message: 'دورات فاشلة متعددة - تفعيل التعافي التلقائي',
                action: 'triggerRecoveryProcedure'
            });
        }

        if (this.adaptationState.performanceScore < 0.6) {
            recommendations.push({
                priority: 'medium',
                message: 'أداء النظام منخفض - مراجعة إستراتيجية التوقيت',
                action: 'reviewTimingStrategy'
            });
        }

        return recommendations;
    }

    /**
     * إعادة تعيين النظام
     */
    reset() {
        this.logger.info('🔄 إعادة تعيين نظام التوقيت الذكي...');
        
        this.stats = {
            totalCycles: 0,
            successfulCycles: 0,
            failedCycles: 0,
            totalWaitTime: 0,
            averageWaitTime: 0,
            lastCycleTime: null,
            performanceHistory: [],
            adaptationHistory: []
        };

        this.timingMemory = {
            recentWaits: [],
            cycleTimes: [],
            performanceMetrics: [],
            maxMemorySize: 100
        };

        this.calculateAdaptationState();
        this.logger.success('✅ تم إعادة تعيين نظام التوقيت الذكي');
    }

    /**
     * تدمير النظام
     */
    destroy() {
        this.stopContinuousMonitoring();
        this.logger.info('🛑 تدمير نظام التوقيت الذكي V2');
    }
}

export { SmartTimingManager };
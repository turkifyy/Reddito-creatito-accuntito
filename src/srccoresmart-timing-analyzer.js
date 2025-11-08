/**
 * 📊 محلل التوقيت الذكي المتقدم V2
 * @version 2.0.0
 * @class SmartTimingAnalyzer
 */

import { Logger } from './logger.js';

class SmartTimingAnalyzer {
    constructor(timingManager) {
        this.logger = new Logger();
        this.timingManager = timingManager;
        this.analysisResults = [];
        this.patternDatabase = new Map();
    }

    /**
     * تحليل شامل لأنماط التوقيت
     */
    async comprehensiveAnalysis() {
        this.logger.info('📊 بدء التحليل الشامل لأنماط التوقيت...');

        const analysis = {
            timestamp: new Date().toISOString(),
            basicStats: this.analyzeBasicStatistics(),
            patternAnalysis: this.analyzePatterns(),
            performanceCorrelation: this.analyzePerformanceCorrelation(),
            efficiencyAnalysis: this.analyzeEfficiency(),
            recommendations: this.generateAnalysisRecommendations(),
            riskAssessment: this.assessRisks()
        };

        this.analysisResults.push(analysis);
        return analysis;
    }

    /**
     * تحليل الإحصائيات الأساسية
     */
    analyzeBasicStatistics() {
        const stats = this.timingManager.stats;
        const recentWaits = this.timingManager.timingMemory.recentWaits;

        return {
            totalCycles: stats.totalCycles,
            successRate: stats.successfulCycles / stats.totalCycles,
            averageWaitTime: stats.averageWaitTime,
            waitTimeStdDev: this.calculateStandardDeviation(recentWaits),
            minWaitTime: Math.min(...recentWaits),
            maxWaitTime: Math.max(...recentWaits),
            waitTimeDistribution: this.analyzeDistribution(recentWaits)
        };
    }

    /**
     * تحليل الأنماط
     */
    analyzePatterns() {
        const patterns = {
            repetition: this.analyzeRepetitionPatterns(),
            sequence: this.analyzeSequencePatterns(),
            periodicity: this.analyzePeriodicity(),
            clustering: this.analyzeClustering(),
            anomalies: this.detectAnomalies()
        };

        return patterns;
    }

    /**
     * تحليل ارتباط الأداء
     */
    analyzePerformanceCorrelation() {
        const correlations = {
            waitTimeVsSuccess: this.calculateWaitTimeSuccessCorrelation(),
            timingVsEfficiency: this.analyzeTimingEfficiency(),
            patternVsDetection: this.analyzePatternDetectionCorrelation()
        };

        return correlations;
    }

    /**
     * حساب الانحراف المعياري
     */
    calculateStandardDeviation(data) {
        if (data.length < 2) return 0;

        const mean = data.reduce((a, b) => a + b) / data.length;
        const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
        
        return Math.sqrt(variance);
    }

    /**
     * تحليل التوزيع
     */
    analyzeDistribution(data) {
        if (data.length === 0) return {};

        const sorted = [...data].sort((a, b) => a - b);
        const quartiles = {
            q1: sorted[Math.floor(sorted.length * 0.25)],
            median: sorted[Math.floor(sorted.length * 0.5)],
            q3: sorted[Math.floor(sorted.length * 0.75)]
        };

        return {
            quartiles,
            skewness: this.calculateSkewness(data),
            kurtosis: this.calculateKurtosis(data)
        };
    }

    /**
     * حساب الانحراف
     */
    calculateSkewness(data) {
        if (data.length < 3) return 0;

        const mean = data.reduce((a, b) => a + b) / data.length;
        const stdDev = this.calculateStandardDeviation(data);
        const cubedDeviations = data.map(x => Math.pow((x - mean) / stdDev, 3));
        
        return cubedDeviations.reduce((a, b) => a + b) / data.length;
    }

    /**
     * حساب التفرطح
     */
    calculateKurtosis(data) {
        if (data.length < 4) return 0;

        const mean = data.reduce((a, b) => a + b) / data.length;
        const stdDev = this.calculateStandardDeviation(data);
        const fourthDeviations = data.map(x => Math.pow((x - mean) / stdDev, 4));
        
        return fourthDeviations.reduce((a, b) => a + b) / data.length - 3;
    }
}

export { SmartTimingAnalyzer };
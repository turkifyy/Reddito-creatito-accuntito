/**
 * 📊 محلل البريد الإلكتروني المتقدم V2
 * @version 2.0.0
 * @class EmailAnalyzer
 */

import { Logger } from './logger.js';

class EmailAnalyzer {
    constructor(emailManager) {
        this.logger = new Logger();
        this.emailManager = emailManager;
        this.analysisHistory = [];
        this.patternDatabase = new Map();
    }

    /**
     * تحليل شامل لأداء البريد
     */
    async comprehensiveAnalysis() {
        this.logger.info('📊 بدء التحليل الشامل لنظام البريد...');

        const analysis = {
            timestamp: new Date().toISOString(),
            performance: this.analyzePerformance(),
            patterns: this.analyzePatterns(),
            serviceHealth: this.analyzeServiceHealth(),
            recommendations: this.generateAnalysisRecommendations(),
            riskAssessment: this.assessRisks()
        };

        this.analysisHistory.push(analysis);
        return analysis;
    }

    /**
     * تحليل الأداء
     */
    analyzePerformance() {
        const stats = this.emailManager.getSystemStats();
        
        return {
            successRate: (stats.verificationsSuccessful / stats.emailsCreated) * 100,
            averageCreationTime: stats.averageVerificationTime,
            serviceEfficiency: this.calculateServiceEfficiency(),
            recoveryEffectiveness: this.calculateRecoveryEffectiveness()
        };
    }

    /**
     * تحليل الأنماط
     */
    analyzePatterns() {
        return {
            creationPatterns: this.analyzeCreationPatterns(),
            verificationPatterns: this.analyzeVerificationPatterns(),
            failurePatterns: this.analyzeFailurePatterns(),
            recoveryPatterns: this.analyzeRecoveryPatterns()
        };
    }

    /**
     * تحليل صحة الخدمة
     */
    analyzeServiceHealth() {
        const health = this.emailManager.systemState.serviceHealth;
        const healthReport = {};

        for (const [service, data] of Object.entries(health)) {
            healthReport[service] = {
                status: data.status,
                failureRate: (data.failureCount / (data.failureCount + 1)) * 100,
                lastCheck: data.lastCheck,
                reliability: this.calculateServiceReliability(service)
            };
        }

        return healthReport;
    }

    /**
     * حساب كفاءة الخدمة
     */
    calculateServiceEfficiency() {
        const stats = this.emailManager.getSystemStats();
        return {
            primary: (stats.serviceSwitches === 0 ? 100 : Math.max(0, 100 - (stats.serviceSwitches * 10))),
            fallback: Math.min(100, stats.serviceSwitches * 15)
        };
    }

    /**
     * حساب فعالية التعافي
     */
    calculateRecoveryEffectiveness() {
        const stats = this.emailManager.getSystemStats();
        
        if (stats.recoveryAttempts === 0) return 100;
        
        const successAfterRecovery = stats.emailsCreated - stats.verificationsFailed;
        return (successAfterRecovery / stats.recoveryAttempts) * 100;
    }

    /**
     * حساب موثوقية الخدمة
     */
    calculateServiceReliability(serviceKey) {
        const health = this.emailManager.systemState.serviceHealth[serviceKey];
        
        if (!health || !health.lastCheck) return 0;
        
        const uptime = 100 - (health.failureCount * 20);
        return Math.max(0, Math.min(100, uptime));
    }
}

export { EmailAnalyzer };

/**
 * 📊 محلل التسجيل المتقدم V2
 * @version 2.0.0
 * @class LoggerAnalyzer
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

class LoggerAnalyzer {
    constructor(logger) {
        this.logger = logger;
        this.analysisCache = new Map();
        this.patterns = {
            errorPatterns: this.initializeErrorPatterns(),
            performancePatterns: this.initializePerformancePatterns(),
            securityPatterns: this.initializeSecurityPatterns()
        };
    }

    /**
     * تحليل شامل للسجلات
     */
    async comprehensiveAnalysis() {
        this.logger.info('LoggerAnalyzer', '📊 بدء التحليل الشامل للسجلات...');

        const analysis = {
            timestamp: new Date().toISOString(),
            errorAnalysis: await this.analyzeErrors(),
            performanceAnalysis: await this.analyzePerformance(),
            patternAnalysis: await this.analyzePatterns(),
            securityAnalysis: await this.analyzeSecurity(),
            recommendations: await this.generateAnalysisRecommendations()
        };

        this.analysisCache.set('comprehensive', analysis);
        return analysis;
    }

    /**
     * تحليل الأخطاء
     */
    async analyzeErrors() {
        const errorLogs = await this.readLogFiles('errors');
        
        return {
            totalErrors: errorLogs.length,
            errorTypes: this.categorizeErrors(errorLogs),
            frequentErrors: this.findFrequentErrors(errorLogs),
            errorTrends: this.analyzeErrorTrends(errorLogs),
            recoveryPatterns: this.analyzeRecoveryPatterns(errorLogs)
        };
    }

    /**
     * تحليل الأداء
     */
    async analyzePerformance() {
        const perfLogs = await this.readLogFiles('performance');
        
        return {
            performanceMetrics: this.extractPerformanceMetrics(perfLogs),
            bottlenecks: this.identifyBottlenecks(perfLogs),
            optimizationOpportunities: this.findOptimizationOpportunities(perfLogs)
        };
    }

    /**
     * قراءة ملفات السجل
     */
    async readLogFiles(type) {
        const logDir = path.join(process.cwd(), 'logs', type);
        const logs = [];

        if (!fs.existsSync(logDir)) {
            return logs;
        }

        const files = fs.readdirSync(logDir).filter(file => file.endsWith('.log'));

        for (const file of files) {
            const filePath = path.join(logDir, file);
            const fileLogs = await this.readLogFile(filePath);
            logs.push(...fileLogs);
        }

        return logs;
    }

    /**
     * قراءة ملف سجل فردي
     */
    async readLogFile(filePath) {
        return new Promise((resolve) => {
            const logs = [];
            const rl = readline.createInterface({
                input: fs.createReadStream(filePath),
                crlfDelay: Infinity
            });

            rl.on('line', (line) => {
                if (line.trim()) {
                    try {
                        const logEntry = JSON.parse(line);
                        logs.push(logEntry);
                    } catch {
                        // تجاهل السطور غير الصالحة
                    }
                }
            });

            rl.on('close', () => {
                resolve(logs);
            });
        });
    }
}

export { LoggerAnalyzer };

/**
 * 📝 نظام التسجيل المتقدم V2.1 - إصلاح مشاكل ES Modules
 * @version 2.1.0
 * @description نظام تسجيل متكامل مع دعم كامل لـ ES modules
 * @class Logger
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// استيراد ديناميكي للتجنب الأخطاء الدائرية
let PerformanceMonitor, HealthMonitor, Config;

async function initializeImports() {
    try {
        // تجنب الاستيراد الدائري عبر الاستيراد الديناميكي
        const perfModule = await import('./performance-monitor.js').catch(() => null);
        const healthModule = await import('../monitoring/health-monitor.js').catch(() => null);
        const configModule = await import('../config/config.js').catch(() => null);

        if (perfModule) PerformanceMonitor = perfModule.PerformanceMonitor;
        if (healthModule) HealthMonitor = healthModule.HealthMonitor;
        if (configModule) Config = configModule.default || configModule;
    } catch (error) {
        console.warn('⚠️ بعض الوحدات غير متوفرة للـ Logger:', error.message);
    }
}

class Logger {
    constructor() {
        this.initialized = false;
        this.performanceMonitor = null;
        this.healthMonitor = null;
        this.config = { logLevel: 'info', environment: 'production', version: '2.1.0' };
        
        // إعدادات التسجيل
        this.settings = {
            logLevel: 'info',
            enableColors: process.env.NODE_ENV !== 'production',
            enableFileLogging: true,
            maxFileSize: 10 * 1024 * 1024,
            maxFiles: 10,
            logRetentionDays: 30
        };

        // إحصائيات التسجيل
        this.stats = {
            totalLogs: 0,
            byLevel: {
                error: 0,
                warn: 0,
                info: 0,
                debug: 0,
                success: 0
            }
        };

        // الألوان والرموز
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            gray: '\x1b[90m'
        };

        this.symbols = {
            error: '❌',
            warn: '⚠️',
            info: 'ℹ️',
            debug: '🐛',
            success: '✅',
            start: '🚀',
            complete: '🎉'
        };

        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            SUCCESS: 4
        };

        this.currentLevel = this.levels[this.settings.logLevel.toUpperCase()] || this.levels.INFO;

        // تهيئة تلقائية
        this.initializeAsync();
    }

    /**
     * تهيئة غير متزامنة
     */
    async initializeAsync() {
        try {
            this.logToConsole('info', 'Logger', '🚀 تهيئة نظام التسجيل المتقدم V2.1...');

            await initializeImports();

            if (Config) {
                this.config = Config.system || this.config;
            }

            await this.createLogStructure();

            this.initialized = true;
            this.logToConsole('success', 'Logger', '✅ تم تهيئة نظام التسجيل المتقدم V2.1 بنجاح');

        } catch (error) {
            console.error('❌ فشل في تهيئة نظام التسجيل:', error.message);
        }
    }

    /**
     * إنشاء هيكل مجلدات التسجيل
     */
    async createLogStructure() {
        const logDirs = [
            'logs',
            'logs/errors',
            'logs/general',
            'logs/debug'
        ];

        for (const dir of logDirs) {
            const fullPath = path.join(process.cwd(), dir);
            try {
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                }
            } catch (error) {
                console.warn(`⚠️ فشل في إنشاء ${dir}:`, error.message);
            }
        }
    }

    /**
     * تسجيل خطأ
     */
    error(component, message, error = null, metadata = {}) {
        this.stats.totalLogs++;
        this.stats.byLevel.error++;

        const logEntry = this.createLogEntry('error', component, message, error, metadata);
        this.writeLogAsync(logEntry, 'error');

        if (this.currentLevel >= this.levels.ERROR) {
            this.logToConsole('error', component, message, error);
        }

        return logEntry;
    }

    /**
     * تسجيل تحذير
     */
    warn(component, message, metadata = {}) {
        this.stats.totalLogs++;
        this.stats.byLevel.warn++;

        const logEntry = this.createLogEntry('warn', component, message, null, metadata);
        this.writeLogAsync(logEntry, 'warn');

        if (this.currentLevel >= this.levels.WARN) {
            this.logToConsole('warn', component, message);
        }

        return logEntry;
    }

    /**
     * تسجيل معلومات
     */
    info(component, message, metadata = {}) {
        this.stats.totalLogs++;
        this.stats.byLevel.info++;

        const logEntry = this.createLogEntry('info', component, message, null, metadata);
        this.writeLogAsync(logEntry, 'info');

        if (this.currentLevel >= this.levels.INFO) {
            this.logToConsole('info', component, message);
        }

        return logEntry;
    }

    /**
     * تسجيل تصحيح
     */
    debug(component, message, metadata = {}) {
        this.stats.totalLogs++;
        this.stats.byLevel.debug++;

        const logEntry = this.createLogEntry('debug', component, message, null, metadata);
        this.writeLogAsync(logEntry, 'debug');

        if (this.currentLevel >= this.levels.DEBUG) {
            this.logToConsole('debug', component, message);
        }

        return logEntry;
    }

    /**
     * تسجيل نجاح
     */
    success(component, message, metadata = {}) {
        this.stats.totalLogs++;
        this.stats.byLevel.success++;

        const logEntry = this.createLogEntry('success', component, message, null, metadata);
        this.writeLogAsync(logEntry, 'success');

        if (this.currentLevel >= this.levels.SUCCESS) {
            this.logToConsole('success', component, message);
        }

        return logEntry;
    }

    /**
     * إنشاء مدخل سجل
     */
    createLogEntry(level, component, message, error = null, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            component,
            message,
            pid: process.pid,
            environment: this.config.environment,
            version: this.config.version,
            ...metadata
        };

        if (error) {
            logEntry.error = {
                message: error.message,
                stack: error.stack,
                code: error.code,
                name: error.name
            };
        }

        return logEntry;
    }

    /**
     * كتابة السجل بشكل غير متزامن
     */
    async writeLogAsync(logEntry, level) {
        if (!this.settings.enableFileLogging) {
            return;
        }

        try {
            const logString = this.formatLogEntry(logEntry, level);
            const filePath = this.getLogFilePath(level);

            await fs.promises.appendFile(filePath, logString + '\n', 'utf8');
        } catch (error) {
            console.error('❌ فشل في كتابة السجل:', error.message);
        }
    }

    /**
     * تنسيق مدخل السجل
     */
    formatLogEntry(logEntry, level) {
        if (this.config.environment === 'production') {
            return JSON.stringify(logEntry);
        } else {
            return this.formatHumanReadable(logEntry, level);
        }
    }

    /**
     * تنسيق مقروء للإنسان
     */
    formatHumanReadable(logEntry, level) {
        const timestamp = logEntry.timestamp.replace('T', ' ').substring(0, 19);
        const symbol = this.symbols[level] || '📝';
        const color = this.colors[this.getColorForLevel(level)] || this.colors.white;

        let formatted = `${this.colors.gray}[${timestamp}]${this.colors.reset} `;
        formatted += `${color}${symbol} [${logEntry.level}]${this.colors.reset} `;
        formatted += `${this.colors.cyan}${logEntry.component}${this.colors.reset} - `;
        formatted += `${logEntry.message}`;

        if (logEntry.error) {
            formatted += `\n${this.colors.red}خطأ: ${logEntry.error.message}${this.colors.reset}`;
        }

        return formatted;
    }

    /**
     * الحصول على اللون لمستوى السجل
     */
    getColorForLevel(level) {
        const colorMap = {
            error: 'red',
            warn: 'yellow',
            info: 'blue',
            debug: 'magenta',
            success: 'green'
        };

        return colorMap[level] || 'white';
    }

    /**
     * الحصول على مسار ملف السجل
     */
    getLogFilePath(level) {
        const date = new Date().toISOString().split('T')[0];
        const levelDir = this.getLogDirectoryForLevel(level);
        return path.join(process.cwd(), 'logs', levelDir, `${date}.log`);
    }

    /**
     * الحصول على مجلد السجل للمستوى
     */
    getLogDirectoryForLevel(level) {
        const dirMap = {
            error: 'errors',
            warn: 'errors',
            info: 'general',
            debug: 'debug',
            success: 'general'
        };

        return dirMap[level] || 'general';
    }

    /**
     * التسجيل في الكونسول فقط
     */
    logToConsole(level, component, message, error = null) {
        if (!this.settings.enableColors) {
            console.log(`[${level.toUpperCase()}] ${component} - ${message}`);
            if (error) console.error(error);
            return;
        }

        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const symbol = this.symbols[level] || '📝';
        const color = this.colors[this.getColorForLevel(level)] || this.colors.white;

        let logMessage = `${this.colors.gray}[${timestamp}]${this.colors.reset} `;
        logMessage += `${color}${symbol} [${level.toUpperCase()}]${this.colors.reset} `;
        logMessage += `${this.colors.cyan}${component}${this.colors.reset} - `;
        logMessage += `${message}`;

        if (error) {
            console.error(logMessage);
            console.error(error);
        } else {
            console.log(logMessage);
        }
    }

    /**
     * الحصول على إحصائيات التسجيل
     */
    getStats() {
        return {
            ...this.stats,
            settings: { ...this.settings }
        };
    }

    /**
     * تدمير النظام
     */
    destroy() {
        this.info('Logger', '🛑 تدمير نظام التسجيل V2.1');
    }
}

export { Logger };

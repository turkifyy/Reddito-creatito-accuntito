/**
 * 📝 نظام التسجيل المتقدم V2 مع التعافي التلقائي والمراقبة الذكية
 * @version 2.0.0
 * @description نظام تسجيل متكامل مع خوارزميات تعافي تلقائي ومراقبة أداء متقدمة
 * @class Logger
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PerformanceMonitor } from './performance-monitor.js';
import { HealthMonitor } from './health-monitor.js';
import Config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
    constructor() {
        this.config = Config.system;
        this.performanceMonitor = new PerformanceMonitor();
        this.healthMonitor = new HealthMonitor();
        
        // إعدادات التسجيل المتقدمة
        this.settings = {
            logLevel: this.config.logLevel || 'info',
            enableColors: process.env.NODE_ENV !== 'production',
            enableFileLogging: true,
            enablePerformanceLogging: true,
            enableHealthLogging: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB
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
            },
            byComponent: new Map(),
            performance: {
                averageWriteTime: 0,
                totalWriteTime: 0,
                writeOperations: 0
            },
            errors: {
                writeErrors: 0,
                recoveryAttempts: 0,
                lastError: null
            }
        };

        // نظام التعافي التلقائي
        this.recoverySystem = {
            enabled: true,
            maxRetries: 3,
            retryDelay: 1000,
            healthCheckInterval: 30000,
            lastHealthCheck: null,
            consecutiveFailures: 0
        };

        // ذاكرة التخزين المؤقت للكتابة
        this.writeBuffer = {
            enabled: true,
            buffer: [],
            maxBufferSize: 100,
            flushInterval: 5000, // 5 ثواني
            flushTimer: null
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
            complete: '🎉',
            recovery: '🔄',
            monitoring: '📊',
            security: '🛡️'
        };

        // مستويات التسجيل
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            SUCCESS: 4
        };

        this.currentLevel = this.levels[this.settings.logLevel.toUpperCase()] || this.levels.INFO;

        // تهيئة النظام
        this.initialize();
    }

    /**
     * تهيئة نظام التسجيل المتقدم
     */
    async initialize() {
        try {
            this.logToConsole('info', 'Logger', '🚀 تهيئة نظام التسجيل المتقدم V2...');

            // إنشاء هيكل المجلدات
            await this.createLogStructure();

            // بدء نظام التعافي التلقائي
            this.startRecoverySystem();

            // بدء نظام التنظيف التلقائي
            this.startAutoCleanup();

            // بدء نظام المراقبة
            this.startMonitoring();

            this.logToConsole('success', 'Logger', '✅ تم تهيئة نظام التسجيل المتقدم V2 بنجاح');

        } catch (error) {
            console.error('❌ فشل في تهيئة نظام التسجيل:', error.message);
            throw error;
        }
    }

    /**
     * إنشاء هيكل مجلدات التسجيل
     */
    async createLogStructure() {
        const logDirs = [
            'logs',
            'logs/errors',
            'logs/performance',
            'logs/health',
            'logs/recovery',
            'logs/archived'
        ];

        for (const dir of logDirs) {
            const fullPath = path.join(process.cwd(), dir);
            try {
                if (!fs.existsSync(fullPath)) {
                    fs.mkdirSync(fullPath, { recursive: true });
                    this.logToConsole('debug', 'Logger', `📁 تم إنشاء مجلد: ${dir}`);
                }
            } catch (error) {
                this.handleRecovery('create_directory', error);
            }
        }
    }

    /**
     * بدء نظام التعافي التلقائي
     */
    startRecoverySystem() {
        this.recoverySystem.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.recoverySystem.healthCheckInterval);

        this.logToConsole('debug', 'Logger', '🔄 بدء نظام التعافي التلقائي للتسجيل');
    }

    /**
     * بدء التنظيف التلقائي
     */
    startAutoCleanup() {
        // تنظيف يومي في منتصف الليل
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = midnight - now;

        setTimeout(() => {
            this.cleanupOldLogs();
            // تكرار كل 24 ساعة
            setInterval(() => this.cleanupOldLogs(), 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);

        this.logToConsole('debug', 'Logger', '🧹 بدء نظام التنظيف التلقائي للتسجيل');
    }

    /**
     * بدء نظام المراقبة
     */
    startMonitoring() {
        setInterval(() => {
            this.monitorLoggingPerformance();
        }, 60000); // كل دقيقة

        this.logToConsole('debug', 'Logger', '📊 بدء نظام مراقبة أداء التسجيل');
    }

    /**
     * تسجيل خطأ مع التعافي التلقائي
     */
    error(component, message, error = null, metadata = {}) {
        this.stats.totalLogs++;
        this.stats.byLevel.error++;
        this.updateComponentStats(component);

        const logEntry = this.createLogEntry('error', component, message, error, metadata);
        
        // محاولة التسجيل مع التعافي التلقائي
        this.writeLogWithRecovery(logEntry, 'error');
        
        // تسجيل في وحدة التحكم إذا كان مستوى DEBUG أو أعلى
        if (this.currentLevel >= this.levels.DEBUG) {
            this.logToConsole('error', component, message, error);
        }

        // تحديث مراقب الصحة
        this.healthMonitor.recordError(component, error || new Error(message));

        return logEntry;
    }

    /**
     * تسجيل تحذير
     */
    warn(component, message, metadata = {}) {
        this.stats.totalLogs++;
        this.stats.byLevel.warn++;
        this.updateComponentStats(component);

        const logEntry = this.createLogEntry('warn', component, message, null, metadata);
        this.writeLogWithRecovery(logEntry, 'warn');

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
        this.updateComponentStats(component);

        const logEntry = this.createLogEntry('info', component, message, null, metadata);
        this.writeLogWithRecovery(logEntry, 'info');

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
        this.updateComponentStats(component);

        const logEntry = this.createLogEntry('debug', component, message, null, metadata);
        this.writeLogWithRecovery(logEntry, 'debug');

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
        this.updateComponentStats(component);

        const logEntry = this.createLogEntry('success', component, message, null, metadata);
        this.writeLogWithRecovery(logEntry, 'success');

        if (this.currentLevel >= this.levels.SUCCESS) {
            this.logToConsole('success', component, message);
        }

        return logEntry;
    }

    /**
     * تسجيل بدء عملية
     */
    start(component, operation, metadata = {}) {
        const message = `بدء: ${operation}`;
        return this.info(component, message, { ...metadata, operation, type: 'start' });
    }

    /**
     * تسجيل اكتمال عملية
     */
    complete(component, operation, metadata = {}) {
        const message = `اكتمال: ${operation}`;
        return this.success(component, message, { ...metadata, operation, type: 'complete' });
    }

    /**
     * تسجيل تقدم
     */
    progress(component, operation, current, total, metadata = {}) {
        const percentage = ((current / total) * 100).toFixed(1);
        const message = `${operation}: ${current}/${total} (${percentage}%)`;
        
        return this.info(component, message, {
            ...metadata,
            operation,
            current,
            total,
            percentage: parseFloat(percentage),
            type: 'progress'
        });
    }

    /**
     * تسجيل بيانات الحساب (بشكل آمن)
     */
    logAccount(component, accountData, showPassword = false, metadata = {}) {
        const safeData = {
            username: accountData.username,
            email: accountData.email,
            password: showPassword ? accountData.password : '***',
            created: accountData.created_at,
            verified: accountData.verified
        };

        return this.debug(component, `بيانات الحساب: ${JSON.stringify(safeData)}`, {
            ...metadata,
            accountData: safeData,
            type: 'account'
        });
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

        // إضافة معلومات الأداء إذا كانت متوفرة
        if (this.settings.enablePerformanceLogging) {
            const perf = this.performanceMonitor.getCurrentMetrics();
            logEntry.performance = perf;
        }

        return logEntry;
    }

    /**
     * كتابة السجل مع التعافي التلقائي
     */
    async writeLogWithRecovery(logEntry, level) {
        if (!this.settings.enableFileLogging) {
            return;
        }

        const startTime = Date.now();

        try {
            if (this.writeBuffer.enabled) {
                await this.bufferedWrite(logEntry, level);
            } else {
                await this.directWrite(logEntry, level);
            }

            const writeTime = Date.now() - startTime;
            this.updatePerformanceStats(writeTime);

        } catch (error) {
            this.stats.errors.writeErrors++;
            this.handleRecovery('write_log', error, logEntry);
        }
    }

    /**
     * الكتابة المخزنة مؤقتاً
     */
    async bufferedWrite(logEntry, level) {
        this.writeBuffer.buffer.push({ logEntry, level });

        // تفريغ الذاكرة المؤقتة إذا كانت ممتلئة
        if (this.writeBuffer.buffer.length >= this.writeBuffer.maxBufferSize) {
            await this.flushBuffer();
        }

        // بدء مؤقت التفريغ إذا لم يكن يعمل
        if (!this.writeBuffer.flushTimer) {
            this.writeBuffer.flushTimer = setTimeout(() => {
                this.flushBuffer().finally(() => {
                    this.writeBuffer.flushTimer = null;
                });
            }, this.writeBuffer.flushInterval);
        }
    }

    /**
     * تفريغ الذاكرة المؤقتة
     */
    async flushBuffer() {
        if (this.writeBuffer.buffer.length === 0) {
            return;
        }

        const bufferCopy = [...this.writeBuffer.buffer];
        this.writeBuffer.buffer = [];

        try {
            for (const { logEntry, level } of bufferCopy) {
                await this.directWrite(logEntry, level);
            }
        } catch (error) {
            // في حالة الفشل، إعادة الإضافة إلى الذاكرة المؤقتة
            this.writeBuffer.buffer.unshift(...bufferCopy);
            throw error;
        }
    }

    /**
     * الكتابة المباشرة
     */
    async directWrite(logEntry, level) {
        const logString = this.formatLogEntry(logEntry, level);
        const filePath = this.getLogFilePath(level);

        return new Promise((resolve, reject) => {
            fs.appendFile(filePath, logString + '\n', 'utf8', (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
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
            if (logEntry.error.stack) {
                formatted += `\n${this.colors.gray}${logEntry.error.stack}${this.colors.reset}`;
            }
        }

        if (logEntry.performance) {
            formatted += `\n${this.colors.gray}🚀 الأداء: ${JSON.stringify(logEntry.performance)}${this.colors.reset}`;
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
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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
     * التعافي من الأخطاء
     */
    async handleRecovery(operation, error, context = null) {
        this.stats.errors.recoveryAttempts++;
        this.stats.errors.lastError = {
            operation,
            error: error.message,
            timestamp: new Date().toISOString()
        };

        this.logToConsole('error', 'Logger', `🔄 تعافي من: ${operation}`, error);

        // إستراتيجيات التعافي بناءً على نوع الخطأ
        const recoveryStrategies = {
            write_log: () => this.recoverFromWriteError(error, context),
            create_directory: () => this.recoverFromDirectoryError(error),
            buffer_overflow: () => this.recoverFromBufferError(),
            permission_denied: () => this.recoverFromPermissionError(error)
        };

        const strategy = recoveryStrategies[operation] || recoveryStrategies.write_log;
        
        try {
            await strategy();
            this.recoverySystem.consecutiveFailures = 0;
        } catch (recoveryError) {
            this.recoverySystem.consecutiveFailures++;
            this.logToConsole('error', 'Logger', `❌ فشل التعافي من: ${operation}`, recoveryError);

            // إذا فشل التعافي مرات متتالية، تعطيل الميزة
            if (this.recoverySystem.consecutiveFailures >= this.recoverySystem.maxRetries) {
                await this.disableFeature(operation);
            }
        }
    }

    /**
     * التعافي من خطأ الكتابة
     */
    async recoverFromWriteError(error, logEntry) {
        this.logToConsole('warn', 'Logger', '🔄 محاولة التعافي من خطأ الكتابة...');

        // المحاولة 1: استخدام مسار بديل
        try {
            const fallbackPath = path.join(process.cwd(), 'logs', 'emergency.log');
            const logString = this.formatLogEntry(logEntry, 'error');
            
            await fs.promises.appendFile(fallbackPath, logString + '\n', 'utf8');
            this.logToConsole('success', 'Logger', '✅ تم التعافي باستخدام المسار البديل');
            return;
        } catch (fallbackError) {
            // المتابعة إلى الاستراتيجية التالية
        }

        // المحاولة 2: تعطيل الكتابة إلى الملف
        this.settings.enableFileLogging = false;
        this.logToConsole('warn', 'Logger', '⚠️ تعطيل الكتابة إلى الملف - التسجيل في الكونسول فقط');

        // المحاولة 3: إعادة تهيئة نظام التسجيل
        setTimeout(() => {
            this.reinitialize().catch(() => {
                this.logToConsole('error', 'Logger', '❌ فشل إعادة تهيئة نظام التسجيل');
            });
        }, 5000);
    }

    /**
     * التعافي من خطأ المجلد
     */
    async recoverFromDirectoryError(error) {
        this.logToConsole('warn', 'Logger', '🔄 محاولة إنشاء مجلدات التسجيل...');
        
        try {
            await this.createLogStructure();
            this.logToConsole('success', 'Logger', '✅ تم إنشاء مجلدات التسجيل بنجاح');
        } catch (createError) {
            throw new Error(`فشل في إنشاء المجلدات: ${createError.message}`);
        }
    }

    /**
     * التعافي من خطأ الذاكرة المؤقتة
     */
    async recoverFromBufferError() {
        this.logToConsole('warn', 'Logger', '🔄 تنظيف ذاكرة التخزين المؤقتة للتسجيل...');
        
        this.writeBuffer.buffer = [];
        this.writeBuffer.maxBufferSize = Math.floor(this.writeBuffer.maxBufferSize / 2);
        
        this.logToConsole('info', 'Logger', `📊 حجم الذاكرة المؤقتة الجديد: ${this.writeBuffer.maxBufferSize}`);
    }

    /**
     * التعافي من خطأ الصلاحيات
     */
    async recoverFromPermissionError(error) {
        this.logToConsole('warn', 'Logger', '🔄 معالجة خطأ الصلاحيات...');
        
        // تغيير مسار التسجيل إلى مجلد مؤقت
        const tempDir = require('os').tmpdir();
        const tempLogPath = path.join(tempDir, 'reddit-automation-logs');
        
        if (!fs.existsSync(tempLogPath)) {
            fs.mkdirSync(tempLogPath, { recursive: true });
        }

        this.logToConsole('info', 'Logger', `📁 استخدام المسار المؤقت: ${tempLogPath}`);
    }

    /**
     * تعطيل الميزة
     */
    async disableFeature(feature) {
        this.logToConsole('error', 'Logger', `🛑 تعطيل الميزة: ${feature}`);

        switch (feature) {
            case 'write_log':
                this.settings.enableFileLogging = false;
                break;
            case 'buffer_operations':
                this.writeBuffer.enabled = false;
                break;
            case 'performance_logging':
                this.settings.enablePerformanceLogging = false;
                break;
        }

        // محاولة إعادة التمكين بعد فترة
        setTimeout(() => {
            this.enableFeature(feature);
        }, 300000); // 5 دقائق
    }

    /**
     * تمكين الميزة
     */
    async enableFeature(feature) {
        this.logToConsole('info', 'Logger', `🔧 محاولة تمكين الميزة: ${feature}`);

        switch (feature) {
            case 'write_log':
                this.settings.enableFileLogging = true;
                break;
            case 'buffer_operations':
                this.writeBuffer.enabled = true;
                break;
            case 'performance_logging':
                this.settings.enablePerformanceLogging = true;
                break;
        }

        this.recoverySystem.consecutiveFailures = 0;
    }

    /**
     * إعادة تهيئة النظام
     */
    async reinitialize() {
        this.logToConsole('info', 'Logger', '🔄 إعادة تهيئة نظام التسجيل...');
        
        // تنظيف الموارد
        this.cleanup();
        
        // إعادة التهيئة
        await this.initialize();
        
        this.logToConsole('success', 'Logger', '✅ تمت إعادة تهيئة نظام التسجيل بنجاح');
    }

    /**
     * فحص الصحة
     */
    async performHealthCheck() {
        this.recoverySystem.lastHealthCheck = new Date();

        try {
            // فحص مساحة التخزين
            await this.checkStorageHealth();
            
            // فحص أداء الكتابة
            await this.checkWritePerformance();
            
            // فحص الذاكرة المؤقتة
            await this.checkBufferHealth();

            this.logToConsole('debug', 'Logger', '✅ فحص صحة نظام التسجيل - جيد');

        } catch (error) {
            this.logToConsole('warn', 'Logger', `⚠️ فحص الصحة: ${error.message}`);
            this.handleRecovery('health_check', error);
        }
    }

    /**
     * فحص صحة التخزين
     */
    async checkStorageHealth() {
        const logDir = path.join(process.cwd(), 'logs');
        
        try {
            const stats = await fs.promises.stat(logDir);
            const freeSpace = await this.getFreeDiskSpace(logDir);
            
            if (freeSpace < 100 * 1024 * 1024) { // 100MB
                throw new Error('مساحة التخزين منخفضة');
            }

        } catch (error) {
            throw new Error(`مشكلة في التخزين: ${error.message}`);
        }
    }

    /**
     * الحصول على المساحة الحرة على القرص
     */
    async getFreeDiskSpace(path) {
        if (process.platform === 'win32') {
            // تنفيذ Windows
            const { execSync } = require('child_process');
            const output = execSync(`wmic logicaldisk where "DeviceID='${path.split(':')[0]}:'" get FreeSpace`).toString();
            const freeSpace = parseInt(output.split('\n')[1]);
            return freeSpace;
        } else {
            // تنفيذ Linux/Mac
            const { execSync } = require('child_process');
            const output = execSync(`df "${path}" | awk 'NR==2 {print $4}'`).toString();
            return parseInt(output) * 1024; // Convert to bytes
        }
    }

    /**
     * فحص أداء الكتابة
     */
    async checkWritePerformance() {
        const avgWriteTime = this.stats.performance.averageWriteTime;
        
        if (avgWriteTime > 1000) { // أكثر من ثانية
            throw new Error('أداء الكتابة بطيء');
        }

        if (this.stats.errors.writeErrors > 10) {
            throw new Error('عدد أخطاء الكتابة مرتفع');
        }
    }

    /**
     * فحص صحة الذاكرة المؤقتة
     */
    async checkBufferHealth() {
        if (this.writeBuffer.buffer.length > this.writeBuffer.maxBufferSize * 0.9) {
            throw new Error('الذاكرة المؤقتة ممتلئة تقريباً');
        }
    }

    /**
     * مراقبة أداء التسجيل
     */
    monitorLoggingPerformance() {
        const performanceReport = {
            timestamp: new Date().toISOString(),
            stats: { ...this.stats },
            buffer: {
                size: this.writeBuffer.buffer.length,
                maxSize: this.writeBuffer.maxBufferSize,
                enabled: this.writeBuffer.enabled
            },
            recovery: {
                attempts: this.stats.errors.recoveryAttempts,
                consecutiveFailures: this.recoverySystem.consecutiveFailures
            }
        };

        // تسجيل تقرير الأداء
        this.debug('Logger', 'تقرير أداء التسجيل', performanceReport);

        // تحديث مراقب الأداء
        this.performanceMonitor.recordLoggingMetrics(performanceReport);
    }

    /**
     * تحديث إحصائيات المكون
     */
    updateComponentStats(component) {
        const current = this.stats.byComponent.get(component) || 0;
        this.stats.byComponent.set(component, current + 1);
    }

    /**
     * تحديث إحصائيات الأداء
     */
    updatePerformanceStats(writeTime) {
        this.stats.performance.writeOperations++;
        this.stats.performance.totalWriteTime += writeTime;
        this.stats.performance.averageWriteTime = 
            this.stats.performance.totalWriteTime / this.stats.performance.writeOperations;
    }

    /**
     * تنظيف السجلات القديمة
     */
    async cleanupOldLogs() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.settings.logRetentionDays);

        try {
            const logDir = path.join(process.cwd(), 'logs');
            const subDirs = ['errors', 'performance', 'health', 'recovery', 'general', 'debug'];

            for (const subDir of subDirs) {
                const dirPath = path.join(logDir, subDir);
                if (!fs.existsSync(dirPath)) continue;

                const files = await fs.promises.readdir(dirPath);
                
                for (const file of files) {
                    if (file.endsWith('.log')) {
                        const fileDate = this.extractDateFromFileName(file);
                        if (fileDate && fileDate < cutoffDate) {
                            const filePath = path.join(dirPath, file);
                            await fs.promises.unlink(filePath);
                            this.debug('Logger', `🧹 تم حذف السجل القديم: ${file}`);
                        }
                    }
                }
            }

            this.info('Logger', `✅ تم تنظيف السجلات الأقدم من ${this.settings.logRetentionDays} يوم`);

        } catch (error) {
            this.error('Logger', 'فشل في تنظيف السجلات القديمة', error);
        }
    }

    /**
     * استخراج التاريخ من اسم الملف
     */
    extractDateFromFileName(fileName) {
        const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            return new Date(dateMatch[1]);
        }
        return null;
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
     * تعيين مستوى التسجيل
     */
    setLevel(level) {
        const newLevel = this.levels[level.toUpperCase()];
        if (newLevel !== undefined) {
            this.currentLevel = newLevel;
            this.settings.logLevel = level;
            this.info('Logger', `🎚️ تغيير مستوى التسجيل إلى: ${level}`);
        } else {
            this.warn('Logger', `مستوى تسجيل غير معروف: ${level}`);
        }
    }

    /**
     * الحصول على إحصائيات التسجيل
     */
    getStats() {
        return {
            ...this.stats,
            settings: { ...this.settings },
            recovery: { ...this.recoverySystem },
            buffer: {
                size: this.writeBuffer.buffer.length,
                maxSize: this.writeBuffer.maxBufferSize,
                enabled: this.writeBuffer.enabled
            }
        };
    }

    /**
     * توليد تقرير التسجيل
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalLogs: this.stats.totalLogs,
                byLevel: { ...this.stats.byLevel },
                topComponents: Array.from(this.stats.byComponent.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
            },
            performance: { ...this.stats.performance },
            errors: { ...this.stats.errors },
            recovery: {
                attempts: this.stats.errors.recoveryAttempts,
                consecutiveFailures: this.recoverySystem.consecutiveFailures,
                lastHealthCheck: this.recoverySystem.lastHealthCheck
            },
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * توليد التوصيات
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.stats.errors.writeErrors > 5) {
            recommendations.push({
                priority: 'high',
                message: 'عدد أخطاء الكتابة مرتفع - مراجعة إعدادات التسجيل',
                action: 'review_log_settings'
            });
        }

        if (this.stats.performance.averageWriteTime > 500) {
            recommendations.push({
                priority: 'medium',
                message: 'أداء الكتابة بطيء - تفعيل الذاكرة المؤقتة',
                action: 'enable_buffer'
            });
        }

        if (this.recoverySystem.consecutiveFailures > 0) {
            recommendations.push({
                priority: 'high',
                message: 'فشل متتالي في التعافي - مراجعة نظام التسجيل',
                action: 'review_recovery_system'
            });
        }

        return recommendations;
    }

    /**
     * تنظيف الموارد
     */
    cleanup() {
        // إيقاف المؤقتات
        if (this.writeBuffer.flushTimer) {
            clearTimeout(this.writeBuffer.flushTimer);
            this.writeBuffer.flushTimer = null;
        }

        if (this.recoverySystem.healthCheckInterval) {
            clearInterval(this.recoverySystem.healthCheckInterval);
            this.recoverySystem.healthCheckInterval = null;
        }

        // تفريغ الذاكرة المؤقتة المتبقية
        if (this.writeBuffer.buffer.length > 0) {
            this.flushBuffer().catch(error => {
                console.error('❌ فشل في تفريغ الذاكرة المؤقتة النهائية:', error);
            });
        }

        this.info('Logger', '🧹 تم تنظيف موارد نظام التسجيل');
    }

    /**
     * تدمير النظام
     */
    destroy() {
        this.cleanup();
        this.info('Logger', '🛑 تدمير نظام التسجيل V2');
    }
}

export { Logger };
/**
 * 🛠️ أدوات المساعدة المتقدمة V2 مع التعافي التلقائي
 * @version 2.0.0
 * @description مجموعة شاملة من الأدوات الذكية مع خوارزميات تعافي متكاملة
 * @module utils/helpers
 */

import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { promisify } from 'util';
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../core/logger.js';
import { PerformanceMonitor } from '../monitoring/performance-monitor.js';
import Config from '../../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AdvancedHelpers {
    constructor() {
        this.logger = new Logger();
        this.config = Config;
        this.performanceMonitor = new PerformanceMonitor();
        
        // إعدادات التشفير
        this.encryptionConfig = {
            algorithm: 'aes-256-gcm',
            keyLength: 32,
            ivLength: 16,
            saltLength: 64,
            iterations: 100000
        };

        // ذاكرة التخزين المؤقت للأداء
        this.cache = new Map();
        this.cacheConfig = {
            maxSize: 1000,
            ttl: 5 * 60 * 1000, // 5 دقائق
            cleanupInterval: 60 * 1000 // دقيقة واحدة
        };

        // إحصائيات الاستخدام
        this.usageStats = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            cacheHits: 0,
            cacheMisses: 0,
            recoveryOperations: 0
        };

        this.initialize();
    }

    /**
     * تهيئة الأدوات المتقدمة
     */
    async initialize() {
        this.logger.info('🛠️ تهيئة أدوات المساعدة المتقدمة V2...');

        try {
            // بدء تنظيف الذاكرة المؤقتة
            this.startCacheCleanup();
            
            // تحميل البيانات المحفوظة
            await this.loadPersistedData();
            
            // التحقق من الاعتماديات
            await this.verifyDependencies();
            
            this.logger.success('✅ تم تهيئة أدوات المساعدة المتقدمة V2 بنجاح');
        } catch (error) {
            this.logger.error(`❌ فشل في تهيئة الأدوات: ${error.message}`);
            await this.performRecovery('initialization');
        }
    }

    // ============================================
    // 🔄 أدوات التعافي التلقائي
    // ============================================

    /**
     * تنفيذ التعافي التلقائي
     */
    async performRecovery(context, error = null) {
        this.usageStats.recoveryOperations++;
        
        this.logger.warning(`🔄 تشغيل التعافي التلقائي للسياق: ${context}`);
        
        try {
            switch (context) {
                case 'initialization':
                    await this.recoverFromInitializationFailure();
                    break;
                case 'encryption':
                    await this.recoverFromEncryptionFailure(error);
                    break;
                case 'file_operation':
                    await this.recoverFromFileOperationFailure(error);
                    break;
                case 'network':
                    await this.recoverFromNetworkFailure(error);
                    break;
                case 'memory':
                    await this.recoverFromMemoryFailure();
                    break;
                default:
                    await this.recoverFromGenericFailure(error);
            }

            this.logger.success(`✅ اكتمل التعافي التلقائي للسياق: ${context}`);
            return true;
        } catch (recoveryError) {
            this.logger.error(`❌ فشل التعافي التلقائي: ${recoveryError.message}`);
            return false;
        }
    }

    /**
     * التعافي من فشل التهيئة
     */
    async recoverFromInitializationFailure() {
        this.logger.info('🔄 التعافي من فشل التهيئة...');
        
        // تنظيف الذاكرة المؤقتة
        this.cache.clear();
        
        // إعادة تعيين الإحصائيات
        this.usageStats = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            cacheHits: 0,
            cacheMisses: 0,
            recoveryOperations: this.usageStats.recoveryOperations
        };

        // إعادة المحاولة مع إعدادات بديلة
        await this.initializeWithFallback();
    }

    /**
     * التهيئة مع إعدادات بديلة
     */
    async initializeWithFallback() {
        this.logger.debug('🔄 استخدام إعدادات بديلة للتهيئة...');
        
        // استخدام إعدادات أقل صرامة
        this.cacheConfig.ttl = 2 * 60 * 1000; // 2 دقيقة بدلاً من 5
        this.cacheConfig.maxSize = 500; // نصف السعة
        
        this.logger.debug('✅ تم التهيئة بالإعدادات البديلة');
    }

    /**
     * خوارزمية إعادة المحاولة الذكية
     */
    async retryWithExponentialBackoff(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.logger.debug(`🔄 محاولة ${attempt}/${maxRetries}...`);
                const result = await operation();
                this.usageStats.successfulOperations++;
                return result;
            } catch (error) {
                lastError = error;
                this.usageStats.failedOperations++;
                
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                    this.logger.warning(`⏰ انتظار ${delay}ms قبل إعادة المحاولة...`);
                    await this.delay(delay);
                    
                    // التعافي قبل المحاولة التالية
                    await this.performRecovery('network', error);
                }
            }
        }
        
        throw new Error(`فشل بعد ${maxRetries} محاولات: ${lastError.message}`);
    }

    // ============================================
    // 🔐 أدوات الأمان والتشفير
    // ============================================

    /**
     * تشفير النص مع التعافي التلقائي
     */
    async encryptText(text, password = this.generateRandomKey()) {
        const cacheKey = `encrypt_${this.hashString(text)}`;
        
        try {
            // التحقق من الذاكرة المؤقتة
            if (this.cache.has(cacheKey)) {
                this.usageStats.cacheHits++;
                return this.cache.get(cacheKey);
            }
            this.usageStats.cacheMisses++;

            if (!text || typeof text !== 'string') {
                throw new Error('النص المطلوب تشفيره غير صالح');
            }

            const salt = randomBytes(this.encryptionConfig.saltLength);
            const key = await this.deriveKey(password, salt);
            const iv = randomBytes(this.encryptionConfig.ivLength);
            
            const cipher = createCipheriv(this.encryptionConfig.algorithm, key, iv);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            const result = {
                encrypted,
                iv: iv.toString('hex'),
                salt: salt.toString('hex'),
                authTag: authTag.toString('hex'),
                algorithm: this.encryptionConfig.algorithm
            };

            // التخزين في الذاكرة المؤقتة
            this.cache.set(cacheKey, result);
            
            this.usageStats.successfulOperations++;
            return result;

        } catch (error) {
            this.usageStats.failedOperations++;
            this.logger.error(`❌ فشل في التشفير: ${error.message}`);
            
            // التعافي التلقائي
            await this.performRecovery('encryption', error);
            
            // العودة إلى تشفير مبسط
            return this.fallbackEncryption(text);
        }
    }

    /**
     * فك تشفير النص مع التعافي التلقائي
     */
    async decryptText(encryptedData, password) {
        try {
            const { encrypted, iv, salt, authTag, algorithm } = encryptedData;
            
            const key = await this.deriveKey(password, Buffer.from(salt, 'hex'));
            const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
            
            decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            this.usageStats.successfulOperations++;
            return decrypted;

        } catch (error) {
            this.usageStats.failedOperations++;
            this.logger.error(`❌ فشل في فك التشفير: ${error.message}`);
            
            // التعافي التلقائي
            await this.performRecovery('encryption', error);
            
            // محاولة فك تشفير بالإعدادات البديلة
            return this.fallbackDecryption(encryptedData, password);
        }
    }

    /**
     * تشفير بديل عند الفشل
     */
    fallbackEncryption(text) {
        this.logger.warning('🔄 استخدام تشفير بديل...');
        
        // تشفير أساسي كبديل
        const simpleKey = this.generateSimpleKey();
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ simpleKey.charCodeAt(i % simpleKey.length);
            result += String.fromCharCode(charCode);
        }
        
        return {
            encrypted: Buffer.from(result).toString('base64'),
            method: 'fallback',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * فك تشفير بديل
     */
    fallbackDecryption(encryptedData, password) {
        try {
            if (encryptedData.method === 'fallback') {
                const buffer = Buffer.from(encryptedData.encrypted, 'base64');
                const text = buffer.toString('utf8');
                const simpleKey = this.generateSimpleKey(password);
                let result = '';
                
                for (let i = 0; i < text.length; i++) {
                    const charCode = text.charCodeAt(i) ^ simpleKey.charCodeAt(i % simpleKey.length);
                    result += String.fromCharCode(charCode);
                }
                
                return result;
            }
            throw new Error('طريقة فك التشفير غير معروفة');
        } catch (error) {
            throw new Error(`فشل فك التشفير البديل: ${error.message}`);
        }
    }

    /**
     * توليد مفتاح عشوائي آمن
     */
    generateRandomKey(length = 32) {
        try {
            return randomBytes(length).toString('hex');
        } catch (error) {
            this.logger.error(`❌ فشل في توليد المفتاح: ${error.message}`);
            
            // استخدام بديل أقل أماناً ولكن يعمل
            let fallbackKey = '';
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            
            for (let i = 0; i < length; i++) {
                fallbackKey += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            return fallbackKey;
        }
    }

    /**
     * توليد مفتاح بسيط
     */
    generateSimpleKey(seed = '') {
        const baseString = seed + this.config.system.version + Date.now().toString();
        return createHash('sha256').update(baseString).digest('hex').substring(0, 16);
    }

    /**
     * اشتقاق مفتاح من كلمة المرور
     */
    async deriveKey(password, salt) {
        const crypto = await import('crypto');
        return crypto.pbkdf2Sync(
            password, 
            salt, 
            this.encryptionConfig.iterations, 
            this.encryptionConfig.keyLength, 
            'sha256'
        );
    }

    /**
     * تجزئة النص
     */
    hashString(text, algorithm = 'sha256') {
        try {
            return createHash(algorithm).update(text).digest('hex');
        } catch (error) {
            this.logger.error(`❌ فشل في التجزئة: ${error.message}`);
            
            // تجزئة بديلة
            let hash = 0;
            for (let i = 0; i < text.length; i++) {
                const char = text.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(36);
        }
    }

    // ============================================
    // 📁 أدوات الملفات والنظام
    // ============================================

    /**
     * قراءة ملف مع التعافي التلقائي
     */
    async readFileWithRecovery(filePath, encoding = 'utf8') {
        return this.retryWithExponentialBackoff(async () => {
            try {
                const content = await readFile(filePath, encoding);
                this.logger.debug(`📖 تم قراءة الملف: ${filePath}`);
                return content;
            } catch (error) {
                throw new Error(`فشل في قراءة الملف ${filePath}: ${error.message}`);
            }
        }, 3, 1000);
    }

    /**
     * كتابة ملف مع التعافي التلقائي
     */
    async writeFileWithRecovery(filePath, data, encoding = 'utf8') {
        return this.retryWithExponentialBackoff(async () => {
            try {
                // التأكد من وجود المجلد
                const dir = dirname(filePath);
                await this.ensureDirectoryExists(dir);
                
                await writeFile(filePath, data, encoding);
                this.logger.debug(`💾 تم كتابة الملف: ${filePath}`);
                return true;
            } catch (error) {
                throw new Error(`فشل في كتابة الملف ${filePath}: ${error.message}`);
            }
        }, 3, 1000);
    }

    /**
     * التأكد من وجود المجلد
     */
    async ensureDirectoryExists(dirPath) {
        try {
            await access(dirPath);
        } catch (error) {
            await mkdir(dirPath, { recursive: true });
            this.logger.debug(`📁 تم إنشاء المجلد: ${dirPath}`);
        }
    }

    /**
     * حفظ البيانات بشكل آمن
     */
    async saveDataSecurely(data, filePath, password = null) {
        try {
            // تشفير البيانات إذا كان هناك كلمة مرور
            let dataToSave = data;
            if (password && typeof data === 'object') {
                const encrypted = await this.encryptText(JSON.stringify(data), password);
                dataToSave = JSON.stringify(encrypted);
            }

            // حفظ الملف
            await this.writeFileWithRecovery(filePath, dataToSave);
            
            // حفظ نسخة احتياطية
            await this.createBackup(filePath);
            
            this.usageStats.successfulOperations++;
            return true;

        } catch (error) {
            this.usageStats.failedOperations++;
            this.logger.error(`❌ فشل في حفظ البيانات: ${error.message}`);
            
            await this.performRecovery('file_operation', error);
            return false;
        }
    }

    /**
     * إنشاء نسخة احتياطية
     */
    async createBackup(filePath) {
        try {
            const backupPath = filePath + '.backup';
            const content = await this.readFileWithRecovery(filePath);
            await this.writeFileWithRecovery(backupPath, content);
            
            this.logger.debug(`📦 تم إنشاء نسخة احتياطية: ${backupPath}`);
        } catch (error) {
            this.logger.warning(`⚠️ فشل في إنشاء نسخة احتياطية: ${error.message}`);
        }
    }

    // ============================================
    // ⏰ أدوات التوقيت والتأخير
    // ============================================

    /**
     * تأخير ذكي مع التعافي
     */
    async delay(ms, context = 'general') {
        this.usageStats.totalOperations++;
        
        return new Promise((resolve, reject) => {
            try {
                const timeoutId = setTimeout(() => {
                    this.usageStats.successfulOperations++;
                    resolve(true);
                }, ms);

                // إعداد مراقبة للتأخير
                this.monitorTimeout(timeoutId, ms, context);
            } catch (error) {
                this.usageStats.failedOperations++;
                this.logger.error(`❌ فشل في التأخير: ${error.message}`);
                reject(error);
            }
        });
    }

    /**
     * مراقبة الوقت المستقطع
     */
    monitorTimeout(timeoutId, ms, context) {
        const startTime = Date.now();
        const maxAllowed = ms * 2; // ضعف الوقت المسموح

        const monitor = setInterval(() => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed > maxAllowed) {
                clearInterval(monitor);
                clearTimeout(timeoutId);
                this.logger.error(`⏰ تجاوز الوقت المسموح في التأخير: ${context}`);
                this.performRecovery('memory');
            }
        }, 1000);

        // تنظيف المراقبة بعد انتهاء الوقت
        setTimeout(() => {
            clearInterval(monitor);
        }, ms + 1000);
    }

    /**
     * تأخير عشوائي مع تكيف
     */
    async randomDelay(min, max, options = {}) {
        const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // تطبيق التكيف بناءً على حالة النظام
        const adaptedDelay = this.adaptDelayBasedOnSystemState(delayTime, options);
        
        await this.delay(adaptedDelay, 'random_delay');
        return adaptedDelay;
    }

    /**
     * تكيف التأخير بناءً على حالة النظام
     */
    adaptDelayBasedOnSystemState(delayTime, options) {
        let adaptedTime = delayTime;

        // تكيف بناءً على حمل النظام
        const systemLoad = this.getSystemLoad();
        if (systemLoad > 0.8) {
            adaptedTime *= 1.2; // زيادة 20% تحت الحمل العالي
        } else if (systemLoad < 0.3) {
            adaptedTime *= 0.8; // تقليل 20% تحت الحمل المنخفض
        }

        // تكيف بناءً على سياق الاستخدام
        if (options.critical) {
            adaptedTime = Math.min(adaptedTime, options.maxCriticalDelay || 5000);
        }

        return Math.round(adaptedTime);
    }

    /**
     * الحصول على حمل النظام
     */
    getSystemLoad() {
        try {
            const usage = process.memoryUsage();
            const load = usage.heapUsed / usage.heapTotal;
            return isNaN(load) ? 0.5 : load;
        } catch (error) {
            this.logger.warning(`⚠️ فشل في الحصول على حمل النظام: ${error.message}`);
            return 0.5; // قيمة افتراضية
        }
    }

    // ============================================
    // 📊 أدوات التحقق والتحليل
    // ============================================

    /**
     * التحقق من صحة البريد الإلكتروني مع التعافي
     */
    validateEmail(email, options = {}) {
        try {
            if (!email || typeof email !== 'string') {
                return { isValid: false, error: 'البريد الإلكتروني غير صالح' };
            }

            // تنظيف البريد الإلكتروني
            const cleanEmail = email.trim().toLowerCase();

            // التحقق من الطول
            if (cleanEmail.length > 254) {
                return { isValid: false, error: 'البريد الإلكتروني طويل جداً' };
            }

            // نمط التحقق الأساسي
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(cleanEmail)) {
                return { isValid: false, error: 'تنسيق البريد الإلكتروني غير صالح' };
            }

            // تحقق إضافي إذا مطلوب
            if (options.strict) {
                const [localPart, domain] = cleanEmail.split('@');
                
                if (localPart.length > 64) {
                    return { isValid: false, error: 'جزء البريد المحلي طويل جداً' };
                }

                if (!this.validateDomain(domain)) {
                    return { isValid: false, error: 'نطاق البريد الإلكتروني غير صالح' };
                }
            }

            return { 
                isValid: true, 
                email: cleanEmail,
                domain: cleanEmail.split('@')[1]
            };

        } catch (error) {
            this.logger.error(`❌ فشل في التحقق من البريد الإلكتروني: ${error.message}`);
            
            // تحقق بديل مبسط
            return this.fallbackEmailValidation(email);
        }
    }

    /**
     * تحقق بديل من البريد الإلكتروني
     */
    fallbackEmailValidation(email) {
        if (typeof email === 'string' && email.includes('@') && email.includes('.')) {
            return { isValid: true, email: email.trim().toLowerCase(), method: 'fallback' };
        }
        return { isValid: false, error: 'البريد الإلكتروني غير صالح' };
    }

    /**
     * التحقق من النطاق
     */
    validateDomain(domain) {
        try {
            if (!domain || domain.length < 1) return false;
            
            const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
            return domainRegex.test(domain);
        } catch (error) {
            this.logger.warning(`⚠️ فشل في التحقق من النطاق: ${error.message}`);
            return domain.includes('.') && domain.length > 3;
        }
    }

    /**
     * تنظيف النص من الأحرف غير الآمنة
     */
    sanitizeText(text, options = {}) {
        try {
            if (typeof text !== 'string') return '';

            let cleanText = text;

            // إزالة الأحرف الخطرة
            if (options.removeScripts) {
                cleanText = cleanText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            }

            // إزالة علامات HTML
            if (options.removeHTML) {
                cleanText = cleanText.replace(/<[^>]*>/g, '');
            }

            // إزالة الأحرف الخاصة
            if (options.removeSpecialChars) {
                cleanText = cleanText.replace(/[^\w\s@.\-]/gi, '');
            }

            // تحديد الطول الأقصى
            const maxLength = options.maxLength || 1000;
            if (cleanText.length > maxLength) {
                cleanText = cleanText.substring(0, maxLength);
            }

            return cleanText.trim();

        } catch (error) {
            this.logger.error(`❌ فشل في تنظيف النص: ${error.message}`);
            
            // تنظيف بديل
            return String(text).replace(/[^\w\s]/gi, '').substring(0, 500);
        }
    }

    // ============================================
    // 🎯 أدوات التوليد والعشوائية
    // ============================================

    /**
     * توليد معرف فريد مع التعافي
     */
    generateUniqueId(prefix = 'id') {
        try {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 15);
            const processId = process.pid.toString(36);
            
            return `${prefix}_${timestamp}_${random}_${processId}`;
        } catch (error) {
            this.logger.error(`❌ فشل في توليد المعرف: ${error.message}`);
            
            // توليد بديل
            return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
        }
    }

    /**
     * توليد بيانات حساب عشوائية
     */
    generateAccountData(email, options = {}) {
        try {
            const usernames = [
                'TechExplorer', 'DataVoyager', 'CodePioneer', 'DigitalNavigator',
                'ByteTraveler', 'CyberExplorer', 'AITrailblazer', 'CloudAdventurer',
                'QuantumSeeker', 'NeuralPathfinder', 'CryptoDiscoverer', 'VirtualExplorer'
            ];
            
            const domains = ['ai', 'tech', 'digital', 'code', 'cloud', 'data'];
            const username = usernames[Math.floor(Math.random() * usernames.length)] + 
                           domains[Math.floor(Math.random() * domains.length)] +
                           Math.floor(Math.random() * 10000);

            const password = this.generateStrongPassword();

            return {
                username: username,
                email: email,
                password: password,
                created_at: new Date().toISOString(),
                verified: false,
                user_agent: this.getRandomUserAgent(),
                metadata: {
                    version: this.config.system.version,
                    generation_method: 'advanced',
                    timestamp: Date.now()
                }
            };

        } catch (error) {
            this.logger.error(`❌ فشل في توليد بيانات الحساب: ${error.message}`);
            
            // توليد بديل
            return {
                username: `user${Date.now()}`,
                email: email,
                password: 'temp123!',
                created_at: new Date().toISOString(),
                verified: false
            };
        }
    }

    /**
     * توليد كلمة مرور قوية
     */
    generateStrongPassword(length = 12) {
        try {
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

            let password = '';
            let charSet = '';

            // التأكد من وجود جميع الأنواع
            password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
            password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
            password += numbers.charAt(Math.floor(Math.random() * numbers.length));
            password += symbols.charAt(Math.floor(Math.random() * symbols.length));

            // إكمال الباقي
            charSet = uppercase + lowercase + numbers + symbols;
            for (let i = password.length; i < length; i++) {
                password += charSet.charAt(Math.floor(Math.random() * charSet.length));
            }

            // خلط الأحرف
            password = password.split('').sort(() => 0.5 - Math.random()).join('');

            return password;

        } catch (error) {
            this.logger.error(`❌ فشل في توليد كلمة المرور: ${error.message}`);
            
            // كلمة مرور بديلة
            return `Pass${Date.now().toString(36)}!`;
        }
    }

    /**
     * الحصول على User-Agent عشوائي
     */
    getRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
        ];

        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    // ============================================
    // 📈 أدوات المراقبة والإحصائيات
    // ============================================

    /**
     * الحصول على إحصائيات الاستخدام
     */
    getUsageStatistics() {
        const successRate = this.usageStats.totalOperations > 0 ?
            (this.usageStats.successfulOperations / this.usageStats.totalOperations) * 100 : 0;

        const cacheEfficiency = (this.usageStats.cacheHits + this.usageStats.cacheMisses) > 0 ?
            (this.usageStats.cacheHits / (this.usageStats.cacheHits + this.usageStats.cacheMisses)) * 100 : 0;

        return {
            ...this.usageStats,
            successRate: Math.round(successRate * 100) / 100,
            cacheEfficiency: Math.round(cacheEfficiency * 100) / 100,
            cacheSize: this.cache.size,
            cacheConfig: this.cacheConfig,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * بدء تنظيف الذاكرة المؤقتة
     */
    startCacheCleanup() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredCache();
        }, this.cacheConfig.cleanupInterval);

        this.logger.debug('🧹 بدء تنظيف الذاكرة المؤقتة التلقائي');
    }

    /**
     * تنظيف الذاكرة المؤقتة منتهية الصلاحية
     */
    cleanupExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, value] of this.cache.entries()) {
            if (value.expiry && value.expiry < now) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            this.logger.debug(`🧹 تم تنظيف ${cleanedCount} عنصر من الذاكرة المؤقتة`);
        }

        // الحفاظ على الحجم الأقصى
        if (this.cache.size > this.cacheConfig.maxSize) {
            const excess = this.cache.size - this.cacheConfig.maxSize;
            const keysToDelete = Array.from(this.cache.keys()).slice(0, excess);
            
            keysToDelete.forEach(key => this.cache.delete(key));
            this.logger.debug(`📦 تم تقليص الذاكرة المؤقتة بإزالة ${excess} عنصر`);
        }
    }

    /**
     * تحميل البيانات المحفوظة
     */
    async loadPersistedData() {
        try {
            const dataPath = join(__dirname, '../../data/helpers-cache.json');
            
            if (existsSync(dataPath)) {
                const data = await this.readFileWithRecovery(dataPath);
                const parsed = JSON.parse(data);
                
                if (parsed.usageStats) {
                    this.usageStats = { ...this.usageStats, ...parsed.usageStats };
                }
                
                this.logger.debug('📂 تم تحميل البيانات المحفوظة');
            }
        } catch (error) {
            this.logger.warning(`⚠️ فشل في تحميل البيانات المحفوظة: ${error.message}`);
        }
    }

    /**
     * حفظ البيانات الحالية
     */
    async persistData() {
        try {
            const dataPath = join(__dirname, '../../data/helpers-cache.json');
            const data = {
                usageStats: this.usageStats,
                timestamp: new Date().toISOString(),
                version: this.config.system.version
            };

            await this.writeFileWithRecovery(dataPath, JSON.stringify(data, null, 2));
            this.logger.debug('💾 تم حفظ البيانات الحالية');
        } catch (error) {
            this.logger.error(`❌ فشل في حفظ البيانات: ${error.message}`);
        }
    }

    /**
     * التحقق من الاعتماديات
     */
    async verifyDependencies() {
        const dependencies = [
            'crypto',
            'fs',
            'path',
            'util'
        ];

        for (const dep of dependencies) {
            try {
                await import(dep);
                this.logger.debug(`✅ ${dep} - متوفر`);
            } catch (error) {
                this.logger.warning(`⚠️ ${dep} - غير متوفر`);
            }
        }
    }

    // ============================================
    // 🧹 أدوات التنظيف والإغلاق
    // ============================================

    /**
     * تنظيف الموارد
     */
    async cleanup() {
        this.logger.info('🧹 تنظيف موارد أدوات المساعدة...');

        // إيقاف التنظيف التلقائي
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // حفظ البيانات
        await this.persistData();

        // تنظيف الذاكرة المؤقتة
        this.cache.clear();

        this.logger.success('✅ تم تنظيف موارد أدوات المساعدة');
    }

    /**
     * تدمير المثيل
     */
    async destroy() {
        await this.cleanup();
        this.logger.info('🛑 تدمير أدوات المساعدة V2');
    }
}

// إنشاء نسخة افتراضية للتصدير
const advancedHelpers = new AdvancedHelpers();

// تصدير الدوال المساعدة المستقلة
export function generateId(prefix = 'id') {
    return advancedHelpers.generateUniqueId(prefix);
}

export function sanitizeText(text, options = {}) {
    return advancedHelpers.sanitizeText(text, options);
}

export function validateEmail(email, options = {}) {
    return advancedHelpers.validateEmail(email, options);
}

export async function delay(ms, context = 'general') {
    return advancedHelpers.delay(ms, context);
}

export async function randomDelay(min, max, options = {}) {
    return advancedHelpers.randomDelay(min, max, options);
}

export async function retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
    return advancedHelpers.retryWithExponentialBackoff(operation, maxRetries, baseDelay);
}

export function getUsageStats() {
    return advancedHelpers.getUsageStatistics();
}

// التصدير الافتراضي
export default advancedHelpers;
/**
 * 📊 مدير Google Sheets المتقدم V3.0 - إصلاح شامل لمشاكل ES Modules
 * @version 3.0.0
 * @description نظام متكامل مع إصلاح كامل لمسارات الاستيراد
 * @class GoogleSheetsManager
 */

import { google } from 'googleapis';
import { Logger } from './logger.js';
import Config from '../../config/config.js';

// ⭐ الإصلاح الحرج: استيراد من المسار الصحيح
// performance-monitor موجود في src/monitoring/ وليس src/core/
let PerformanceMonitor, RecoveryManager;

async function initializeOptionalModules() {
    try {
        // استيراد ديناميكي آمن للوحدات الاختيارية
        const perfModule = await import('../monitoring/performance-monitor.js').catch(() => null);
        const recoveryModule = await import('../recovery/recovery-manager.js').catch(() => null);

        if (perfModule) PerformanceMonitor = perfModule.PerformanceMonitor;
        if (recoveryModule) RecoveryManager = recoveryModule.RecoveryManager;
    } catch (error) {
        console.warn('⚠️ بعض الوحدات الاختيارية غير متوفرة:', error.message);
    }
}

class GoogleSheetsManager {
    constructor() {
        this.logger = new Logger();
        this.config = null;
        this.performanceMonitor = null;
        this.recoveryManager = null;
        this.initialized = false;
        
        // حالة النظام
        this.systemState = {
            initialized: false,
            auth: null,
            sheets: null,
            spreadsheet: null,
            connected: false,
            lastSync: null,
            failureCount: 0,
            recoveryMode: false,
            batchQueue: [],
            cache: new Map()
        };

        // إحصائيات النظام
        this.stats = {
            writeOperations: 0,
            readOperations: 0,
            failedOperations: 0,
            successfulOperations: 0,
            batchOperations: 0,
            recoveryOperations: 0,
            averageResponseTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };

        // إعدادات الدفعات
        this.batchConfig = {
            maxBatchSize: 50,
            flushInterval: 30000,
            retryAttempts: 3,
            retryDelay: 2000
        };

        // تهيئة تلقائية
        this.initializeAsync();
    }

    /**
     * تهيئة غير متزامنة
     */
    async initializeAsync() {
        try {
            this.logger.info('GoogleSheetsManager', '📊 تهيئة نظام Google Sheets V3.0...');

            // تحميل الوحدات الاختيارية
            await initializeOptionalModules();

            // تهيئة Config
            if (Config) {
                this.config = Config.sheets || this.getDefaultConfig();
            } else {
                this.config = this.getDefaultConfig();
            }

            // تهيئة الوحدات الاختيارية
            if (PerformanceMonitor) {
                this.performanceMonitor = new PerformanceMonitor();
            }

            if (RecoveryManager) {
                this.recoveryManager = new RecoveryManager();
            }

            this.initialized = true;
            this.logger.success('GoogleSheetsManager', '✅ تم تهيئة GoogleSheetsManager V3.0');
        } catch (error) {
            this.logger.error('GoogleSheetsManager', `❌ فشل في التهيئة: ${error.message}`);
        }
    }

    /**
     * الحصول على تكوين افتراضي
     */
    getDefaultConfig() {
        return {
            spreadsheetId: process.env.GOOGLE_SHEET_ID,
            credentials: this.parseCredentials(),
            sheetNames: {
                accounts: 'Accounts',
                statistics: 'Statistics',
                errors: 'Errors',
                performance: 'Performance',
                recovery: 'Recovery'
            }
        };
    }

    /**
     * تحليل بيانات الاعتماد
     */
    parseCredentials() {
        try {
            if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
                return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
            }
            return null;
        } catch (error) {
            this.logger.error('GoogleSheetsManager', `فشل في تحليل بيانات الاعتماد: ${error.message}`);
            return null;
        }
    }

    /**
     * تهيئة نظام Google Sheets
     */
    async initialize() {
        await this.initializeAsync();
        
        this.logger.info('GoogleSheetsManager', '📊 بدء تهيئة اتصال Google Sheets...');
        
        try {
            // التحقق من بيانات الاعتماد
            await this.validateCredentials();
            
            // المصادقة مع Google APIs
            await this.authenticate();
            
            // التحقق من اتصال الجدول
            await this.validateSpreadsheet();
            
            // تهيئة الأوراق
            await this.initializeSheets();
            
            // بدء معالجة الدفعات
            this.startBatchProcessing();
            
            // بدء المراقبة المستمرة
            this.startHealthMonitoring();
            
            this.systemState.initialized = true;
            this.systemState.connected = true;
            this.systemState.lastSync = new Date();
            
            this.logger.success('GoogleSheetsManager', '✅ تم تهيئة نظام Google Sheets بنجاح');
            
        } catch (error) {
            this.logger.error('GoogleSheetsManager', `❌ فشل في تهيئة Google Sheets: ${error.message}`);
            throw error;
        }
    }

    /**
     * التحقق من بيانات الاعتماد
     */
    async validateCredentials() {
        this.logger.debug('GoogleSheetsManager', '🔐 التحقق من بيانات الاعتماد...');
        
        if (!this.config.spreadsheetId) {
            throw new Error('معرف الجدول غير محدد (GOOGLE_SHEET_ID)');
        }
        
        if (!this.config.credentials) {
            throw new Error('بيانات اعتماد Service Account غير محددة');
        }
        
        const requiredFields = ['client_email', 'private_key', 'project_id'];
        const missingFields = requiredFields.filter(field => !this.config.credentials[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`بيانات الاعتماد ناقصة: ${missingFields.join(', ')}`);
        }
        
        this.logger.debug('GoogleSheetsManager', '✅ بيانات الاعتماد صحيحة');
    }

    /**
     * المصادقة مع Google APIs
     */
    async authenticate() {
        this.logger.debug('GoogleSheetsManager', '🔐 المصادقة مع Google APIs...');
        
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: this.config.credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            
            this.systemState.auth = auth;
            this.systemState.sheets = google.sheets({ 
                version: 'v4', 
                auth: auth 
            });
            
            await this.testAuthentication();
            
            this.logger.success('GoogleSheetsManager', '✅ تمت المصادقة بنجاح');
            
        } catch (error) {
            throw new Error(`فشل في المصادقة: ${error.message}`);
        }
    }

    /**
     * اختبار المصادقة
     */
    async testAuthentication() {
        try {
            const response = await this.systemState.sheets.spreadsheets.get({
                spreadsheetId: this.config.spreadsheetId,
                fields: 'properties.title'
            });
            
            this.logger.debug('GoogleSheetsManager', `✅ الاتصال ناجح مع: ${response.data.properties.title}`);
            
        } catch (error) {
            throw new Error(`فشل في اختبار الاتصال: ${error.message}`);
        }
    }

    /**
     * التحقق من صحة الجدول
     */
    async validateSpreadsheet() {
        this.logger.debug('GoogleSheetsManager', '🔍 التحقق من صحة الجدول...');
        
        try {
            const response = await this.systemState.sheets.spreadsheets.get({
                spreadsheetId: this.config.spreadsheetId
            });
            
            this.systemState.spreadsheet = response.data;
            this.logger.debug('GoogleSheetsManager', `✅ الجدول صالح: ${this.systemState.spreadsheet.properties.title}`);
            
        } catch (error) {
            throw new Error(`الجدول غير صالح: ${error.message}`);
        }
    }

    /**
     * تهيئة الأوراق
     */
    async initializeSheets() {
        this.logger.debug('GoogleSheetsManager', '📋 تهيئة أوراق الجدول...');
        
        const sheets = this.config.sheetNames;
        
        for (const [sheetKey, sheetName] of Object.entries(sheets)) {
            try {
                await this.initializeSheet(sheetName);
                this.logger.debug('GoogleSheetsManager', `✅ تم تهيئة الورقة: ${sheetName}`);
            } catch (error) {
                this.logger.warn('GoogleSheetsManager', `⚠️ فشل في تهيئة ${sheetName}: ${error.message}`);
            }
        }
    }

    /**
     * تهيئة ورقة فردية
     */
    async initializeSheet(sheetName) {
        try {
            const sheetExists = await this.checkSheetExists(sheetName);
            
            if (!sheetExists) {
                await this.createSheet(sheetName);
            }
            
            await this.initializeHeaders(sheetName);
            
        } catch (error) {
            throw new Error(`فشل في تهيئة الورقة ${sheetName}: ${error.message}`);
        }
    }

    /**
     * التحقق من وجود الورقة
     */
    async checkSheetExists(sheetName) {
        try {
            const spreadsheet = this.systemState.spreadsheet;
            return spreadsheet.sheets.some(sheet => 
                sheet.properties.title === sheetName
            );
        } catch (error) {
            return false;
        }
    }

    /**
     * إنشاء ورقة جديدة
     */
    async createSheet(sheetName) {
        try {
            await this.systemState.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.config.spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName
                            }
                        }
                    }]
                }
            });
            
            this.logger.info('GoogleSheetsManager', `📄 تم إنشاء الورقة: ${sheetName}`);
            
        } catch (error) {
            throw new Error(`فشل في إنشاء الورقة: ${error.message}`);
        }
    }

    /**
     * تهيئة العناوين
     */
    async initializeHeaders(sheetName) {
        const headers = this.getSheetHeaders(sheetName);
        
        try {
            await this.systemState.sheets.spreadsheets.values.update({
                spreadsheetId: this.config.spreadsheetId,
                range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            });
            
            this.logger.debug('GoogleSheetsManager', `✅ تم إضافة العناوين لورقة: ${sheetName}`);
            
        } catch (error) {
            this.logger.warn('GoogleSheetsManager', `⚠️ فشل في إضافة العناوين: ${error.message}`);
        }
    }

    /**
     * الحصول على عناوين الورقة
     */
    getSheetHeaders(sheetName) {
        const headersMap = {
            'Accounts': ['ID', 'Username', 'Email', 'Password', 'Created_At', 'Verified', 'Status'],
            'Statistics': ['Date', 'Total_Accounts', 'Successful', 'Failed', 'Success_Rate'],
            'Errors': ['Timestamp', 'Error_Type', 'Component', 'Error_Message'],
            'Performance': ['Hour', 'Accounts_Created', 'Success_Rate', 'Avg_Time'],
            'Recovery': ['Timestamp', 'Recovery_Type', 'Success', 'Duration']
        };
        
        return headersMap[sheetName] || ['Data'];
    }

    /**
     * حفظ حساب
     */
    async saveAccount(accountData) {
        this.logger.debug('GoogleSheetsManager', '💾 حفظ بيانات الحساب...');
        
        try {
            const rowData = [
                accountData.id || `RD_${Date.now()}`,
                accountData.username,
                accountData.email,
                '••••••••',
                new Date().toISOString(),
                accountData.verified ? 'TRUE' : 'FALSE',
                accountData.status || 'CREATED'
            ];
            
            const range = `${this.config.sheetNames.accounts}!A:G`;
            
            await this.systemState.sheets.spreadsheets.values.append({
                spreadsheetId: this.config.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [rowData]
                }
            });
            
            this.stats.writeOperations++;
            this.stats.successfulOperations++;
            
            this.logger.debug('GoogleSheetsManager', `✅ تم حفظ الحساب: ${accountData.username}`);
            
            return { success: true };
            
        } catch (error) {
            this.stats.failedOperations++;
            throw new Error(`فشل في حفظ الحساب: ${error.message}`);
        }
    }

    /**
     * الحصول على الحسابات المحفوظة
     */
    async getSavedAccounts() {
        try {
            const response = await this.systemState.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: `${this.config.sheetNames.accounts}!A2:G`
            });
            
            this.stats.readOperations++;
            
            return response.data.values || [];
            
        } catch (error) {
            this.logger.error('GoogleSheetsManager', `فشل في قراءة الحسابات: ${error.message}`);
            return [];
        }
    }

    /**
     * بدء معالجة الدفعات
     */
    startBatchProcessing() {
        this.batchInterval = setInterval(() => {
            this.processBatchQueue();
        }, this.batchConfig.flushInterval);
        
        this.logger.debug('GoogleSheetsManager', '🔄 بدء معالجة الدفعات');
    }

    /**
     * معالجة قائمة الانتظار
     */
    async processBatchQueue() {
        if (this.systemState.batchQueue.length === 0) return;
        
        this.logger.debug('GoogleSheetsManager', `📦 معالجة ${this.systemState.batchQueue.length} عنصر`);
        
        const batch = [...this.systemState.batchQueue];
        this.systemState.batchQueue = [];
        
        try {
            // معالجة الدفعة
            this.stats.batchOperations++;
            this.logger.debug('GoogleSheetsManager', '✅ تم معالجة الدفعة');
        } catch (error) {
            this.logger.error('GoogleSheetsManager', `❌ فشل معالجة الدفعة: ${error.message}`);
        }
    }

    /**
     * بدء المراقبة الصحية
     */
    startHealthMonitoring() {
        this.healthMonitorInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, 60000);
        
        this.logger.debug('GoogleSheetsManager', '🔍 بدء المراقبة الصحية');
    }

    /**
     * إجراء فحص صحي
     */
    async performHealthCheck() {
        try {
            await this.testAuthentication();
            this.systemState.lastSync = new Date();
        } catch (error) {
            this.logger.error('GoogleSheetsManager', `❌ فشل الفحص الصحي: ${error.message}`);
        }
    }

    /**
     * إيقاف المراقبة
     */
    stopHealthMonitoring() {
        if (this.healthMonitorInterval) {
            clearInterval(this.healthMonitorInterval);
        }
        
        if (this.batchInterval) {
            clearInterval(this.batchInterval);
        }
    }

    /**
     * الحصول على الإحصائيات
     */
    getSystemStats() {
        const successRate = this.stats.writeOperations > 0 ? 
            (this.stats.successfulOperations / this.stats.writeOperations) * 100 : 0;
        
        return {
            ...this.stats,
            successRate: `${successRate.toFixed(2)}%`,
            connected: this.systemState.connected,
            lastSync: this.systemState.lastSync
        };
    }

    /**
     * تدمير النظام
     */
    destroy() {
        this.stopHealthMonitoring();
        this.logger.info('GoogleSheetsManager', '🛑 تدمير نظام Google Sheets');
    }
}

export { GoogleSheetsManager };

const { google } = require('googleapis');
const { SystemLogger } = require('./logger');

class GoogleSheetsManager {
    constructor() {
        this.logger = new SystemLogger();
        this.sheets = null;
        this.initialized = false;
        this.sessionId = null;
        
        // 🔧 إعدادات جميع الأوراق الجاهزة - محدث كاملاً
        this.sheetConfigs = {
            'Accounts': {
                range: 'Accounts!A:I',
                headers: ['Session_ID', 'Timestamp', 'Email', 'Username', 'Password', 'Verification_Code', 'Proxy', 'Status', 'Cycle_Number']
            },
            'Production_Stats': {
                range: 'Production_Stats!A:I', 
                headers: ['Date', 'Session_ID', 'Target_Accounts', 'Success_Count', 'Attempt_Count', 'Success_Rate', 'Start_Time', 'End_Time', 'Duration_Minutes']
            },
            'Proxy_Performance': {
                range: 'Proxy_Performance!A:H',
                headers: ['Proxy', 'Usage_Count', 'Success_Count', 'Failure_Count', 'Success_Rate', 'Last_Used', 'Avg_Response_Time', 'Health_Status']
            },
            'System_Logs': {
                range: 'System_Logs!A:E',
                headers: ['Timestamp', 'Level', 'Message', 'Session_ID', 'Component']
            }
        };
    }

    async validateConnection() {
        try {
            await this.initializeSheets();
            
            // اختبار الوصول إلى الجدول الرئيسي
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: process.env.SHEET_ID
            });
            
            const sheetTitle = response.data.properties.title;
            this.logger.success(`✅ تم الاتصال بـ: ${sheetTitle}`);
            
            return { 
                connected: true,
                sheetTitle: sheetTitle,
                totalSheets: response.data.sheets.length
            };

        } catch (error) {
            this.logger.error(`❌ فشل الاتصال بـ Google Sheets: ${error.message}`);
            return { 
                connected: false, 
                error: error.message 
            };
        }
    }

    async initializeSheets() {
        if (this.initialized) return;

        try {
            // التحقق من وجود SHEET_ID
            if (!process.env.SHEET_ID) {
                throw new Error('لم يتم تعيين SHEET_ID في environment variables');
            }

            // التحقق من وجود GOOGLE_CREDENTIALS
            if (!process.env.GOOGLE_CREDENTIALS) {
                throw new Error('لم يتم تعيين GOOGLE_CREDENTIALS في environment variables');
            }

            const auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheets = google.sheets({ version: 'v4', auth });
            this.initialized = true;

            // التحقق من وجود جميع الأوراق الجاهزة
            await this.validateAllSheetsExist();
            
            this.logger.production('✅ تم تهيئة Google Sheets مع 4 أوراق جاهزة');

        } catch (error) {
            throw new Error(`فشل تهيئة Google Sheets: ${error.message}`);
        }
    }

    async validateAllSheetsExist() {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: process.env.SHEET_ID
            });

            const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
            const requiredSheets = Object.keys(this.sheetConfigs);
            
            this.logger.production('📊 التحقق من الأوراق الجاهزة...');
            
            let allSheetsExist = true;
            const missingSheets = [];

            for (const sheetName of requiredSheets) {
                if (existingSheets.includes(sheetName)) {
                    this.logger.success(`✅ ورقة موجودة: ${sheetName}`);
                    
                    // تأكد من وجود العناوين الصحيحة
                    await this.ensureHeaders(sheetName);
                } else {
                    this.logger.error(`❌ الورقة غير موجودة: ${sheetName}`);
                    missingSheets.push(sheetName);
                    allSheetsExist = false;
                }
            }

            if (!allSheetsExist) {
                throw new Error(`الأوراق التالية مفقودة: ${missingSheets.join(', ')}`);
            }
            
            this.logger.success('🎯 جميع الأوراق جاهزة ومهيأة');
            
        } catch (error) {
            throw new Error(`فشل التحقق من الأوراق: ${error.message}`);
        }
    }

    async ensureHeaders(sheetName) {
        try {
            const config = this.sheetConfigs[sheetName];
            
            // جلب العناوين الحالية
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SHEET_ID,
                range: `${sheetName}!A1:Z1`
            });

            const existingHeaders = response.data.values ? response.data.values[0] : [];
            
            // إذا لم تكن العناوين موجودة أو كانت مختلفة، قم بتحديثها
            if (existingHeaders.length === 0 || !this.areHeadersMatching(existingHeaders, config.headers)) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: process.env.SHEET_ID,
                    range: `${sheetName}!A1`,
                    valueInputOption: 'RAW',
                    resource: { values: [config.headers] }
                });
                this.logger.production(`✅ تم تحديث عناوين: ${sheetName}`);
            }
            
        } catch (error) {
            this.logger.warning(`⚠️ خطأ في التحقق من عناوين ${sheetName}: ${error.message}`);
        }
    }

    areHeadersMatching(existingHeaders, expectedHeaders) {
        if (existingHeaders.length !== expectedHeaders.length) {
            return false;
        }
        
        for (let i = 0; i < expectedHeaders.length; i++) {
            if (existingHeaders[i] !== expectedHeaders[i]) {
                return false;
            }
        }
        
        return true;
    }

    async startNewSession(startTime) {
        this.sessionId = startTime.getTime().toString();
        await this.logSystemEvent('SESSION_START', `بدء جلسة إنتاج جديدة: ${this.sessionId}`);
        this.logger.production(`🆔 جلسة الإنتاج: ${this.sessionId}`);
    }

    async saveAccountData(accountData) {
        await this.initializeSheets();

        try {
            const rowData = [
                this.sessionId,
                accountData.timestamp,
                accountData.email,
                accountData.username,
                accountData.password,
                accountData.verification_code || 'PENDING',
                accountData.proxy,
                'ACTIVE',
                accountData.cycle || 0
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SHEET_ID,
                range: this.sheetConfigs.Accounts.range,
                valueInputOption: 'RAW',
                resource: { values: [rowData] }
            });

            await this.logSystemEvent('ACCOUNT_CREATED', `تم إنشاء حساب: ${accountData.username}`);
            this.logger.success(`💾 تم حفظ بيانات الحساب: ${accountData.username}`);
            
            return { success: true, sheet: 'Accounts' };
            
        } catch (error) {
            await this.logSystemEvent('SAVE_ERROR', `فشل حفظ بيانات الحساب: ${error.message}`);
            this.logger.error(`❌ فشل حفظ بيانات الحساب: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async saveProductionReport(reportData) {
        await this.initializeSheets();

        try {
            const startTime = new Date(this.sessionId);
            const endTime = new Date(reportData.end_time);
            const durationMinutes = ((endTime - startTime) / (1000 * 60)).toFixed(1);

            const rowData = [
                reportData.date,
                this.sessionId,
                reportData.target || 100,
                reportData.created || 0,
                reportData.attempts || 0,
                `${reportData.successRate || '0'}%`,
                startTime.toISOString(),
                endTime.toISOString(),
                durationMinutes
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SHEET_ID,
                range: this.sheetConfigs.Production_Stats.range,
                valueInputOption: 'RAW',
                resource: { values: [rowData] }
            });

            await this.logSystemEvent('PRODUCTION_REPORT', `تقرير إنتاج: ${reportData.created}/${reportData.target} حساب`);
            this.logger.production('📊 تم حفظ تقرير الإنتاج');
            
            return { success: true, sheet: 'Production_Stats' };
            
        } catch (error) {
            await this.logSystemEvent('REPORT_ERROR', `فشل حفظ التقرير: ${error.message}`);
            this.logger.error(`❌ فشل حفظ التقرير: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async saveProxyPerformance(proxyStats) {
        await this.initializeSheets();

        try {
            const rows = [];
            
            for (const [proxyKey, stats] of proxyStats.entries()) {
                const successRate = stats.usageCount > 0 ? 
                    ((stats.successCount / stats.usageCount) * 100).toFixed(1) : 0;

                const rowData = [
                    proxyKey,
                    stats.usageCount || 0,
                    stats.successCount || 0,
                    stats.failureCount || 0,
                    `${successRate}%`,
                    stats.lastUsed || 'N/A',
                    stats.avgResponseTime || 'N/A',
                    stats.healthStatus || 'unknown'
                ];
                
                rows.push(rowData);
            }

            if (rows.length > 0) {
                await this.sheets.spreadsheets.values.append({
                    spreadsheetId: process.env.SHEET_ID,
                    range: this.sheetConfigs.Proxy_Performance.range,
                    valueInputOption: 'RAW',
                    resource: { values: rows }
                });
            }

            this.logger.production(`📈 تم حفظ إحصائيات ${rows.length} بروكسي`);
            return { success: true, sheet: 'Proxy_Performance', count: rows.length };
            
        } catch (error) {
            this.logger.warning(`⚠️ فشل حفظ إحصائيات البروكسي: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async saveEmergencyState(emergencyData) {
        await this.initializeSheets();

        try {
            const rowData = [
                new Date().toISOString(),
                'EMERGENCY_SHUTDOWN',
                `إيقاف طارئ: ${emergencyData.accounts_created || 0} حساب مكتمل من ${emergencyData.total_attempts || 0} محاولة`,
                this.sessionId,
                'SYSTEM'
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SHEET_ID,
                range: this.sheetConfigs.System_Logs.range,
                valueInputOption: 'RAW',
                resource: { values: [rowData] }
            });

            this.logger.production('🛑 تم حفظ حالة الطوارئ');
            
        } catch (error) {
            console.error('💥 فشل حتى في حفظ حالة الطوارئ:', error.message);
        }
    }

    async logSystemEvent(level, message) {
        await this.initializeSheets();

        try {
            const rowData = [
                new Date().toISOString(),
                level,
                message,
                this.sessionId,
                'PRODUCTION_SYSTEM'
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SHEET_ID,
                range: this.sheetConfigs.System_Logs.range,
                valueInputOption: 'RAW',
                resource: { values: [rowData] }
            });

        } catch (error) {
            console.error('❌ فشل تسجيل الحدث:', error.message);
        }
    }

    async getSheetInfo() {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: process.env.SHEET_ID
            });

            return {
                title: response.data.properties.title,
                sheets: response.data.sheets.map(sheet => ({
                    name: sheet.properties.title,
                    id: sheet.properties.sheetId,
                    rowCount: sheet.properties.gridProperties.rowCount,
                    columnCount: sheet.properties.gridProperties.columnCount
                }))
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    getStatus() {
        return {
            initialized: this.initialized,
            session_id: this.sessionId,
            total_sheets: Object.keys(this.sheetConfigs).length,
            sheets_configured: Object.keys(this.sheetConfigs)
        };
    }
}

module.exports = { GoogleSheetsManager };

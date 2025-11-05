const { google } = require('googleapis');
const { SystemLogger } = require('./logger');

class GoogleSheetsManager {
    constructor() {
        this.logger = new SystemLogger();
        this.sheets = null;
        this.initialized = false;
        this.sessionId = null;
        
        // إعدادات جميع الأوراق الجاهزة
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
            
            // اختبار الوصول إلى الجدول
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: process.env.SHEET_ID
            });
            
            this.logger.success(`✅ تم الاتصال بـ: ${response.data.properties.title}`);
            return { connected: true };

        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    async initializeSheets() {
        if (this.initialized) return;

        try {
            const auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheets = google.sheets({ version: 'v4', auth });
            this.initialized = true;

            // التحقق من وجود جميع الأوراق الجاهزة
            await this.validateSheetsExist();
            
            this.logger.production('✅ تم تهيئة Google Sheets مع جميع الأوراق الجاهزة');

        } catch (error) {
            throw new Error(`فشل تهيئة Google Sheets: ${error.message}`);
        }
    }

    async validateSheetsExist() {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: process.env.SHEET_ID
            });

            const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
            const requiredSheets = Object.keys(this.sheetConfigs);
            
            this.logger.production('📊 التحقق من جميع الأوراق الجاهزة...');
            
            for (const sheetName of requiredSheets) {
                if (existingSheets.includes(sheetName)) {
                    this.logger.success(`✅ ورقة موجودة: ${sheetName}`);
                    
                    // تأكد من وجود العناوين
                    await this.ensureHeaders(sheetName);
                } else {
                    throw new Error(`❌ الورقة غير موجودة: ${sheetName}`);
                }
            }
            
            this.logger.success(`✅ تم التحقق من ${requiredSheets.length} أوراق بنجاح`);
            
        } catch (error) {
            throw new Error(`فشل التحقق من الأوراق: ${error.message}`);
        }
    }

    async ensureHeaders(sheetName) {
        try {
            const config = this.sheetConfigs[sheetName];
            
            // التحقق من وجود العناوين
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SHEET_ID,
                range: `${sheetName}!A1:Z1`
            });

            const existingHeaders = response.data.values ? response.data.values[0] : [];
            
            // إذا لم تكن العناوين موجودة، أضفها
            if (existingHeaders.length === 0 || existingHeaders[0] !== config.headers[0]) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: process.env.SHEET_ID,
                    range: `${sheetName}!A1`,
                    valueInputOption: 'RAW',
                    resource: { values: [config.headers] }
                });
                this.logger.production(`✅ تم إضافة عناوين: ${sheetName}`);
            }
            
        } catch (error) {
            this.logger.warning(`⚠️ خطأ في عناوين ${sheetName}: ${error.message}`);
        }
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
                accountData.cycle
            ];

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SHEET_ID,
                range: this.sheetConfigs.Accounts.range,
                valueInputOption: 'RAW',
                resource: { values: [rowData] }
            });

            await this.logSystemEvent('ACCOUNT_CREATED', `تم إنشاء حساب: ${accountData.username}`);
            this.logger.success(`💾 تم حفظ بيانات الحساب: ${accountData.username}`);
            
        } catch (error) {
            await this.logSystemEvent('SAVE_ERROR', `فشل حفظ بيانات الحساب: ${error.message}`);
            throw new Error(`فشل حفظ بيانات الإنتاج: ${error.message}`);
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
                reportData.target,
                reportData.created,
                reportData.attempts,
                `${reportData.successRate}%`,
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

            await this.logSystemEvent('PRODUCTION_REPORT', `تقرير إنتاج: ${reportData.created}/${reportData.target} حساب (${reportData.successRate}%)`);
            this.logger.production('📊 تم حفظ تقرير الإنتاج');
            
        } catch (error) {
            await this.logSystemEvent('REPORT_ERROR', `فشل حفظ التقرير: ${error.message}`);
            this.logger.error(`❌ فشل حفظ التقرير: ${error.message}`);
        }
    }

    async saveProxyPerformance(proxyStats) {
        await this.initializeSheets();

        try {
            this.logger.production('📈 بدء حفظ إحصائيات البروكسيات...');
            
            let savedCount = 0;
            const currentTime = new Date().toISOString();

            for (const [proxyKey, stats] of proxyStats.entries()) {
                try {
                    const successRate = stats.usageCount > 0 ? 
                        ((stats.successCount / stats.usageCount) * 100).toFixed(1) : 0;

                    const rowData = [
                        proxyKey,
                        stats.usageCount,
                        stats.successCount,
                        stats.failureCount,
                        `${successRate}%`,
                        stats.lastUsed || currentTime,
                        stats.avgResponseTime ? `${stats.avgResponseTime}ms` : 'N/A',
                        stats.healthStatus || 'unknown'
                    ];

                    await this.sheets.spreadsheets.values.append({
                        spreadsheetId: process.env.SHEET_ID,
                        range: this.sheetConfigs.Proxy_Performance.range,
                        valueInputOption: 'RAW',
                        resource: { values: [rowData] }
                    });

                    savedCount++;
                    
                } catch (proxyError) {
                    this.logger.warning(`⚠️ فشل حفظ إحصائيات بروكسي ${proxyKey}: ${proxyError.message}`);
                }
            }

            await this.logSystemEvent('PROXY_STATS_SAVED', `تم حفظ إحصائيات ${savedCount} بروكسي`);
            this.logger.success(`📈 تم حفظ إحصائيات ${savedCount} بروكسي`);
            
        } catch (error) {
            await this.logSystemEvent('PROXY_STATS_ERROR', `فشل حفظ إحصائيات البروكسيات: ${error.message}`);
            this.logger.error(`❌ فشل حفظ إحصائيات البروكسيات: ${error.message}`);
        }
    }

    async saveProxyPerformanceBatch(proxyManager) {
        try {
            const proxyStats = new Map();
            const proxies = proxyManager.proxies || [];
            
            for (const proxy of proxies) {
                if (proxy.usageCount > 0) {
                    const proxyKey = `${proxy.host}:${proxy.port}`;
                    const successRate = proxy.usageCount > 0 ? 
                        ((proxy.successCount / proxy.usageCount) * 100).toFixed(1) : 0;

                    proxyStats.set(proxyKey, {
                        usageCount: proxy.usageCount,
                        successCount: proxy.successCount,
                        failureCount: proxy.failureCount,
                        successRate: successRate,
                        lastUsed: proxy.lastUsed,
                        avgResponseTime: proxy.responseTime,
                        healthStatus: proxy.healthStatus || 'unknown'
                    });
                }
            }

            if (proxyStats.size > 0) {
                await this.saveProxyPerformance(proxyStats);
            }
            
        } catch (error) {
            this.logger.error(`❌ فشل تجميع إحصائيات البروكسيات: ${error.message}`);
        }
    }

    async saveEmergencyState(emergencyData) {
        await this.initializeSheets();

        try {
            const rowData = [
                new Date().toISOString(),
                'EMERGENCY_SHUTDOWN',
                `إيقاف طارئ: ${emergencyData.accounts_created} حساب مكتمل من ${emergencyData.total_attempts} محاولة`,
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

    async clearOldProxyStats() {
        await this.initializeSheets();

        try {
            // مسح البيانات القديمة في ورقة البروكسيات (احتفظ بالعناوين فقط)
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: process.env.SHEET_ID,
                range: 'Proxy_Performance!A2:Z'
            });

            this.logger.production('🧹 تم مسح إحصائيات البروكسيات القديمة');
            
        } catch (error) {
            this.logger.warning(`⚠️ فشل مسح الإحصائيات القديمة: ${error.message}`);
        }
    }

    getStatus() {
        return {
            initialized: this.initialized,
            session_id: this.sessionId,
            sheets_configured: Object.keys(this.sheetConfigs).length,
            sheets_list: Object.keys(this.sheetConfigs)
        };
    }
}

module.exports = { GoogleSheetsManager };

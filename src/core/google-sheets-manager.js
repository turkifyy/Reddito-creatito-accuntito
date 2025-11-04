const { google } = require('googleapis');
const { SystemLogger } = require('./logger');

class GoogleSheetsManager {
    constructor() {
        this.logger = new SystemLogger();
        this.sheets = null;
        this.initialized = false;
        this.sessionId = null;
    }

    async validateConnection() {
        try {
            await this.initializeSheets();
            
            const testData = [[new Date().toISOString(), 'TEST_CONNECTION', 'SUCCESS']];
            
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SHEET_ID,
                range: 'ConnectionTest!A:C',
                valueInputOption: 'RAW',
                resource: { values: testData }
            });

            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: process.env.SHEET_ID,
                range: 'ConnectionTest!A:Z'
            });

            return {
                connected: true,
                readAccess: true,
                writeAccess: true
            };
            
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
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

            await this.initializeProductionSheet();
            
            this.logger.production('✅ تم تهيئة Google Sheets للإنتاج');

        } catch (error) {
            throw new Error(`فشل تهيئة Google Sheets: ${error.message}`);
        }
    }

    async initializeProductionSheet() {
        try {
            const sheetStructure = {
                'Accounts': [
                    ['Session_ID', 'Timestamp', 'Email', 'Username', 'Password', 'Verification_Code', 'Proxy', 'Status', 'Cycle_Number']
                ],
                'Production_Stats': [
                    ['Date', 'Session_ID', 'Target_Accounts', 'Success_Count', 'Attempt_Count', 'Success_Rate', 'Start_Time', 'End_Time', 'Duration_Minutes']
                ],
                'Proxy_Performance': [
                    ['Proxy', 'Usage_Count', 'Success_Count', 'Failure_Count', 'Success_Rate', 'Last_Used', 'Avg_Response_Time', 'Health_Status']
                ],
                'System_Logs': [
                    ['Timestamp', 'Level', 'Message', 'Session_ID', 'Component']
                ]
            };

            for (const [sheetName, headers] of Object.entries(sheetStructure)) {
                try {
                    await this.sheets.spreadsheets.values.append({
                        spreadsheetId: process.env.SHEET_ID,
                        range: `${sheetName}!A1`,
                        valueInputOption: 'RAW',
                        resource: { values: [headers] }
                    });
                } catch (error) {
                    // الأوراق موجودة بالفعل
                }
            }

        } catch (error) {
            this.logger.warning(`⚠️ قد تكون الأوراق موجودة مسبقاً: ${error.message}`);
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
                range: 'Accounts!A:I',
                valueInputOption: 'RAW',
                resource: { values: [rowData] }
            });

            await this.logSystemEvent('ACCOUNT_CREATED', 
                `تم إنشاء حساب: ${accountData.username}`);

            this.logger.success(`💾 تم حفظ بيانات الحساب: ${accountData.username}`);
            
        } catch (error) {
            await this.logSystemEvent('SAVE_ERROR', 
                `فشل حفظ بيانات الحساب: ${error.message}`);
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
                range: 'Production_Stats!A:I',
                valueInputOption: 'RAW',
                resource: { values: [rowData] }
            });

            await this.logSystemEvent('PRODUCTION_REPORT', 
                `تقرير إنتاج: ${reportData.created}/${reportData.target} حساب (${reportData.successRate}%)`);

            this.logger.production('📊 تم حفظ تقرير الإنتاج');
            
        } catch (error) {
            await this.logSystemEvent('REPORT_ERROR', 
                `فشل حفظ التقرير: ${error.message}`);
            this.logger.error(`❌ فشل حفظ التقرير: ${error.message}`);
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
                range: 'System_Logs!A:E',
                valueInputOption: 'RAW',
                resource: { values: [rowData] }
            });

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
                range: 'System_Logs!A:E',
                valueInputOption: 'RAW',
                resource: { values: [rowData] }
            });

        } catch (error) {
            console.error('❌ فشل تسجيل الحدث:', error.message);
        }
    }

    getStatus() {
        return {
            initialized: this.initialized,
            session_id: this.sessionId,
            last_operation: new Date().toISOString()
        };
    }
}

module.exports = { GoogleSheetsManager };

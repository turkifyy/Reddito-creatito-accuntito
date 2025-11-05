const { google } = require('googleapis');
const { SystemLogger } = require('./logger');

class SetupManager {
    constructor() {
        this.logger = new SystemLogger();
        this.sheets = null;
    }

    async initializeSheets() {
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheets = google.sheets({ version: 'v4', auth });
            this.logger.success('✅ تم تهيئة Google Sheets');
            return true;
        } catch (error) {
            throw new Error(`فشل تهيئة Google Sheets: ${error.message}`);
        }
    }

    async setupSheetsStructure() {
        try {
            const spreadsheetId = process.env.SHEET_ID;
            
            await this.createSheetsIfNotExist(spreadsheetId);
            await this.setupAccountsSheet(spreadsheetId);
            await this.setupProductionStatsSheet(spreadsheetId);
            await this.setupSystemLogsSheet(spreadsheetId);
            
            this.logger.success('✅ تم إعداد هيكل الجداول');
            return true;
            
        } catch (error) {
            throw new Error(`فشل إعداد الهيكل: ${error.message}`);
        }
    }

    async createSheetsIfNotExist(spreadsheetId) {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: spreadsheetId
            });

            const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
            const requiredSheets = ['Accounts', 'Production_Stats', 'System_Logs'];
            
            for (const sheetName of requiredSheets) {
                if (!existingSheets.includes(sheetName)) {
                    await this.sheets.spreadsheets.batchUpdate({
                        spreadsheetId: spreadsheetId,
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
                    this.logger.production(`✅ تم إنشاء: ${sheetName}`);
                }
            }
            
        } catch (error) {
            this.logger.production('📊 الأوراق جاهزة');
        }
    }

    async setupAccountsSheet(spreadsheetId) {
        const headers = [['Session_ID', 'Timestamp', 'Email', 'Username', 'Password', 'Verification_Code', 'Proxy', 'Status', 'Cycle_Number']];
        
        await this.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Accounts!A1:I1',
            valueInputOption: 'RAW',
            resource: { values: headers }
        });
    }

    async setupProductionStatsSheet(spreadsheetId) {
        const headers = [['Date', 'Session_ID', 'Target_Accounts', 'Success_Count', 'Attempt_Count', 'Success_Rate', 'Start_Time', 'End_Time', 'Duration_Minutes']];
        
        await this.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Production_Stats!A1:I1',
            valueInputOption: 'RAW',
            resource: { values: headers }
        });
    }

    async setupSystemLogsSheet(spreadsheetId) {
        const headers = [['Timestamp', 'Level', 'Message', 'Session_ID', 'Component']];
        
        await this.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'System_Logs!A1:E1',
            valueInputOption: 'RAW',
            resource: { values: headers }
        });
    }

    async validateSheetAccess(spreadsheetId) {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: spreadsheetId
            });
            
            this.logger.success(`✅ تم الوصول إلى: ${response.data.properties.title}`);
            return true;
            
        } catch (error) {
            throw new Error(`فشل الوصول إلى الجدول: ${error.message}`);
        }
    }
}

module.exports = { SetupManager };

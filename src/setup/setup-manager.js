const { google } = require('googleapis');
const { SystemLogger } = require('../core/logger');

class SetupManager {
    constructor() {
        this.logger = new SystemLogger();
        this.sheets = null;
        this.auth = null;
    }

    // تهيئة اتصال Google Sheets
    async initializeSheets() {
        try {
            this.logger.production('📊 تهيئة Google Sheets...');

            // التحقق من المتغيرات البيئية
            if (!process.env.GOOGLE_CREDENTIALS) {
                throw new Error('GOOGLE_CREDENTIALS غير موجود في المتغيرات البيئية');
            }

            if (!process.env.SHEET_ID) {
                throw new Error('SHEET_ID غير موجود في المتغيرات البيئية');
            }

            // تحليل بيانات الاعتماد
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

            // إنشاء مصادقة JWT
            this.auth = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key.replace(/\\n/g, '\n'),
                ['https://www.googleapis.com/auth/spreadsheets']
            );

            // تهيئة Google Sheets API
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });

            this.logger.success('✅ تم تهيئة Google Sheets بنجاح');
            return true;

        } catch (error) {
            this.logger.error(`❌ فشل تهيئة Google Sheets: ${error.message}`);
            throw error;
        }
    }

    // التحقق من الوصول إلى الورقة
    async validateSheetAccess(sheetId) {
        try {
            this.logger.production('🔍 التحقق من الوصول إلى الورقة...');

            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: sheetId
            });

            if (response.data) {
                this.logger.success(`✅ تم الاتصال بـ: ${response.data.properties.title}`);
                return true;
            }

            throw new Error('فشل الحصول على بيانات الورقة');

        } catch (error) {
            this.logger.error(`❌ فشل الوصول إلى الورقة: ${error.message}`);
            throw error;
        }
    }

    // إنشاء/التحقق من بنية الأوراق
    async setupSheetsStructure() {
        try {
            this.logger.production('📊 التحقق من الأوراق الجاهزة...');

            const sheetId = process.env.SHEET_ID;

            // قائمة الأوراق المطلوبة
            const requiredSheets = [
                {
                    name: 'Accounts',
                    headers: ['Username', 'Password', 'Email', 'Created_At', 'Proxy', 'Status', 'Session_ID']
                },
                {
                    name: 'Production_Stats',
                    headers: ['Date', 'Target', 'Created', 'Attempts', 'Success_Rate', 'Duration_Minutes', 'Session_ID']
                },
                {
                    name: 'Proxy_Performance',
                    headers: ['Proxy', 'Total_Uses', 'Successes', 'Failures', 'Success_Rate', 'Avg_Response_Time', 'Last_Used']
                },
                {
                    name: 'System_Logs',
                    headers: ['Timestamp', 'Level', 'Message', 'Details', 'Session_ID']
                }
            ];

            // الحصول على الأوراق الموجودة
            const existingSheets = await this.getExistingSheets(sheetId);

            // إنشاء أو تحديث كل ورقة
            for (const sheetConfig of requiredSheets) {
                const exists = existingSheets.some(s => s.properties.title === sheetConfig.name);

                if (!exists) {
                    await this.createSheet(sheetId, sheetConfig.name);
                    this.logger.success(`✅ تم إنشاء ورقة: ${sheetConfig.name}`);
                } else {
                    this.logger.success(`✅ ورقة موجودة: ${sheetConfig.name}`);
                }

                // تحديث العناوين
                await this.updateSheetHeaders(sheetId, sheetConfig.name, sheetConfig.headers);
            }

            this.logger.success('🎯 جميع الأوراق جاهزة ومهيأة');
            return true;

        } catch (error) {
            this.logger.error(`❌ فشل إعداد بنية الأوراق: ${error.message}`);
            throw error;
        }
    }

    // الحصول على الأوراق الموجودة
    async getExistingSheets(sheetId) {
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: sheetId
            });

            return response.data.sheets || [];

        } catch (error) {
            this.logger.error(`❌ فشل الحصول على الأوراق: ${error.message}`);
            throw error;
        }
    }

    // إنشاء ورقة جديدة
    async createSheet(sheetId, sheetName) {
        try {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName,
                                gridProperties: {
                                    rowCount: 1000,
                                    columnCount: 20
                                }
                            }
                        }
                    }]
                }
            });

            return true;

        } catch (error) {
            // إذا كانت الورقة موجودة بالفعل، تجاهل الخطأ
            if (error.message.includes('already exists')) {
                return true;
            }
            throw error;
        }
    }

    // تحديث عناوين الورقة
    async updateSheetHeaders(sheetId, sheetName, headers) {
        try {
            // التحقق من وجود عناوين
            const existingData = await this.sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `${sheetName}!A1:Z1`
            });

            // إذا كانت العناوين موجودة، لا تحدث
            if (existingData.data.values && existingData.data.values.length > 0) {
                return true;
            }

            // كتابة العناوين
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: sheetId,
                range: `${sheetName}!A1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            });

            this.logger.production(`✅ تم تحديث عناوين: ${sheetName}`);
            return true;

        } catch (error) {
            this.logger.warning(`⚠️ تحذير تحديث العناوين: ${error.message}`);
            return false;
        }
    }

    // كتابة بيانات إلى ورقة
    async appendToSheet(sheetName, data) {
        try {
            const sheetId = process.env.SHEET_ID;

            await this.sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [data]
                }
            });

            return true;

        } catch (error) {
            this.logger.error(`❌ فشل الكتابة إلى ${sheetName}: ${error.message}`);
            throw error;
        }
    }

    // قراءة بيانات من ورقة
    async readFromSheet(sheetName, range = 'A:Z') {
        try {
            const sheetId = process.env.SHEET_ID;

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `${sheetName}!${range}`
            });

            return response.data.values || [];

        } catch (error) {
            this.logger.error(`❌ فشل القراءة من ${sheetName}: ${error.message}`);
            throw error;
        }
    }

    // تنظيف البيانات القديمة (اختياري)
    async cleanupOldData(daysToKeep = 30) {
        try {
            this.logger.production(`🧹 تنظيف البيانات الأقدم من ${daysToKeep} يوم...`);

            // يمكن تنفيذ منطق التنظيف هنا إذا لزم الأمر

            return true;

        } catch (error) {
            this.logger.warning(`⚠️ تحذير التنظيف: ${error.message}`);
            return false;
        }
    }

    // الحصول على إحصائيات الاستخدام
    async getUsageStats() {
        try {
            const accounts = await this.readFromSheet('Accounts');
            const stats = await this.readFromSheet('Production_Stats');

            return {
                totalAccounts: accounts.length - 1, // -1 للعناوين
                totalSessions: stats.length - 1,
                lastUpdate: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error(`❌ فشل الحصول على الإحصائيات: ${error.message}`);
            return null;
        }
    }
}

module.exports = { SetupManager };

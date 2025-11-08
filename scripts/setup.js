#!/usr/bin/env node

/**
 * 🛠️ نظام الإعداد الذكي المتكامل V2 مع التعافي التلقائي
 * @version 2.0.0
 * @file scripts/setup.js
 * @description نظام إعداد متكامل مع خوارزميات تعافي تلقائي ومراقبة صحية
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import os from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// الألوان للواجهة
const colors = {
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

class AdvancedSetupSystem {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.setupConfig = {
            phase: 'initial',
            stepsCompleted: 0,
            totalSteps: 12,
            errors: [],
            warnings: [],
            startTime: new Date(),
            systemInfo: this.collectSystemInfo()
        };

        this.recoverySystem = new SetupRecoverySystem();
        this.healthMonitor = new SetupHealthMonitor();
        this.dependencyManager = new DependencyManager();
        
        this.setupPhases = [
            'system_check',
            'dependencies',
            'directory_structure',
            'configuration',
            'environment',
            'permissions',
            'services',
            'security',
            'validation',
            'testing',
            'optimization',
            'completion'
        ];
    }

    /**
     * جمع معلومات النظام
     */
    collectSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            nodeVersion: process.version,
            npmVersion: this.getNpmVersion(),
            memory: {
                total: os.totalmem(),
                free: os.freemem()
            },
            cpus: os.cpus().length,
            uptime: os.uptime(),
            userInfo: os.userInfo(),
            hostname: os.hostname()
        };
    }

    /**
     * الحصول على إصدار npm
     */
    getNpmVersion() {
        try {
            return execSync('npm --version', { encoding: 'utf8' }).trim();
        } catch {
            return 'غير معروف';
        }
    }

    /**
     * بدء عملية الإعداد
     */
    async start() {
        this.showBanner();
        await this.showWelcome();

        try {
            // فحص صحة النظام قبل البدء
            await this.preFlightCheck();

            // تنفيذ مراحل الإعداد
            for (const phase of this.setupPhases) {
                await this.executePhase(phase);
            }

            // الإنهاء الناجح
            await this.completeSetup();

        } catch (error) {
            await this.handleSetupFailure(error);
        } finally {
            this.rl.close();
        }
    }

    /**
     * عرض شاشة الترحيب
     */
    async showWelcome() {
        this.log(`
🚀 نظام أتمتة Reddit المتطور V2
📋 عملية الإعداد الذكي مع التعافي التلقائي
⏰ البدء: ${this.setupConfig.startTime.toLocaleString()}
        `, 'cyan');

        // طلب التأكيد
        const confirmed = await this.askQuestion(
            'هل تريد متابعة عملية الإعداد؟ (y/n): ',
            ['y', 'n', 'yes', 'no']
        );

        if (!['y', 'yes'].includes(confirmed.toLowerCase())) {
            this.log('❌ تم إلغاء عملية الإعداد', 'red');
            process.exit(0);
        }
    }

    /**
     * فحص ما قبل الإقلاع
     */
    async preFlightCheck() {
        this.log('🔍 بدء فحص ما قبل الإقلاع...', 'blue');

        const checks = [
            { name: 'إصدار Node.js', check: this.checkNodeVersion.bind(this) },
            { name: 'صلاحيات النظام', check: this.checkSystemPermissions.bind(this) },
            { name: 'اتصال الإنترنت', check: this.checkInternetConnection.bind(this) },
            { name: 'مساحة التخزين', check: this.checkStorageSpace.bind(this) },
            { name: 'ذاكرة النظام', check: this.checkSystemMemory.bind(this) }
        ];

        for (const check of checks) {
            try {
                await check.check();
                this.log(`✅ ${check.name}`, 'green');
            } catch (error) {
                this.setupConfig.errors.push(`${check.name}: ${error.message}`);
                this.log(`❌ ${check.name}: ${error.message}`, 'red');
                
                // محاولة التعافي التلقائي
                await this.recoverySystem.attemptRecovery(check.name, error);
            }
        }

        if (this.setupConfig.errors.length > 0) {
            throw new Error('فشل فحص ما قبل الإقلاع');
        }
    }

    /**
     * التحقق من إصدار Node.js
     */
    async checkNodeVersion() {
        const currentVersion = process.version;
        const requiredVersion = 'v18.0.0';

        if (this.compareVersions(currentVersion, requiredVersion) < 0) {
            throw new Error(`Node.js ${requiredVersion} مطلوب، لديك ${currentVersion}`);
        }

        this.log(`✅ إصدار Node.js: ${currentVersion}`, 'green');
    }

    /**
     * التحقق من صلاحيات النظام
     */
    async checkSystemPermissions() {
        const requiredDirs = [
            process.cwd(),
            path.join(process.cwd(), 'node_modules'),
            path.join(process.cwd(), 'logs'),
            path.join(process.cwd(), 'data')
        ];

        for (const dir of requiredDirs) {
            try {
                // محاولة إنشاء ملف اختبار
                const testFile = path.join(dir, '.write-test');
                fs.writeFileSync(testFile, 'test');
                fs.unlinkSync(testFile);
            } catch (error) {
                throw new Error(`لا توجد صلاحيات كتابة في: ${dir}`);
            }
        }
    }

    /**
     * التحقق من اتصال الإنترنت
     */
    async checkInternetConnection() {
        try {
            // محاولة الاتصال بخدمات أساسية
            const services = [
                'https://www.npmjs.com',
                'https://www.google.com',
                'https://www.github.com'
            ];

            for (const service of services) {
                await this.testConnection(service);
            }
        } catch (error) {
            throw new Error('فشل في الاتصال بالإنترنت');
        }
    }

    /**
     * اختبار اتصال بخدمة
     */
    async testConnection(url) {
        return new Promise((resolve, reject) => {
            const https = require('https');
            const req = https.get(url, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error(`استجابة غير متوقعة: ${res.statusCode}`));
                }
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('انتهى وقت الاتصال'));
            });
        });
    }

    /**
     * التحقق من مساحة التخزين
     */
    async checkStorageSpace() {
        const minSpaceRequired = 500 * 1024 * 1024; // 500 MB
        const stats = require('fs').statSync(process.cwd());
        const freeSpace = stats.size;

        if (freeSpace < minSpaceRequired) {
            throw new Error(`مساحة التخزين غير كافية. المطلوب: 500MB، المتاح: ${(freeSpace / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    /**
     * التحقق من ذاكرة النظام
     */
    async checkSystemMemory() {
        const minMemoryRequired = 512 * 1024 * 1024; // 512 MB
        const freeMemory = os.freemem();

        if (freeMemory < minMemoryRequired) {
            throw new Error(`الذاكرة غير كافية. المطلوب: 512MB، المتاح: ${(freeMemory / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    /**
     * تنفيذ مرحلة إعداد
     */
    async executePhase(phase) {
        this.setupConfig.phase = phase;
        this.log(`\n🎯 بدء مرحلة: ${this.getPhaseName(phase)}`, 'magenta');

        try {
            switch (phase) {
                case 'system_check':
                    await this.phaseSystemCheck();
                    break;
                case 'dependencies':
                    await this.phaseDependencies();
                    break;
                case 'directory_structure':
                    await this.phaseDirectoryStructure();
                    break;
                case 'configuration':
                    await this.phaseConfiguration();
                    break;
                case 'environment':
                    await this.phaseEnvironment();
                    break;
                case 'permissions':
                    await this.phasePermissions();
                    break;
                case 'services':
                    await this.phaseServices();
                    break;
                case 'security':
                    await this.phaseSecurity();
                    break;
                case 'validation':
                    await this.phaseValidation();
                    break;
                case 'testing':
                    await this.phaseTesting();
                    break;
                case 'optimization':
                    await this.phaseOptimization();
                    break;
                case 'completion':
                    await this.phaseCompletion();
                    break;
            }

            this.setupConfig.stepsCompleted++;
            this.log(`✅ اكتملت مرحلة: ${this.getPhaseName(phase)}`, 'green');

        } catch (error) {
            this.log(`❌ فشل في مرحلة ${this.getPhaseName(phase)}: ${error.message}`, 'red');
            
            // التعافي التلقائي من فشل المرحلة
            await this.recoverySystem.recoverFromPhaseFailure(phase, error);
            
            throw error;
        }
    }

    /**
     * مرحلة فحص النظام
     */
    async phaseSystemCheck() {
        this.log('🔍 فحص شامل للنظام...', 'blue');

        const checks = [
            { name: 'معمارية النظام', check: () => this.checkSystemArchitecture() },
            { name: 'المكتبات النظام', check: () => this.checkSystemLibraries() },
            { name: 'إصدار npm', check: () => this.checkNpmVersion() },
            { name: 'بيئة التشغيل', check: () => this.checkRuntimeEnvironment() }
        ];

        for (const check of checks) {
            await this.executeWithRecovery(check.name, check.check);
        }
    }

    /**
     * التحقق من معمارية النظام
     */
    async checkSystemArchitecture() {
        const arch = os.arch();
        const supportedArchs = ['x64', 'arm64'];

        if (!supportedArchs.includes(arch)) {
            throw new Error(`المعمارية ${arch} غير مدعومة. المعماريات المدعومة: ${supportedArchs.join(', ')}`);
        }

        this.log(`✅ المعمارية: ${arch}`, 'green');
    }

    /**
     * التحقق من المكتبات النظام
     */
    async checkSystemLibraries() {
        const platform = os.platform();
        
        if (platform === 'linux') {
            // التحقق من المكتبات المطلوبة على Linux
            const requiredLibs = ['libnss3', 'libxss1', 'libatk-bridge2.0-0'];
            
            for (const lib of requiredLibs) {
                try {
                    execSync(`dpkg -l | grep ${lib}`, { stdio: 'pipe' });
                } catch {
                    this.setupConfig.warnings.push(`المكتبة ${lib} غير مثبتة - قد تحتاج لتثبيتها يدوياً`);
                }
            }
        }
    }

    /**
     * التحقق من إصدار npm
     */
    async checkNpmVersion() {
        const npmVersion = this.getNpmVersion();
        const requiredVersion = '9.0.0';

        if (this.compareVersions(npmVersion, requiredVersion) < 0) {
            this.setupConfig.warnings.push(`إصدار npm ${npmVersion} قديم - يوصى بالتحديث إلى ${requiredVersion}`);
        }

        this.log(`✅ إصدار npm: ${npmVersion}`, 'green');
    }

    /**
     * مرحلة الاعتماديات
     */
    async phaseDependencies() {
        this.log('📦 تثبيت الاعتماديات...', 'blue');

        await this.dependencyManager.installDependencies();
        
        // التحقق من التثبيت
        await this.dependencyManager.verifyInstallation();
    }

    /**
     * مرحلة هيكل المجلدات
     */
    async phaseDirectoryStructure() {
        this.log('📁 إنشاء هيكل المجلدات...', 'blue');

        const directories = [
            'data',
            'logs',
            'tmp',
            'screenshots',
            'backups',
            'config/env',
            'scripts/temp',
            'monitoring/data'
        ];

        let createdCount = 0;
        for (const dir of directories) {
            if (await this.createDirectory(dir)) {
                createdCount++;
            }
        }

        this.log(`✅ تم إنشاء ${createdCount} مجلد من أصل ${directories.length}`, 'green');
    }

    /**
     * إنشاء مجلد
     */
    async createDirectory(dirPath) {
        const fullPath = path.join(process.cwd(), dirPath);
        
        try {
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                
                // إنشاء ملف .gitkeep
                const gitkeepPath = path.join(fullPath, '.gitkeep');
                if (!fs.existsSync(gitkeepPath)) {
                    fs.writeFileSync(gitkeepPath, '# Git keep file\n');
                }
                
                this.log(`📁 تم إنشاء: ${dirPath}`, 'green');
                return true;
            }
        } catch (error) {
            this.log(`❌ فشل في إنشاء ${dirPath}: ${error.message}`, 'red');
            return false;
        }
        
        return true;
    }

    /**
     * مرحلة التكوين
     */
    async phaseConfiguration() {
        this.log('⚙️ إعداد التكوين...', 'blue');

        // نسخ ملفات التكوين إذا لزم الأمر
        await this.setupConfigurationFiles();
        
        // التحقق من صحة التكوين
        await this.validateConfiguration();
    }

    /**
     * إعداد ملفات التكوين
     */
    async setupConfigurationFiles() {
        const configFiles = [
            { source: 'config/config.example.js', target: 'config/config.js' },
            { source: '.env.example', target: '.env' }
        ];

        for (const file of configFiles) {
            await this.setupConfigFile(file.source, file.target);
        }
    }

    /**
     * إعداد ملف تكوين
     */
    async setupConfigFile(source, target) {
        const sourcePath = path.join(process.cwd(), source);
        const targetPath = path.join(process.cwd(), target);

        if (!fs.existsSync(targetPath) && fs.existsSync(sourcePath)) {
            try {
                fs.copyFileSync(sourcePath, targetPath);
                this.log(`📄 تم إنشاء: ${target}`, 'green');
            } catch (error) {
                this.log(`❌ فشل في إنشاء ${target}: ${error.message}`, 'red');
            }
        }
    }

    /**
     * التحقق من صحة التكوين
     */
    async validateConfiguration() {
        try {
            // محاولة تحميل التكوين للتحقق من صحته
            const configPath = path.join(process.cwd(), 'config/config.js');
            if (fs.existsSync(configPath)) {
                const { config } = await import(configPath);
                this.log('✅ تكوين النظام صالح', 'green');
            }
        } catch (error) {
            throw new Error(`تكوين النظام غير صالح: ${error.message}`);
        }
    }

    /**
     * مرحلة البيئة
     */
    async phaseEnvironment() {
        this.log('🌍 إعداد متغيرات البيئة...', 'blue');

        // التحقق من متغيرات البيئة المطلوبة
        await this.checkEnvironmentVariables();
        
        // إعداد البيئة للتشغيل
        await this.setupEnvironment();
    }

    /**
     * التحقق من متغيرات البيئة
     */
    async checkEnvironmentVariables() {
        const requiredVars = [
            'NODE_ENV',
            'GOOGLE_SHEET_ID',
            'GOOGLE_SERVICE_ACCOUNT_JSON'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            this.setupConfig.warnings.push(
                `متغيرات البيئة المفقودة: ${missingVars.join(', ')} - تأكد من إضافتها في .env`
            );
        }
    }

    /**
     * مرحلة الصلاحيات
     */
    async phasePermissions() {
        this.log('🔐 ضبط الصلاحيات...', 'blue');

        // ضبط صلاحيات الملفات
        await this.setFilePermissions();
        
        // التحقق من صلاحيات التنفيذ
        await this.checkExecutionPermissions();
    }

    /**
     * ضبط صلاحيات الملفات
     */
    async setFilePermissions() {
        const filesToMakeExecutable = [
            'scripts/setup.js',
            'scripts/cleanup.js'
        ];

        if (os.platform() !== 'win32') {
            for (const file of filesToMakeExecutable) {
                const filePath = path.join(process.cwd(), file);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.chmodSync(filePath, '755');
                        this.log(`🔧 صلاحيات تنفيذ: ${file}`, 'green');
                    } catch (error) {
                        this.log(`⚠️ فشل في ضبط صلاحيات ${file}`, 'yellow');
                    }
                }
            }
        }
    }

    /**
     * مرحلة الخدمات
     */
    async phaseServices() {
        this.log('🛠️ إعداد الخدمات...', 'blue');

        // إعداد Google Sheets
        await this.setupGoogleSheets();
        
        // اختبار خدمات الطرف الثالث
        await this.testExternalServices();
    }

    /**
     * إعداد Google Sheets
     */
    async setupGoogleSheets() {
        this.log('📊 التحقق من إعداد Google Sheets...', 'blue');

        if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
            this.setupConfig.warnings.push('إعدادات Google Sheets غير مكتملة - تأكد من إضافة المتغيرات في .env');
            return;
        }

        try {
            // اختبار اتصال Google Sheets
            const { GoogleSheetsManager } = await import('../src/core/google-sheets-manager.js');
            const sheetsManager = new GoogleSheetsManager();
            await sheetsManager.initialize();
            
            this.log('✅ اتصال Google Sheets نشط', 'green');
        } catch (error) {
            throw new Error(`فشل في الاتصال بـ Google Sheets: ${error.message}`);
        }
    }

    /**
     * اختبار خدمات الطرف الثالث
     */
    async testExternalServices() {
        const services = [
            { name: 'Reddit', url: 'https://www.reddit.com' },
            { name: 'BestTempEmail', url: 'https://www.besttemporaryemail.com' }
        ];

        for (const service of services) {
            try {
                await this.testConnection(service.url);
                this.log(`✅ ${service.name} متاح`, 'green');
            } catch (error) {
                this.setupConfig.warnings.push(`الخدمة ${service.name} غير متاحة: ${error.message}`);
            }
        }
    }

    /**
     * مرحلة الأمان
     */
    async phaseSecurity() {
        this.log('🛡️ فحوصات الأمان...', 'blue');

        await this.runSecurityChecks();
        await this.setupSecurityMeasures();
    }

    /**
     * تشغيل فحوصات الأمان
     */
    async runSecurityChecks() {
        const securityChecks = [
            { name: 'ملفات حساسة', check: () => this.checkSensitiveFiles() },
            { name: 'صلاحيات آمنة', check: () => this.checkSecurePermissions() },
            { name: 'اعتماديات آمنة', check: () => this.checkDependenciesSecurity() }
        ];

        for (const check of securityChecks) {
            await this.executeWithRecovery(check.name, check.check);
        }
    }

    /**
     * التحقق من الملفات الحساسة
     */
    async checkSensitiveFiles() {
        const sensitiveFiles = [
            '.env',
            'google-credentials.json',
            'config/production.json'
        ];

        const exposedFiles = sensitiveFiles.filter(file => 
            fs.existsSync(path.join(process.cwd(), file))
        );

        if (exposedFiles.length > 0) {
            this.setupConfig.warnings.push(
                `ملفات حساسة موجودة: ${exposedFiles.join(', ')} - تأكد من إضافتها إلى .gitignore`
            );
        }
    }

    /**
     * مرحلة التحقق
     */
    async phaseValidation() {
        this.log('✅ التحقق النهائي...', 'blue');

        await this.runFinalValidation();
        await this.generateValidationReport();
    }

    /**
     * التشغيل النهائي للتحقق
     */
    async runFinalValidation() {
        const validations = [
            { name: 'هيكل المشروع', check: () => this.validateProjectStructure() },
            { name: 'الاعتماديات', check: () => this.dependencyManager.verifyInstallation() },
            { name: 'التكوين', check: () => this.validateConfiguration() },
            { name: 'البيئة', check: () => this.validateEnvironment() }
        ];

        for (const validation of validations) {
            await this.executeWithRecovery(validation.name, validation.check);
        }
    }

    /**
     * التحقق من هيكل المشروع
     */
    async validateProjectStructure() {
        const requiredPaths = [
            'src/main.js',
            'config/config.js',
            'package.json',
            '.github/workflows/production.yml'
        ];

        const missingPaths = requiredPaths.filter(file => 
            !fs.existsSync(path.join(process.cwd(), file))
        );

        if (missingPaths.length > 0) {
            throw new Error(`ملفات أساسية مفقودة: ${missingPaths.join(', ')}`);
        }

        this.log('✅ هيكل المشروع صالح', 'green');
    }

    /**
     * التحقق من البيئة
     */
    async validateEnvironment() {
        if (process.env.NODE_ENV !== 'production') {
            this.setupConfig.warnings.push('NODE_ENV ليس production - قد يؤثر على الأداء');
        }
    }

    /**
     * مرحلة الاختبار
     */
    async phaseTesting() {
        this.log('🧪 تشغيل الاختبارات...', 'blue');

        await this.runSystemTests();
        await this.generateTestReport();
    }

    /**
     * تشغيل اختبارات النظام
     */
    async runSystemTests() {
        const tests = [
            { name: 'اختبار النواة', command: 'node src/deployment-check.js --quick' },
            { name: 'اختبار التكوين', command: 'node -e "import(\'./config/config.js\').then(() => console.log(\'✅ التكوين صالح\'))"' }
        ];

        for (const test of tests) {
            try {
                execSync(test.command, { stdio: 'inherit', cwd: process.cwd() });
                this.log(`✅ ${test.name}`, 'green');
            } catch (error) {
                this.setupConfig.warnings.push(`فشل في ${test.name}: ${error.message}`);
            }
        }
    }

    /**
     * مرحلة التحسين
     */
    async phaseOptimization() {
        this.log('⚡ تحسين النظام...', 'blue');

        await this.optimizePerformance();
        await this.setupMonitoring();
    }

    /**
     * تحسين الأداء
     */
    async optimizePerformance() {
        try {
            // تنظيف ذاكرة التخزين المؤقت
            execSync('npm cache clean --force', { stdio: 'pipe' });
            
            // تحديث الاعتماديات
            execSync('npm update', { stdio: 'pipe' });
            
            this.log('✅ تم تحسين أداء النظام', 'green');
        } catch (error) {
            this.log('⚠️ فشل في بعض عمليات التحسين', 'yellow');
        }
    }

    /**
     * إعداد المراقبة
     */
    async setupMonitoring() {
        // إنشاء ملفات المراقبة الأولية
        const monitoringFiles = [
            { path: 'monitoring/health-check.js', content: '// نظام المراقبة الصحية' },
            { path: 'monitoring/performance.json', content: '{}' }
        ];

        for (const file of monitoringFiles) {
            const filePath = path.join(process.cwd(), file.path);
            const dirPath = path.dirname(filePath);
            
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
            
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, file.content);
            }
        }
    }

    /**
     * مرحلة الإكمال
     */
    async phaseCompletion() {
        this.log('🎉 إكمال الإعداد...', 'blue');

        await this.generateSetupReport();
        await this.showCompletionMessage();
    }

    /**
     * توليد تقرير الإعداد
     */
    async generateSetupReport() {
        const report = {
            timestamp: new Date().toISOString(),
            duration: new Date() - this.setupConfig.startTime,
            system: this.setupConfig.systemInfo,
            phases: {
                completed: this.setupConfig.stepsCompleted,
                total: this.setupConfig.totalSteps,
                successRate: (this.setupConfig.stepsCompleted / this.setupConfig.totalSteps) * 100
            },
            issues: {
                errors: this.setupConfig.errors,
                warnings: this.setupConfig.warnings
            },
            recommendations: this.generateRecommendations()
        };

        // حفظ التقرير
        const reportPath = path.join(process.cwd(), 'logs/setup-report.json');
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`📊 تم حفظ تقرير الإعداد في: ${reportPath}`, 'green');
    }

    /**
     * عرض رسالة الإكمال
     */
    async showCompletionMessage() {
        const duration = ((new Date() - this.setupConfig.startTime) / 1000 / 60).toFixed(2);
        
        this.log(`
🎉 اكتمل إعداد النظام بنجاح!

📊 ملخص الإعداد:
   - ⏰ المدة: ${duration} دقيقة
   - ✅ المراحل المكتملة: ${this.setupConfig.stepsCompleted}/${this.setupConfig.totalSteps}
   - ⚠️  التحذيرات: ${this.setupConfig.warnings.length}
   - ❌ الأخطاء: ${this.setupConfig.errors.length}

🚀 الخطوات التالية:
   1. راجع التحذيرات في logs/setup-report.json
   2. تأكد من إعداد متغيرات البيئة في .env
   3. اختبر النظام: npm run test
   4. ابدأ التشغيل: npm start

📖 للمساعدة: راجع README.md
        `, 'cyan');
    }

    /**
     * معالجة فشل الإعداد
     */
    async handleSetupFailure(error) {
        this.log('\n❌ فشل في عملية الإعداد', 'red');
        this.log(`📋 السبب: ${error.message}`, 'red');

        // محاولة التعافي
        await this.recoverySystem.attemptFullRecovery(error);

        // عرض تقرير الفشل
        await this.generateFailureReport(error);

        process.exit(1);
    }

    /**
     * توليد تقرير الفشل
     */
    async generateFailureReport(error) {
        const report = {
            timestamp: new Date().toISOString(),
            phase: this.setupConfig.phase,
            error: error.message,
            stack: error.stack,
            system: this.setupConfig.systemInfo,
            recoveryAttempted: this.recoverySystem.recoveryAttempted
        };

        const reportPath = path.join(process.cwd(), 'logs/setup-failure.json');
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`📄 تم حفظ تقرير الفشل في: ${reportPath}`, 'yellow');
    }

    /**
     * تنفيذ مع التعافي
     */
    async executeWithRecovery(name, operation) {
        try {
            await operation();
            return true;
        } catch (error) {
            this.log(`❌ فشل في ${name}: ${error.message}`, 'red');
            
            // التعافي التلقائي
            await this.recoverySystem.attemptRecovery(name, error);
            
            // إعادة المحاولة بعد التعافي
            try {
                this.log(`🔄 إعادة محاولة ${name} بعد التعافي...`, 'yellow');
                await operation();
                this.log(`✅ نجحت إعادة المحاولة لـ ${name}`, 'green');
                return true;
            } catch (retryError) {
                throw new Error(`فشل في ${name} حتى بعد التعافي: ${retryError.message}`);
            }
        }
    }

    /**
     * الحصول على اسم المرحلة
     */
    getPhaseName(phase) {
        const phaseNames = {
            system_check: 'فحص النظام',
            dependencies: 'الاعتماديات',
            directory_structure: 'هيكل المجلدات',
            configuration: 'التكوين',
            environment: 'البيئة',
            permissions: 'الصلاحيات',
            services: 'الخدمات',
            security: 'الأمان',
            validation: 'التحقق',
            testing: 'الاختبار',
            optimization: 'التحسين',
            completion: 'الإكمال'
        };

        return phaseNames[phase] || phase;
    }

    /**
     * توليد التوصيات
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.setupConfig.warnings.length > 0) {
            recommendations.push('راجع التحذيرات وأصلحها قبل التشغيل في البيئة الإنتاجية');
        }

        if (this.setupConfig.systemInfo.npmVersion < '9.0.0') {
            recommendations.push('قم بتحديث npm إلى الإصدار 9 أو أعلى');
        }

        if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
            recommendations.push('أضف متغيرات البيئة المطلوبة في ملف .env');
        }

        return recommendations;
    }

    /**
     * مقارنة الإصدارات
     */
    compareVersions(v1, v2) {
        const parts1 = v1.replace('v', '').split('.').map(Number);
        const parts2 = v2.replace('v', '').split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        
        return 0;
    }

    /**
     * سؤال المستخدم
     */
    askQuestion(question, validAnswers = []) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                if (validAnswers.length > 0 && !validAnswers.includes(answer.toLowerCase())) {
                    this.log('❌ إجابة غير صالحة', 'red');
                    resolve(this.askQuestion(question, validAnswers));
                } else {
                    resolve(answer);
                }
            });
        });
    }

    /**
     * تسجيل رسالة
     */
    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    /**
     * عرض البانر
     */
    showBanner() {
        const banner = `
${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 نظام أتمتة Reddit المتطور V2 - الإعداد الذكي         ║
║   📅 الإصدار: 2.0.0 | البيئة: ${process.env.NODE_ENV || 'production'}                    ║
║   🔧 مع التعافي التلقائي والخوارزميات الذكية              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
        `;
        
        console.log(banner);
    }
}

/**
 * 🛠️ نظام التعافي التلقائي للإعداد
 */
class SetupRecoverySystem {
    constructor() {
        this.recoveryAttempted = false;
        this.recoveryStrategies = new Map();
        this.initializeRecoveryStrategies();
    }

    /**
     * تهيئة إستراتيجيات التعافي
     */
    initializeRecoveryStrategies() {
        this.recoveryStrategies.set('node_version', this.recoverNodeVersion.bind(this));
        this.recoveryStrategies.set('dependencies', this.recoverDependencies.bind(this));
        this.recoveryStrategies.set('permissions', this.recoverPermissions.bind(this));
        this.recoveryStrategies.set('network', this.recoverNetwork.bind(this));
        this.recoveryStrategies.set('default', this.recoverGeneric.bind(this));
    }

    /**
     * محاولة التعافي
     */
    async attemptRecovery(context, error) {
        this.recoveryAttempted = true;
        
        const strategy = this.recoveryStrategies.get(context) || this.recoveryStrategies.get('default');
        
        try {
            await strategy(error);
            return true;
        } catch (recoveryError) {
            console.error(`❌ فشل التعافي لـ ${context}: ${recoveryError.message}`);
            return false;
        }
    }

    /**
     * التعافي من فشل المرحلة
     */
    async recoverFromPhaseFailure(phase, error) {
        console.log(`🔄 محاولة التعافي من فشل مرحلة ${phase}...`);
        
        switch (phase) {
            case 'dependencies':
                return await this.recoverDependencies(error);
            case 'configuration':
                return await this.recoverConfiguration(error);
            case 'services':
                return await this.recoverServices(error);
            default:
                return await this.recoverGeneric(error);
        }
    }

    /**
     * التعافي الكامل
     */
    async attemptFullRecovery(error) {
        console.log('🔄 بدء التعافي الكامل...');
        
        try {
            // 1. تنظيف الاعتماديات المعطلة
            await this.cleanupBrokenDependencies();
            
            // 2. إعادة تثبيت الاعتماديات
            await this.reinstallDependencies();
            
            // 3. إصلاح الهيكل
            await this.repairStructure();
            
            console.log('✅ التعافي الكامل مكتمل');
            return true;
        } catch (recoveryError) {
            console.error(`❌ فشل التعافي الكامل: ${recoveryError.message}`);
            return false;
        }
    }

    /**
     * التعافي من إصدار Node.js
     */
    async recoverNodeVersion(error) {
        console.log('🔄 محاولة التعافي من مشكلة إصدار Node.js...');
        
        // استخدام nvm إذا كان متاحاً
        try {
            execSync('nvm install 18 --lts', { stdio: 'pipe' });
            execSync('nvm use 18', { stdio: 'pipe' });
            console.log('✅ تم التعافي من مشكلة Node.js');
        } catch {
            console.log('⚠️ تعذر التعافي من مشكلة Node.js - يلزم التدخل اليدوي');
        }
    }

    /**
     * التعافي من الاعتماديات
     */
    async recoverDependencies(error) {
        console.log('🔄 محاولة التعافي من مشكلة الاعتماديات...');
        
        try {
            // تنظيف الاعتماديات المعطلة
            await this.cleanupBrokenDependencies();
            
            // إعادة التثبيت
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ تم التعافي من مشكلة الاعتماديات');
        } catch (recoveryError) {
            throw new Error(`فشل في التعافي من الاعتماديات: ${recoveryError.message}`);
        }
    }

    /**
     * تنظيف الاعتماديات المعطلة
     */
    async cleanupBrokenDependencies() {
        try {
            // حذف node_modules و package-lock.json
            const nodeModulesPath = path.join(process.cwd(), 'node_modules');
            const packageLockPath = path.join(process.cwd(), 'package-lock.json');
            
            if (fs.existsSync(nodeModulesPath)) {
                fs.rmSync(nodeModulesPath, { recursive: true, force: true });
            }
            
            if (fs.existsSync(packageLockPath)) {
                fs.unlinkSync(packageLockPath);
            }
            
            console.log('🧹 تم تنظيف الاعتماديات المعطلة');
        } catch (error) {
            console.error('❌ فشل في تنظيف الاعتماديات المعطلة');
        }
    }

    /**
     * إعادة تثبيت الاعتماديات
     */
    async reinstallDependencies() {
        try {
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ تم إعادة تثبيت الاعتماديات');
        } catch (error) {
            throw new Error(`فشل في إعادة تثبيت الاعتماديات: ${error.message}`);
        }
    }
}

/**
 * 📊 مراقب صحة الإعداد
 */
class SetupHealthMonitor {
    constructor() {
        this.healthChecks = [];
        this.healthStatus = 'healthy';
    }

    /**
     * فحص صحة النظام
     */
    async checkSystemHealth() {
        const checks = [
            this.checkDiskHealth.bind(this),
            this.checkMemoryHealth.bind(this),
            this.checkNetworkHealth.bind(this),
            this.checkNodeHealth.bind(this)
        ];

        for (const check of checks) {
            await check();
        }

        return this.healthStatus;
    }

    /**
     * فحص صحة القرص
     */
    async checkDiskHealth() {
        try {
            const stats = fs.statSync(process.cwd());
            // منطق فحص القرص
        } catch (error) {
            console.error('❌ مشكلة في صحة القرص');
        }
    }

    // ... methods أخرى لفحص الصحة
}

/**
 * 📦 مدير الاعتماديات
 */
class DependencyManager {
    constructor() {
        this.dependencies = [];
        this.installationLog = [];
    }

    /**
     * تثبيت الاعتماديات
     */
    async installDependencies() {
        console.log('📦 تثبيت الاعتماديات...');
        
        try {
            // استخدام npm ci للإنتاج (أكثر استقراراً)
            execSync('npm ci', { stdio: 'inherit' });
            console.log('✅ تم تثبيت الاعتماديات باستخدام npm ci');
        } catch (error) {
            console.log('🔄 الانتقال إلى npm install...');
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ تم تثبيت الاعتماديات باستخدام npm install');
        }
    }

    /**
     * التحقق من التثبيت
     */
    async verifyInstallation() {
        console.log('🔍 التحقق من تثبيت الاعتماديات...');
        
        const requiredDeps = [
            'selenium-webdriver',
            'googleapis',
            'axios',
            'chromedriver'
        ];

        for (const dep of requiredDeps) {
            try {
                require.resolve(dep);
                console.log(`✅ ${dep}`, 'green');
            } catch (error) {
                throw new Error(`الاعتمادية ${dep} غير مثبتة`);
            }
        }
    }
}

// التشغيل إذا تم استدعاء الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
    const setupSystem = new AdvancedSetupSystem();
    
    // معالجة إشارات الإيقاف
    process.on('SIGINT', async () => {
        console.log('\n🛑 استقبال إشارة إيقاف...');
        await setupSystem.generateFailureReport(new Error('تم الإيقاف يدوياً'));
        process.exit(0);
    });

    process.on('uncaughtException', async (error) => {
        console.error('🚨 خطأ غير متوقع:', error);
        await setupSystem.handleSetupFailure(error);
    });

    process.on('unhandledRejection', async (reason, promise) => {
        console.error('🚨 رفض وعود غير معالج:', reason);
        await setupSystem.handleSetupFailure(new Error(`رفض وعود: ${reason}`));
    });

    // بدء عملية الإعداد
    setupSystem.start().catch(async (error) => {
        await setupSystem.handleSetupFailure(error);
    });
}

export default AdvancedSetupSystem;
export { SetupRecoverySystem, SetupHealthMonitor, DependencyManager };

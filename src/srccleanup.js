#!/usr/bin/env node

/**
 * 🧹 تنظيف النظام التلقائي V2
 * @file scripts/cleanup.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SystemCleanup {
    constructor() {
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m'
        };
    }

    log(message, color = 'reset') {
        console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    }

    async run() {
        this.log('🧹 بدء تنظيف النظام V2...', 'blue');
        
        try {
            // 1. إيقاف العمليات العالقة
            await this.killDanglingProcesses();
            
            // 2. تنظيف الملفات المؤقتة
            await this.cleanTempFiles();
            
            // 3. تنظيف السجلات القديمة
            await this.cleanOldLogs();
            
            // 4. تنظيف ذاكرة التخزين المؤقت
            await this.clearCaches();
            
            this.log('✅ اكتمل تنظيف النظام بنجاح!', 'green');
            
        } catch (error) {
            this.log(`❌ فشل في التنظيف: ${error.message}`, 'red');
        }
    }

    async killDanglingProcesses() {
        this.log('🛑 إيقاف العمليات العالقة...', 'blue');
        
        const processes = ['chrome', 'chromedriver', 'node', 'Xvfb'];
        
        processes.forEach(proc => {
            try {
                execSync(`pkill -f ${proc}`, { stdio: 'ignore' });
                this.log(`✅ تم إيقاف عمليات ${proc}`, 'green');
            } catch (error) {
                this.log(`⚠️ لا توجد عمليات ${proc} نشطة`, 'yellow');
            }
        });
    }

    async cleanTempFiles() {
        this.log('📁 تنظيف الملفات المؤقتة...', 'blue');
        
        const tempDirs = [
            'tmp',
            'temp',
            'screenshots',
            '.cache'
        ];

        let cleanedCount = 0;
        
        tempDirs.forEach(dir => {
            const fullPath = path.join(process.cwd(), dir);
            if (fs.existsSync(fullPath)) {
                try {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                    fs.mkdirSync(fullPath, { recursive: true });
                    cleanedCount++;
                    this.log(`✅ تم تنظيف: ${dir}`, 'green');
                } catch (error) {
                    this.log(`⚠️ فشل في تنظيف ${dir}: ${error.message}`, 'yellow');
                }
            }
        });

        this.log(`📊 تم تنظيف ${cleanedCount} مجلد مؤقت`, 'blue');
    }

    async cleanOldLogs() {
        this.log('📝 تنظيف السجلات القديمة...', 'blue');
        
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) return;

        const files = fs.readdirSync(logDir);
        const now = Date.now();
        const weekAgo = now - (7 * 24 * 60 * 60 * 1000); // أسبوع
        
        let deletedCount = 0;
        
        files.forEach(file => {
            const filePath = path.join(logDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtimeMs < weekAgo && file !== '.gitkeep') {
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    this.log(`🗑️ تم حذف: ${file}`, 'green');
                } catch (error) {
                    this.log(`⚠️ فشل في حذف ${file}: ${error.message}`, 'yellow');
                }
            }
        });

        this.log(`📊 تم حذف ${deletedCount} ملف سجل قديم`, 'blue');
    }

    async clearCaches() {
        this.log('🗃️ تنظيف ذاكرة التخزين المؤقت...', 'blue');
        
        try {
            // تنظيف npm cache
            execSync('npm cache clean --force', { stdio: 'inherit' });
            this.log('✅ تم تنظيف npm cache', 'green');
            
            // تنظيف ذاكرة التخزين المؤقت للنظام
            const cacheDirs = [
                path.join(process.cwd(), 'node_modules/.cache'),
                '/tmp/chromium',
                '/tmp/.com.google.Chrome'
            ];
            
            cacheDirs.forEach(dir => {
                if (fs.existsSync(dir)) {
                    try {
                        fs.rmSync(dir, { recursive: true, force: true });
                        this.log(`✅ تم تنظيف: ${dir}`, 'green');
                    } catch (error) {
                        this.log(`⚠️ فشل في تنظيف ${dir}`, 'yellow');
                    }
                }
            });
            
        } catch (error) {
            this.log(`⚠️ فشل في تنظيف الذاكرة المؤقتة: ${error.message}`, 'yellow');
        }
    }
}

// التشغيل إذا تم استدعاء الملف مباشرة
if (import.meta.url === `file://${process.argv[1]}`) {
    const cleanup = new SystemCleanup();
    cleanup.run();
}

export default SystemCleanup;
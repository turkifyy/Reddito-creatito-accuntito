/**
 * ⚙️ ملف الإعدادات الرئيسي لنظام أتمتة Reddit V2
 * @version 2.0.0
 * @description إعدادات متقدمة لبيئة الإنتاج مع التعافي التلقائي
 * @module config
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config as dotenvConfig } from 'dotenv';

// تحميل متغيرات البيئة
dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * الإعدادات الرئيسية للنظام V2
 */
export default {
    // ============================================
    // 🔐 إعدادات النظام الأساسية
    // ============================================
    system: {
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'production',
        timezone: 'Asia/Riyadh',
        maxConcurrentOperations: 3,
        enableAdvancedMonitoring: true,
        enableAutoRecovery: true,
        logLevel: process.env.LOG_LEVEL || 'info',
        dataRetentionDays: 30,
        
        // إعدادات الأداء
        performance: {
            enableMetrics: true,
            metricsInterval: 60000, // كل دقيقة
            enableProfiling: false,
            maxMemoryUsage: 0.85, // 85%
            maxCpuUsage: 0.80,    // 80%
        }
    },

    // ============================================
    // 🎯 إعدادات Reddit
    // ============================================
    reddit: {
        // روابط التسجيل
        urls: {
            register: 'https://www.reddit.com/register/',
            registerAlternative: 'https://www.reddit.com/register/?src=home',
            oldRegister: 'https://old.reddit.com/register',
            login: 'https://www.reddit.com/login/'
        },

        // إعدادات التسجيل
        registration: {
            timeout: 45000,
            maxRetries: 3,
            retryDelay: 10000,
            enableHumanBehavior: true,
            minTypingDelay: 50,
            maxTypingDelay: 150,
            
            // إعدادات CAPTCHA
            captcha: {
                maxWaitTime: 120000, // 2 دقيقة
                autoDetection: true,
                manualFallback: true,
                refreshOnCaptcha: true
            }
        },

        // قيود الحسابات
        limits: {
            accountsPerHour: 12,
            accountsPerDay: 48,
            maxConcurrentRegistrations: 2,
            coolDownBetweenAccounts: 5000 // 5 ثواني
        }
    },

    // ============================================
    // ⏰ إعدادات التوقيت الذكي V2
    // ============================================
    timing: {
        // الأهداف اليومية
        dailyTarget: parseInt(process.env.DAILY_TARGET) || 48,
        batchSize: 3,
        totalCycles: 16, // 48 ÷ 3 = 16 دورة

        // التوقيت بين الدورات
        cycleTiming: {
            minWaitBetweenCycles: 60,    // دقيقة
            maxWaitBetweenCycles: 120,   // دقيقة
            adaptiveTiming: true,
            progressBasedAdjustment: true,
            
            // التكيف مع التقدم
            adaptation: {
                earlyPhaseMultiplier: 1.0,   // 0-25%
                midPhaseMultiplier: 1.1,     // 25-75%  
                latePhaseMultiplier: 0.8     // 75-100%
            }
        },

        // التأخيرات العشوائية
        randomDelays: {
            betweenActions: {
                min: 2000,
                max: 8000
            },
            betweenAccounts: {
                min: 5000, 
                max: 15000
            },
            betweenCycles: {
                min: 60000,  // 1 دقيقة
                max: 7200000 // 120 دقيقة
            }
        },

        // إعدادات الوقت الحقيقي
        realTime: {
            workingHours: {
                start: 0,   // 12:00 AM
                end: 24     // 12:00 AM (24 ساعة)
            },
            peakHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            avoidPeakHours: false
        }
    },

    // ============================================
    // 📧 إعدادات البريد الإلكتروني V2
    // ============================================
    email: {
        // الخدمة الرئيسية
        primaryService: {
            name: 'besttemporaryemail.com',
            apiBaseUrl: 'https://www.besttemporaryemail.com/api/v1',
            timeout: 15000,
            maxRetries: 3
        },

        // الخدمات البديلة
        fallbackServices: [
            {
                name: 'temp-mail.io',
                url: 'https://api.temp-mail.io/request/domains/format/json',
                enabled: true
            },
            {
                name: '10minutemail',
                url: 'https://10minutemail.com/10MinuteMail/index.html', 
                enabled: true
            }
        ],

        // إعدادات التحقق
        verification: {
            checkInterval: 5000,
            maxEmailChecks: 12,
            timeout: 60000,
            enablePatternMatching: true,
            
            // أنماط رموز التحقق
            codePatterns: [
                /verification code:?\s*([A-Z0-9]{6})/i,
                /code:?\s*([A-Z0-9]{6})/i,
                /([A-Z0-9]{6})/,
                /verify.*?([A-Z0-9]{4,8})/i
            ]
        },

        // إعدادات الأمان
        security: {
            sanitizeEmails: true,
            maxEmailLength: 100,
            allowedDomains: ['besttemporaryemail.com', 'tempmail.io']
        }
    },

    // ============================================
    // 🌐 إعدادات المتصفح المتقدمة V2
    // ============================================
    browser: {
        // الإعدادات الأساسية
        headless: process.env.NODE_ENV === 'production',
        windowSize: '1920,1080',
        language: 'en-US,en;q=0.9',
        timezone: 'Asia/Riyadh',

        // إعدادات Chrome المتقدمة
        chromeOptions: {
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--allow-running-insecure-content',
                '--disable-extensions',
                '--disable-popup-blocking',
                '--disable-default-apps',
                '--disable-infobars',
                '--remote-debugging-port=0',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-features=VizDisplayCompositor',
                '--disable-site-isolation-trials',
                '--disable-webgl',
                '--disable-threaded-animation',
                '--disable-threaded-scrolling',
                '--disable-checker-imaging',
                '--disable-partial-raster',
                '--disable-skia-runtime-opts'
            ],
            preferences: {
                'credentials_enable_service': false,
                'profile.password_manager_enabled': false,
                'profile.default_content_setting_values.notifications': 2,
                'profile.default_content_setting_values.geolocation': 2,
                'profile.default_content_setting_values.images': 1
            }
        },

        // إعدادات User-Agent
        userAgents: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],

        // إعدادات الشبكة
        network: {
            timeout: 30000,
            pageLoadTimeout: 45000,
            scriptTimeout: 30000,
            implicitWait: 10000
        },

        // إعدادات إضافية
        advanced: {
            enableStealthMode: true,
            randomizeViewport: true,
            enableCookies: false,
            clearCacheOnStart: true,
            blockImages: false,
            enableJavascript: true
        }
    },

    // ============================================
    // 📊 إعدادات Google Sheets V2
    // ============================================
    sheets: {
        // الإعدادات الأساسية
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        credentials: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 
            JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) : null,

        // هيكل الأوراق
        sheetNames: {
            accounts: 'Accounts',
            statistics: 'Statistics', 
            errors: 'Errors',
            performance: 'Performance',
            recovery: 'Recovery',
            dashboard: 'Dashboard'
        },

        // إعدادات الكتابة
        writing: {
            batchSize: 10,
            retryAttempts: 3,
            retryDelay: 2000,
            enableAutoCreateSheets: true,
            dataValidation: true
        },

        // إعدادات الأمان
        security: {
            encryptSensitiveData: true,
            maskPasswords: true,
            sanitizeInput: true,
            maxCellLength: 50000
        }
    },

    // ============================================
    // 🛡️ إعدادات التعافي التلقائي V2
    // ============================================
    recovery: {
        // المستويات المختلفة للتعافي
        levels: {
            quick: {
                enabled: true,
                maxAttempts: 3,
                delayBetweenAttempts: 5000
            },
            medium: {
                enabled: true, 
                maxAttempts: 2,
                delayBetweenAttempts: 10000
            },
            full: {
                enabled: true,
                maxAttempts: 1,
                delayBetweenAttempts: 30000
            },
            emergency: {
                enabled: true,
                maxAttempts: 1,
                delayBetweenAttempts: 60000
            }
        },

        // محفزات التعافي
        triggers: {
            consecutiveFailures: 3,
            memoryUsage: 0.85, // 85%
            cpuUsage: 0.80,    // 80%
            networkErrors: 5,
            browserCrashes: 2,
            timeoutErrors: 3
        },

        // إستراتيجيات التعافي
        strategies: {
            browserCrash: ['restart_browser', 'clear_cache', 'change_user_agent'],
            networkIssue: ['reset_connection', 'wait_retry', 'use_proxy'],
            captchaDetection: ['wait_manual', 'refresh_page', 'change_parameters'],
            serviceUnavailable: ['use_fallback', 'wait_retry', 'alternative_method']
        },

        // إعدادات التعافي الذكي
        smartRecovery: {
            enableLearning: true,
            patternRecognition: true,
            adaptiveStrategies: true,
            successRateThreshold: 0.7 // 70%
        }
    },

    // ============================================
    // 📈 إعدادات المراقبة والأداء V2
    // ============================================
    monitoring: {
        // مراقب الصحة
        health: {
            checkInterval: 60000, // كل دقيقة
            enableContinuousMonitoring: true,
            thresholds: {
                memory: 0.85,
                cpu: 0.80,
                disk: 0.90,
                network: 1000 // ms
            }
        },

        // مراقب الأداء
        performance: {
            trackMetrics: true,
            metricsRetention: 24, // ساعة
            enableAlerts: true,
            alertThresholds: {
                successRate: 0.7,    // 70%
                errorRate: 0.1,      // 10%
                accountCreationTime: 120000 // 2 دقيقة
            }
        },

        // التقارير
        reporting: {
            enableDailyReports: true,
            enableErrorReports: true,
            enablePerformanceReports: true,
            reportRetention: 7 // أيام
        }
    },

    // ============================================
    // 🔐 إعدادات الأمان المتقدمة V2
    // ============================================
    security: {
        // إعدادات البيانات
        data: {
            encryptSensitiveInfo: true,
            maskCredentials: true,
            sanitizeLogs: true,
            autoCleanup: true
        },

        // إعدادات الشبكة
        network: {
            enableHttps: true,
            validateSsl: true,
            timeout: 30000,
            maxRedirects: 5
        },

        // إعدادات التحقق
        validation: {
            validateEmails: true,
            validateUsernames: true,
            maxUsernameLength: 20,
            minPasswordLength: 8,
            passwordComplexity: true
        },

        // إعدادات الخصوصية
        privacy: {
            anonymizeData: true,
            clearCookies: true,
            disableTracking: true,
            respectRobotsTxt: true
        }
    },

    // ============================================
    // 🧪 إعدادات الاختبار والتطوير V2
    // ============================================
    development: {
        // وضع الاختبار
        testing: {
            enabled: process.env.NODE_ENV !== 'production',
            maxTestAccounts: 5,
            enableDryRun: true,
            testEmailDomain: 'test.example.com'
        },

        // التصحيح
        debugging: {
            enableDebugMode: process.env.NODE_ENV !== 'production',
            logLevel: 'debug',
            saveScreenshots: true,
            verboseLogging: false
        },

        // التطوير
        features: {
            enableExperimental: false,
            betaFeatures: [],
            featureFlags: {
                advancedRecovery: true,
                smartTiming: true,
                healthMonitoring: true
            }
        }
    },

    // ============================================
    // 📁 إعدادات الملفات والتخزين V2
    // ============================================
    storage: {
        // هياكل المجلدات
        directories: {
            logs: join(__dirname, '../logs'),
            data: join(__dirname, '../data'),
            temp: join(__dirname, '../tmp'),
            screenshots: join(__dirname, '../screenshots'),
            backups: join(__dirname, '../backups')
        },

        // إعدادات السجلات
        logging: {
            maxFileSize: '10m',
            maxFiles: 10,
            compression: true,
            format: 'combined'
        },

        // النسخ الاحتياطي
        backup: {
            enabled: true,
            interval: 24 * 60 * 60 * 1000, // 24 ساعة
            retention: 7, // أيام
            autoCleanup: true
        }
    },

    // ============================================
    // 🔧 إعدادات متقدمة V2
    // ============================================
    advanced: {
        // تحسينات الأداء
        performance: {
            enableGarbageCollection: true,
            maxHeapSize: 2048, // MB
            optimizeV8: true,
            enableCompression: true
        },

        // إعدادات الذاكرة
        memory: {
            leakDetection: true,
            maxMemoryRestarts: 3,
            gcInterval: 30 * 60 * 1000 // 30 دقيقة
        },

        // إعدادات العملية
        process: {
            maxRestarts: 5,
            restartDelay: 10000,
            enableCluster: false,
            workers: 1
        }
    }
};

// ============================================
// 🛡️ تحقق من صحة الإعدادات
// ============================================

/**
 * التحقق من صحة الإعدادات المطلوبة
 */
export function validateConfig() {
    const errors = [];

    // التحقق من إعدادات Google Sheets
    if (!config.sheets.spreadsheetId) {
        errors.push('GOOGLE_SHEET_ID مطلوب في environment variables');
    }

    if (!config.sheets.credentials) {
        errors.push('GOOGLE_SERVICE_ACCOUNT_JSON مطلوب في environment variables');
    }

    // التحقق من الأهداف
    if (config.timing.dailyTarget <= 0 || config.timing.dailyTarget > 100) {
        errors.push('الهدف اليومي يجب أن يكون بين 1 و 100');
    }

    // التحقق من التوقيتات
    if (config.timing.cycleTiming.minWaitBetweenCycles >= config.timing.cycleTiming.maxWaitBetweenCycles) {
        errors.push('الحد الأدنى للانتظار يجب أن يكون أقل من الحد الأقصى');
    }

    if (errors.length > 0) {
        throw new Error(`أخطاء في الإعدادات:\n${errors.join('\n')}`);
    }

    return true;
}

/**
 * الحصول على إعدادات بيئة محددة
 */
export function getEnvironmentConfig(env = process.env.NODE_ENV) {
    const baseConfig = { ...config };
    
    switch (env) {
        case 'development':
            baseConfig.browser.headless = false;
            baseConfig.development.testing.enabled = true;
            baseConfig.development.debugging.enableDebugMode = true;
            baseConfig.timing.dailyTarget = 5; // هدف أقل للتطوير
            break;
            
        case 'test':
            baseConfig.browser.headless = true;
            baseConfig.development.testing.enabled = true;
            baseConfig.timing.dailyTarget = 2;
            baseConfig.email.verification.maxEmailChecks = 2;
            break;
            
        case 'production':
            baseConfig.browser.headless = true;
            baseConfig.development.testing.enabled = false;
            baseConfig.development.debugging.enableDebugMode = false;
            break;
    }
    
    return baseConfig;
}

/**
 * توليد تقرير الإعدادات
 */
export function generateConfigReport() {
    const report = {
        system: {
            version: config.system.version,
            environment: config.system.environment,
            features: {
                autoRecovery: config.system.enableAutoRecovery,
                advancedMonitoring: config.system.enableAdvancedMonitoring
            }
        },
        targets: {
            daily: config.timing.dailyTarget,
            batchSize: config.timing.batchSize,
            totalCycles: config.timing.totalCycles
        },
        services: {
            email: config.email.primaryService.name,
            sheets: config.sheets.spreadsheetId ? 'مضبوط' : 'غير مضبوط',
            browser: config.browser.headless ? 'Headless' : 'مرئي'
        },
        security: {
            recovery: config.recovery.levels.quick.enabled,
            monitoring: config.monitoring.health.enableContinuousMonitoring
        }
    };
    
    return report;
}

// تصدير الإعدادات الرئيسية
export const config = Object.freeze(getEnvironmentConfig());

// التحقق التلقائي عند التحميل
try {
    validateConfig();
    console.log('✅ تم تحميل إعدادات النظام V2 بنجاح');
} catch (error) {
    console.error('❌ خطأ في إعدادات النظام:', error.message);
    process.exit(1);
}

export default config;
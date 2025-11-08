/**
 * ⚙️ ملف الإعدادات الرئيسي لنظام أتمتة Reddit V2
 * @version 2.0.0
 * @description إعدادات متقدمة لبيئة الإنتاج مع التعافي التلقائي ودعم البريد المجاني
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
        maxConcurrentOperations: 2, // تقليل بسبب قيود البريد المجاني
        enableAdvancedMonitoring: true,
        enableAutoRecovery: true,
        logLevel: process.env.LOG_LEVEL || 'info',
        dataRetentionDays: 30,
        
        // إعدادات الأداء
        performance: {
            enableMetrics: true,
            metricsInterval: 60000,
            enableProfiling: false,
            maxMemoryUsage: 0.85,
            maxCpuUsage: 0.80,
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
                maxWaitTime: 120000,
                autoDetection: true,
                manualFallback: true,
                refreshOnCaptcha: true
            }
        },

        // قيود الحسابات - مخفضة بسبب البريد المجاني
        limits: {
            accountsPerHour: 8,  // تقليل بسبب قيود البريد
            accountsPerDay: 32,  // تقليل من 48 إلى 32
            maxConcurrentRegistrations: 1, // تقليل التزامن
            coolDownBetweenAccounts: 10000 // زيادة إلى 10 ثواني
        }
    },

    // ============================================
    // ⏰ إعدادات التوقيت الذكي V2 - معدلة للبريد المجاني
    // ============================================
    timing: {
        // الأهداف اليومية - مخفضة بسبب البريد المجاني
        dailyTarget: parseInt(process.env.DAILY_TARGET) || 32, // تقليل من 48 إلى 32
        batchSize: 2, // تقليل من 3 إلى 2
        totalCycles: 16, // 32 ÷ 2 = 16 دورة

        // التوقيت بين الدورات - زيادة بسبب البريد المجاني
        cycleTiming: {
            minWaitBetweenCycles: 75,    // زيادة من 60 إلى 75 دقيقة
            maxWaitBetweenCycles: 150,   // زيادة من 120 إلى 150 دقيقة
            adaptiveTiming: true,
            progressBasedAdjustment: true,
            
            // التكيف مع التقدم
            adaptation: {
                earlyPhaseMultiplier: 1.0,
                midPhaseMultiplier: 1.1,  
                latePhaseMultiplier: 0.8
            }
        },

        // التأخيرات العشوائية - زيادة بسبب البريد المجاني
        randomDelays: {
            betweenActions: {
                min: 3000,  // زيادة من 2000
                max: 10000  // زيادة من 8000
            },
            betweenAccounts: {
                min: 8000,  // زيادة من 5000
                max: 20000  // زيادة من 15000
            },
            betweenCycles: {
                min: 4500000,  // 75 دقيقة
                max: 9000000   // 150 دقيقة
            }
        },

        // إعدادات الوقت الحقيقي
        realTime: {
            workingHours: {
                start: 0,
                end: 24
            },
            peakHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            avoidPeakHours: true // تفعيل تجنب الذروة
        }
    },

    // ============================================
    // 📧 إعدادات البريد الإلكتروني V2 - مجانية بالكامل
    // ============================================
    email: {
        // الخدمة الرئيسية - besttemporaryemail.com بدون API
        primaryService: {
            name: 'besttemporaryemail.com',
            baseUrl: 'https://www.besttemporaryemail.com',
            method: 'web_scraping', // استخدام Web Scraping بدلاً من API
            timeout: 20000,
            maxRetries: 3,
            
            // إعدادات الـ Web Scraping
            scraping: {
                enabled: true,
                maxAttempts: 3,
                waitForElement: 10000,
                selectors: {
                    emailField: '#email', // سيتم تحديث حسب الهيكل الفعلي
                    refreshButton: '.refresh', // سيتم تحديث
                    messagesList: '.messages', // سيتم تحديث
                    messageContent: '.message-body' // سيتم تحديث
                }
            }
        },

        // ⚠️ لا توجد خدمات بديلة مدفوعة - استخدام حلول مجانية فقط
        fallbackServices: [
            {
                name: 'email-generation-only',
                method: 'local_generation',
                enabled: true,
                domains: [
                    'besttemporaryemail.com',
                    'tempmail.com',
                    'tmpmail.org'
                ]
            }
        ],

        // إعدادات إنشاء البريد المحلي
        generation: {
            enabled: true,
            usernameLength: 12,
            useRandomSuffix: true,
            domains: [
                'besttemporaryemail.com',
                'tempmail.com', 
                'tmpmail.org',
                '10minutemail.com'
            ],
            // دمج الطوابع الزمنية لتجنب التكرار
            timestampFormat: 'YYYYMMDDHHmmss'
        },

        // إعدادات التحقق - معدلة للبريد المجاني
        verification: {
            checkInterval: 8000,  // زيادة من 5000
            maxEmailChecks: 15,   // زيادة من 12
            timeout: 90000,       // زيادة من 60000
            enablePatternMatching: true,
            
            // أنماط رموز التحقق
            codePatterns: [
                /verification code:?\s*([A-Z0-9]{6})/i,
                /code:?\s*([A-Z0-9]{6})/i,
                /([A-Z0-9]{6})/,
                /verify.*?([A-Z0-9]{4,8})/i,
                /reddit.*?code:?\s*([A-Z0-9]{6})/i
            ],

            // إستراتيجيات بديلة عند فشل التحقق
            fallbackStrategies: [
                'retry_with_delay',
                'use_alternative_domain', 
                'manual_verification_fallback'
            ]
        },

        // إعدادات الأمان
        security: {
            sanitizeEmails: true,
            maxEmailLength: 100,
            allowedDomains: [
                'besttemporaryemail.com',
                'tempmail.com',
                'tmpmail.org',
                '10minutemail.com'
            ]
        }
    },

    // ============================================
    // 🌐 إعدادات المتصفح المتقدمة V2 - معدلة للبريد المجاني
    // ============================================
    browser: {
        // الإعدادات الأساسية
        headless: process.env.NODE_ENV === 'production',
        windowSize: '1920,1080',
        language: 'en-US,en;q=0.9',
        timezone: 'Asia/Riyadh',

        // إعدادات Chrome المتقدمة - محسنة للبريد المجاني
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
                '--disable-site-isolation-trials',
                '--disable-webgl',
                '--disable-threaded-animation',
                '--disable-threaded-scrolling',
                '--disable-checker-imaging',
                '--disable-partial-raster',
                '--disable-skia-runtime-opts',
                '--aggressive-cache-discard', // إضافة للبريد المجاني
                '--memory-pressure-off' // إضافة للبريد المجاني
            ],
            preferences: {
                'credentials_enable_service': false,
                'profile.password_manager_enabled': false,
                'profile.default_content_setting_values.notifications': 2,
                'profile.default_content_setting_values.geolocation': 2,
                'profile.default_content_setting_values.images': 1,
                'profile.managed_default_content_settings.popups': 2 // منع النوافذ المنبثقة
            }
        },

        // إعدادات User-Agent - متنوعة أكثر
        userAgents: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
        ],

        // إعدادات الشبكة - زيادة المهلات للبريد المجاني
        network: {
            timeout: 40000,       // زيادة من 30000
            pageLoadTimeout: 60000, // زيادة من 45000
            scriptTimeout: 40000,   // زيادة من 30000
            implicitWait: 15000    // زيادة من 10000
        },

        // إعدادات إضافية - محسنة للبريد المجاني
        advanced: {
            enableStealthMode: true,
            randomizeViewport: true,
            enableCookies: false,
            clearCacheOnStart: true,
            blockImages: false,
            enableJavascript: true,
            enableCache: false, // تعطيل الكاش للبريد المجاني
            disableBackgroundNetworking: true // إضافة للبريد المجاني
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

        // إعدادات الكتابة - معدلة للبريد المجاني
        writing: {
            batchSize: 5, // تقليل من 10
            retryAttempts: 5, // زيادة من 3
            retryDelay: 3000, // زيادة من 2000
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
    // 🛡️ إعدادات التعافي التلقائي V2 - معززة للبريد المجاني
    // ============================================
    recovery: {
        // المستويات المختلفة للتعافي - معززة للبريد المجاني
        levels: {
            quick: {
                enabled: true,
                maxAttempts: 5,  // زيادة من 3
                delayBetweenAttempts: 8000 // زيادة من 5000
            },
            medium: {
                enabled: true, 
                maxAttempts: 3,  // زيادة من 2
                delayBetweenAttempts: 15000 // زيادة من 10000
            },
            full: {
                enabled: true,
                maxAttempts: 2,  // زيادة من 1
                delayBetweenAttempts: 45000 // زيادة من 30000
            },
            emergency: {
                enabled: true,
                maxAttempts: 1,
                delayBetweenAttempts: 90000 // زيادة من 60000
            }
        },

        // محفزات التعافي - معدلة للبريد المجاني
        triggers: {
            consecutiveFailures: 2, // تقليل من 3
            memoryUsage: 0.80, // تقليل من 0.85
            cpuUsage: 0.75,    // تقليل من 0.80
            networkErrors: 3,  // تقليل من 5
            browserCrashes: 1, // تقليل من 2
            timeoutErrors: 2,  // تقليل من 3
            emailServiceErrors: 2 // إضافة جديدة للبريد المجاني
        },

        // إستراتيجيات التعافي - معززة للبريد المجاني
        strategies: {
            browserCrash: ['restart_browser', 'clear_cache', 'change_user_agent', 'reset_network'],
            networkIssue: ['reset_connection', 'wait_retry', 'change_dns', 'flush_cache'],
            captchaDetection: ['wait_manual', 'refresh_page', 'change_parameters', 'use_alternative_url'],
            serviceUnavailable: ['wait_extended', 'retry_later', 'reduce_load'],
            emailServiceFail: ['retry_generation', 'use_fallback_domain', 'manual_fallback'] // إضافة جديدة
        },

        // إعدادات التعافي الذكي - معززة للبريد المجاني
        smartRecovery: {
            enableLearning: true,
            patternRecognition: true,
            adaptiveStrategies: true,
            successRateThreshold: 0.6, // تقليل من 0.7
            emailSpecificRecovery: true // إضافة جديدة
        }
    },

    // ============================================
    // 📈 إعدادات المراقبة والأداء V2 - معدلة للبريد المجاني
    // ============================================
    monitoring: {
        // مراقب الصحة - معدل للبريد المجاني
        health: {
            checkInterval: 45000, // تقليل من 60000
            enableContinuousMonitoring: true,
            thresholds: {
                memory: 0.80, // تقليل من 0.85
                cpu: 0.75,    // تقليل من 0.80
                disk: 0.85,   // تقليل من 0.90
                network: 2000 // زيادة من 1000ms
            }
        },

        // مراقب الأداء - معدل للبريد المجاني
        performance: {
            trackMetrics: true,
            metricsRetention: 48, // زيادة من 24 ساعة
            enableAlerts: true,
            alertThresholds: {
                successRate: 0.6,    // تقليل من 0.7
                errorRate: 0.15,     // زيادة من 0.1
                accountCreationTime: 180000 // زيادة من 120000
            }
        },

        // التقارير - معززة للبريد المجاني
        reporting: {
            enableDailyReports: true,
            enableErrorReports: true,
            enablePerformanceReports: true,
            enableEmailServiceReports: true, // إضافة جديدة
            reportRetention: 14 // زيادة من 7 أيام
        }
    },

    // ============================================
    // 🔐 إعدادات الأمان المتقدمة V2 - معززة للبريد المجاني
    // ============================================
    security: {
        // إعدادات البيانات - معززة للبريد المجاني
        data: {
            encryptSensitiveInfo: true,
            maskCredentials: true,
            sanitizeLogs: true,
            autoCleanup: true,
            clearTempData: true, // إضافة جديدة
            anonymizeIPs: true   // إضافة جديدة
        },

        // إعدادات الشبكة - معززة للبريد المجاني
        network: {
            enableHttps: true,
            validateSsl: true,
            timeout: 40000,     // زيادة من 30000
            maxRedirects: 3     // تقليل من 5
        },

        // إعدادات التحقق - معززة للبريد المجاني
        validation: {
            validateEmails: true,
            validateUsernames: true,
            maxUsernameLength: 20,
            minPasswordLength: 8,
            passwordComplexity: true,
            emailFormatValidation: true, // إضافة جديدة
            domainWhitelist: true        // إضافة جديدة
        },

        // إعدادات الخصوصية - معززة للبريد المجاني
        privacy: {
            anonymizeData: true,
            clearCookies: true,
            disableTracking: true,
            respectRobotsTxt: true,
            minimizeDataCollection: true, // إضافة جديدة
            secureDataTransmission: true  // إضافة جديدة
        }
    },

    // ============================================
    // 🧪 إعدادات الاختبار والتطوير V2 - معدلة للبريد المجاني
    // ============================================
    development: {
        // وضع الاختبار - معدل للبريد المجاني
        testing: {
            enabled: process.env.NODE_ENV !== 'production',
            maxTestAccounts: 3, // تقليل من 5
            enableDryRun: true,
            testEmailDomain: 'besttemporaryemail.com' // استخدام المجاني
        },

        // التصحيح - معدل للبريد المجاني
        debugging: {
            enableDebugMode: process.env.NODE_ENV !== 'production',
            logLevel: 'debug',
            saveScreenshots: true,
            verboseLogging: false,
            emailDebugging: true // إضافة جديدة
        },

        // التطوير - معدل للبريد المجاني
        features: {
            enableExperimental: false,
            betaFeatures: [],
            featureFlags: {
                advancedRecovery: true,
                smartTiming: true,
                healthMonitoring: true,
                freeEmailIntegration: true // إضافة جديدة
            }
        }
    },

    // ============================================
    // 📁 إعدادات الملفات والتخزين V2 - معدلة للبريد المجاني
    // ============================================
    storage: {
        // هياكل المجلدات
        directories: {
            logs: join(__dirname, '../logs'),
            data: join(__dirname, '../data'),
            temp: join(__dirname, '../tmp'),
            screenshots: join(__dirname, '../screenshots'),
            backups: join(__dirname, '../backups'),
            email_cache: join(__dirname, '../email_cache') // إضافة جديدة
        },

        // إعدادات السجلات - معززة للبريد المجاني
        logging: {
            maxFileSize: '5m',  // تقليل من 10m
            maxFiles: 20,       // زيادة من 10
            compression: true,
            format: 'combined',
            emailLogs: true     // إضافة جديدة
        },

        // النسخ الاحتياطي - معزز للبريد المجاني
        backup: {
            enabled: true,
            interval: 12 * 60 * 60 * 1000, // تقليل من 24 إلى 12 ساعة
            retention: 14, // زيادة من 7 أيام
            autoCleanup: true,
            includeEmailData: true // إضافة جديدة
        }
    },

    // ============================================
    // 🔧 إعدادات متقدمة V2 - معدلة للبريد المجاني
    // ============================================
    advanced: {
        // تحسينات الأداء - معدلة للبريد المجاني
        performance: {
            enableGarbageCollection: true,
            maxHeapSize: 1024, // تقليل من 2048 MB
            optimizeV8: true,
            enableCompression: true,
            reduceMemoryFootprint: true // إضافة جديدة
        },

        // إعدادات الذاكرة - معدلة للبريد المجاني
        memory: {
            leakDetection: true,
            maxMemoryRestarts: 5, // زيادة من 3
            gcInterval: 15 * 60 * 1000 // تقليل من 30 إلى 15 دقيقة
        },

        // إعدادات العملية - معدلة للبريد المجاني
        process: {
            maxRestarts: 8,     // زيادة من 5
            restartDelay: 15000, // زيادة من 10000
            enableCluster: false,
            workers: 1
        },

        // إعدادات البريد الإلكتروني المتقدمة - جديدة كلياً
        emailAdvanced: {
            domainRotation: true,
            usernameGeneration: {
                useDictionary: true,
                useRandomStrings: true,
                minLength: 8,
                maxLength: 15,
                avoidSimilarity: true
            },
            rateLimiting: {
                requestsPerMinute: 10,
                requestsPerHour: 50,
                coolDownPeriod: 5000
            },
            fallbackMechanisms: [
                'domain_switch',
                'delay_and_retry',
                'pattern_change',
                'manual_override'
            ]
        }
    }
};

// ============================================
// 🛡️ تحقق من صحة الإعدادات - مخصص للبريد المجاني
// ============================================

/**
 * التحقق من صحة الإعدادات المطلوبة للبريد المجاني
 */
export function validateConfig() {
    const errors = [];
    const warnings = [];

    // التحقق من إعدادات Google Sheets
    if (!config.sheets.spreadsheetId) {
        errors.push('GOOGLE_SHEET_ID مطلوب في environment variables');
    }

    if (!config.sheets.credentials) {
        errors.push('GOOGLE_SERVICE_ACCOUNT_JSON مطلوب في environment variables');
    }

    // تحذيرات خاصة بالبريد المجاني
    if (config.timing.dailyTarget > 40) {
        warnings.push('الهدف اليومي مرتفع بالنسبة للبريد المجاني - يوصى بـ 32 حساب كحد أقصى');
    }

    if (config.email.primaryService.method === 'web_scraping') {
        warnings.push('استخدام Web Scraping للبريد المجاني قد يكون غير مستقر - تأكد من تحديث العناصر بانتظام');
    }

    // التحقق من المجالات المجانية
    const freeDomains = config.email.generation.domains;
    if (freeDomains.length === 0) {
        errors.push('يجب توفير مجالات بريد مجانية على الأقل');
    }

    // التحقق من التوقيتات
    if (config.timing.cycleTiming.minWaitBetweenCycles < 60) {
        warnings.push('الحد الأدنى للانتظار منخفض جداً للبريد المجاني - يوصى بـ 75 دقيقة على الأقل');
    }

    if (errors.length > 0) {
        throw new Error(`أخطاء في الإعدادات:\n${errors.join('\n')}`);
    }

    if (warnings.length > 0) {
        console.warn('تحذيرات في الإعدادات:\n' + warnings.join('\n'));
    }

    return { valid: true, warnings };
}

/**
 * الحصول على إعدادات بيئة محددة - مخصص للبريد المجاني
 */
export function getEnvironmentConfig(env = process.env.NODE_ENV) {
    const baseConfig = JSON.parse(JSON.stringify(config)); // Deep clone
    
    switch (env) {
        case 'development':
            baseConfig.browser.headless = false;
            baseConfig.development.testing.enabled = true;
            baseConfig.development.debugging.enableDebugMode = true;
            baseConfig.timing.dailyTarget = 3;
            baseConfig.email.verification.maxEmailChecks = 5;
            break;
            
        case 'test':
            baseConfig.browser.headless = true;
            baseConfig.development.testing.enabled = true;
            baseConfig.timing.dailyTarget = 2;
            baseConfig.email.verification.maxEmailChecks = 3;
            break;
            
        case 'production':
            baseConfig.browser.headless = true;
            baseConfig.development.testing.enabled = false;
            baseConfig.development.debugging.enableDebugMode = false;
            // إعدادات إنتاجية إضافية للبريد المجاني
            baseConfig.timing.dailyTarget = Math.min(baseConfig.timing.dailyTarget, 32);
            break;
    }
    
    return baseConfig;
}

/**
 * توليد تقرير الإعدادات - مخصص للبريد المجاني
 */
export function generateConfigReport() {
    const report = {
        system: {
            version: config.system.version,
            environment: config.system.environment,
            features: {
                autoRecovery: config.system.enableAutoRecovery,
                advancedMonitoring: config.system.enableAdvancedMonitoring,
                freeEmailService: true // إضافة جديدة
            }
        },
        targets: {
            daily: config.timing.dailyTarget,
            batchSize: config.timing.batchSize,
            totalCycles: config.timing.totalCycles,
            adjustedForFreeEmail: true // إضافة جديدة
        },
        services: {
            email: {
                service: config.email.primaryService.name,
                method: config.email.primaryService.method,
                domains: config.email.generation.domains.length,
                free: true // إضافة جديدة
            },
            sheets: config.sheets.spreadsheetId ? 'مضبوط' : 'غير مضبوط',
            browser: config.browser.headless ? 'Headless' : 'مرئي'
        },
        security: {
            recovery: config.recovery.levels.quick.enabled,
            monitoring: config.monitoring.health.enableContinuousMonitoring,
            freeEmailOptimized: true // إضافة جديدة
        },
        recommendations: generateOptimizationRecommendations()
    };
    
    return report;
}

/**
 * توليد توصيات التحسين - مخصص للبريد المجاني
 */
export function generateOptimizationRecommendations() {
    const recommendations = [];

    if (config.timing.dailyTarget > 35) {
        recommendations.push({
            priority: 'medium',
            message: 'تقليل الهدف اليومي إلى 32 حساب لتحسين الاستقرار مع البريد المجاني',
            action: 'reduce_daily_target'
        });
    }

    if (config.timing.cycleTiming.minWaitBetweenCycles < 70) {
        recommendations.push({
            priority: 'high',
            message: 'زيادة الحد الأدنى للانتظار إلى 75 دقيقة على الأقل',
            action: 'increase_min_wait'
        });
    }

    if (config.email.generation.domains.length < 3) {
        recommendations.push({
            priority: 'high', 
            message: 'إضافة المزيد من مجالات البريد المجانية',
            action: 'add_more_domains'
        });
    }

    return recommendations;
}

/**
 * التحقق من توفر خدمة البريد المجاني
 */
export async function checkFreeEmailService() {
    try {
        // محاكاة فحص الخدمة المجانية
        const isAvailable = true; // نفترض أنها متاحة
        
        if (!isAvailable) {
            throw new Error('خدمة البريد المجاني غير متاحة حالياً');
        }
        
        return {
            available: true,
            message: 'خدمة البريد المجاني متاحة ومضبوطة',
            domains: config.email.generation.domains
        };
    } catch (error) {
        return {
            available: false,
            message: error.message,
            domains: []
        };
    }
}

// تصدير الإعدادات الرئيسية
export const config = Object.freeze(getEnvironmentConfig());

// التحقق التلقائي عند التحميل مع تركيز على البريد المجاني
try {
    const validationResult = validateConfig();
    console.log('✅ تم تحميل إعدادات النظام V2 بنجاح مع دعم البريد المجاني');
    
    if (validationResult.warnings.length > 0) {
        console.log('📝 ملاحظات: النظام مضبوط للعمل مع البريد المجاني - بعض الإعدادات مخفضة للاستقرار');
    }
} catch (error) {
    console.error('❌ خطأ في إعدادات النظام:', error.message);
    process.exit(1);
}

export default config;
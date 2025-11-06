const { Builder, By, until, Capabilities } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { SystemLogger } = require('./logger');

class SeleniumManager {
    constructor() {
        this.logger = new SystemLogger();
        this.driver = null;
        this.maxWaitTime = 30000; // 30 ثانية
        this.tempEmailUrl = 'https://besttemporaryemail.com/';
    }

    // إنشاء متصفح Chrome بدون بروكسي (للاختبار)
    async createBrowserNonProxy() {
        try {
            const options = new chrome.Options();
            
            // إعدادات Chrome الأساسية
            options.addArguments('--headless=new');
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            options.addArguments('--disable-gpu');
            options.addArguments('--window-size=1920,1080');
            options.addArguments('--disable-blink-features=AutomationControlled');
            options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // إزالة علامات الأتمتة
            options.excludeSwitches(['enable-automation']);
            options.addArguments('--disable-blink-features=AutomationControlled');
            
            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();

            return driver;
            
        } catch (error) {
            this.logger.error(`❌ فشل إنشاء المتصفح: ${error.message}`);
            throw error;
        }
    }

    // إنشاء متصفح Chrome مع بروكسي
    async createBrowserWithProxy(proxy) {
        try {
            const options = new chrome.Options();
            
            // إعدادات Chrome
            options.addArguments('--headless=new');
            options.addArguments('--no-sandbox');
            options.addArguments('--disable-dev-shm-usage');
            options.addArguments('--disable-gpu');
            options.addArguments('--window-size=1920,1080');
            options.addArguments('--disable-blink-features=AutomationControlled');
            options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // إعدادات البروكسي
            if (proxy) {
                const proxyStr = `${proxy.host}:${proxy.port}`;
                options.addArguments(`--proxy-server=http://${proxyStr}`);
                
                // إذا كان البروكسي يحتاج مصادقة
                if (proxy.username && proxy.password) {
                    this.logger.warning('⚠️ بروكسي بمصادقة - قد يحتاج إعداد إضافي');
                }
                
                this.logger.production(`🔧 تكوين البروكسي: ${proxyStr}`);
            }
            
            // تجاهل أخطاء الشهادات
            options.addArguments('--ignore-certificate-errors');
            options.addArguments('--ignore-ssl-errors');
            
            // إزالة علامات الأتمتة
            options.excludeSwitches(['enable-automation']);
            
            // إضافة preferences لتحسين الأداء
            options.setUserPreferences({
                'profile.default_content_setting_values.notifications': 2,
                'profile.default_content_setting_values.automatic_downloads': 2
            });

            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();

            // تعيين timeouts
            await driver.manage().setTimeouts({
                implicit: 10000,
                pageLoad: 60000,
                script: 30000
            });

            return driver;
            
        } catch (error) {
            this.logger.error(`❌ فشل إنشاء المتصفح مع البروكسي: ${error.message}`);
            throw error;
        }
    }

    // اختبار Selenium بدون بروكسي
    async validateEnvironmentNonProxy() {
        let driver = null;
        
        try {
            this.logger.production('🧪 اختبار Selenium الأساسي...');
            
            driver = await this.createBrowserNonProxy();
            
            // اختبار بسيط
            await driver.get('https://www.google.com');
            const title = await driver.getTitle();
            
            if (title) {
                this.logger.success('✅ Selenium يعمل بشكل صحيح');
                await driver.quit();
                
                return {
                    ready: true,
                    message: 'Selenium جاهز للعمل'
                };
            }
            
            await driver.quit();
            return {
                ready: false,
                error: 'فشل في الحصول على عنوان الصفحة'
            };
            
        } catch (error) {
            if (driver) {
                try {
                    await driver.quit();
                } catch (quitError) {
                    // تجاهل أخطاء الإغلاق
                }
            }
            
            return {
                ready: false,
                error: error.message
            };
        }
    }

    // اختبار Selenium مع بروكسي
    async validateEnvironmentWithProxy(proxy) {
        let driver = null;
        
        try {
            this.logger.production(`🧪 اختبار Selenium مع بروكسي: ${proxy.host}:${proxy.port}`);
            
            driver = await this.createBrowserWithProxy(proxy);
            
            // اختبار بسيط مع timeout أطول
            await driver.get('http://httpbin.org/ip');
            
            await driver.wait(until.elementLocated(By.tagName('body')), 20000);
            
            const bodyText = await driver.findElement(By.tagName('body')).getText();
            
            if (bodyText && bodyText.length > 0) {
                this.logger.success(`✅ Selenium + بروكسي يعمل: ${proxy.host}:${proxy.port}`);
                await driver.quit();
                
                return {
                    ready: true,
                    message: `Selenium جاهز مع البروكسي ${proxy.host}:${proxy.port}`
                };
            }
            
            await driver.quit();
            return {
                ready: false,
                error: 'لم يتم تحميل المحتوى'
            };
            
        } catch (error) {
            if (driver) {
                try {
                    await driver.quit();
                } catch (quitError) {
                    // تجاهل
                }
            }
            
            return {
                ready: false,
                error: error.message
            };
        }
    }

    // اختبار عام للبيئة
    async validateEnvironment() {
        return await this.validateEnvironmentNonProxy();
    }

    // الحصول على بريد مؤقت من besttemporaryemail.com
    async getTempEmailFromBestTemp(driver) {
        try {
            this.logger.production('📧 الحصول على بريد مؤقت من besttemporaryemail.com...');
            
            await driver.get(this.tempEmailUrl);
            await this.delay(3000);
            
            // انتظار ظهور البريد الإلكتروني
            await driver.wait(until.elementLocated(By.id('email')), 15000);
            
            const emailElement = await driver.findElement(By.id('email'));
            const email = await emailElement.getAttribute('value');
            
            if (!email || email.trim() === '') {
                throw new Error('فشل في الحصول على البريد المؤقت');
            }
            
            this.logger.success(`✅ تم الحصول على البريد: ${email}`);
            
            return {
                email: email.trim(),
                driver: driver
            };
            
        } catch (error) {
            this.logger.error(`❌ فشل الحصول على البريد المؤقت: ${error.message}`);
            throw error;
        }
    }

    // الحصول على كود التحقق من besttemporaryemail.com
    async getVerificationCodeFromBestTemp(driver, timeout = 120000) {
        try {
            this.logger.production('🔍 انتظار رسالة التحقق...');
            
            const startTime = Date.now();
            let lastCheck = 0;
            
            while (Date.now() - startTime < timeout) {
                try {
                    // تحديث الصفحة كل 10 ثواني
                    if (Date.now() - lastCheck > 10000) {
                        await driver.navigate().refresh();
                        await this.delay(2000);
                        lastCheck = Date.now();
                    }
                    
                    // البحث عن رسائل من Reddit
                    const emails = await driver.findElements(By.css('.email-item, .message-item, .mail-item'));
                    
                    for (const emailItem of emails) {
                        try {
                            const emailText = await emailItem.getText();
                            
                            // التحقق من أن الرسالة من Reddit
                            if (emailText.toLowerCase().includes('reddit') || 
                                emailText.toLowerCase().includes('verification') ||
                                emailText.toLowerCase().includes('verify')) {
                                
                                // النقر على الرسالة
                                await emailItem.click();
                                await this.delay(2000);
                                
                                // البحث عن كود التحقق
                                const bodyElement = await driver.findElement(By.css('.email-body, .message-body, .mail-content, body'));
                                const bodyText = await bodyElement.getText();
                                
                                // البحث عن رمز مكون من 6 أرقام
                                const codeMatch = bodyText.match(/\b\d{6}\b/);
                                
                                if (codeMatch) {
                                    const code = codeMatch[0];
                                    this.logger.success(`✅ تم العثور على كود التحقق: ${code}`);
                                    return code;
                                }
                            }
                        } catch (itemError) {
                            // تجاهل أخطاء العناصر الفردية
                            continue;
                        }
                    }
                    
                    await this.delay(5000);
                    
                } catch (checkError) {
                    this.logger.warning(`⚠️ خطأ في التحقق: ${checkError.message}`);
                    await this.delay(5000);
                }
            }
            
            throw new Error('انتهت مهلة انتظار رسالة التحقق');
            
        } catch (error) {
            this.logger.error(`❌ فشل الحصول على كود التحقق: ${error.message}`);
            throw error;
        }
    }

    // إنشاء حساب Reddit باستخدام besttemporaryemail.com
    async createRedditAccountWithBestTempEmail(proxy) {
        let driver = null;
        let tempEmailDriver = null;
        
        try {
            this.logger.production('🚀 بدء إنشاء حساب Reddit...');
            
            // 1. فتح نافذة للبريد المؤقت
            tempEmailDriver = await this.createBrowserWithProxy(proxy);
            const emailData = await this.getTempEmailFromBestTemp(tempEmailDriver);
            const email = emailData.email;
            
            // 2. فتح نافذة Reddit
            driver = await this.createBrowserWithProxy(proxy);
            
            // 3. الذهاب إلى صفحة التسجيل
            this.logger.production('📝 فتح صفحة التسجيل...');
            await driver.get('https://www.reddit.com/register');
            await this.delay(3000);
            
            // 4. ملء البريد الإلكتروني
            this.logger.production('✉️ ملء البريد الإلكتروني...');
            const emailInput = await driver.wait(
                until.elementLocated(By.css('input[name="email"], input[type="email"]')),
                this.maxWaitTime
            );
            await emailInput.clear();
            await emailInput.sendKeys(email);
            await this.delay(1000);
            
            // 5. توليد اسم مستخدم عشوائي
            const username = this.generateUsername();
            this.logger.production(`👤 اسم المستخدم: ${username}`);
            
            const usernameInput = await driver.findElement(By.css('input[name="username"]'));
            await usernameInput.clear();
            await usernameInput.sendKeys(username);
            await this.delay(1000);
            
            // 6. توليد كلمة مرور قوية
            const password = this.generatePassword();
            const passwordInput = await driver.findElement(By.css('input[name="password"], input[type="password"]'));
            await passwordInput.clear();
            await passwordInput.sendKeys(password);
            await this.delay(1000);
            
            // 7. النقر على زر التسجيل
            this.logger.production('🔘 النقر على زر التسجيل...');
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            await this.delay(5000);
            
            // 8. الحصول على كود التحقق
            this.logger.production('🔍 انتظار كود التحقق...');
            const verificationCode = await this.getVerificationCodeFromBestTemp(tempEmailDriver);
            
            // 9. إدخال كود التحقق
            this.logger.production('🔑 إدخال كود التحقق...');
            const codeInput = await driver.wait(
                until.elementLocated(By.css('input[name="otp"], input[type="text"]')),
                this.maxWaitTime
            );
            await codeInput.clear();
            await codeInput.sendKeys(verificationCode);
            await this.delay(1000);
            
            // 10. تأكيد الكود
            const verifyButton = await driver.findElement(By.css('button[type="submit"]'));
            await verifyButton.click();
            await this.delay(5000);
            
            // 11. التحقق من النجاح
            const currentUrl = await driver.getCurrentUrl();
            
            if (currentUrl.includes('reddit.com') && !currentUrl.includes('register')) {
                this.logger.success('✅ تم إنشاء الحساب بنجاح!');
                
                // إغلاق المتصفحات
                await driver.quit();
                await tempEmailDriver.quit();
                
                return {
                    success: true,
                    username: username,
                    password: password,
                    email: email,
                    verification_code: verificationCode,
                    created_at: new Date().toISOString()
                };
            } else {
                throw new Error('فشل التحقق - لم يتم إكمال التسجيل');
            }
            
        } catch (error) {
            this.logger.error(`❌ فشل إنشاء الحساب: ${error.message}`);
            
            // إغلاق المتصفحات
            if (driver) {
                try {
                    await driver.quit();
                } catch (e) {}
            }
            
            if (tempEmailDriver) {
                try {
                    await tempEmailDriver.quit();
                } catch (e) {}
            }
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    // توليد اسم مستخدم عشوائي
    generateUsername() {
        const adjectives = ['Cool', 'Happy', 'Smart', 'Fast', 'Bright', 'Swift', 'Bold', 'Wise', 'Calm', 'Wild'];
        const nouns = ['Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion', 'Hawk', 'Panda', 'Dragon', 'Phoenix'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 9999);
        
        return `${adj}${noun}${num}`;
    }

    // توليد كلمة مرور قوية
    generatePassword() {
        const length = 16;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        return password;
    }

    // تأخير
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // إغلاق المتصفح
    async closeBrowser() {
        if (this.driver) {
            try {
                await this.driver.quit();
                this.driver = null;
            } catch (error) {
                this.logger.warning(`⚠️ خطأ في إغلاق المتصفح: ${error.message}`);
            }
        }
    }
}

module.exports = { SeleniumManager };
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { SystemLogger } = require('./logger');

class SeleniumManager {
    constructor() {
        this.logger = new SystemLogger();
        this.emailServices = [
            'https://besttemporaryemail.com/',
            'https://10minutemail.com/',
            'https://temp-mail.org/'
        ];
    }

    async validateEnvironment() {
        try {
            // اختبار بدون بروكسي أولاً
            const testDriver = await this.createDriver();
            await testDriver.get('https://www.google.com');
            const title = await testDriver.getTitle();
            await testDriver.quit();
            
            return { 
                ready: true,
                message: 'Selenium جاهز للتشغيل',
                chrome_version: await this.getChromeVersion()
            };
        } catch (error) {
            return { 
                ready: false, 
                error: `فشل تحقق Selenium: ${error.message}` 
            };
        }
    }

    async getChromeVersion() {
        try {
            const { execSync } = require('child_process');
            return execSync('google-chrome --version').toString().trim();
        } catch (error) {
            return 'غير معروف';
        }
    }

    async createDriver(proxy = null) {
        try {
            const options = new chrome.Options();
            
            // إعدادات متقدمة للمتصفح
            options.addArguments([
                '--headless=new',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-images',
                '--disable-javascript',
                '--disable-plugins',
                '--disable-popup-blocking',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                '--lang=en-US,en;q=0.9',
                '--window-size=1920,1080',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors'
            ]);

            options.excludeSwitches(['enable-automation', 'enable-logging']);
            options.setUserPreferences({
                'credentials_enable_service': false,
                'profile.password_manager_enabled': false,
                'profile.default_content_setting_values.notifications': 2
            });

            // إعداد البروكسي إذا كان موجوداً
            if (proxy && proxy.host && proxy.port) {
                try {
                    const proxyUrl = `http://${proxy.host}:${proxy.port}`;
                    options.addArguments(`--proxy-server=${proxyUrl}`);
                    this.logger.production(`🌐 إعداد البروكسي: ${proxyUrl}`);
                } catch (proxyError) {
                    this.logger.warning(`⚠️ خطأ في إعداد البروكسي: ${proxyError.message}`);
                }
            }

            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();

            // تعيين مهلات أطول
            await driver.manage().setTimeouts({ 
                implicit: 25000, 
                pageLoad: 60000,
                script: 40000
            });

            // إزالة خصائص automation بشكل متقدم
            await this.removeAutomationDetection(driver);

            return driver;
            
        } catch (error) {
            throw new Error(`فشل إنشاء متصفح: ${error.message}`);
        }
    }

    async removeAutomationDetection(driver) {
        try {
            await driver.executeScript(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            );
            await driver.executeScript(
                "Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]})"
            );
            await driver.executeScript(
                "Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']})"
            );
        } catch (error) {
            this.logger.warning(`⚠️ خطأ في إزالة كشف الآلية: ${error.message}`);
        }
    }

    async createRedditAccount(proxy) {
        let driver;
        
        try {
            this.logger.production('🌐 بدء إنشاء حساب Reddit...');
            
            driver = await this.createDriver(proxy);
            
            // 1. الحصول على بريد مؤقت من أفضل خدمة متاحة
            const emailData = await this.getTempEmail(driver);
            this.logger.production(`📧 البريد المؤقت: ${emailData.email}`);
            
            // 2. إنشاء حساب Reddit
            const accountData = await this.createRedditWithSelenium(driver, emailData.email);
            this.logger.production(`👤 اسم المستخدم: ${accountData.username}`);
            
            // 3. استخراج رمز التحقق
            const verificationCode = await this.getVerificationCode(driver, emailData);
            
            return {
                success: true,
                email: emailData.email,
                username: accountData.username,
                password: accountData.password,
                verification_code: verificationCode,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error(`❌ فشل إنشاء الحساب: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        } finally {
            if (driver) {
                try {
                    await driver.quit();
                } catch (quitError) {
                    this.logger.warning(`⚠️ خطأ في إغلاق المتصفح: ${quitError.message}`);
                }
            }
        }
    }

    async getTempEmail(driver) {
        let lastError = '';
        
        // تجربة جميع خدمات البريد بالترتيب
        for (const serviceUrl of this.emailServices) {
            try {
                this.logger.production(`📧 تجربة خدمة البريد: ${serviceUrl}`);
                
                await driver.get(serviceUrl);
                
                let email = null;
                let attempts = 0;
                
                // محاولات متعددة لاستخراج البريد
                while (!email && attempts < 5) {
                    attempts++;
                    
                    try {
                        email = await this.extractEmailFromService(driver, serviceUrl);
                        
                        if (email && this.isValidEmail(email)) {
                            this.logger.success(`✅ تم الحصول على البريد من: ${new URL(serviceUrl).hostname}`);
                            return {
                                email: email,
                                service: serviceUrl,
                                sessionData: { url: serviceUrl }
                            };
                        }
                    } catch (extractError) {
                        lastError = extractError.message;
                    }
                    
                    if (!email) {
                        await this.delay(2000);
                        await driver.navigate().refresh();
                    }
                }
                
            } catch (serviceError) {
                lastError = serviceError.message;
                this.logger.warning(`⚠️ فشل خدمة البريد: ${serviceUrl} - ${serviceError.message}`);
                continue; // جرب الخدمة التالية
            }
        }
        
        throw new Error(`فشل جميع خدمات البريد: ${lastError}`);
    }

    async extractEmailFromService(driver, serviceUrl) {
        const hostname = new URL(serviceUrl).hostname;
        
        try {
            switch (hostname) {
                case 'besttemporaryemail.com':
                    return await this.extractFromBestTempEmail(driver);
                    
                case '10minutemail.com':
                    return await this.extractFrom10MinuteEmail(driver);
                    
                case 'temp-mail.org':
                    return await this.extractFromTempMailOrg(driver);
                    
                default:
                    return await this.extractEmailGeneric(driver);
            }
        } catch (error) {
            throw new Error(`فشل استخراج من ${hostname}: ${error.message}`);
        }
    }

    async extractFromBestTempEmail(driver) {
        try {
            // انتظار ظهور عنصر البريد
            await driver.wait(until.elementLocated(By.css('input[type="email"], .email-address, #email, [class*="email"]')), 15000);
            
            // محاولات متعددة للعثور على البريد
            const emailSelectors = [
                'input[type="email"]',
                '.email-address',
                '#email',
                '[class*="email"]',
                '.mail',
                '#mail'
            ];
            
            for (const selector of emailSelectors) {
                try {
                    const elements = await driver.findElements(By.css(selector));
                    for (const element of elements) {
                        try {
                            const email = await element.getAttribute('value');
                            if (this.isValidEmail(email)) {
                                return email;
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            throw new Error('لم يتم العثور على بريد صالح');
            
        } catch (error) {
            throw new Error(`BestTempEmail: ${error.message}`);
        }
    }

    async extractFrom10MinuteEmail(driver) {
        try {
            await driver.wait(until.elementLocated(By.css('#mailAddress, .mail-address, [class*="email"]')), 15000);
            
            const emailElement = await driver.findElement(By.css('#mailAddress, .mail-address, [class*="email"]'));
            const email = await emailElement.getAttribute('value');
            
            if (!this.isValidEmail(email)) {
                throw new Error('بريد غير صالح');
            }
            
            return email;
            
        } catch (error) {
            throw new Error(`10MinuteEmail: ${error.message}`);
        }
    }

    async extractFromTempMailOrg(driver) {
        try {
            await driver.wait(until.elementLocated(By.css('.email, #mail, [class*="email"]')), 15000);
            
            const emailElement = await driver.findElement(By.css('.email, #mail, [class*="email"]'));
            const email = await emailElement.getText() || await emailElement.getAttribute('value');
            
            if (!this.isValidEmail(email)) {
                throw new Error('بريد غير صالح');
            }
            
            return email;
            
        } catch (error) {
            throw new Error(`TempMailOrg: ${error.message}`);
        }
    }

    async extractEmailGeneric(driver) {
        // طريقة عامة للعثور على البريد
        const emailSelectors = [
            'input[type="email"]',
            '[id*="email"]',
            '[class*="email"]',
            '.email',
            '#email',
            '.mail',
            '#mail'
        ];
        
        for (const selector of emailSelectors) {
            try {
                const elements = await driver.findElements(By.css(selector));
                for (const element of elements) {
                    try {
                        let email = await element.getAttribute('value') || await element.getText();
                        if (this.isValidEmail(email)) {
                            return email;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        throw new Error('لم يتم العثور على بريد في الخدمة');
    }

    isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }

    async createRedditWithSelenium(driver, email) {
        try {
            await driver.get('https://www.reddit.com/register/');
            
            // انتظار أطول لتحميل الصفحة
            await driver.wait(until.elementLocated(By.css('input[name="email"]')), 30000);
            
            const username = this.generateUsername();
            const password = this.generatePassword();
            
            this.logger.production(`🔐 إنشاء بيانات الاعتماد: ${username} / ${password}`);
            
            // إضافة تأخيرات طبيعية بين الإدخالات
            await this.humanLikeDelay(2000, 4000);
            
            // ملء نموذج التسجيل مع معالجة الأخطاء
            await this.fillRegistrationForm(driver, email, username, password);
            
            this.logger.production('✅ تم إرسال طلب إنشاء الحساب');
            
            return {
                username: username,
                password: password
            };
            
        } catch (error) {
            throw new Error(`فشل إنشاء حساب Reddit: ${error.message}`);
        }
    }

    async fillRegistrationForm(driver, email, username, password) {
        try {
            // إدخال البريد الإلكتروني
            const emailField = await driver.findElement(By.css('input[name="email"]'));
            await emailField.clear();
            await this.humanLikeDelay(1000, 2000);
            await emailField.sendKeys(email);
            
            await this.humanLikeDelay(1500, 3000);
            
            // إدخال اسم المستخدم
            const usernameField = await driver.findElement(By.css('input#regUsername, input[name="username"]'));
            await usernameField.clear();
            await this.humanLikeDelay(1000, 2000);
            await usernameField.sendKeys(username);
            
            await this.humanLikeDelay(1500, 3000);
            
            // إدخال كلمة المرور
            const passwordField = await driver.findElement(By.css('input#regPassword, input[name="password"]'));
            await passwordField.clear();
            await this.humanLikeDelay(1000, 2000);
            await passwordField.sendKeys(password);
            
            await this.humanLikeDelay(2000, 4000);
            
            // النقر على زر التسجيل
            const signupButton = await driver.findElement(By.css('button[type="submit"], .signup-button, [type="submit"]'));
            await driver.executeScript("arguments[0].click();", signupButton);
            
            // انتظار الاستجابة مع معالجة متعددة
            await this.waitForRegistrationResponse(driver);
            
        } catch (error) {
            throw new Error(`فشل تعبئة النموذج: ${error.message}`);
        }
    }

    async waitForRegistrationResponse(driver) {
        try {
            // انتظار أي من رسائل النجاح أو الخطأ
            await driver.wait(async () => {
                try {
                    // التحقق من رسائل النجاح
                    const successElements = await driver.findElements(
                        By.xpath('//*[contains(text(), "verification") or contains(text(), "check your email") or contains(text(), "verify") or contains(text(), "email sent")]')
                    );
                    
                    if (successElements.length > 0) {
                        return true;
                    }
                    
                    // التحقق من رسائل الخطأ
                    const errorElements = await driver.findElements(
                        By.css('.error, .alert-error, [class*="error"], .AnimatedForm__errorMessage')
                    );
                    
                    if (errorElements.length > 0) {
                        const errorText = await errorElements[0].getText();
                        throw new Error(`رفض من Reddit: ${errorText.substring(0, 100)}`);
                    }
                    
                    return false;
                    
                } catch (error) {
                    throw error;
                }
            }, 45000);
            
        } catch (timeoutError) {
            this.logger.warning('⚠️ لم يتم العثور على رسالة تأكيد واضحة');
            // المتابعة رغم عدم وجود تأكيد واضح
        }
    }

    async getVerificationCode(driver, emailData) {
        try {
            this.logger.production('⏳ انتظار رسالة التحقق...');
            
            // العودة إلى خدمة البريد
            await driver.get(emailData.service);
            await this.delay(5000); // انتظار تحميل الصفحة
            
            const totalWaitTime = 240000; // 4 دقائق كحد أقصى
            const checkInterval = 30000; // التحقق كل 30 ثانية
            let waited = 0;
            
            while (waited < totalWaitTime) {
                this.logger.production(`🔍 فحص البريد... (${waited/1000} ثانية)`);
                
                try {
                    const verificationCode = await this.checkForVerificationEmail(driver, emailData.service);
                    
                    if (verificationCode) {
                        this.logger.success(`✅ تم العثور على رمز التحقق: ${verificationCode}`);
                        return verificationCode;
                    }
                    
                    // تحديث الصفحة
                    await driver.navigate().refresh();
                    await this.delay(5000);
                    
                } catch (checkError) {
                    this.logger.warning(`⚠️ خطأ في فحص البريد: ${checkError.message}`);
                }
                
                waited += checkInterval;
                await this.delay(checkInterval);
            }
            
            this.logger.warning('⏰ انتهى وقت انتظار الرسالة');
            return null;
            
        } catch (error) {
            this.logger.warning(`⚠️ فشل استخراج رمز التحقق: ${error.message}`);
            return null;
        }
    }

    async checkForVerificationEmail(driver, serviceUrl) {
        const hostname = new URL(serviceUrl).hostname;
        
        try {
            switch (hostname) {
                case 'besttemporaryemail.com':
                    return await this.checkBestTempEmailMessages(driver);
                    
                case '10minutemail.com':
                    return await this.check10MinuteEmailMessages(driver);
                    
                case 'temp-mail.org':
                    return await this.checkTempMailOrgMessages(driver);
                    
                default:
                    return await this.checkMessagesGeneric(driver);
            }
        } catch (error) {
            throw new Error(`فشل فحص الرسائل في ${hostname}: ${error.message}`);
        }
    }

    async checkBestTempEmailMessages(driver) {
        try {
            // البحث عن رسائل Reddit
            const messageSelectors = [
                '//*[contains(text(), "Reddit")]',
                '//*[contains(text(), "verification")]',
                '.message',
                '.email-item',
                '[class*="message"]'
            ];
            
            for (const selector of messageSelectors) {
                try {
                    const elements = selector.startsWith('//') ? 
                        await driver.findElements(By.xpath(selector)) :
                        await driver.findElements(By.css(selector));
                    
                    if (elements.length > 0) {
                        // النقر على أول رسالة
                        await driver.executeScript("arguments[0].click();", elements[0]);
                        await this.delay(3000);
                        
                        // استخراج النص من الجسم
                        const bodySelectors = ['.message-body', '.email-content', '.message-content', 'body'];
                        for (const bodySelector of bodySelectors) {
                            try {
                                const bodyElement = await driver.findElement(By.css(bodySelector));
                                const text = await bodyElement.getText();
                                
                                const code = this.extractVerificationCode(text);
                                if (code) return code;
                                
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return null;
            
        } catch (error) {
            throw new Error(`BestTempEmail messages: ${error.message}`);
        }
    }

    async check10MinuteEmailMessages(driver) {
        try {
            const messageElements = await driver.findElements(
                By.xpath('//*[contains(text(), "Reddit") or contains(text(), "verification")]')
            );
            
            if (messageElements.length > 0) {
                await driver.executeScript("arguments[0].click();", messageElements[0]);
                await this.delay(3000);
                
                const bodyElement = await driver.findElement(By.css('.message-body, .mail-message'));
                const text = await bodyElement.getText();
                
                return this.extractVerificationCode(text);
            }
            
            return null;
            
        } catch (error) {
            throw new Error(`10MinuteEmail messages: ${error.message}`);
        }
    }

    async checkTempMailOrgMessages(driver) {
        try {
            const messageElements = await driver.findElements(
                By.css('.mail, .message, [class*="mail"]')
            );
            
            for (const element of messageElements) {
                try {
                    const text = await element.getText();
                    if (text.includes('Reddit') || text.includes('verification')) {
                        await driver.executeScript("arguments[0].click();", element);
                        await this.delay(3000);
                        
                        const bodyElement = await driver.findElement(By.css('.message-content, .mail-content'));
                        const bodyText = await bodyElement.getText();
                        
                        return this.extractVerificationCode(bodyText);
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return null;
            
        } catch (error) {
            throw new Error(`TempMailOrg messages: ${error.message}`);
        }
    }

    async checkMessagesGeneric(driver) {
        // طريقة عامة للعثور على الرسائل
        const messageSelectors = [
            '.message',
            '.email',
            '.mail',
            '[class*="message"]',
            '[class*="email"]'
        ];
        
        for (const selector of messageSelectors) {
            try {
                const elements = await driver.findElements(By.css(selector));
                for (const element of elements) {
                    try {
                        const text = await element.getText();
                        if (text.includes('Reddit') || text.includes('verification')) {
                            await driver.executeScript("arguments[0].click();", element);
                            await this.delay(3000);
                            
                            const bodyText = await driver.findElement(By.css('body')).getText();
                            return this.extractVerificationCode(bodyText);
                        }
                    } catch (e) {
                        continue;
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        return null;
    }

    extractVerificationCode(text) {
        if (!text) return null;
        
        const patterns = [
            /\b\d{6}\b/,                          // 123456
            /code:\s*(\d{6})/i,                   // code: 123456
            /verification code:\s*(\d{6})/i,      // verification code: 123456
            /code is:\s*(\d{6})/i,                // code is: 123456
            /:\s*(\d{6})/,                        // : 123456
            /"(\d{6})"/,                          // "123456"
            /'(\d{6})'/,                          // '123456'
            /\[(\d{6})\]/,                        // [123456]
            /\((\d{6})\)/                         // (123456)
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1] || match[0];
            }
        }
        
        return null;
    }

    async humanLikeDelay(min = 1000, max = 3000) {
        const delayTime = Math.floor(Math.random() * (max - min)) + min;
        await this.delay(delayTime);
    }

    generateUsername() {
        const prefixes = ['user', 'reddit', 'auto', 'bot', 'creator', 'gamer', 'player', 'tech', 'digital', 'web'];
        const suffixes = ['pro', 'master', 'expert', 'king', 'star', 'hero', 'legend', 'nova', 'prime', 'max'];
        const numbers = Math.floor(Math.random() * 10000);
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix}_${suffix}_${numbers}`.toLowerCase();
    }

    generatePassword() {
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*';
        
        let password = '';
        
        // تأكد من وجود حرف كبير، صغير، رقم ورمز
        password += upper[Math.floor(Math.random() * upper.length)];
        password += lower[Math.floor(Math.random() * lower.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        // إكمال إلى 12-16 حرف
        const allChars = lower + upper + numbers + symbols;
        const targetLength = Math.floor(Math.random() * 5) + 12;
        
        for (let i = password.length; i < targetLength; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // خلط الأحرف
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { SeleniumManager };

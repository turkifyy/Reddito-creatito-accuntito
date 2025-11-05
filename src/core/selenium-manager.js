const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { SystemLogger } = require('./logger');

class SeleniumManager {
    constructor() {
        this.logger = new SystemLogger();
        this.emailServices = [
            'https://besttemporaryemail.com/',
            'https://10minutemail.com/'
        ];
    }

    async validateEnvironment() {
        try {
            const testDriver = await this.createDriver({ host: '127.0.0.1', port: 8080 });
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

    async createDriver(proxy) {
        try {
            const options = new chrome.Options();
            
            // إعدادات متقدمة للإنتاج
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
                '--ignore-certificate-errors'
            ]);

            options.excludeSwitches(['enable-automation', 'enable-logging']);
            options.setUserPreferences({
                'credentials_enable_service': false,
                'profile.password_manager_enabled': false,
                'profile.default_content_setting_values.notifications': 2
            });

            // إعداد البروكسي العام
            if (proxy) {
                options.addArguments(`--proxy-server=http://${proxy.host}:${proxy.port}`);
            }

            const driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();

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
            this.logger.warning('⚠️ فشل في إزالة كشف الأتمتة');
        }
    }

    async createRedditAccount(proxy) {
        let driver;
        
        try {
            this.logger.production('🌐 بدء إنشاء حساب Reddit...');
            
            driver = await this.createDriver(proxy);
            
            // 1. الحصول على بريد مؤقت من أفضل خدمة متاحة
            const emailData = await this.getTempEmailWithFallback(driver);
            this.logger.production(`📧 البريد المؤقت: ${emailData.email}`);
            
            // 2. إنشاء حساب Reddit
            const accountData = await this.createRedditWithSelenium(driver, emailData.email);
            this.logger.production(`👤 اسم المستخدم: ${accountData.username}`);
            
            // 3. استخراج رمز التحقق
            const verificationCode = await this.getVerificationCodeAdvanced(driver, emailData);
            
            return {
                success: true,
                email: emailData.email,
                username: accountData.username,
                password: accountData.password,
                verification_code: verificationCode,
                timestamp: new Date().toISOString(),
                email_service: emailData.service
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

    async getTempEmailWithFallback(driver) {
        for (const service of this.emailServices) {
            try {
                this.logger.production(`🔄 تجربة خدمة البريد: ${service}`);
                const emailData = await this.getTempEmailFromService(driver, service);
                
                if (emailData && emailData.email) {
                    this.logger.success(`✅ نجح استخدام: ${service}`);
                    return emailData;
                }
            } catch (error) {
                this.logger.warning(`⚠️ فشلت الخدمة ${service}: ${error.message}`);
                continue;
            }
        }
        
        throw new Error('جميع خدمات البريد المؤقت فشلت');
    }

    async getTempEmailFromService(driver, serviceUrl) {
        try {
            await driver.get(serviceUrl);
            
            let email;
            let sessionData = {};

            if (serviceUrl.includes('besttemporaryemail.com')) {
                email = await this.getEmailFromBestTempEmail(driver);
                sessionData.service = 'besttemporaryemail';
            } else if (serviceUrl.includes('10minutemail.com')) {
                email = await this.getEmailFrom10MinuteMail(driver);
                sessionData.service = '10minutemail';
            }

            if (!email || !email.includes('@')) {
                throw new Error('بريد إلكتروني غير صالح');
            }

            return {
                email: email,
                service: sessionData.service,
                sessionId: `session_${Date.now()}_${sessionData.service}`
            };
            
        } catch (error) {
            throw new Error(`فشل من ${serviceUrl}: ${error.message}`);
        }
    }

    async getEmailFromBestTempEmail(driver) {
        try {
            // استراتيجيات متعددة لاستخراج البريد من besttemporaryemail
            const emailSelectors = [
                '#email', 
                '.email-address',
                '[class*="email"]',
                '[id*="mail"]',
                'input[type="email"]',
                '.mail'
            ];

            for (const selector of emailSelectors) {
                try {
                    const emailElement = await driver.wait(
                        until.elementLocated(By.css(selector)),
                        10000
                    );
                    const email = await emailElement.getAttribute('value');
                    
                    if (email && email.includes('@')) {
                        return email;
                    }
                } catch (e) {
                    continue;
                }
            }

            // إذا فشلت جميع الطرق، جرب XPath
            const xpathSelectors = [
                '//*[contains(text(), "@")]',
                '//input[contains(@id, "mail")]',
                '//*[contains(@class, "email")]'
            ];

            for (const xpath of xpathSelectors) {
                try {
                    const elements = await driver.findElements(By.xpath(xpath));
                    for (const element of elements) {
                        const text = await element.getText();
                        const value = await element.getAttribute('value');
                        const candidate = text || value;
                        
                        if (candidate && candidate.includes('@')) {
                            const emailMatch = candidate.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                            if (emailMatch) {
                                return emailMatch[0];
                            }
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            throw new Error('لم يتم العثور على بريد إلكتروني');
            
        } catch (error) {
            throw new Error(`فشل استخراج البريد من besttemporaryemail: ${error.message}`);
        }
    }

    async getEmailFrom10MinuteMail(driver) {
        try {
            const emailElement = await driver.wait(
                until.elementLocated(By.css('#mailAddress, .mail-address, [class*="email"]')),
                15000
            );
            return await emailElement.getAttribute('value');
        } catch (error) {
            throw new Error(`فشل استخراج البريد من 10minutemail: ${error.message}`);
        }
    }

    async createRedditWithSelenium(driver, email) {
        try {
            await driver.get('https://www.reddit.com/register/');
            
            // انتظار أطول مع البروكسيات العامة
            await driver.wait(until.elementLocated(By.css('input[name="email"]')), 40000);
            
            const username = this.generateProductionUsername();
            const password = this.generateProductionPassword();
            
            this.logger.production(`🔐 إنشاء بيانات الاعتماد: ${username} / ${password}`);
            
            // إضافة تأخيرات طبيعية محسنة
            await this.humanLikeDelay(2000, 4000);
            
            // ملء نموذج التسجيل مع معالجة أفضل للأخطاء
            await this.fillRegistrationForm(driver, email, username, password);
            
            // النقر على زر التسجيل
            await this.clickSignupButton(driver);
            
            // التحقق من النجاح مع تحسينات
            await this.verifySignupSuccess(driver);
            
            return {
                username: username,
                password: password
            };
            
        } catch (error) {
            throw new Error(`فشل إنشاء حساب Reddit: ${error.message}`);
        }
    }

    async fillRegistrationForm(driver, email, username, password) {
        const fields = [
            { selector: 'input[name="email"]', value: email, description: 'البريد الإلكتروني' },
            { selector: 'input#regUsername, input[name="username"]', value: username, description: 'اسم المستخدم' },
            { selector: 'input#regPassword, input[name="password"]', value: password, description: 'كلمة المرور' }
        ];

        for (const field of fields) {
            try {
                const element = await driver.findElement(By.css(field.selector));
                await element.clear();
                await this.humanLikeDelay(1000, 2000);
                await element.sendKeys(field.value);
                await this.humanLikeDelay(1500, 3000);
                this.logger.production(`✅ تم إدخال: ${field.description}`);
            } catch (error) {
                throw new Error(`فشل إدخال ${field.description}: ${error.message}`);
            }
        }
    }

    async clickSignupButton(driver) {
        try {
            const signupSelectors = [
                'button[type="submit"]',
                '.signup-button',
                '[data-testid="signup-button"]',
                'button:contains("Sign up")'
            ];

            for (const selector of signupSelectors) {
                try {
                    const button = await driver.findElement(By.css(selector));
                    await driver.executeScript("arguments[0].click();", button);
                    this.logger.production('✅ تم النقر على زر التسجيل');
                    return;
                } catch (e) {
                    continue;
                }
            }

            throw new Error('لم يتم العثور على زر التسجيل');
            
        } catch (error) {
            throw new Error(`فشل النقر على زر التسجيل: ${error.message}`);
        }
    }

    async verifySignupSuccess(driver) {
        try {
            // أنماط متعددة لرسائل النجاح
            const successPatterns = [
                '//*[contains(text(), "verification")]',
                '//*[contains(text(), "check your email")]',
                '//*[contains(text(), "verify")]',
                '//*[contains(text(), "email sent")]',
                '//*[contains(text(), "confirmation")]'
            ];

            for (const pattern of successPatterns) {
                try {
                    await driver.wait(until.elementLocated(By.xpath(pattern)), 30000);
                    this.logger.success('✅ تم إرسال طلب إنشاء الحساب بنجاح');
                    return;
                } catch (e) {
                    continue;
                }
            }

            // التحقق من عدم وجود أخطاء
            await this.checkForErrors(driver);
            this.logger.warning('⚠️ لم يتم العثور على رسالة تأكيد واضحة');
            
        } catch (error) {
            throw new Error(`فشل التحقق من إنشاء الحساب: ${error.message}`);
        }
    }

    async checkForErrors(driver) {
        try {
            const errorSelectors = [
                '.error',
                '.alert-error',
                '[class*="error"]',
                '.AnimatedForm__errorMessage',
                '[data-testid="error-message"]'
            ];

            for (const selector of errorSelectors) {
                const errorElements = await driver.findElements(By.css(selector));
                if (errorElements.length > 0) {
                    const errorText = await errorElements[0].getText();
                    if (errorText && errorText.length > 0) {
                        throw new Error(`رفض من Reddit: ${errorText.substring(0, 100)}`);
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async getVerificationCodeAdvanced(driver, emailData) {
        try {
            this.logger.production('⏳ انتظار رسالة التحقق...');
            
            const totalWaitTime = 300000; // 5 دقائق كحد أقصى
            const checkInterval = 30000; // التحقق كل 30 ثانية
            
            for (let waited = 0; waited < totalWaitTime; waited += checkInterval) {
                this.logger.production(`🔄 فحص البريد... (${Math.round(waited/1000)} ثانية)`);
                
                const verificationCode = await this.checkForVerificationEmail(driver, emailData);
                if (verificationCode) {
                    return verificationCode;
                }
                
                if (waited < totalWaitTime - checkInterval) {
                    await this.delay(checkInterval);
                }
            }
            
            this.logger.warning('⏰ انتهى وقت انتظار الرسالة');
            return null;
            
        } catch (error) {
            this.logger.warning(`⚠️ خطأ في استخراج رمز التحقق: ${error.message}`);
            return null;
        }
    }

    async checkForVerificationEmail(driver, emailData) {
        try {
            // تحديث الصفحة بناءً على خدمة البريد المستخدمة
            await driver.navigate().refresh();
            await this.delay(5000); // انتظار تحميل الصفحة
            
            if (emailData.service === 'besttemporaryemail') {
                return await this.extractCodeFromBestTempEmail(driver);
            } else {
                return await this.extractCodeFrom10MinuteMail(driver);
            }
            
        } catch (error) {
            this.logger.warning(`⚠️ خطأ في فحص البريد: ${error.message}`);
            return null;
        }
    }

    async extractCodeFromBestTempEmail(driver) {
        try {
            // استراتيجيات متعددة للعثور على رسالة Reddit
            const messageSelectors = [
                '//*[contains(text(), "Reddit")]',
                '//*[contains(text(), "reddit")]',
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
                        await driver.executeScript("arguments[0].click();", elements[0]);
                        await this.delay(3000);
                        
                        // استخراج النص من الجسم الرئيسي
                        const bodyText = await driver.findElement(By.css('body')).getText();
                        const code = this.extractVerificationCode(bodyText);
                        
                        if (code) {
                            return code;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return null;
            
        } catch (error) {
            throw new Error(`فشل استخراج الرمز من besttemporaryemail: ${error.message}`);
        }
    }

    async extractCodeFrom10MinuteMail(driver) {
        try {
            const redditElements = await driver.findElements(
                By.xpath('//*[contains(text(), "Reddit")]')
            );
            
            if (redditElements.length > 0) {
                await driver.executeScript("arguments[0].click();", redditElements[0]);
                
                await driver.wait(until.elementLocated(
                    By.css('.message-body, .email-content, .mail-body, [class*="content"]')
                ), 15000);
                
                const messageBody = await driver.findElement(
                    By.css('.message-body, .email-content, .mail-body, [class*="content"]')
                );
                const messageText = await messageBody.getText();
                
                return this.extractVerificationCode(messageText);
            }
            
            return null;
            
        } catch (error) {
            throw new Error(`فشل استخراج الرمز من 10minutemail: ${error.message}`);
        }
    }

    extractVerificationCode(text) {
        const otpPatterns = [
            /\b\d{6}\b/,
            /code:\s*(\d{6})/i,
            /verification code:\s*(\d{6})/i,
            /code is:\s*(\d{6})/i,
            /:\s*(\d{6})/,
            /"(\d{6})"/,
            /code\s*[:\-]\s*(\d{6})/i,
            /verification\s*[:\-]\s*(\d{6})/i
        ];
        
        for (const pattern of otpPatterns) {
            const match = text.match(pattern);
            if (match) {
                const code = match[1] || match[0];
                this.logger.success(`✅ تم العثور على رمز التحقق: ${code}`);
                return code;
            }
        }
        
        return null;
    }

    async humanLikeDelay(min = 1000, max = 3000) {
        const delayTime = Math.floor(Math.random() * (max - min)) + min;
        await this.delay(delayTime);
    }

    generateProductionUsername() {
        const prefixes = ['user', 'reddit', 'auto', 'bot', 'creator', 'maker', 'gamer', 'player', 'pro', 'master'];
        const suffixes = ['pro', 'master', 'expert', 'king', 'queen', 'star', 'hero', 'legend', 'prime', 'elite'];
        const numbers = Math.floor(Math.random() * 10000);
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix}_${suffix}_${numbers}`.toLowerCase();
    }

    generateProductionPassword() {
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*';
        
        let password = '';
        password += upper[Math.floor(Math.random() * upper.length)];
        password += lower[Math.floor(Math.random() * lower.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        const allChars = lower + upper + numbers + symbols;
        const targetLength = Math.floor(Math.random() * 4) + 10; // 10-14 حرف
        
        for (let i = password.length; i < targetLength; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { SeleniumManager };

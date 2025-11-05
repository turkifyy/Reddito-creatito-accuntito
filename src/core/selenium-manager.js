const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { SystemLogger } = require('./logger');

class SeleniumManager {
    constructor() {
        this.logger = new SystemLogger();
    }

    async validateEnvironment() {
        try {
            this.logger.production('🔍 اختبار Selenium بدون بروكسي...');
            
            // اختبار بدون بروكسي أولاً
            const testDriver = await this.createDriver(null); // بدون بروكسي
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
            
            // إعدادات متقدمة للاستقرار
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

            options.excludeSwitches(['enable-automation']);
            options.setUserPreferences({
                'credentials_enable_service': false,
                'profile.password_manager_enabled': false
            });

            // إعداد البروكسي فقط إذا كان صالحاً
            if (proxy && await this.testProxyConnection(proxy)) {
                options.addArguments(`--proxy-server=http://${proxy.host}:${proxy.port}`);
                this.logger.production(`🌐 استخدام بروكسي: ${proxy.host}:${proxy.port}`);
            } else {
                this.logger.warning('🚫 تشغيل بدون بروكسي - البروكسي غير صالح');
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

            // إزالة خصائص automation
            await driver.executeScript(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            );

            return driver;
            
        } catch (error) {
            throw new Error(`فشل إنشاء متصفح: ${error.message}`);
        }
    }

    async testProxyConnection(proxy) {
        try {
            const { HttpsProxyAgent } = require('https-proxy-agent');
            const axios = require('axios');
            
            const agent = new HttpsProxyAgent(`http://${proxy.host}:${proxy.port}`);
            
            const response = await axios.get('http://httpbin.org/ip', {
                httpsAgent: agent,
                timeout: 15000
            });

            return response.status === 200;
            
        } catch (error) {
            this.logger.warning(`❌ بروكسي غير صالح: ${proxy.host}:${proxy.port}`);
            return false;
        }
    }

    async createRedditAccount(proxy) {
        let driver;
        
        try {
            this.logger.production('🌐 بدء إنشاء حساب Reddit...');
            
            // محاولة مع بروكسي، إذا فشل حاول بدون بروكسي
            let attempts = 0;
            const maxAttempts = 2;
            
            while (attempts < maxAttempts) {
                attempts++;
                try {
                    if (attempts === 1 && proxy) {
                        driver = await this.createDriver(proxy);
                    } else {
                        this.logger.warning('🔄 المحاولة بدون بروكسي...');
                        driver = await this.createDriver(null);
                    }
                    
                    // 1. الحصول على بريد مؤقت
                    const emailData = await this.getTempEmail(driver);
                    this.logger.production(`📧 البريد المؤقت: ${emailData.email}`);
                    
                    // 2. إنشاء حساب Reddit
                    const accountData = await this.createRedditWithSelenium(driver, emailData.email);
                    this.logger.production(`👤 اسم المستخدم: ${accountData.username}`);
                    
                    // 3. استخراج رمز التحقق
                    const verificationCode = await this.getVerificationCode(driver, emailData.sessionId);
                    
                    return {
                        success: true,
                        email: emailData.email,
                        username: accountData.username,
                        password: accountData.password,
                        verification_code: verificationCode,
                        timestamp: new Date().toISOString(),
                        proxy_used: attempts === 1 ? `${proxy.host}:${proxy.port}` : 'NO_PROXY'
                    };

                } catch (error) {
                    if (attempts < maxAttempts) {
                        this.logger.warning(`🔄 إعادة المحاولة ${attempts}/${maxAttempts}: ${error.message}`);
                        if (driver) {
                            try { await driver.quit(); } catch (e) {}
                        }
                        await this.delay(5000);
                    } else {
                        throw error;
                    }
                }
            }
            
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
        try {
            await driver.get('https://10minutemail.com');
            
            let emailElement;
            for (let attempt = 0; attempt < 5; attempt++) {
                try {
                    emailElement = await driver.wait(
                        until.elementLocated(By.css('#mailAddress, .mail-address, [class*="email"]')),
                        10000
                    );
                    const email = await emailElement.getAttribute('value');
                    
                    if (email && email.includes('@')) {
                        return {
                            email: email,
                            sessionId: 'session_' + Date.now()
                        };
                    }
                } catch (e) {
                    if (attempt === 4) throw e;
                    await this.delay(2000);
                    await driver.navigate().refresh();
                }
            }
            
            throw new Error('لم يتم العثور على بريد إلكتروني صالح');
            
        } catch (error) {
            throw new Error(`فشل الحصول على البريد: ${error.message}`);
        }
    }

    async createRedditWithSelenium(driver, email) {
        try {
            await driver.get('https://www.reddit.com/register/');
            
            await driver.wait(until.elementLocated(By.css('input[name="email"]')), 30000);
            
            const username = this.generateUsername();
            const password = this.generatePassword();
            
            this.logger.production(`🔐 إنشاء بيانات الاعتماد: ${username}`);
            
            await this.humanLikeDelay(1000, 3000);
            
            // ملء نموذج التسجيل
            const emailField = await driver.findElement(By.css('input[name="email"]'));
            await emailField.clear();
            await this.humanLikeDelay(500, 1500);
            await emailField.sendKeys(email);
            
            await this.humanLikeDelay(1000, 2000);
            
            const usernameField = await driver.findElement(By.css('input#regUsername, input[name="username"]'));
            await usernameField.clear();
            await this.humanLikeDelay(500, 1500);
            await usernameField.sendKeys(username);
            
            await this.humanLikeDelay(1000, 2000);
            
            const passwordField = await driver.findElement(By.css('input#regPassword, input[name="password"]'));
            await passwordField.clear();
            await this.humanLikeDelay(500, 1500);
            await passwordField.sendKeys(password);
            
            await this.humanLikeDelay(2000, 4000);
            
            // النقر على زر التسجيل
            const signupButton = await driver.findElement(By.css('button[type="submit"], .signup-button'));
            await driver.executeScript("arguments[0].click();", signupButton);
            
            // انتظار الاستجابة
            try {
                await driver.wait(until.elementLocated(
                    By.xpath('//*[contains(text(), "verification") or contains(text(), "check your email") or contains(text(), "verify") or contains(text(), "email sent")]')
                ), 45000);
                
                this.logger.production('✅ تم إرسال طلب إنشاء الحساب بنجاح');
                
            } catch (timeoutError) {
                // التحقق من وجود أخطاء
                const errorElements = await driver.findElements(By.css('.error, .alert-error, [class*="error"], .AnimatedForm__errorMessage'));
                if (errorElements.length > 0) {
                    const errorText = await errorElements[0].getText();
                    throw new Error(`رفض من Reddit: ${errorText.substring(0, 100)}`);
                }
                
                this.logger.warning('⚠️ لم يتم العثور على رسالة التأكيد، لكن المتابعة مستمرة');
            }
            
            return {
                username: username,
                password: password
            };
            
        } catch (error) {
            throw new Error(`فشل إنشاء حساب Reddit: ${error.message}`);
        }
    }

    async getVerificationCode(driver, sessionId) {
        try {
            const totalWaitTime = Math.floor(Math.random() * 120000) + 180000;
            const checkInterval = 45000;
            
            for (let waited = 0; waited < totalWaitTime; waited += checkInterval) {
                this.logger.production(`⏳ انتظار الرسالة... (${Math.round(waited/1000)} ثانية)`);
                
                try {
                    await driver.navigate().refresh();
                    
                    const redditSelectors = [
                        '//*[contains(text(), "Reddit")]',
                        '//*[contains(text(), "verification")]',
                        '//*[contains(text(), "verify")]',
                        '//*[contains(text(), "code")]',
                        '[class*="reddit"]',
                        '[class*="verification"]'
                    ];
                    
                    for (const selector of redditSelectors) {
                        try {
                            const elements = selector.startsWith('//') ? 
                                await driver.findElements(By.xpath(selector)) :
                                await driver.findElements(By.css(selector));
                                
                            if (elements.length > 0) {
                                await driver.executeScript("arguments[0].click();", elements[0]);
                                
                                await driver.wait(until.elementLocated(
                                    By.css('.message-body, .email-content, .mail-body, [class*="content"], .message')
                                ), 20000);
                                
                                const messageBody = await driver.findElement(
                                    By.css('.message-body, .email-content, .mail-body, [class*="content"], .message')
                                );
                                const messageText = await messageBody.getText();
                                
                                const otpPatterns = [
                                    /\b\d{6}\b/,
                                    /code:\s*(\d{6})/i,
                                    /verification code:\s*(\d{6})/i,
                                    /code is:\s*(\d{6})/i,
                                    /:\s*(\d{6})/,
                                    /"(\d{6})"/
                                ];
                                
                                for (const pattern of otpPatterns) {
                                    const otpMatch = messageText.match(pattern);
                                    if (otpMatch) {
                                        const code = otpMatch[1] || otpMatch[0];
                                        this.logger.success(`✅ تم العثور على رمز التحقق: ${code}`);
                                        return code;
                                    }
                                }
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                    
                } catch (refreshError) {
                    this.logger.warning(`⚠️ خطأ في تحديث الصفحة: ${refreshError.message}`);
                }
                
                await this.delay(checkInterval);
            }
            
            this.logger.warning('⏰ انتهى وقت انتظار الرسالة');
            return null;
            
        } catch (error) {
            this.logger.warning(`⚠️ لم يتم العثور على رمز التحقق: ${error.message}`);
            return null;
        }
    }

    async humanLikeDelay(min = 500, max = 2000) {
        const delayTime = Math.floor(Math.random() * (max - min)) + min;
        await this.delay(delayTime);
    }

    generateUsername() {
        const prefixes = ['user', 'reddit', 'auto', 'bot', 'creator', 'maker', 'gamer', 'player'];
        const suffixes = ['pro', 'master', 'expert', 'king', 'queen', 'star', 'hero', 'legend'];
        const numbers = Math.floor(Math.random() * 10000);
        
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix}_${suffix}_${numbers}`;
    }

    generatePassword() {
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
        const targetLength = Math.floor(Math.random() * 4) + 10;
        
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

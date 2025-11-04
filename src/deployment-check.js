const { SystemLogger } = require('./core/logger');

const logger = new SystemLogger();

async function deploymentCheck() {
    logger.production('🔍 فحص نشر نظام الإنتاج...');
    
    const requiredEnvVars = ['PROXY_LIST', 'GOOGLE_CREDENTIALS', 'SHEET_ID'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        logger.error(`❌ متغيرات بيئية مفقودة: ${missingVars.join(', ')}`);
        process.exit(1);
    }
    
    logger.success('✅ جميع المتغيرات البيئية موجودة');
    
    const proxyCount = process.env.PROXY_LIST.split('\n').filter(line => line.trim()).length;
    logger.info(`📡 عدد البروكسيات: ${proxyCount}`);
    
    if (proxyCount < 100) {
        logger.warning('⚠️ عدد البروكسيات منخفض جداً');
    }
    
    try {
        const axios = require('axios');
        await axios.get('https://www.google.com', { timeout: 10000 });
        logger.success('✅ اتصال الإنترنت نشط');
    } catch (error) {
        logger.error('❌ فشل الاتصال بالإنترنت');
        process.exit(1);
    }
    
    try {
        const { execSync } = require('child_process');
        const chromeVersion = execSync('google-chrome --version').toString().trim();
        logger.success(`✅ ${chromeVersion}`);
    } catch (error) {
        logger.error('❌ Chrome غير مثبت بشكل صحيح');
        process.exit(1);
    }
    
    logger.production('🎉 فحص النشر مكتمل - النظام جاهز للإنتاج');
}

deploymentCheck().catch(error => {
    logger.error(`💥 فشل فحص النشر: ${error.message}`);
    process.exit(1);
});

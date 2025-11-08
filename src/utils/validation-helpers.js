/**
 * 🛡️ أدوات التحقق والتحقق من الصحة المتقدمة V2
 * @version 2.0.0
 * @class ValidationHelpers
 */

import { Logger } from '../core/logger.js';
import advancedHelpers from './helpers.js';

class ValidationHelpers {
    constructor() {
        this.logger = new Logger();
        this.validators = new Map();
        this.initializeValidators();
    }

    /**
     * تهيئة المدققات
     */
    initializeValidators() {
        // مدققات البريد الإلكتروني
        this.validators.set('email', this.validateEmailAdvanced.bind(this));
        
        // مدققات كلمات المرور
        this.validators.set('password', this.validatePasswordStrength.bind(this));
        
        // مدققات أسماء المستخدمين
        this.validators.set('username', this.validateUsername.bind(this));
        
        // مدققات URLs
        this.validators.set('url', this.validateUrl.bind(this));
        
        // مدققات البيانات
        this.validators.set('data', this.validateDataStructure.bind(this));
    }

    /**
     * تحقق متقدم من البريد الإلكتروني
     */
    validateEmailAdvanced(email, options = {}) {
        const basicValidation = advancedHelpers.validateEmail(email, options);
        
        if (!basicValidation.isValid) {
            return basicValidation;
        }

        const advancedChecks = {
            disposable: this.isDisposableEmail(basicValidation.domain),
            mxRecords: options.checkMx ? this.hasMxRecords(basicValidation.domain) : true,
            typoSquatting: this.checkTypoSquatting(basicValidation.domain)
        };

        const issues = [];
        if (advancedChecks.disposable && options.blockDisposable) {
            issues.push('بريد مؤقت غير مسموح');
        }

        return {
            ...basicValidation,
            advancedChecks,
            issues,
            isAcceptable: issues.length === 0
        };
    }

    /**
     * التحقق من قوة كلمة المرور
     */
    validatePasswordStrength(password, options = {}) {
        const requirements = {
            minLength: options.minLength || 8,
            requireUppercase: options.requireUppercase !== false,
            requireLowercase: options.requireLowercase !== false,
            requireNumbers: options.requireNumbers !== false,
            requireSymbols: options.requireSymbols !== false
        };

        const issues = [];

        if (password.length < requirements.minLength) {
            issues.push(`يجب أن تكون كلمة المرور ${requirements.minLength} أحرف على الأقل`);
        }

        if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
            issues.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
        }

        if (requirements.requireLowercase && !/[a-z]/.test(password)) {
            issues.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
        }

        if (requirements.requireNumbers && !/\d/.test(password)) {
            issues.push('يجب أن تحتوي على رقم واحد على الأقل');
        }

        if (requirements.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            issues.push('يجب أن تحتوي على رمز خاص واحد على الأقل');
        }

        // حساب قوة كلمة المرور
        const strength = this.calculatePasswordStrength(password);

        return {
            isValid: issues.length === 0,
            strength: strength,
            score: this.getPasswordScore(strength),
            issues: issues,
            meetsRequirements: issues.length === 0
        };
    }

    /**
     * حساب قوة كلمة المرور
     */
    calculatePasswordStrength(password) {
        let score = 0;

        // الطول
        if (password.length >= 12) score += 2;
        else if (password.length >= 8) score += 1;

        // التنوع
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[^a-zA-Z\d]/.test(password)) score += 1;

        // الأنماط الشائعة
        if (/(.)\1{2,}/.test(password)) score -= 1; // تكرار الأحرف
        if (/123|abc|qwerty/i.test(password)) score -= 2; // تسلسلات شائعة

        if (score >= 5) return 'strong';
        if (score >= 3) return 'medium';
        return 'weak';
    }
}

export { ValidationHelpers };

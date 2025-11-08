/**
 * 📧 قائمة مجالات البريد الإلكتروني المجانية المدعومة
 * @version 2.0.0
 * @description مجالات بريد مجانية مدعومة في النظام V2
 */

export const FREE_EMAIL_DOMAINS = {
    // المجالات الرئيسية المدعومة
    primary: [
        'besttemporaryemail.com',
        'tempmail.com',
        'tmpmail.org',
        '10minutemail.com',
        'mailinator.com',
        'guerrillamail.com',
        'yopmail.com',
        'throwawaymail.com'
    ],
    
    // المجالات الاحتياطية
    secondary: [
        'fakeinbox.com',
        'getairmail.com',
        'maildrop.cc',
        'temp-mail.org',
        'trashmail.com',
        'disposablemail.com',
        'tempail.com'
    ],
    
    // المجالات المتخصصة
    specialized: [
        'tempmailaddress.com',
        'mytemp.email',
        'tmpmail.net',
        'sandbox.com'
    ]
};

/**
 * الحصول على مجال عشوائي
 */
export function getRandomDomain() {
    const allDomains = [
        ...FREE_EMAIL_DOMAINS.primary,
        ...FREE_EMAIL_DOMAINS.secondary,
        ...FREE_EMAIL_DOMAINS.specialized
    ];
    
    return allDomains[Math.floor(Math.random() * allDomains.length)];
}

/**
 * التحقق من صحة المجال
 */
export function isValidDomain(domain) {
    const allDomains = [
        ...FREE_EMAIL_DOMAINS.primary,
        ...FREE_EMAIL_DOMAINS.secondary,
        ...FREE_EMAIL_DOMAINS.specialized
    ];
    
    return allDomains.includes(domain);
}

export default FREE_EMAIL_DOMAINS;
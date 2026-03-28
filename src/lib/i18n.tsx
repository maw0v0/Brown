import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Language = 'ar' | 'en';

const translations = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    genres: 'التصنيفات',
    teams: 'الفرق',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    dashboard: 'لوحة التحكم',
    search: 'بحث...',
    
    // Home
    featuredManhwa: 'مانهوا مميزة',
    latestChapters: 'آخر الفصول',
    popularManhwa: 'الأكثر شعبية',
    viewAll: 'عرض الكل',
    
    // Manhwa details
    chapters: 'الفصول',
    description: 'الوصف',
    status: 'الحالة',
    rating: 'التقييم',
    rateThis: 'قيّم هذا',
    comments: 'التعليقات',
    addComment: 'أضف تعليقاً',
    reply: 'رد',
    like: 'إعجاب',
    dislike: 'عدم إعجاب',
    report: 'إبلاغ',
    edit: 'تعديل',
    delete: 'حذف',
    ongoing: 'مستمر',
    completed: 'مكتمل',
    hiatus: 'متوقف',
    
    // Reader
    previousChapter: 'الفصل السابق',
    nextChapter: 'الفصل التالي',
    verticalScroll: 'تمرير عمودي',
    pageByPage: 'صفحة صفحة',
    followUs: 'تابعونا',
    chapterRating: 'تقييم الفصل',
    
    // Teams
    members: 'الأعضاء',
    joinRequest: 'طلب انضمام',
    socialLinks: 'روابط التواصل',
    latestReleases: 'آخر الإصدارات',
    projectsTaken: 'المشاريع المأخوذة',
    
    // Auth
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetPassword: 'إعادة تعيين كلمة المرور',
    username: 'اسم المستخدم',
    
    // Profile
    favorites: 'المفضلة',
    readingHistory: 'سجل القراءة',
    bio: 'نبذة',
    
    // Coins
    coins: 'العملات',
    buyCoins: 'شراء عملات',
    locked: 'مقفل',
    unlock: 'فتح',
    free: 'مجاني',
    premium: 'مميز',
    membership: 'العضوية',
    price: 'السعر',
    
    // Admin
    addManhwa: 'إضافة مانهوا',
    editManhwa: 'تعديل المانهوا',
    publishChapter: 'نشر فصل',
    manageUsers: 'إدارة المستخدمين',
    manageComments: 'إدارة التعليقات',
    manageTeams: 'إدارة الفرق',
    manageGenres: 'إدارة التصنيفات',
    manageCoins: 'إدارة العملات',
    statistics: 'الإحصائيات',
    totalManhwa: 'عدد المانهوا',
    totalChapters: 'عدد الفصول',
    totalUsers: 'عدد المستخدمين',
    
    // General
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    loading: 'جاري التحميل...',
    noResults: 'لا توجد نتائج',
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
  },
  en: {
    home: 'Home',
    genres: 'Genres',
    teams: 'Teams',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    profile: 'Profile',
    settings: 'Settings',
    dashboard: 'Dashboard',
    search: 'Search...',
    
    featuredManhwa: 'Featured Manhwa',
    latestChapters: 'Latest Chapters',
    popularManhwa: 'Most Popular',
    viewAll: 'View All',
    
    chapters: 'Chapters',
    description: 'Description',
    status: 'Status',
    rating: 'Rating',
    rateThis: 'Rate This',
    comments: 'Comments',
    addComment: 'Add Comment',
    reply: 'Reply',
    like: 'Like',
    dislike: 'Dislike',
    report: 'Report',
    edit: 'Edit',
    delete: 'Delete',
    ongoing: 'Ongoing',
    completed: 'Completed',
    hiatus: 'Hiatus',
    
    previousChapter: 'Previous Chapter',
    nextChapter: 'Next Chapter',
    verticalScroll: 'Vertical Scroll',
    pageByPage: 'Page by Page',
    followUs: 'Follow Us',
    chapterRating: 'Chapter Rating',
    
    members: 'Members',
    joinRequest: 'Join Request',
    socialLinks: 'Social Links',
    latestReleases: 'Latest Releases',
    projectsTaken: 'Projects Taken',
    
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    username: 'Username',
    
    favorites: 'Favorites',
    readingHistory: 'Reading History',
    bio: 'Bio',
    
    coins: 'Coins',
    buyCoins: 'Buy Coins',
    locked: 'Locked',
    unlock: 'Unlock',
    free: 'Free',
    premium: 'Premium',
    membership: 'Membership',
    price: 'Price',
    
    addManhwa: 'Add Manhwa',
    editManhwa: 'Edit Manhwa',
    publishChapter: 'Publish Chapter',
    manageUsers: 'Manage Users',
    manageComments: 'Manage Comments',
    manageTeams: 'Manage Teams',
    manageGenres: 'Manage Genres',
    manageCoins: 'Manage Coins',
    statistics: 'Statistics',
    totalManhwa: 'Total Manhwa',
    totalChapters: 'Total Chapters',
    totalUsers: 'Total Users',
    
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
    noResults: 'No Results',
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
  },
} as const;

type TranslationKey = keyof typeof translations.ar;

interface I18nContextType {
  lang: Language;
  t: (key: TranslationKey) => string;
  setLang: (lang: Language) => void;
  dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'ar';
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('lang', newLang);
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return translations[lang][key] || key;
  }, [lang]);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [dir, lang]);

  return (
    <I18nContext.Provider value={{ lang, t, setLang, dir }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

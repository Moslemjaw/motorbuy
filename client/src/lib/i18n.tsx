import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface Translations {
  [key: string]: string;
}

const en: Translations = {
  // Brand
  "brand.name": "MotorBuy",
  "brand.letter": "M",
  
  // Navbar
  "nav.home": "Home",
  "nav.products": "Products",
  "nav.vendors": "Vendors",
  "nav.cart": "Cart",
  "nav.login": "Login",
  "nav.logout": "Logout",
  "nav.dashboard": "Dashboard",
  "nav.account": "Account",
  "nav.wallet": "Wallet",
  "nav.admin": "Admin",
  
  // Hero
  "hero.title": "Find the Perfect Parts for Your",
  "hero.title.highlight": "Ride",
  "hero.subtitle": "Connect with trusted vendors, discover quality parts, and build your dream machine. All in one marketplace.",
  "hero.shopParts": "Shop Parts",
  "hero.browseVendors": "Browse Vendors",
  
  // Stats
  "stats.products": "Products",
  "stats.vendors": "Vendors",
  "stats.categories": "Categories",
  
  // Sections
  "section.categories": "Shop by Category",
  "section.categories.subtitle": "Find exactly what your vehicle needs",
  "section.newArrivals": "New Arrivals",
  "section.newArrivals.subtitle": "Fresh stock from our top vendors",
  "section.spotlight": "Vendor Spotlight",
  "section.spotlight.subtitle": "Featured promotions and updates from our vendors",
  "section.whyUs": "Why Choose MotorBuy?",
  "section.whyUs.subtitle": "Your trusted automotive parts marketplace in Kuwait",
  
  // Features
  "feature.quality": "Quality Parts",
  "feature.quality.desc": "All parts verified for quality and authenticity",
  "feature.delivery": "Fast Delivery",
  "feature.delivery.desc": "Quick delivery across Kuwait",
  "feature.support": "24/7 Support",
  "feature.support.desc": "Customer support always available",
  "feature.secure": "Secure Payments",
  "feature.secure.desc": "Safe and secure transactions",
  
  // Common
  "common.viewAll": "View All",
  "common.browse": "Browse",
  "common.add": "Add",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.sort": "Sort",
  "common.price": "Price",
  "common.kwd": "KWD",
  "common.addToCart": "Add to Cart",
  "common.inStock": "In Stock",
  "common.outOfStock": "Out of Stock",
  "common.noResults": "No results found",
  "common.loading": "Loading...",
  
  // Product
  "product.off": "{percent}% OFF",
  "product.adding": "Adding...",
  "product.pleaseLogin": "Please login",
  "product.loginRequired": "You need to be logged in to add items to cart",
  "product.addedToCart": "Added to cart",
  "product.addedToCartDesc": "added to your cart",
  
  // Auth
  "auth.login": "Sign In",
  "auth.signup": "Sign Up",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.firstName": "First Name",
  "auth.lastName": "Last Name",
  "auth.haveAccount": "Already have an account?",
  "auth.noAccount": "Don't have an account?",
  "auth.welcome": "Welcome back!",
  "auth.welcomeSubtitle": "Sign in to your account",
  "auth.createAccount": "Create Account",
  "auth.createSubtitle": "Fill in your details to create an account",
  "auth.signedInAs": "You are signed in as",
  "auth.goHome": "Go to Home",
  "auth.customerDashboard": "Customer Dashboard",
  "auth.vendorDashboard": "Vendor Dashboard",
  "auth.adminDashboard": "Admin Dashboard",
  "auth.signOut": "Sign Out",
  "auth.loginSuccess": "Welcome back!",
  "auth.loginSuccessDesc": "You have successfully logged in.",
  "auth.signupSuccess": "Account created!",
  "auth.signupSuccessDesc": "Welcome to MotorBuy.",
  "auth.loggedOut": "Logged out",
  "auth.loggedOutDesc": "You have been logged out.",
  "auth.error": "Error",
  "auth.backHome": "Back to Home",
  "auth.createOne": "Create one",
  "auth.signIn": "Sign in",
  "auth.passwordHint": "At least 6 characters",
  "auth.enterEmail": "Enter your email and password to sign in",
  "auth.genericError": "An error occurred",
  "auth.defaultUser": "User",
  
  // Footer
  "footer.about": "About MotorBuy",
  "footer.aboutText": "Your trusted marketplace for quality automotive parts in Kuwait.",
  "footer.services": "Our Services",
  "footer.support": "Support",
  "footer.legal": "Legal",
  "footer.contact": "Contact Us",
  "footer.terms": "Terms & Conditions",
  "footer.privacy": "Privacy Policy",
  "footer.faq": "FAQ",
  "footer.rights": "All rights reserved",
  "footer.followUs": "Follow Us",
  
  // Vendor
  "vendor.dashboard": "Vendor Dashboard",
  "vendor.products": "My Products",
  "vendor.orders": "Orders",
  "vendor.spotlight": "Create Spotlight",
  "vendor.yourSpotlights": "Your Spotlights",
  "vendor.analytics": "Analytics",
  
  // Customer
  "customer.orders": "My Orders",
  "customer.wishlist": "Wishlist",
  "customer.profile": "Profile",
  
  // Categories
  "cat.engine-parts": "Engine Parts",
  "cat.brakes": "Brakes",
  "cat.suspension": "Suspension",
  "cat.electrical": "Electrical",
  "cat.filters": "Filters",
  "cat.cooling-system": "Cooling System",
  "cat.transmission": "Transmission",
  "cat.fuel-system": "Fuel System",
  "cat.exhaust": "Exhaust",
  "cat.body-parts": "Body Parts",
  "cat.interior": "Interior",
  "cat.wheels-tires": "Wheels & Tires",
  "cat.lighting": "Lighting",
  "cat.fluids-chemicals": "Fluids & Chemicals",
  
  // Browse Parts Page
  "products.title": "Browse Parts",
  "products.subtitle": "Find exactly what you need for your vehicle from trusted vendors.",
  "products.count": "Products",
  "products.searchPlaceholder": "Search parts by name or brand...",
  "products.allCategories": "All Categories",
  "products.newestArrivals": "Newest Arrivals",
  "products.priceLowHigh": "Price: Low to High",
  "products.priceHighLow": "Price: High to Low",
  "products.noProducts": "No products found",
  "products.noProductsDesc": "Try adjusting your search or filter criteria to find what you're looking for.",
  "products.clearFilters": "Clear All Filters",
  "products.tagline": "Kuwait's premier auto parts marketplace",
  
  // Vendors Page
  "vendors.title": "Our Vendors",
  "vendors.subtitle": "Trusted shops and expert parts dealers serving automotive enthusiasts across Kuwait.",
  "vendors.count": "Verified Vendors",
  "vendors.verified": "Verified Seller",
  "vendors.visitShop": "Visit Shop",
  "vendors.noVendors": "No vendors yet",
  "vendors.noVendorsDesc": "Check back soon as we onboard new automotive parts vendors.",
  "vendors.defaultDesc": "Quality automotive parts and accessories.",
  "vendors.location": "Kuwait",
  
  // Stories Page
  "stories.title": "Vendor Stories",
  "stories.subtitle": "Latest updates, promotions, and announcements from our trusted vendors.",
  "stories.feedBadge": "Community Feed",
  "stories.noStories": "No stories yet",
  "stories.noStoriesDesc": "Check back soon for updates from our vendors.",
  "stories.browseVendors": "Browse Vendors",
  "stories.recently": "Recently",
  "stories.noContent": "No content",
};

const ar: Translations = {
  // Brand
  "brand.name": "موتورباي",
  "brand.letter": "م",
  
  // Navbar
  "nav.home": "الرئيسية",
  "nav.products": "المنتجات",
  "nav.vendors": "الموردين",
  "nav.cart": "السلة",
  "nav.login": "تسجيل الدخول",
  "nav.logout": "تسجيل الخروج",
  "nav.dashboard": "لوحة التحكم",
  "nav.account": "حسابي",
  "nav.wallet": "المحفظة",
  "nav.admin": "الإدارة",
  
  // Hero
  "hero.title": "اعثر على قطع الغيار المثالية",
  "hero.title.highlight": "لسيارتك",
  "hero.subtitle": "تواصل مع موردين موثوقين، اكتشف قطع غيار عالية الجودة، وابني سيارة أحلامك. كل ذلك في سوق واحد.",
  "hero.shopParts": "تسوق القطع",
  "hero.browseVendors": "تصفح الموردين",
  
  // Stats
  "stats.products": "المنتجات",
  "stats.vendors": "الموردين",
  "stats.categories": "الفئات",
  
  // Sections
  "section.categories": "تسوق حسب الفئة",
  "section.categories.subtitle": "اعثر على ما تحتاجه سيارتك بالضبط",
  "section.newArrivals": "وصل حديثاً",
  "section.newArrivals.subtitle": "مخزون جديد من أفضل موردينا",
  "section.spotlight": "عروض الموردين",
  "section.spotlight.subtitle": "عروض ترويجية وتحديثات مميزة من موردينا",
  "section.whyUs": "لماذا نحن؟",
  "section.whyUs.subtitle": "سوقك الموثوق لقطع غيار السيارات في الكويت",
  
  // Features
  "feature.quality": "قطع غيار أصلية",
  "feature.quality.desc": "جميع القطع موثقة للجودة والأصالة",
  "feature.delivery": "توصيل سريع",
  "feature.delivery.desc": "توصيل سريع في جميع أنحاء الكويت",
  "feature.support": "دعم متواصل",
  "feature.support.desc": "خدمة العملاء متاحة دائماً",
  "feature.secure": "دفع آمن",
  "feature.secure.desc": "معاملات آمنة ومضمونة",
  
  // Common
  "common.viewAll": "عرض الكل",
  "common.browse": "تصفح",
  "common.add": "إضافة",
  "common.save": "حفظ",
  "common.cancel": "إلغاء",
  "common.delete": "حذف",
  "common.edit": "تعديل",
  "common.search": "بحث",
  "common.filter": "تصفية",
  "common.sort": "ترتيب",
  "common.price": "السعر",
  "common.kwd": "د.ك",
  "common.addToCart": "أضف للسلة",
  "common.inStock": "متوفر",
  "common.outOfStock": "غير متوفر",
  "common.noResults": "لا توجد نتائج",
  "common.loading": "جاري التحميل...",
  
  // Product
  "product.off": "خصم {percent}%",
  "product.adding": "جاري الإضافة...",
  "product.pleaseLogin": "الرجاء تسجيل الدخول",
  "product.loginRequired": "يجب تسجيل الدخول لإضافة المنتجات للسلة",
  "product.addedToCart": "تمت الإضافة للسلة",
  "product.addedToCartDesc": "تمت إضافته للسلة",
  
  // Auth
  "auth.login": "تسجيل الدخول",
  "auth.signup": "إنشاء حساب",
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.firstName": "الاسم الأول",
  "auth.lastName": "اسم العائلة",
  "auth.haveAccount": "لديك حساب بالفعل؟",
  "auth.noAccount": "ليس لديك حساب؟",
  "auth.welcome": "مرحباً بعودتك!",
  "auth.welcomeSubtitle": "سجل دخولك للوصول إلى حسابك",
  "auth.createAccount": "إنشاء حساب",
  "auth.createSubtitle": "أدخل بياناتك لإنشاء حساب",
  "auth.signedInAs": "أنت مسجل الدخول باسم",
  "auth.goHome": "الذهاب للرئيسية",
  "auth.customerDashboard": "لوحة تحكم العميل",
  "auth.vendorDashboard": "لوحة تحكم المورد",
  "auth.adminDashboard": "لوحة تحكم المدير",
  "auth.signOut": "تسجيل الخروج",
  "auth.loginSuccess": "مرحباً بعودتك!",
  "auth.loginSuccessDesc": "تم تسجيل الدخول بنجاح.",
  "auth.signupSuccess": "تم إنشاء الحساب!",
  "auth.signupSuccessDesc": "مرحباً بك معنا.",
  "auth.loggedOut": "تم تسجيل الخروج",
  "auth.loggedOutDesc": "تم تسجيل خروجك بنجاح.",
  "auth.error": "خطأ",
  "auth.backHome": "العودة للرئيسية",
  "auth.createOne": "أنشئ حساباً",
  "auth.signIn": "تسجيل الدخول",
  "auth.passwordHint": "٦ أحرف على الأقل",
  "auth.enterEmail": "أدخل بريدك الإلكتروني وكلمة المرور للدخول",
  "auth.genericError": "حدث خطأ",
  "auth.defaultUser": "مستخدم",
  
  // Footer
  "footer.about": "من نحن",
  "footer.aboutText": "سوقك الموثوق لقطع غيار السيارات عالية الجودة في الكويت.",
  "footer.services": "خدماتنا",
  "footer.support": "الدعم",
  "footer.legal": "قانوني",
  "footer.contact": "اتصل بنا",
  "footer.terms": "الشروط والأحكام",
  "footer.privacy": "سياسة الخصوصية",
  "footer.faq": "الأسئلة الشائعة",
  "footer.rights": "جميع الحقوق محفوظة",
  "footer.followUs": "تابعنا",
  
  // Vendor
  "vendor.dashboard": "لوحة تحكم المورد",
  "vendor.products": "منتجاتي",
  "vendor.orders": "الطلبات",
  "vendor.spotlight": "إنشاء عرض",
  "vendor.yourSpotlights": "عروضك",
  "vendor.analytics": "التحليلات",
  
  // Customer
  "customer.orders": "طلباتي",
  "customer.wishlist": "المفضلة",
  "customer.profile": "الملف الشخصي",
  
  // Categories
  "cat.engine-parts": "قطع المحرك",
  "cat.brakes": "الفرامل",
  "cat.suspension": "نظام التعليق",
  "cat.electrical": "الكهربائيات",
  "cat.filters": "الفلاتر",
  "cat.cooling-system": "نظام التبريد",
  "cat.transmission": "ناقل الحركة",
  "cat.fuel-system": "نظام الوقود",
  "cat.exhaust": "نظام العادم",
  "cat.body-parts": "قطع الهيكل",
  "cat.interior": "الداخلية",
  "cat.wheels-tires": "العجلات والإطارات",
  "cat.lighting": "الإضاءة",
  "cat.fluids-chemicals": "السوائل والكيماويات",
  
  // Browse Parts Page
  "products.title": "تصفح القطع",
  "products.subtitle": "اعثر على ما تحتاجه لسيارتك من موردين موثوقين.",
  "products.count": "منتج",
  "products.searchPlaceholder": "ابحث عن قطع بالاسم أو الماركة...",
  "products.allCategories": "جميع الفئات",
  "products.newestArrivals": "وصل حديثاً",
  "products.priceLowHigh": "السعر: من الأقل للأعلى",
  "products.priceHighLow": "السعر: من الأعلى للأقل",
  "products.noProducts": "لا توجد منتجات",
  "products.noProductsDesc": "حاول تعديل البحث أو معايير التصفية للعثور على ما تبحث عنه.",
  "products.clearFilters": "مسح جميع الفلاتر",
  "products.tagline": "سوق قطع غيار السيارات الأول في الكويت",
  
  // Vendors Page
  "vendors.title": "موردينا",
  "vendors.subtitle": "متاجر موثوقة وخبراء قطع غيار يخدمون عشاق السيارات في جميع أنحاء الكويت.",
  "vendors.count": "مورد موثق",
  "vendors.verified": "بائع موثق",
  "vendors.visitShop": "زيارة المتجر",
  "vendors.noVendors": "لا يوجد موردين حتى الآن",
  "vendors.noVendorsDesc": "عد قريباً حيث نضيف موردين جدد لقطع غيار السيارات.",
  "vendors.defaultDesc": "قطع غيار وإكسسوارات سيارات عالية الجودة.",
  "vendors.location": "الكويت",
  
  // Stories Page
  "stories.title": "قصص الموردين",
  "stories.subtitle": "آخر التحديثات والعروض الترويجية والإعلانات من موردينا الموثوقين.",
  "stories.feedBadge": "آخر الأخبار",
  "stories.noStories": "لا توجد قصص حتى الآن",
  "stories.noStoriesDesc": "عد قريباً للاطلاع على تحديثات الموردين.",
  "stories.browseVendors": "تصفح الموردين",
  "stories.recently": "مؤخراً",
  "stories.noContent": "لا يوجد محتوى",
};

const translations: Record<Language, Translations> = { en, ar };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("motorbuy-language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("motorbuy-language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

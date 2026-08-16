import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const adminEn = {
  dashboard: {
    title: "Admin Dashboard",
    subtitle: "Manage students, enrollments & content",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    marketing: "Marketing",
    logout: "Logout",
  },
  students: {
    title: "Users",
    subtitle: "Read-only overview of every student.",
    studentAdmin: "Student Admin →",
    searchPlaceholder: "Search by name or email...",
    allLevels: "All Levels",
    columns: "Columns",
    exportCsv: "Export CSV",
    noMatch: "No students match your filters",
    noMatchHint: "Try clearing filters or adjusting your search term",
    clearFilters: "Clear all filters",
    deleteConfirmTitle: "Delete student?",
    deleteConfirmDesc: "This will permanently delete {name}'s profile. This cannot be undone.",
    delete: "Delete",
    cancel: "Cancel",
  },
  enrollments: {
    title: "Enrollments",
    showLegacy: "Show Legacy",
    backfill: "Backfill Missing",
    searchPlaceholder: "Search by name, email or plan…",
    overdueOnly: "Overdue only",
    underReview: "Under Review",
    pendingPayment: "Pending Payment",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    bulkApprove: "Approve All",
    approving: "Approving…",
    clear: "Clear",
  },
  kpi: {
    activeStudents: "Active Students",
    totalRevenue: "Total Revenue",
    allEnrollments: "all enrollments",
    atRisk: "At-Risk Students",
    needAttention: "Need Attention",
    pending: "pending",
    locked: "locked",
  },
  common: {
    retry: "Retry",
    dataLoadError: "Data load error",
  },
};

const adminAr = {
  dashboard: {
    title: "لوحة الإدارة",
    subtitle: "إدارة الطلاب والتسجيلات والمحتوى",
    refresh: "تحديث",
    refreshing: "جاري التحديث…",
    marketing: "التسويق",
    logout: "تسجيل الخروج",
  },
  students: {
    title: "المستخدمون",
    subtitle: "نظرة شاملة على جميع الطلاب.",
    studentAdmin: "إدارة الطلاب ←",
    searchPlaceholder: "ابحث بالاسم أو البريد الإلكتروني...",
    allLevels: "جميع المستويات",
    columns: "الأعمدة",
    exportCsv: "تصدير CSV",
    noMatch: "لا يوجد طلاب مطابقون للفلاتر",
    noMatchHint: "حاول مسح الفلاتر أو تعديل مصطلح البحث",
    clearFilters: "مسح جميع الفلاتر",
    deleteConfirmTitle: "حذف الطالب؟",
    deleteConfirmDesc: "سيؤدي هذا إلى حذف ملف {name} نهائياً. لا يمكن التراجع عن هذا الإجراء.",
    delete: "حذف",
    cancel: "إلغاء",
  },
  enrollments: {
    title: "التسجيلات",
    showLegacy: "إظهار القديمة",
    backfill: "تعبئة المفقودة",
    searchPlaceholder: "ابحث بالاسم أو البريد أو الخطة…",
    overdueOnly: "المتأخرة فقط",
    underReview: "قيد المراجعة",
    pendingPayment: "في انتظار الدفع",
    pending: "معلقة",
    approved: "موافق عليها",
    rejected: "مرفوضة",
    bulkApprove: "الموافقة على الكل",
    approving: "جاري الموافقة…",
    clear: "مسح",
  },
  kpi: {
    activeStudents: "الطلاب النشطون",
    totalRevenue: "إجمالي الإيرادات",
    allEnrollments: "جميع التسجيلات",
    atRisk: "الطلاب في خطر",
    needAttention: "يحتاج انتباهاً",
    pending: "معلق",
    locked: "مقفل",
  },
  common: {
    retry: "إعادة المحاولة",
    dataLoadError: "خطأ في تحميل البيانات",
  },
};

/**
 * The admin namespace carries a complete Arabic translation set — and until
 * now nothing could ever reach it. `lng` was hardcoded to "en" and
 * `changeLanguage` was never called anywhere, so `adminAr` above was written,
 * reviewed and shipped as dead weight.
 *
 * The initial language is resolved the same way the rest of the site resolves
 * it (URL first, then the saved preference), and LanguageProvider keeps the
 * two in step from then on — see syncAdminLanguage below.
 */
function initialAdminLanguage(): "en" | "ar" {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "ar" || fromUrl === "en") return fromUrl;
    const stored = localStorage.getItem("k-lovers-lang");
    if (stored === "ar" || stored === "en") return stored;
  } catch {
    /* Private mode, or no window during prerender. */
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { admin: adminEn },
    ar: { admin: adminAr },
  },
  lng: initialAdminLanguage(),
  fallbackLng: "en",
  ns: ["admin"],
  defaultNS: "admin",
  interpolation: { escapeValue: false },
});

/** Points i18next at the language the rest of the app is using. */
export function syncAdminLanguage(language: "en" | "ar"): void {
  if (i18n.language !== language) void i18n.changeLanguage(language);
}

export default i18n;

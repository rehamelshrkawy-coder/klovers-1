import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { attachLeadToUser } from "@/lib/attachLeadToUser";
import { attachSessionToUser } from "@/lib/attachSessionToUser";
import { captureUtmFromUrl } from "@/lib/leadSession";
import { identify, trackPageView, capture } from "@/lib/analytics";
import ErrorBoundary from "@/components/ErrorBoundary";
import WhatsAppButton from "./components/WhatsAppButton";
import CookieBanner from "./components/CookieBanner";
import InstallPrompt from "./components/InstallPrompt";

// Route guards — kept eager (tiny, needed immediately)
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AuthProtectedRoute from "./components/AuthProtectedRoute";

// Lazy-loaded pages — each becomes its own JS chunk
const Index = lazy(() => import("./pages/Index"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const EnrollPage = lazy(() => import("./pages/EnrollPage"));
const EnrollNowPage = lazy(() => import("./pages/EnrollNowPage"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const EgyptPaymentPage = lazy(() => import("./pages/EgyptPaymentPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const MySchedulePage = lazy(() => import("./pages/MySchedulePage"));
const ResubmitSchedulePage = lazy(() => import("./pages/ResubmitSchedulePage"));
const AdminResetPage = lazy(() => import("./pages/AdminResetPage"));
const MarketingGeneratorPage = lazy(() => import("./pages/MarketingGeneratorPage"));
const KoreanOrchestratorPage = lazy(() => import("./pages/KoreanOrchestratorPage"));
const PlacementTestPage = lazy(() => import("./pages/PlacementTestPage"));
const GamesPage = lazy(() => import("./pages/GamesPage"));
const TextbookHubPage = lazy(() => import("./pages/TextbookHubPage"));
const TextbookPage = lazy(() => import("./pages/TextbookPage"));
const LessonDetailPage = lazy(() => import("./pages/LessonDetailPage"));
const TextbookProgressPage = lazy(() => import("./pages/TextbookProgressPage"));
const VocabularyReviewPage = lazy(() =>
  import("./pages/VocabularyReviewPage").then(m => ({ default: m.VocabularyReviewPage }))
);
const DailyQuizPage = lazy(() => import("./pages/DailyQuizPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CompleteProfilePage = lazy(() => import("./pages/CompleteProfilePage"));
const FreeTrialPage = lazy(() => import("./pages/FreeTrialPage"));
const TrialBookingPage = lazy(() => import("./pages/TrialBookingPage"));
const ProgressReportPage = lazy(() => import("./pages/ProgressReportPage"));
const CertificatePage = lazy(() => import("./pages/CertificatePage"));
const AffiliatePage = lazy(() => import("./pages/AffiliatePage"));
const LearnKoreanArabicSpeakersPage = lazy(() => import("./pages/LearnKoreanArabicSpeakersPage"));
const TopikExamPage = lazy(() => import("./pages/TopikExamPage"));
const KDramaLearningPage = lazy(() => import("./pages/KDramaLearningPage"));
const InterviewTrainingPage = lazy(() => import("./pages/InterviewTrainingPage"));
const KoreanInterviewPage = lazy(() => import("./pages/KoreanInterviewPage"));
const ReturningStudentsLandingPage = lazy(() => import("./pages/ReturningStudentsLandingPage"));
const HangulBookPage = lazy(() => import("./pages/HangulBookPage"));
const TrialBookPage = lazy(() => import("./pages/TrialBookPage"));
const TrialConfirmPage = lazy(() => import("./pages/TrialConfirmPage"));
const EnrollmentStatusPage = lazy(() => import("./pages/EnrollmentStatusPage"));
const HangulStarterPage = lazy(() => import("./pages/HangulStarterPage"));
const RsvpConfirmationPage = lazy(() => import("./pages/RsvpConfirmationPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Tracks page views on every client-side navigation
const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);
  return null;
};

const AppInner = () => {
  useEffect(() => {
    captureUtmFromUrl();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        attachLeadToUser(session.user);
        attachSessionToUser();
        // Link future analytics events to the authenticated user
        identify(session.user.id, {
          email: session.user.email,
          created_at: session.user.created_at,
        });
      }
    });

    // Register service worker for offline support / PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // SW registration failure is non-fatal; app still works online
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  return null;
};

// Minimal full-screen spinner shown while a lazy chunk loads
const PageLoader = () => (
  <div role="status" aria-label="Loading page" className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="bottom-center" />
        <AppInner />
        {/* Skip-nav — keyboard/screen-reader accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-semibold focus:outline-none focus:shadow-xl"
        >
          Skip to main content
        </a>
        <WhatsAppButton />
        <CookieBanner />
        <BrowserRouter>
          <PageViewTracker />
          <InstallPrompt />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/enroll" element={<EnrollPage />} />
                <Route path="/enroll-now" element={<EnrollNowPage />} />
                <Route path="/dashboard" element={<AuthProtectedRoute><StudentDashboard /></AuthProtectedRoute>} />
                <Route path="/pay/:enrollmentId" element={<AuthProtectedRoute><EgyptPaymentPage /></AuthProtectedRoute>} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/dashboard/schedule" element={<AuthProtectedRoute><MySchedulePage /></AuthProtectedRoute>} />
                <Route path="/resubmit-schedule" element={<AuthProtectedRoute><ResubmitSchedulePage /></AuthProtectedRoute>} />
                <Route path="/placement-test" element={<PlacementTestPage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/textbook" element={<AuthProtectedRoute><TextbookHubPage /></AuthProtectedRoute>} />
                <Route path="/textbook/progress" element={<AuthProtectedRoute><TextbookProgressPage /></AuthProtectedRoute>} />
                <Route path="/review" element={<AuthProtectedRoute><VocabularyReviewPage /></AuthProtectedRoute>} />
                <Route path="/daily-quiz" element={<AuthProtectedRoute><DailyQuizPage /></AuthProtectedRoute>} />
                <Route path="/textbook/:bookId" element={<AuthProtectedRoute><TextbookPage /></AuthProtectedRoute>} />
                <Route path="/textbook/:bookId/:lessonId" element={<AuthProtectedRoute><LessonDetailPage /></AuthProtectedRoute>} />
                <Route path="/profile" element={<AuthProtectedRoute><ProfilePage /></AuthProtectedRoute>} />
                <Route path="/complete-profile" element={<CompleteProfilePage />} />
                <Route path="/free-trial" element={<FreeTrialPage />} />
                <Route path="/rsvp" element={<RsvpConfirmationPage />} />
                <Route path="/trial-booking" element={<AuthProtectedRoute><TrialBookingPage /></AuthProtectedRoute>} />
                <Route path="/progress-report" element={<AuthProtectedRoute><ProgressReportPage /></AuthProtectedRoute>} />
                <Route path="/certificate" element={<AuthProtectedRoute><CertificatePage /></AuthProtectedRoute>} />
                <Route path="/affiliate" element={<AffiliatePage />} />
                <Route path="/learn-korean-arabic-speakers" element={<LearnKoreanArabicSpeakersPage />} />
                <Route path="/topik-exam-preparation" element={<TopikExamPage />} />
                <Route path="/learn-korean-kdramas" element={<KDramaLearningPage />} />
                <Route path="/interview-training" element={<KoreanInterviewPage />} />
                <Route path="/welcome-back" element={<ReturningStudentsLandingPage />} />
                <Route path="/hangul-book" element={<AuthProtectedRoute><HangulBookPage /></AuthProtectedRoute>} />
                <Route path="/trial-book" element={<AuthProtectedRoute><TrialBookPage /></AuthProtectedRoute>} />
                <Route path="/trial-confirm" element={<TrialConfirmPage />} />
                <Route path="/enrollment-status" element={<AuthProtectedRoute><EnrollmentStatusPage /></AuthProtectedRoute>} />
                <Route path="/hangul-starter" element={<HangulStarterPage />} />
                <Route path="/practice-interview" element={<InterviewTrainingPage />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/reset" element={<ProtectedRoute><AdminResetPage /></ProtectedRoute>} />
                <Route path="/admin/marketing" element={<ProtectedRoute><MarketingGeneratorPage /></ProtectedRoute>} />
                <Route path="/admin/korean-orchestra" element={<ProtectedRoute><KoreanOrchestratorPage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

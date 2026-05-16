import { track } from "@/lib/tracking";
import { supabase } from "@/integrations/supabase/client";

// Comprehensive analytics for all user interactions
export const analyticsEvents = {
  // Trial flow
  trialViewed: (source: string) => {
    track.custom("trial_viewed", { source });
  },
  trialCountrySelected: (country: string) => {
    track.custom("trial_country_selected", { country });
  },
  trialLanguageSelected: (language: "arabic" | "english") => {
    track.custom("trial_language_selected", { language });
  },
  trialSlotPicked: (dayOfWeek: number, timeSlot: string) => {
    track.custom("trial_slot_picked", { day_of_week: dayOfWeek, time: timeSlot });
  },
  trialBookingStarted: () => {
    track.custom("trial_booking_started", {});
  },
  trialBookingCompleted: (data: {
    email: string;
    level: string;
    trialDate: string;
    dayOfWeek: number;
    startTime: string;
  }) => {
    track.custom("trial_booking_completed", data);
    track.lead({
      content_name: "trial_booked",
      value: 0,
      currency: "USD",
    });
  },
  trialBookingFailed: (error: string) => {
    track.custom("trial_booking_failed", { error });
  },

  // Enrollment flow
  enrollmentViewed: (source: string, courseLevel: string) => {
    track.custom("enrollment_viewed", { source, course_level: courseLevel });
  },
  enrollmentCountrySelected: (country: string) => {
    track.custom("enrollment_country_selected", { country });
  },
  enrollmentCourseSelected: (courseId: string, courseName: string, price: number) => {
    track.custom("enrollment_course_selected", { course_id: courseId, course_name: courseName, price });
  },
  enrollmentPaymentInitiated: (courseId: string, amount: number, currency: string) => {
    track.custom("enrollment_payment_initiated", { course_id: courseId, amount, currency });
  },
  enrollmentPaymentCompleted: (courseId: string, amount: number, orderId: string) => {
    track.custom("enrollment_payment_completed", { course_id: courseId, amount, order_id: orderId });
    track.lead({
      content_name: "enrollment_completed",
      value: amount,
      currency: "USD",
    });
  },

  // Dashboard interactions
  dashboardViewed: (userLevel: string) => {
    track.custom("dashboard_viewed", { user_level: userLevel });
  },
  lessonStarted: (lessonId: string, lessonTitle: string, duration: number) => {
    track.custom("lesson_started", { lesson_id: lessonId, lesson_title: lessonTitle, duration });
  },
  lessonCompleted: (lessonId: string, duration: number, score?: number) => {
    track.custom("lesson_completed", { lesson_id: lessonId, duration, score });
  },
  quizAttempted: (quizId: string, score: number, totalPoints: number) => {
    track.custom("quiz_attempted", { quiz_id: quizId, score, total_points: totalPoints });
  },

  // Feature engagement
  placementTestStarted: () => {
    track.custom("placement_test_started", {});
  },
  placementTestCompleted: (level: string, score: number) => {
    track.custom("placement_test_completed", { level, score });
  },
  materialsDownloaded: (materialId: string, materialType: string) => {
    track.custom("materials_downloaded", { material_id: materialId, material_type: materialType });
  },

  // Referral system
  referralLinkViewed: (referrerId: string) => {
    track.custom("referral_link_viewed", { referrer_id: referrerId });
  },
  referralLinkShared: (platform: "whatsapp" | "email" | "copy" | "other") => {
    track.custom("referral_link_shared", { platform });
  },
  referralConversion: (referrerId: string, newUserId: string) => {
    track.custom("referral_conversion", { referrer_id: referrerId, new_user_id: newUserId });
  },

  // Email interactions
  emailOpened: (emailId: string, emailType: string) => {
    track.custom("email_opened", { email_id: emailId, email_type: emailType });
  },
  emailClicked: (emailId: string, emailType: string, linkUrl: string) => {
    track.custom("email_clicked", { email_id: emailId, email_type: emailType, link_url: linkUrl });
  },

  // Error tracking
  errorOccurred: (errorCode: string, errorMessage: string, context: Record<string, unknown>) => {
    track.custom("error_occurred", { error_code: errorCode, error_message: errorMessage, context });
  },

  // Page views with context
  pageViewed: (pageName: string, properties?: Record<string, unknown>) => {
    track.custom("page_viewed", { page_name: pageName, ...properties });
  },

  // CTAssistant interactions
  ctaClicked: (ctaLabel: string, ctaText: string, source: string) => {
    track.custom("cta_clicked", { cta_label: ctaLabel, cta_text: ctaText, source });
  },

  // Timing metrics
  trackTiming: (category: string, variable: string, time: number, label?: string) => {
    track.custom("timing", { category, variable, time, label });
  },
};

// Database event logging for deeper analysis
export const logAnalyticsEvent = async (
  eventType: string,
  userId: string | null,
  data: Record<string, unknown>
) => {
  try {
    await supabase.from("analytics_events").insert({
      event_type: eventType,
      user_id: userId,
      event_data: data,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Failed to log analytics event:", error);
  }
};

// Funnel tracking helper
export const trackFunnel = (funnelName: string, step: number, userId: string | null, properties?: Record<string, unknown>) => {
  track.custom(`${funnelName}_step_${step}`, properties);
  logAnalyticsEvent(`funnel:${funnelName}:step_${step}`, userId, properties || {});
};

// Cohort analysis helper
export const trackCohort = (cohortName: string, userId: string, properties: Record<string, unknown>) => {
  track.custom(`cohort_${cohortName}`, { user_id: userId, ...properties });
};

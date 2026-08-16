// ─── Site-wide configuration constants ───────────────────────────────────────
// Change these in ONE place and they propagate everywhere.

export const WHATSAPP_NUMBER = "201010003084"; // Update this if your number changes
export const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

export const CONTACT_EMAIL = "koreanlovers.net@gmail.com";
export const SITE_URL = "https://kloversegy.com";
export const ENROLL_URL = `${SITE_URL}/enroll-now`;

export const RETURNING_STUDENT_CODE = "KLOVERSOLDSTUDENT1";

/**
 * Master switch for the trial-confirmation email.
 *
 * This is genuinely enforced: `TrialClassesManager` checks it before invoking
 * the `send-confirmation-email` edge function, and reports in its toast whether
 * an email actually went out. It previously guarded only a helper with zero
 * call sites, so flipping it to `false` paused nothing and emails kept sending.
 */
export const TRIAL_CONFIRMATION_EMAIL_ENABLED = true;

// ─── Trial class contract ────────────────────────────────────────────────────
// One value per fact. Marketing copy, calendar invites, JSON-LD, the admin
// defaults and the booking screens all read these — previously the trial was
// simultaneously 30 and 45 minutes long, and the group held 4, 5, 6 or 8.

/** Trial class length in minutes. Sold as 30; the calendar invite must agree. */
export const TRIAL_DURATION_MIN = 30;

/** Maximum students in one trial group. The trial is a GROUP class — say so. */
export const TRIAL_GROUP_SIZE_MAX = 6;

/**
 * Timezone the teacher's trial slots are anchored to. Every stored
 * `start_time` is a wall-clock time in this zone; the UI renders it in the
 * visitor's zone. Slot creation, the picker, the dashboard card and the
 * confirmation email must all default here — they used to disagree by up to
 * seven hours, so one null value rendered as two different times.
 */
export const TRIAL_ANCHOR_TIMEZONE = "Asia/Kuala_Lumpur";

// ─── Social proof ────────────────────────────────────────────────────────────
// One number per claim, sitewide, in both locales. The site previously told an
// English visitor it had taught 500+ students and an Arabic visitor 2,000+, and
// claimed "rated by 200+ students" three centimetres above a live counter
// reading 0. These are three *different* quantities and are now labelled as such.

/** Students who have completed at least one paid course. */
export const STUDENTS_TAUGHT = 500;

/** Mean review score. Rendered to one decimal place. */
export const AVERAGE_RATING = 4.9;

/** How many of those students left a rating. Never presented as enrolment. */
export const RATINGS_COUNT = 200;

/** Telegram + Facebook community members. Not students — say "community". */
export const COMMUNITY_MEMBERS = 2000;

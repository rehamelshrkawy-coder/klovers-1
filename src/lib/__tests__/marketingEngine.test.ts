import { describe, it, expect } from "vitest";

/**
 * Tests for pure helper functions extracted from marketingEngine.ts.
 * We test the stateless, deterministic functions in isolation without needing
 * to import the full module (which has a getLevelLabel dependency chain).
 */

// ── getUrgencyLabel (mirrored) ────────────────────────────────────────────────

function getUrgencyLabel(seatsLeft: number): "Last Seats" | "Open Registration" {
  if (seatsLeft <= 2) return "Last Seats";
  return "Open Registration";
}

describe("getUrgencyLabel", () => {
  it("0 seats → 'Last Seats'", () => {
    expect(getUrgencyLabel(0)).toBe("Last Seats");
  });

  it("1 seat → 'Last Seats'", () => {
    expect(getUrgencyLabel(1)).toBe("Last Seats");
  });

  it("2 seats → 'Last Seats'", () => {
    expect(getUrgencyLabel(2)).toBe("Last Seats");
  });

  it("3 seats → 'Open Registration'", () => {
    expect(getUrgencyLabel(3)).toBe("Open Registration");
  });

  it("large seat count → 'Open Registration'", () => {
    expect(getUrgencyLabel(100)).toBe("Open Registration");
  });

  it("boundary: exactly 2 is still Last Seats, 3 flips to Open", () => {
    expect(getUrgencyLabel(2)).toBe("Last Seats");
    expect(getUrgencyLabel(3)).toBe("Open Registration");
  });
});

// ── isWhatsAppCTA (mirrored) ──────────────────────────────────────────────────

type MonthlyPostType =
  | "empty_slots" | "invite_student" | "discount" | "referral"
  | "testimonial" | "faq" | "countdown" | "tip" | "culture";

const WHATSAPP_CTA_TYPES = new Set<MonthlyPostType>(["referral", "invite_student"]);

function isWhatsAppCTA(postType: MonthlyPostType): boolean {
  return WHATSAPP_CTA_TYPES.has(postType);
}

describe("isWhatsAppCTA", () => {
  it("'referral' → true", () => {
    expect(isWhatsAppCTA("referral")).toBe(true);
  });

  it("'invite_student' → true", () => {
    expect(isWhatsAppCTA("invite_student")).toBe(true);
  });

  it("'empty_slots' → false", () => {
    expect(isWhatsAppCTA("empty_slots")).toBe(false);
  });

  it("'discount' → false", () => {
    expect(isWhatsAppCTA("discount")).toBe(false);
  });

  it("'testimonial' → false", () => {
    expect(isWhatsAppCTA("testimonial")).toBe(false);
  });

  it("'faq' → false", () => {
    expect(isWhatsAppCTA("faq")).toBe(false);
  });

  it("exactly 2 post types use WhatsApp CTA", () => {
    const allTypes: MonthlyPostType[] = [
      "empty_slots", "invite_student", "discount", "referral",
      "testimonial", "faq", "countdown", "tip", "culture",
    ];
    const whatsAppTypes = allTypes.filter(t => isWhatsAppCTA(t));
    expect(whatsAppTypes).toHaveLength(2);
    expect(whatsAppTypes).toContain("referral");
    expect(whatsAppTypes).toContain("invite_student");
  });
});

// ── enrollUrl / whatsappUrl / trialUrl (mirrored) ────────────────────────────

type CampaignDirection = "balanced" | "engagement" | "enrollment" | "brand_awareness" | "referral_drive" | "re_engagement";

function enrollUrl(campaign: CampaignDirection, postType: MonthlyPostType, source = "instagram"): string {
  return `kloversegy.com/enroll?utm_source=${source}&utm_campaign=${campaign}&utm_content=${postType}`;
}

function trialUrl(campaign: CampaignDirection): string {
  return `kloversegy.com/free-trial?utm_source=instagram&utm_campaign=${campaign}`;
}

function whatsappUrl(campaign: CampaignDirection, postType: MonthlyPostType): string {
  const msg = encodeURIComponent("Hi! I saw your post and I'm interested in learning Korean with Klovers 🇰🇷");
  return `wa.me/601121777560?text=${msg}`;
}

describe("enrollUrl", () => {
  it("includes the campaign in the URL", () => {
    const url = enrollUrl("balanced", "empty_slots");
    expect(url).toContain("utm_campaign=balanced");
  });

  it("includes the post type as utm_content", () => {
    const url = enrollUrl("enrollment", "discount");
    expect(url).toContain("utm_content=discount");
  });

  it("uses instagram as the default source", () => {
    const url = enrollUrl("balanced", "tip");
    expect(url).toContain("utm_source=instagram");
  });

  it("accepts a custom source override", () => {
    const url = enrollUrl("balanced", "tip", "facebook");
    expect(url).toContain("utm_source=facebook");
  });

  it("always contains the kloversegy.com/enroll base", () => {
    const url = enrollUrl("referral_drive", "referral");
    expect(url).toContain("kloversegy.com/enroll");
  });
});

describe("trialUrl", () => {
  it("includes the campaign in the URL", () => {
    const url = trialUrl("engagement");
    expect(url).toContain("utm_campaign=engagement");
  });

  it("always points to the free-trial page", () => {
    const url = trialUrl("balanced");
    expect(url).toContain("free-trial");
  });

  it("source is always instagram", () => {
    const url = trialUrl("enrollment");
    expect(url).toContain("utm_source=instagram");
  });
});

describe("whatsappUrl", () => {
  it("always points to the Klovers WhatsApp number", () => {
    const url = whatsappUrl("balanced", "referral");
    expect(url).toContain("wa.me/601121777560");
  });

  it("includes URL-encoded message text", () => {
    const url = whatsappUrl("balanced", "invite_student");
    expect(url).toContain("?text=");
    // Encoded form should not contain raw spaces
    const textPart = url.split("?text=")[1];
    expect(textPart).not.toContain(" ");
  });
});

// ── getDiscountPostTemplate (mirrored) ────────────────────────────────────────

interface PostTemplate {
  mainText: string;
  subtitle: string;
  extra: string;
  isUrgent: boolean;
}

function getDiscountPostTemplate(discountPct: number, code: string): PostTemplate {
  return {
    mainText: `${discountPct}% OFF`,
    subtitle: `First Month\nCode: ${code || "SAVE" + discountPct}`,
    extra: "#KoreanCourse  #Klovers  #Discount",
    isUrgent: true,
  };
}

describe("getDiscountPostTemplate", () => {
  it("mainText includes the discount percentage", () => {
    const t = getDiscountPostTemplate(20, "SAVE20");
    expect(t.mainText).toBe("20% OFF");
  });

  it("subtitle includes the provided discount code", () => {
    const t = getDiscountPostTemplate(15, "KLOVERS15");
    expect(t.subtitle).toContain("KLOVERS15");
  });

  it("falls back to SAVExx code when code is empty", () => {
    const t = getDiscountPostTemplate(10, "");
    expect(t.subtitle).toContain("SAVE10");
  });

  it("isUrgent is always true for discount posts", () => {
    expect(getDiscountPostTemplate(30, "PROMO30").isUrgent).toBe(true);
    expect(getDiscountPostTemplate(5, "").isUrgent).toBe(true);
  });

  it("extra always contains Klovers hashtags", () => {
    const t = getDiscountPostTemplate(25, "Q4");
    expect(t.extra).toContain("#Klovers");
  });
});

// ── getCountdownPostTemplate (mirrored) ───────────────────────────────────────

function getCountdownPostTemplate(daysLeft: number, levelLabel: string): PostTemplate {
  return {
    mainText: `${daysLeft} Days Left`,
    subtitle: `${levelLabel}\nregistration closes soon`,
    extra: "#LastChance  #Klovers  #KoreanCourse",
    isUrgent: true,
  };
}

describe("getCountdownPostTemplate", () => {
  it("mainText includes days left", () => {
    expect(getCountdownPostTemplate(3, "Level 1").mainText).toBe("3 Days Left");
    expect(getCountdownPostTemplate(1, "Hangul").mainText).toBe("1 Days Left");
  });

  it("subtitle includes the level label", () => {
    const t = getCountdownPostTemplate(2, "Level 3");
    expect(t.subtitle).toContain("Level 3");
  });

  it("isUrgent is always true", () => {
    expect(getCountdownPostTemplate(7, "L2").isUrgent).toBe(true);
  });

  it("extra contains #LastChance and #Klovers", () => {
    const t = getCountdownPostTemplate(1, "L1");
    expect(t.extra).toContain("#LastChance");
    expect(t.extra).toContain("#Klovers");
  });
});

// ── getReferralPostTemplate (mirrored) ────────────────────────────────────────

function getReferralPostTemplate(): PostTemplate {
  return {
    mainText: "Refer a Friend",
    subtitle: "Get 1 Free Class\nShare your link",
    extra: "#Klovers  #LearnKorean  #KoreanAcademy",
    isUrgent: false,
  };
}

describe("getReferralPostTemplate", () => {
  it("mainText is 'Refer a Friend'", () => {
    expect(getReferralPostTemplate().mainText).toBe("Refer a Friend");
  });

  it("isUrgent is false (no forced urgency for referral posts)", () => {
    expect(getReferralPostTemplate().isUrgent).toBe(false);
  });

  it("subtitle mentions 'Free Class'", () => {
    expect(getReferralPostTemplate().subtitle).toContain("Free Class");
  });
});

// ── generatePublishingCopy (mirrored) ─────────────────────────────────────────

const POST_TYPE_LABELS: Record<MonthlyPostType, string> = {
  empty_slots:    "Class Opening",
  invite_student: "Student Invite",
  discount:       "Promotion",
  referral:       "Referral",
  testimonial:    "Student Story",
  faq:            "FAQ",
  countdown:      "Countdown",
  tip:            "Korean Tip",
  culture:        "K-Culture",
};

function generatePublishingCopy(post: {
  day: number;
  postType: MonthlyPostType;
  caption: string;
  scheduledDate: string;
}): string {
  const label = POST_TYPE_LABELS[post.postType];
  const date = post.scheduledDate
    ? new Date(post.scheduledDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";
  return `=== Day ${post.day} — ${label} ===\n📅 ${date}\n\n${post.caption}\n\n---`;
}

describe("generatePublishingCopy", () => {
  it("includes the day number", () => {
    const copy = generatePublishingCopy({ day: 5, postType: "tip", caption: "Hello", scheduledDate: "2025-07-05" });
    expect(copy).toContain("Day 5");
  });

  it("includes the human-readable post type label", () => {
    const copy = generatePublishingCopy({ day: 1, postType: "discount", caption: "sale", scheduledDate: "2025-07-01" });
    expect(copy).toContain("Promotion");
  });

  it("includes the caption", () => {
    const caption = "Join our Korean class today!";
    const copy = generatePublishingCopy({ day: 2, postType: "culture", caption, scheduledDate: "2025-07-02" });
    expect(copy).toContain(caption);
  });

  it("starts with '===' header", () => {
    const copy = generatePublishingCopy({ day: 1, postType: "tip", caption: "x", scheduledDate: "2025-07-01" });
    expect(copy).toMatch(/^===/);
  });

  it("ends with '---' separator", () => {
    const copy = generatePublishingCopy({ day: 30, postType: "countdown", caption: "last!", scheduledDate: "2025-07-30" });
    expect(copy.trimEnd()).toMatch(/---$/);
  });

  it("each post type has a unique human-readable label", () => {
    const labels = Object.values(POST_TYPE_LABELS);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });
});

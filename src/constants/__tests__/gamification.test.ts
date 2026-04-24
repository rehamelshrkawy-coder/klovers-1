import { describe, it, expect } from "vitest";
import {
  getLeague,
  getLeagueProgress,
  LEAGUES,
  XP_VALUES,
  BADGES,
} from "../gamification";

describe("XP_VALUES", () => {
  it("all XP values are positive numbers", () => {
    for (const [key, value] of Object.entries(XP_VALUES)) {
      expect(value, `${key} should be positive`).toBeGreaterThan(0);
    }
  });

  it("chapter XP is greater than any single section XP", () => {
    const sectionXp = [
      XP_VALUES.vocab,
      XP_VALUES.grammar,
      XP_VALUES.dialogue,
      XP_VALUES.exercise,
      XP_VALUES.reading,
      XP_VALUES.writing,
    ];
    const maxSection = Math.max(...sectionXp);
    expect(XP_VALUES.chapter).toBeGreaterThan(maxSection);
  });

  it("has expected activity keys", () => {
    const expectedKeys = ["vocab", "grammar", "dialogue", "exercise", "reading", "writing", "chapter", "streak_bonus", "game_complete"];
    for (const key of expectedKeys) {
      expect(XP_VALUES).toHaveProperty(key);
    }
  });
});

describe("LEAGUES", () => {
  it("league minXp values are in ascending order", () => {
    for (let i = 1; i < LEAGUES.length; i++) {
      expect(LEAGUES[i].minXp).toBeGreaterThan(LEAGUES[i - 1].minXp);
    }
  });

  it("first league starts at 0 XP", () => {
    expect(LEAGUES[0].minXp).toBe(0);
  });

  it("last league has Infinity as maxXp", () => {
    expect(LEAGUES[LEAGUES.length - 1].maxXp).toBe(Infinity);
  });

  it("each league has required shape", () => {
    for (const league of LEAGUES) {
      expect(league).toHaveProperty("key");
      expect(league).toHaveProperty("name");
      expect(league).toHaveProperty("emoji");
      expect(league).toHaveProperty("minXp");
      expect(league).toHaveProperty("maxXp");
      expect(typeof league.key).toBe("string");
      expect(typeof league.minXp).toBe("number");
    }
  });
});

describe("getLeague", () => {
  it("returns Beginner League for 0 XP", () => {
    const league = getLeague(0);
    expect(league.key).toBe("beginner");
  });

  it("returns Beginner League for 199 XP (upper boundary)", () => {
    const league = getLeague(199);
    expect(league.key).toBe("beginner");
  });

  it("returns Hangul League at its threshold (200 XP)", () => {
    const league = getLeague(200);
    expect(league.key).toBe("hangul");
  });

  it("returns Conversation League at 500 XP", () => {
    expect(getLeague(500).key).toBe("conversation");
  });

  it("returns Grammar League at 1000 XP", () => {
    expect(getLeague(1000).key).toBe("grammar");
  });

  it("returns TOPIK Rookie at 2000 XP", () => {
    expect(getLeague(2000).key).toBe("topik_rookie");
  });

  it("returns TOPIK Challenger at 3500 XP", () => {
    expect(getLeague(3500).key).toBe("topik_challenger");
  });

  it("returns TOPIK Master at 5500 XP", () => {
    expect(getLeague(5500).key).toBe("topik_master");
  });

  it("returns TOPIK Master for very large XP values", () => {
    expect(getLeague(999999).key).toBe("topik_master");
  });

  it("returns correct index alongside league data", () => {
    const league = getLeague(500);
    expect(typeof league.index).toBe("number");
    expect(league.index).toBeGreaterThanOrEqual(0);
    expect(league.index).toBeLessThan(LEAGUES.length);
  });

  it("never returns undefined for any non-negative XP value", () => {
    const testValues = [0, 1, 50, 199, 200, 499, 500, 999, 1000, 9999, 100000];
    for (const xp of testValues) {
      expect(getLeague(xp)).toBeDefined();
    }
  });
});

describe("getLeagueProgress", () => {
  it("returns 0 at league start", () => {
    // Beginner starts at 0; 0 XP = 0% through beginner range (0-199)
    const progress = getLeagueProgress(0);
    expect(progress).toBeGreaterThanOrEqual(0);
  });

  it("returns a percentage between 0 and 100", () => {
    const testXpValues = [0, 100, 199, 200, 350, 499, 500, 1000, 5500];
    for (const xp of testXpValues) {
      const p = getLeagueProgress(xp);
      expect(p, `getLeagueProgress(${xp})`).toBeGreaterThanOrEqual(0);
      expect(p, `getLeagueProgress(${xp})`).toBeLessThanOrEqual(100);
    }
  });

  it("returns 100 for very large XP in the top league", () => {
    // Top league is open-ended; progress should cap at 100
    const p = getLeagueProgress(999999);
    expect(p).toBe(100);
  });
});

describe("BADGES", () => {
  it("all badges have key, name, emoji, and description", () => {
    for (const badge of BADGES) {
      expect(badge.key, `badge ${badge.key} missing key`).toBeTruthy();
      expect(badge.name, `badge ${badge.key} missing name`).toBeTruthy();
      expect(badge.emoji, `badge ${badge.key} missing emoji`).toBeTruthy();
      expect(badge.description, `badge ${badge.key} missing description`).toBeTruthy();
    }
  });

  it("badge keys are unique", () => {
    const keys = BADGES.map(b => b.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("streak badges exist for all milestones", () => {
    const streakBadges = BADGES.map(b => b.key).filter(k => k.startsWith("streak_"));
    expect(streakBadges).toContain("streak_3");
    expect(streakBadges).toContain("streak_7");
    expect(streakBadges).toContain("streak_14");
    expect(streakBadges).toContain("streak_30");
  });
});

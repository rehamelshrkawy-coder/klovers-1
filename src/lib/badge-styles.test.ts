import { describe, it, expect } from "vitest";
import {
  getLeadStatusBadgeClass,
  getApprovalBadgeVariant,
  getDerivedStatusBadgeVariant,
} from "./badge-styles";

// ── getLeadStatusBadgeClass ───────────────────────────────────────────────────

describe("getLeadStatusBadgeClass", () => {
  it("'enrolled' → contains 'green'", () => {
    expect(getLeadStatusBadgeClass("enrolled")).toContain("green");
  });

  it("'trial_booked' → contains 'violet'", () => {
    expect(getLeadStatusBadgeClass("trial_booked")).toContain("violet");
  });

  it("'rejected' → contains 'red'", () => {
    expect(getLeadStatusBadgeClass("rejected")).toContain("red");
  });

  it("'lost' → contains 'red'", () => {
    expect(getLeadStatusBadgeClass("lost")).toContain("red");
  });

  it("'contacted' → contains 'blue'", () => {
    expect(getLeadStatusBadgeClass("contacted")).toContain("blue");
  });

  it("'new' → contains 'muted'", () => {
    expect(getLeadStatusBadgeClass("new")).toContain("muted");
  });

  it("unknown status falls through to default muted", () => {
    expect(getLeadStatusBadgeClass("anything_else")).toContain("muted");
    expect(getLeadStatusBadgeClass("")).toContain("muted");
  });

  it("'rejected' and 'lost' return the same class string (same visual treatment)", () => {
    expect(getLeadStatusBadgeClass("rejected")).toBe(getLeadStatusBadgeClass("lost"));
  });

  it("dark-mode variant is included in every status", () => {
    const statuses = ["enrolled", "trial_booked", "rejected", "lost", "contacted", "new"];
    for (const s of statuses) {
      const cls = getLeadStatusBadgeClass(s);
      // All badges include dark: classes for consistent theming
      expect(cls, `${s} missing dark: class`).toContain("dark:");
    }
  });
});

// ── getApprovalBadgeVariant ───────────────────────────────────────────────────

describe("getApprovalBadgeVariant", () => {
  it("APPROVED → 'default'", () => {
    expect(getApprovalBadgeVariant("APPROVED")).toBe("default");
  });

  it("REJECTED → 'destructive'", () => {
    expect(getApprovalBadgeVariant("REJECTED")).toBe("destructive");
  });

  it("UNDER_REVIEW → 'secondary'", () => {
    expect(getApprovalBadgeVariant("UNDER_REVIEW")).toBe("secondary");
  });

  it("PENDING_PAYMENT → 'secondary'", () => {
    expect(getApprovalBadgeVariant("PENDING_PAYMENT")).toBe("secondary");
  });

  it("empty string → 'outline'", () => {
    expect(getApprovalBadgeVariant("")).toBe("outline");
  });

  it("unknown status → 'outline'", () => {
    expect(getApprovalBadgeVariant("UNKNOWN_STATUS")).toBe("outline");
    expect(getApprovalBadgeVariant("approved")).toBe("outline"); // case-sensitive
  });

  it("returns one of the four valid shadcn badge variants", () => {
    const validVariants = new Set(["default", "destructive", "secondary", "outline"]);
    const statuses = ["APPROVED", "REJECTED", "UNDER_REVIEW", "PENDING_PAYMENT", "ANYTHING"];
    for (const s of statuses) {
      expect(validVariants.has(getApprovalBadgeVariant(s)), `invalid variant for ${s}`).toBe(true);
    }
  });
});

// ── getDerivedStatusBadgeVariant ──────────────────────────────────────────────

describe("getDerivedStatusBadgeVariant", () => {
  it("ACTIVE → 'default'", () => {
    expect(getDerivedStatusBadgeVariant("ACTIVE")).toBe("default");
  });

  it("LOCKED → 'destructive'", () => {
    expect(getDerivedStatusBadgeVariant("LOCKED")).toBe("destructive");
  });

  it("COMPLETED → 'secondary'", () => {
    expect(getDerivedStatusBadgeVariant("COMPLETED")).toBe("secondary");
  });

  it("LEAD → 'secondary'", () => {
    expect(getDerivedStatusBadgeVariant("LEAD")).toBe("secondary");
  });

  it("empty string → 'secondary'", () => {
    expect(getDerivedStatusBadgeVariant("")).toBe("secondary");
  });

  it("unknown status → 'secondary'", () => {
    expect(getDerivedStatusBadgeVariant("PENDING")).toBe("secondary");
  });

  it("returns one of three valid variants", () => {
    const valid = new Set(["default", "destructive", "secondary"]);
    const inputs = ["ACTIVE", "LOCKED", "COMPLETED", "LEAD", "", "BOGUS"];
    for (const s of inputs) {
      expect(valid.has(getDerivedStatusBadgeVariant(s)), `invalid for '${s}'`).toBe(true);
    }
  });
});

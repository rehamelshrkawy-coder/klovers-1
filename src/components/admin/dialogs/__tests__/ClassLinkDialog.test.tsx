import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClassLinkDialog } from "../ClassLinkDialog";
import "@/i18n/config";

const baseProps = {
  target: {
    id: "enr-1",
    profiles: { name: "Ahmed", email: "ahmed@test.com" },
  } as any,
  classLinkUrl: "",
  setClassLinkUrl: vi.fn(),
  sendToGroup: false,
  setSendToGroup: vi.fn(),
  slotDay: "",
  setSlotDay: vi.fn(),
  slotTime: "",
  setSlotTime: vi.fn(),
  slotTimezone: "Africa/Cairo",
  setSlotTimezone: vi.fn(),
  firstClassDate: "",
  setFirstClassDate: vi.fn(),
  isSending: false,
  onSend: vi.fn(),
  onClose: vi.fn(),
};

describe("ClassLinkDialog", () => {
  it("renders the dialog when target is provided", () => {
    render(<ClassLinkDialog {...baseProps} />);
    expect(screen.getByText(/Send Class Link/i)).toBeInTheDocument();
  });

  it("does not render when target is null", () => {
    render(<ClassLinkDialog {...baseProps} target={null} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the student name in description", () => {
    render(<ClassLinkDialog {...baseProps} />);
    expect(screen.getByText(/Ahmed/)).toBeInTheDocument();
  });
});

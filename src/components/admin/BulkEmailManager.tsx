import { useState, useEffect, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getLevelShortLabel } from "@/constants/levels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Send, TestTube, Eye, RefreshCw, Mail, FileText } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome",
    name: "🎉 Welcome",
    subject: "Welcome to KLovers! 🎉",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#FFFF00;padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#000000;font-size:24px;font-weight:700;">Welcome to KLovers! 🎉</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">{{greeting}}</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Your account is set up and ready. Whether you're a complete beginner or brushing up your skills, we're here to guide you every step of the way.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="{{dashboard_url}}" style="background:#000000;color:#FFFF00;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">Start Learning Korean →</a>
    </td></tr></table>
    <p style="color:#6B7280;font-size:14px;line-height:1.5;margin:0 0 8px;">Quick links:</p>
    <p style="margin:0 0 24px;">
      <a href="{{courses_url}}" style="color:#000000;text-decoration:underline;font-size:14px;font-weight:600;">Browse Courses</a> &nbsp;•&nbsp;
      <a href="{{dashboard_url}}" style="color:#000000;text-decoration:underline;font-size:14px;font-weight:600;">Your Dashboard</a>
    </p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#6B7280;font-size:14px;margin:0;">Warm regards,<br><strong>Reham</strong>, Founder of K-Lovers</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    id: "new_course",
    name: "📚 New Course Announcement",
    subject: "New Course Available at K-Lovers! 🎓",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#000000;padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#FFDD00;font-size:24px;font-weight:700;">📚 New Course Available!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">{{greeting}}</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">We're excited to announce a new Korean course! Whether you're just starting or ready for the next level, we have something for you.</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#111827;">📖 Course Details:</p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.8;">• Level: [Edit level here]<br>• Schedule: [Edit schedule here]<br>• Duration: [Edit duration here]<br>• Spots Available: [Edit spots here]</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="{{courses_url}}" style="background:#000000;color:#FFDD00;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">View Courses →</a>
    </td></tr></table>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#6B7280;font-size:14px;margin:0;">— The KLovers Team</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    id: "reminder",
    name: "⏰ Class Reminder",
    subject: "Your Korean class is coming up! ⏰",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#000000;padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#FFDD00;font-size:24px;font-weight:700;">⏰ Class Reminder</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">{{greeting}}</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Just a friendly reminder that your Korean class is coming up soon! Make sure you're ready.</p>
    <div style="background:#FFFDE7;border-left:4px solid #FFDD00;border-radius:4px;padding:16px;margin:0 0 24px;">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.8;">📅 <strong>Date:</strong> [Edit date]<br>🕐 <strong>Time:</strong> [Edit time]<br>📚 <strong>Level:</strong> [Edit level]</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="{{dashboard_url}}" style="background:#000000;color:#FFDD00;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">Go to Dashboard →</a>
    </td></tr></table>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#6B7280;font-size:14px;margin:0;">See you in class! ✨<br><strong>Reham</strong>, KLovers</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    id: "promotion",
    name: "🎁 Special Offer",
    subject: "Special Offer Just for You! 🎁",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:linear-gradient(135deg,#000000,#1a1a1a);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#FFDD00;font-size:24px;font-weight:700;">🎁 Special Offer!</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">{{greeting}}</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">We have an exclusive offer just for you! Don't miss this chance to level up your Korean skills at a special price.</p>
    <div style="background:#FFFDE7;border:2px dashed #FFDD00;border-radius:8px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:28px;font-weight:800;color:#000000;">[Edit discount %] OFF</p>
      <p style="margin:0;color:#374151;font-size:14px;">Use code: <strong>[Edit code]</strong></p>
      <p style="margin:8px 0 0;color:#6B7280;font-size:12px;">Valid until [Edit date]</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="{{courses_url}}" style="background:#000000;color:#FFDD00;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">Claim Offer →</a>
    </td></tr></table>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#6B7280;font-size:14px;margin:0;">— The KLovers Team</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    id: "update",
    name: "📢 General Update",
    subject: "Important Update from K-Lovers 📢",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#000000;padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#FFDD00;font-size:24px;font-weight:700;">📢 Important Update</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">{{greeting}}</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">[Write your update message here. You can include any important announcements, schedule changes, or news about K-Lovers.]</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="{{dashboard_url}}" style="background:#000000;color:#FFDD00;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">Visit Dashboard →</a>
    </td></tr></table>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#6B7280;font-size:14px;margin:0;">Best,<br><strong>Reham</strong>, KLovers</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    id: "april-intake",
    name: "🌸 April Intake",
    subject: "April Korean Language Intake Now Open",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr><td style="background:#000000;padding:28px 40px;text-align:center;">
    <p style="margin:0 0 14px;font-size:32px;line-height:1;">&#127472;&#127479;</p>
    <h1 style="margin:0;color:#FFFF00;font-size:24px;font-weight:700;line-height:1.3;">April Korean Language Intake Now Open</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 18px;">{{greeting}}</p>
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 18px;">Our April Korean Language batch is now officially open for enrollment.</p>
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 18px;">At KLovers, we follow a structured 6-level curriculum aligned with official TOPIK progression, ensuring steady development from beginner foundations to exam readiness. Our small-group format allows for personal feedback and real speaking practice from the first weeks.</p>
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px;"><strong>Special pricing is available for Egyptian students.</strong> Seats are limited and enrollment will close once the group is full.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:10px 0 24px;">
      <a href="https://kloversegy.com" style="background:#FFFF00;color:#000000;text-decoration:none;padding:14px 34px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">Register Now →</a>
    </td></tr></table>
    <p style="text-align:center;color:#6B7280;font-size:14px;margin:0 0 28px;">🌐 <a href="https://kloversegy.com" style="color:#000000;text-decoration:none;font-weight:600;">kloversegy.com</a></p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#6B7280;font-size:14px;margin:0;text-align:center;">✨ <strong style="color:#111827;">Klovers Team</strong></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    id: "textbook-launch",
    name: "📖 Textbook Launch",
    subject: "🎓 Our Free Korean Textbook Is Live! Start Learning Today",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr><td style="background:#000000;padding:32px 40px;text-align:center;">
    <p style="margin:0 0 12px;font-size:40px;line-height:1;">📖</p>
    <h1 style="margin:0;color:#FFFF00;font-size:26px;font-weight:700;line-height:1.3;">Our Free Korean Textbook Is Live!</h1>
    <p style="margin:10px 0 0;color:#ffffff;font-size:14px;opacity:0.85;">75 interactive lessons · TOPIK 1 & 2 · 100% free</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 18px;">{{greeting}}</p>
    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 18px;">We're thrilled to announce that <strong>KLovers' interactive Korean Textbook</strong> is now available — and it's completely <strong>free</strong>! 🎉</p>

    <div style="background:#FFFDE7;border-left:4px solid #FFFF00;border-radius:4px;padding:20px;margin:0 0 24px;">
      <p style="margin:0 0 12px;font-weight:700;color:#111827;font-size:15px;">✨ What's inside:</p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:2;">
        📚 <strong>75 structured lessons</strong> — from Hangul basics to intermediate grammar<br>
        🎯 <strong>5 sections per lesson</strong> — Vocabulary, Grammar, Dialogue, Exercises & Reading<br>
        🏆 <strong>XP & streaks</strong> — gamified progress to keep you motivated<br>
        🖼️ <strong>Visual scenes</strong> — AI-generated illustrations for each topic<br>
        📊 <strong>TOPIK-aligned</strong> — covers Level 1 (45 lessons) and Level 2 (30 lessons)
      </p>
    </div>

    <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 24px;">Whether you're a complete beginner or preparing for TOPIK, this textbook will guide you step-by-step. Track your progress, earn XP, and level up your Korean!</p>

    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:10px 0 12px;">
      <a href="https://klovers.lovable.app/textbook" style="background:#FFFF00;color:#000000;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:17px;font-weight:700;display:inline-block;border:2px solid #000000;">Start Learning Now →</a>
    </td></tr></table>
    <p style="text-align:center;color:#9CA3AF;font-size:13px;margin:0 0 28px;">No sign-up required to browse lessons</p>

    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#6B7280;font-size:14px;margin:0;text-align:center;">Happy studying! 💛<br><strong style="color:#111827;">Reham</strong>, Founder of KLovers</p>
    <p style="text-align:center;margin:12px 0 0;"><a href="https://kloversegy.com" style="color:#000000;text-decoration:none;font-size:13px;font-weight:600;">🌐 kloversegy.com</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
  {
    id: "blank",
    name: "📝 Blank Template",
    subject: "",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">{{greeting}}</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">[Your message here]</p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#6B7280;font-size:14px;margin:0;">— The KLovers Team</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  },
];

interface Campaign {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  created_at: string;
  queued: number;
  sent: number;
  failed: number;
}

interface SendRecord {
  id: string;
  email: string;
  status: string;
  error: string | null;
  attempts: number;
  sent_at: string | null;
}

const BulkEmailManager = () => {
  const [name, setName] = useState("Welcome Campaign");
  const [subject, setSubject] = useState(EMAIL_TEMPLATES[0].subject);
  const [htmlBody, setHtmlBody] = useState(EMAIL_TEMPLATES[0].html);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("welcome");

  const applyTemplate = async (templateId: string) => {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;

    setSelectedTemplate(templateId);
    setName(tpl.name.replace(/^[^\w]*\s*/, "") + " Campaign");
    setSubject(tpl.subject);

    if (templateId === "new_course") {
      // Fetch groups with their linked schedule package info
      const { data: groups } = await supabase
        .from("pkg_groups")
        .select("id, name, capacity, is_active, package_id")
        .eq("is_active", true)
        .order("name");

      // Fetch packages for day/time/level info
      const { data: packages } = await supabase
        .from("schedule_packages")
        .select("id, level, day_of_week, start_time, timezone, course_type, capacity")
        .eq("is_active", true);

      // Fetch member counts per group
      const { data: members } = await supabase
        .from("pkg_group_members")
        .select("group_id, member_status")
        .eq("member_status", "active")
        .limit(5000);

      if (groups && groups.length > 0 && packages) {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const pkgMap = new Map(packages.map(p => [p.id, p]));
        const memberCounts = new Map<string, number>();
        if (members) {
          for (const m of members) {
            memberCounts.set(m.group_id, (memberCounts.get(m.group_id) || 0) + 1);
          }
        }

        const detailLines = groups.map(g => {
          const pkg = pkgMap.get(g.package_id);
          const enrolled = memberCounts.get(g.id) || 0;
          const spotsLeft = g.capacity - enrolled;
          if (!pkg) return null;
          const lvl = getLevelShortLabel(pkg.level);
          const day = dayNames[pkg.day_of_week] || "TBD";
          const time = pkg.start_time?.slice(0, 5) || "TBD";
          const type = pkg.course_type === "private" ? "🔒 Private" : "👥 Group";
          return `• <strong>${g.name}</strong> — ${lvl} | ${day} at ${time} | ${type} | ${spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}`;
        }).filter(Boolean).join("<br>");

        const filledHtml = tpl.html.replace(
          `• Level: [Edit level here]<br>• Schedule: [Edit schedule here]<br>• Duration: [Edit duration here]<br>• Spots Available: [Edit spots here]`,
          detailLines || "No active groups available"
        );
        setHtmlBody(filledHtml);
      } else {
        setHtmlBody(tpl.html);
      }
    } else {
      setHtmlBody(tpl.html);
    }
  };
  const [audience, setAudience] = useState<"new" | "all">("new");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ queued: 0, sent: 0, failed: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [detailSends, setDetailSends] = useState<SendRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoadingHistory(true);
    const { data: camps } = await supabase
      .from("email_campaigns" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!camps || camps.length === 0) {
      setCampaigns([]);
      setLoadingHistory(false);
      return;
    }

    // Get counts for each campaign
    const campaignList: Campaign[] = [];
    for (const c of camps as any[]) {
      const { data: sends } = await supabase
        .from("email_sends" as any)
        .select("status")
        .eq("campaign_id", c.id);

      const counts = { queued: 0, sent: 0, failed: 0 };
      if (sends) {
        for (const s of sends as any[]) {
          if (s.status === "queued") counts.queued++;
          else if (s.status === "sent") counts.sent++;
          else if (s.status === "failed") counts.failed++;
        }
      }
      campaignList.push({ ...c, ...counts });
    }
    setCampaigns(campaignList);
    setLoadingHistory(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleTestSend = async () => {
    setTestSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-email-campaign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "test",
            subject,
            html_body: htmlBody,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Test send failed");
      toast({ title: "Test email sent!", description: "Check your admin inbox." });
    } catch (err: any) {
      toast({ title: "Test failed", description: err.message, variant: "destructive" });
    } finally {
      setTestSending(false);
    }
  };

  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    setProgress({ queued: 0, sent: 0, failed: 0 });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // 1. Create campaign
      const { data: campaign, error: campErr } = await supabase
        .from("email_campaigns" as any)
        .insert({ name, subject, html_body: htmlBody, created_by: session.user.id } as any)
        .select()
        .single();
      if (campErr || !campaign) throw new Error(campErr?.message || "Failed to create campaign");

      const campaignId = (campaign as any).id;

      // 2. Get target users
      let users: { user_id: string; email: string; name: string }[] = [];
      const { data: profiles } = await supabase.from("profiles").select("user_id, email, name").limit(5000);
      if (!profiles) throw new Error("Failed to fetch users");

      if (audience === "new") {
        // Only users who haven't received any campaign with this name
        const { data: existingSends } = await supabase
          .from("email_sends" as any)
          .select("user_id, campaign_id");

        // Get campaign IDs with same name
        const { data: sameName } = await supabase
          .from("email_campaigns" as any)
          .select("id")
          .eq("name", name);

        const sameNameIds = new Set((sameName as any[] || []).map((c: any) => c.id));
        sameNameIds.delete(campaignId); // exclude current

        const alreadySent = new Set<string>();
        if (existingSends) {
          for (const s of existingSends as any[]) {
            if (sameNameIds.has(s.campaign_id)) alreadySent.add(s.user_id);
          }
        }
        users = (profiles as any[]).filter(p => !alreadySent.has(p.user_id));
      } else {
        users = profiles as any[];
      }

      if (users.length === 0) {
        toast({ title: "No users to send to", description: "All users already received this campaign.", variant: "destructive" });
        setSending(false);
        return;
      }

      // 3. Enqueue sends
      const sends = users.map(u => ({
        campaign_id: campaignId,
        user_id: u.user_id,
        email: u.email,
        status: "queued",
      }));

      // Insert in chunks of 100
      for (let i = 0; i < sends.length; i += 100) {
        await supabase.from("email_sends" as any).insert(sends.slice(i, i + 100) as any);
      }

      setProgress({ queued: users.length, sent: 0, failed: 0 });

      // 4. Process in batches with polling
      let remaining = true;
      while (remaining) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-email-campaign`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ action: "process", campaign_id: campaignId }),
          }
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Processing failed");

        setProgress({
          queued: result.queued || 0,
          sent: result.sent || 0,
          failed: result.failed || 0,
        });

        remaining = (result.queued || 0) > 0;
        if (remaining) await new Promise(r => setTimeout(r, 2000));
      }

      toast({ title: "Campaign sent!", description: `${progress.sent} emails delivered.` });
      fetchCampaigns();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const viewDetail = async (campaign: Campaign) => {
    setDetailCampaign(campaign);
    const { data } = await supabase
      .from("email_sends" as any)
      .select("id, email, status, error, attempts, sent_at")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false });
    setDetailSends((data as any[]) || []);
  };

  const total = progress.queued + progress.sent + progress.failed;
  const pct = total > 0 ? Math.round(((progress.sent + progress.failed) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* CREATE CAMPAIGN */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5" /> New Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> Choose Template</Label>
            <div className="flex flex-wrap gap-2">
              {EMAIL_TEMPLATES.map((tpl) => (
                <Button
                  key={tpl.id}
                  variant={selectedTemplate === tpl.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyTemplate(tpl.id)}
                  className="text-xs"
                >
                  {tpl.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Welcome Campaign" />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Welcome to K-Lovers" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>HTML Body</Label>
            <Textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as "new" | "all")}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Only users who haven't received this (recommended)</SelectItem>
                <SelectItem value="all">All users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)} disabled={sending}>
              <Eye className="h-4 w-4 me-1" /> Preview
            </Button>
            <Button variant="outline" onClick={handleTestSend} disabled={testSending || sending}>
              <TestTube className="h-4 w-4 me-1" /> {testSending ? "Sending..." : "Test Send"}
            </Button>
            <Button onClick={() => setShowConfirm(true)} disabled={sending || !name || !subject || !htmlBody}>
              <Send className="h-4 w-4 me-1" /> Send Campaign
            </Button>
          </div>

          {sending && (
            <div className="space-y-2 pt-2">
              <Progress value={pct} className="h-3" />
              <div className="flex gap-3 text-sm">
                <span className="text-muted-foreground">Queued: {progress.queued}</span>
                <span className="text-green-600">Sent: {progress.sent}</span>
                <span className="text-destructive">Failed: {progress.failed}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CAMPAIGN HISTORY */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Campaign History</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchCampaigns} disabled={loadingHistory}>
            <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Queued</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{c.queued}</TableCell>
                    <TableCell className="text-green-600">{c.sent}</TableCell>
                    <TableCell className="text-destructive">{c.failed}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => viewDetail(c)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* PREVIEW DIALOG */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <iframe
            className="border rounded-lg w-full"
            style={{ height: "500px" }}
            sandbox="allow-same-origin"
            srcDoc={htmlBody
              .replace(/\{\{greeting\}\}/g, "Hi there,")
              .replace(/\{\{dashboard_url\}\}/g, "#")
              .replace(/\{\{courses_url\}\}/g, "#")}
            title="Email Preview"
          />
        </DialogContent>
      </Dialog>

      {/* CONFIRM DIALOG */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send "{subject}" to {audience === "all" ? "all" : "eligible"} users.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>Send Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DETAIL DIALOG */}
      <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{detailCampaign?.name} — Details</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 mb-4">
            <Badge variant="secondary">Queued: {detailCampaign?.queued}</Badge>
            <Badge className="bg-green-100 text-green-700">Sent: {detailCampaign?.sent}</Badge>
            {(detailCampaign?.failed ?? 0) > 0 && (
              <Badge variant="destructive">Failed: {detailCampaign?.failed}</Badge>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailSends.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{s.email}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "sent" ? "default" : s.status === "failed" ? "destructive" : "secondary"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.attempts}</TableCell>
                  <TableCell className="text-xs text-destructive max-w-[200px] truncate">{s.error || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(BulkEmailManager);

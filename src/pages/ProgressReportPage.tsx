import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReportData {
  name: string;
  email: string;
  level: string;
  country: string;
  attendance: number;
  sessionsRemaining: number;
  weeklyXp: number;
  placementScore: number | null;
  placementLevel: string | null;
  joinedAt: string;
}

const ProgressReportPage = () => {
  const [params] = useSearchParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const isAr = language === "ar";

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = params.get("uid") || session.user.id;

      const [profileRes, enrollRes, attendRes, xpRes, ptRes] = await Promise.all([
        supabase.from("profiles").select("name, email, level, country, created_at").eq("user_id", uid).maybeSingle(),
        supabase.from("enrollments").select("sessions_remaining, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("group_attendance").select("id").eq("user_id", uid).eq("status", "present"),
        supabase.from("student_xp").select("xp_earned").eq("user_id", uid),
        supabase.from("placement_tests").select("score, level, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]).catch(() => Array(5).fill({ data: null, error: true }));

      const totalXp = Array.isArray(xpRes?.data)
        ? xpRes.data.reduce((s: number, r: any) => s + (r.xp_earned || 0), 0)
        : 0;

      setData({
        name: profileRes.data?.name || "Student",
        email: profileRes.data?.email || session.user.email || "",
        level: profileRes.data?.level || "Beginner",
        country: profileRes.data?.country || "",
        attendance: attendRes.data?.length || 0,
        sessionsRemaining: enrollRes.data?.sessions_remaining || 0,
        weeklyXp: totalXp,
        placementScore: (ptRes.data as any)?.score || null,
        placementLevel: (ptRes.data as any)?.level || null,
        joinedAt: profileRes.data?.created_at || new Date().toISOString(),
      });
      setLoading(false);
    };
    load();
  }, [params]);

  const handlePrint = () => window.print();

  const dateLocale = isAr ? "ar-EG" : "en-US";
  const month = new Date().toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
  const joinedDate = data ? new Date(data.joinedAt).toLocaleDateString(dateLocale, { month: "long", year: "numeric" }) : "";

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">{isAr ? "جارٍ تحميل التقرير..." : "Loading report…"}</div>;
  if (!data) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">{isAr ? "سجّل الدخول لعرض تقريرك." : "Sign in to view your report."}</div>;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Print controls — hidden when printing */}
      <div className="print:hidden flex justify-center gap-3 py-6">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" /> {isAr ? "طباعة / حفظ كـ PDF" : "Print / Save as PDF"}
        </Button>
      </div>

      {/* Report card — uses inline styles for print/PDF compatibility */}
      <div ref={reportRef} className="max-w-2xl mx-auto bg-white shadow-xl print:shadow-none print:max-w-none"
        style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" }}>

        {/* Header */}
        <div style={{ background: "#000", padding: "32px 40px", textAlign: "center" }}>
          <div style={{ display: "inline-block", width: 60, height: 60, borderRadius: "50%", background: "#FFFF00", lineHeight: "60px", fontSize: 28, fontWeight: 900, color: "#000", marginBottom: 12 }}>K</div>
          <h1 style={{ color: "#FFFF00", margin: "0 0 4px", fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>KLovers Korean Academy</h1>
          <p style={{ color: "#bbb", margin: 0, fontSize: 13 }}>{isAr ? "تقرير تقدم الطالب" : "Student Progress Report"} · {month}</p>
        </div>

        {/* Student info */}
        <div style={{ background: "#f8f9fa", padding: "24px 40px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "#111" }}>{data.name}</h2>
          <p style={{ margin: "0 0 2px", color: "#555", fontSize: 13 }}>{data.email}</p>
          <p style={{ margin: 0, color: "#555", fontSize: 13 }}>{isAr ? "طالب منذ" : "Student since"} {joinedDate}{data.country ? ` · ${data.country}` : ""}</p>
        </div>

        {/* Stats grid */}
        <div style={{ padding: "32px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
            {[
              { label: isAr ? "الحصص المحضورة" : "Classes Attended", value: data.attendance, emoji: "✅" },
              { label: isAr ? "الحصص المتبقية" : "Sessions Remaining", value: data.sessionsRemaining, emoji: "📅" },
              { label: isAr ? "إجمالي XP المكتسب" : "Total XP Earned", value: `${data.weeklyXp} XP`, emoji: "⚡" },
            ].map(({ label, value, emoji }) => (
              <div key={label} style={{ background: "#f8f9fa", borderRadius: 10, padding: "16px 12px", textAlign: "center", border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{value}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Level info */}
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#92400e" }}>{isAr ? "المستوى الحالي" : "Current Level"}</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111" }}>{data.level}</p>
            {data.placementScore && <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>{isAr ? "اختبار تحديد المستوى:" : "Placement test:"} {data.placementScore}/100 · {data.placementLevel}</p>}
          </div>

          {/* Message */}
          <div style={{ borderLeft: "3px solid #FFFF00", paddingLeft: 16, marginBottom: 32 }}>
            <p style={{ margin: "0 0 8px", color: "#222", lineHeight: 1.6 }}>
              {isAr
                ? <>واصل العمل الرائع يا <strong>{data.name.split(" ")[0]}</strong>! الاستمرارية هي مفتاح إتقان الكورية. حتى 10 دقائق من التمرين اليومي تتراكم لتصبح طلاقة مع الوقت.</>
                : <>Keep up the great work, <strong>{data.name.split(" ")[0]}</strong>! Consistency is the key to mastering Korean. Even 10 minutes of daily practice compounds into fluency over time.</>
              }
            </p>
            <p style={{ margin: 0, color: "#555", fontSize: 13 }}>화이팅! 💪 — Reham &amp; the K-Lovers team</p>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, color: "#777", fontSize: 12 }}>kloversegy.com · koreanlovers.net@gmail.com</p>
            <p style={{ margin: 0, color: "#777", fontSize: 12 }}>{isAr ? "تم الإنشاء" : "Generated"} {new Date().toLocaleDateString(dateLocale)}</p>
          </div>
        </div>
      </div>

      <div className="h-8 print:hidden" />
    </div>
  );
};

export default ProgressReportPage;

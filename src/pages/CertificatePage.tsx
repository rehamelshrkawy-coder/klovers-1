import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LEVEL_LABELS: Record<string, string> = {
  "A0": "Complete Beginner",
  "A1": "TOPIK 1 – Beginner",
  "TOPIK 1 / A1": "TOPIK 1 – Beginner",
  "A2": "TOPIK 2 – Elementary",
  "TOPIK 2 / A2": "TOPIK 2 – Elementary",
  "B1": "TOPIK 3 – Intermediate",
  "TOPIK 3 / B1": "TOPIK 3 – Intermediate",
  "B2": "TOPIK 4 – Upper Intermediate",
  "TOPIK 4 / B2": "TOPIK 4 – Upper Intermediate",
  "C1": "TOPIK 5 – Advanced",
  "TOPIK 5 / C1": "TOPIK 5 – Advanced",
  "C2": "TOPIK 6 – Mastery",
  "TOPIK 6 / C2": "TOPIK 6 – Mastery",
};

const CertificatePage = () => {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const level = decodeURIComponent(params.get("level") || "A0");
  const levelLabel = LEVEL_LABELS[level] || level;

  useEffect(() => {
    const loadName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = params.get("uid") || session.user.id;
      const { data } = await supabase.from("profiles").select("name").eq("user_id", uid).maybeSingle();
      if (data?.name) setName(data.name);
      setLoading(false);
    };
    loadName();
  }, [params]);

  useEffect(() => {
    if (loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1200, H = 850;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Gold border outer
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Gold border inner
    ctx.strokeStyle = "rgba(255,255,0,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    // Corner ornaments
    const corners = [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]];
    corners.forEach(([x, y]) => {
      ctx.fillStyle = "#FFFF00";
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top badge / logo area
    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    ctx.arc(W / 2, 110, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "bold 40px serif";
    ctx.textAlign = "center";
    ctx.fillText("K", W / 2, 126);

    // Title
    ctx.fillStyle = "#FFFF00";
    ctx.font = "bold 15px sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("K L O V E R S   K O R E A N   A C A D E M Y", W / 2, 186);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "13px sans-serif";
    ctx.fillText("CERTIFICATE OF ACHIEVEMENT", W / 2, 210);

    // Divider
    const grad = ctx.createLinearGradient(100, 0, W - 100, 0);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, "#FFFF00");
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, 230);
    ctx.lineTo(W - 100, 230);
    ctx.stroke();

    // "This certifies that"
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("This is to certify that", W / 2, 285);

    // Student name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${name.length > 20 ? 44 : 56}px Georgia, serif`;
    ctx.fillText(name, W / 2, 360);

    // Underline name
    const nameW = ctx.measureText(name).width;
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameW / 2, 374);
    ctx.lineTo(W / 2 + nameW / 2, 374);
    ctx.stroke();

    // "has successfully completed"
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("has successfully completed the Korean language program at", W / 2, 420);

    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("KLovers Korean Academy and achieved the level of", W / 2, 448);

    // Level badge background — manual rounded rect (roundRect not supported in older Safari/Firefox)
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };
    ctx.fillStyle = "#FFFF00";
    rr(W / 2 - 160, 472, 320, 64, 12);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(levelLabel, W / 2, 511);

    // Divider
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 570);
    ctx.lineTo(W - 100, 570);
    ctx.stroke();

    // Date + signature area
    const dateStr = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Issued: ${dateStr}`, 120, 630);

    ctx.textAlign = "right";
    ctx.fillText("kloversegy.com", W - 120, 630);

    // Signature line
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(255,255,0,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, 690);
    ctx.lineTo(W / 2 + 120, 690);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("Reham", W / 2, 714);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Founder & Lead Instructor · KLovers Academy", W / 2, 732);

    // Korean text watermark
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#FFFF00";
    ctx.font = "bold 200px sans-serif";
    ctx.fillText("한국어", W / 2, H / 2 + 60);
    ctx.restore();

  }, [loading, name, levelLabel]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `klovers-certificate-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4">
      <h1 className="text-foreground text-2xl font-bold mb-2">{t("certificatePage.pageTitle")}</h1>
      <p className="text-muted-foreground text-sm mb-6">{t("certificatePage.pageSubtitle")}</p>

      {loading ? (
        <div className="text-muted-foreground">{t("certificatePage.generating")}</div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            className="rounded-xl shadow-2xl max-w-full"
            style={{ border: "2px solid rgba(255,255,0,0.3)" }}
          />
          <Button onClick={download} className="mt-6 gap-2 text-base font-bold px-8" size="lg">
            <Download className="h-5 w-5" /> {t("certificatePage.downloadPng")}
          </Button>
          <p className="text-muted-foreground text-xs mt-3">{t("certificatePage.rightClickHint")}</p>
        </>
      )}
    </div>
  );
};

export default CertificatePage;

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Copy, Upload, CheckCircle, Clock, Wallet, Eye, RefreshCw, AlertTriangle, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { track } from "@/lib/tracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { useLanguage } from "@/contexts/LanguageContext";

const METHOD_DETAIL_KEYS: Record<string, { labelKey: string; value: string }> = {
  vodafone_cash: { labelKey: "payment.sendToVodafone", value: "+201010003084" },
  instapay:      { labelKey: "payment.transferToBank", value: "00601121777560" },
};

interface EnrollmentData {
  id: string;
  plan_type: string;
  class_type: string | null;
  duration: number;
  amount: number;
  currency: string;
  approval_status: string;
  due_at: string | null;
  classes_included: number;
  receipt_url: string;
  payment_method: string | null;
  payment_date: string | null;
}

/* ── Order Summary sub-component ── */
const OrderSummary = ({ enrollment }: { enrollment: EnrollmentData }) => {
  const { t, language } = useLanguage();
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Wallet className="h-5 w-5" /> {t("payment.orderSummary")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("payment.plan")}</span>
          <span className="font-medium text-foreground capitalize">
            {t("payment.planClasses").replace("{plan}", enrollment.plan_type)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("payment.duration")}</span>
          <span className="font-medium text-foreground">
            {enrollment.duration} {enrollment.duration === 1 ? t("payment.month") : t("payment.months")} ({t("payment.classesCount").replace("{count}", String(enrollment.classes_included))})
          </span>
        </div>
        <div className="flex justify-between text-sm border-t border-border pt-2">
          <span className="font-semibold text-foreground">{t("payment.total")}</span>
          <span className="font-bold text-lg text-foreground">{Math.round(enrollment.amount).toLocaleString()} EGP</span>
        </div>
        {enrollment.due_at && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t("payment.payBefore")} {new Date(enrollment.due_at).toLocaleString(language === "ar" ? "ar-EG" : "en-US")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ── Under Review confirmation block ── */
const UnderReviewBlock = ({
  enrollment,
  receiptFileName,
  onViewReceipt,
  viewingReceipt,
  onReplaceReceipt,
  replacing,
}: {
  enrollment: EnrollmentData;
  receiptFileName: string;
  onViewReceipt: () => void;
  viewingReceipt: boolean;
  onReplaceReceipt: (file: File) => void;
  replacing: boolean;
}) => {
  const { t, language } = useLanguage();
  const [showReplace, setShowReplace] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);

  const METHOD_LABEL_KEYS: Record<string, string> = {
    vodafone_cash: "payment.vodafoneCash",
    instapay: "payment.instapay",
    bank_transfer: "payment.bankTransfer",
  };

  const handleReplace = () => {
    if (newFile) onReplaceReceipt(newFile);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Status badge */}
        <div className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 mx-auto text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{t("payment.paymentUnderReview")}</h2>
        </div>

        {/* Submission details */}
        <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("payment.paymentMethod")}</span>
            <span className="font-medium text-foreground">
              {enrollment.payment_method && METHOD_LABEL_KEYS[enrollment.payment_method]
                ? t(METHOD_LABEL_KEYS[enrollment.payment_method])
                : enrollment.payment_method}
            </span>
          </div>
          {enrollment.payment_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("payment.paymentDate")}</span>
              <span className="font-medium text-foreground">{new Date(enrollment.payment_date).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("payment.receipt")}</span>
            <span className="font-medium text-foreground truncate max-w-[180px]">{receiptFileName}</span>
          </div>
        </div>

        {/* View receipt */}
        <Button variant="outline" className="w-full" onClick={onViewReceipt} disabled={viewingReceipt}>
          <Eye className="h-4 w-4 mr-2" />
          {viewingReceipt ? t("payment.opening") : t("payment.viewReceipt")}
        </Button>

        {/* Next-step messaging */}
        <div className="bg-accent/50 border border-border rounded-lg p-4 text-sm space-y-1">
          <p className="font-semibold text-foreground">{t("payment.whatNext")}</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>{t("payment.whatNext1")} <strong className="text-foreground">{t("payment.hours")}</strong>.</li>
            <li>{t("payment.whatNext2Pre")} <strong className="text-foreground">{t("payment.whatNext2Mid")}</strong> {t("payment.whatNext2Post")}</li>
            <li>{t("payment.whatNext3")}</li>
          </ul>
        </div>

        {/* Replace receipt */}
        {!showReplace ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground transition-colors w-full text-center"
            onClick={() => setShowReplace(true)}
          >
            {t("payment.wrongFile")}
          </button>
        ) : (
          <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                {t("payment.replaceWarning")}
              </p>
            </div>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setNewFile(e.target.files?.[0] || null)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={!newFile || replacing}
                onClick={handleReplace}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {replacing ? t("payment.replacing") : t("payment.replaceReceipt")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowReplace(false); setNewFile(null); }}>
                {t("payment.cancel")}
              </Button>
            </div>
          </div>
        )}

        <Button className="w-full" onClick={() => window.location.href = "/dashboard"}>
          {t("payment.goToDashboard")}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ── Payment Form sub-component ── */
const PaymentForm = ({
  enrollment,
  onSubmit,
  submitting,
}: {
  enrollment: EnrollmentData;
  onSubmit: (method: string, date: string, file: File, txRef: string) => void;
  submitting: boolean;
}) => {
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [txRef, setTxRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const METHODS = [
    { value: "vodafone_cash", label: t("payment.vodafoneCash"), icon: "📱" },
    { value: "instapay", label: t("payment.instapay"), icon: "💳" },
    { value: "bank_transfer", label: t("payment.bankTransfer"), icon: "🏦" },
  ];

  const copyAccount = () => {
    const detail = METHOD_DETAIL_KEYS[paymentMethod];
    if (!detail) return;
    navigator.clipboard.writeText(detail.value);
    toast({ title: t("payment.copied"), description: t("payment.copiedDesc").replace("{label}", t(detail.labelKey)) });
  };

  const handleSubmit = () => {
    if (!paymentMethod || !paymentDate || !receiptFile) return;
    onSubmit(paymentMethod, paymentDate, receiptFile, txRef);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("payment.submitPayment")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Payment Method */}
        <div className="space-y-2">
          <Label id="payment-method-label">{t("payment.paymentMethodRequired")}</Label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="payment-method-label">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={paymentMethod === m.value}
                aria-label={m.label}
                onClick={() => setPaymentMethod(m.value)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  paymentMethod === m.value
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-xl block" aria-hidden="true">{m.icon}</span>
                <span className="text-xs font-medium text-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transfer details — shown only after method is selected */}
        {paymentMethod === "bank_transfer" && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground">{t("payment.bankTransferHelp")}</p>
            <a
              href={WHATSAPP_BASE}
              onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "egypt_payment_bank_transfer" }); }}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1ebe5d] px-4 py-2 rounded-lg transition-colors w-full justify-center"
            >
              {t("payment.contactWhatsApp")}
            </a>
          </div>
        )}
        {paymentMethod && paymentMethod !== "bank_transfer" && METHOD_DETAIL_KEYS[paymentMethod] && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{t(METHOD_DETAIL_KEYS[paymentMethod].labelKey)}</p>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-bold text-foreground flex-1">{METHOD_DETAIL_KEYS[paymentMethod].value}</code>
              <Button variant="outline" size="sm" type="button" onClick={copyAccount}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Payment Date */}
        <div className="space-y-2">
          <Label htmlFor="paymentDate">{t("payment.paymentDateRequired")}</Label>
          <Input
            id="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Receipt Upload */}
        <div className="space-y-2">
          <Label htmlFor="receipt">{t("payment.receiptLabel")}</Label>
          <Input
            id="receipt"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
          />
          {receiptFile && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Upload className="h-3 w-3" /> {receiptFile.name}
            </p>
          )}
        </div>

        {/* Transaction Reference */}
        <div className="space-y-2">
          <Label htmlFor="txRef">{t("payment.txRef")}</Label>
          <Input
            id="txRef"
            placeholder={t("payment.txRefPlaceholder")}
            value={txRef}
            onChange={(e) => setTxRef(e.target.value)}
            maxLength={100}
          />
        </div>

        <Button
          className="w-full"
          size="lg"
          type="button"
          disabled={!paymentMethod || !paymentDate || !receiptFile || submitting}
          onClick={handleSubmit}
        >
          {submitting ? t("payment.submitting") : t("payment.submitPayment")}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ── Main Page ── */
const EgyptPaymentPage = () => {
  useSEO({ title: "Complete Payment | Klovers Korean Academy", description: "Complete your enrollment payment to activate your Klovers Korean course.", noindex: true });
  const { t } = useLanguage();
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [lastFileName, setLastFileName] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Save payment URL so login page redirects back here after sign-in
        localStorage.setItem("enroll_redirect", window.location.pathname);
        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      // Try direct query first (works when user_id matches or is null)
      let data: any = null;
      const { data: direct, error: directErr } = await supabase
        .from("enrollments")
        .select("id, plan_type, class_type, duration, amount, currency, approval_status, due_at, classes_included, receipt_url, payment_method, payment_date")
        .eq("id", enrollmentId!)
        .maybeSingle();

      if (!directErr && direct) {
        data = direct;
      } else {
        // Fallback: use SECURITY DEFINER RPC (bypasses RLS for manual enrollments)
        const { data: rows, error: rpcErr } = await (supabase as any)
          .rpc("get_enrollment_for_payment", { p_enrollment_id: enrollmentId! });
        data = rows && rows.length > 0 ? rows[0] : null;
      }

      if (!data) {
        toast({ title: t("payment.enrollmentNotFound"), description: `ID: ${enrollmentId}`, variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setEnrollment(data as any);
      if (data.receipt_url) {
        setLastFileName(data.receipt_url.split("/").pop() ?? "receipt");
      }
      setLoading(false);
    };
    load();
    track.pageView();
  }, [enrollmentId, navigate]);

  const uploadReceipt = useCallback(async (file: File, enrollId: string): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) throw new Error(t("payment.fileTooLarge"));
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) throw new Error(t("payment.onlyAllowed"));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error(t("payment.notAuthenticated"));

    const ext = file.name.split(".").pop();
    const path = `${session.user.id}/${enrollId}.${ext}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }, [t]);

  const handleSubmit = async (method: string, date: string, file: File, txRef: string) => {
    if (!enrollment) return;
    setSubmitting(true);
    setUploadProgress(10);
    try {
      const path = await uploadReceipt(file, enrollment.id);
      setUploadProgress(70);

      const { error: rpcError } = await supabase.rpc("submit_egypt_payment", {
        _enrollment_id: enrollment.id,
        _payment_method: method,
        _payment_date: date,
        _receipt_url: path,
        _tx_ref: txRef.trim(),
      } as any);
      if (rpcError) {
        // If status changed (e.g. admin already approved), refresh enrollment data
        if (rpcError.message?.includes("PENDING_PAYMENT")) {
          const { data: refreshed } = await supabase
            .from("enrollments")
            .select("id, plan_type, class_type, duration, amount, currency, approval_status, due_at, classes_included, receipt_url, payment_method, payment_date")
            .eq("id", enrollment.id)
            .single();
          if (refreshed) {
            setEnrollment(refreshed as any);
            toast({ title: t("payment.statusUpdated"), description: refreshed.approval_status === "APPROVED" ? t("payment.alreadyApproved") : t("payment.statusChanged"), variant: "default" });
            return;
          }
        }
        throw rpcError;
      }

      setUploadProgress(100);
      setLastFileName(file.name);
      setEnrollment((prev) =>
        prev ? { ...prev, approval_status: "UNDER_REVIEW", payment_method: method, payment_date: date, receipt_url: path } : null
      );
      track.purchase({ value: enrollment.amount, currency: enrollment.currency || "EGP" });
      toast({ title: t("payment.paymentSubmitted"), description: t("payment.paymentSubmittedDesc") });
    } catch (err: any) {
      toast({ title: t("payment.error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleViewReceipt = async () => {
    if (!enrollment?.receipt_url) return;
    setViewingReceipt(true);
    try {
      const { data, error } = await supabase.storage.from("receipts").createSignedUrl(enrollment.receipt_url, 600);
      if (error || !data?.signedUrl) throw error ?? new Error("Could not generate link");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast({ title: t("payment.error"), description: t("payment.couldNotOpen"), variant: "destructive" });
    } finally {
      setViewingReceipt(false);
    }
  };

  const handleReplaceReceipt = async (file: File) => {
    if (!enrollment) return;
    setReplacing(true);
    try {
      const path = await uploadReceipt(file, enrollment.id);

      const { error } = await supabase
        .from("enrollments")
        .update({ receipt_url: path } as any)
        .eq("id", enrollment.id);
      if (error) throw error;

      setLastFileName(file.name);
      setEnrollment((prev) => prev ? { ...prev, receipt_url: path } : null);
      toast({ title: t("payment.receiptReplaced"), description: t("payment.receiptReplacedDesc") });
    } catch (err: any) {
      toast({ title: t("payment.error"), description: err.message, variant: "destructive" });
    } finally {
      setReplacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">{t("payment.loading")}</p>
        </main>
      </div>
    );
  }

  if (!enrollment) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
        <OrderSummary enrollment={enrollment} />

        {enrollment.approval_status === "PENDING_PAYMENT" && (
          <>
            {uploadProgress !== null && (
              <div className="mb-4 space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {uploadProgress < 70 ? t("payment.uploadingReceipt") : uploadProgress < 100 ? t("payment.submittingPayment") : t("payment.done")}
                </p>
              </div>
            )}
            <PaymentForm enrollment={enrollment} onSubmit={handleSubmit} submitting={submitting} />
          </>
        )}

        {enrollment.approval_status === "UNDER_REVIEW" && (
          <UnderReviewBlock
            enrollment={enrollment}
            receiptFileName={lastFileName}
            onViewReceipt={handleViewReceipt}
            viewingReceipt={viewingReceipt}
            onReplaceReceipt={handleReplaceReceipt}
            replacing={replacing}
          />
        )}

        {enrollment.approval_status === "APPROVED" && (
          <div className="space-y-4">
            {/* Success card */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-9 w-9 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t("payment.youAreIn")}</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  {t("payment.approvedMsg")}
                </p>
                <Button className="w-full sm:w-auto" onClick={() => navigate("/dashboard")}>
                  {t("payment.goToDashboard")} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Upsell card — upgrade to private */}
            {enrollment.plan_type === "group" && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">{t("payment.upgradeAvailable")}</p>
                      <h3 className="font-bold text-foreground mb-1">{t("payment.upgradeTitle")}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t("payment.upgradeDesc")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I just enrolled in a group class and I'm interested in upgrading to private sessions. Can you tell me more?")}`}
                          onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(`${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I just enrolled in a group class and I'm interested in upgrading to private sessions. Can you tell me more?")}`, { cta_label: "egypt_payment_upgrade_private" }); }}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          {t("payment.askPrivate")}
                        </a>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-muted-foreground">
                          {t("payment.noThanks")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {enrollment.approval_status === "REJECTED" && (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <h2 className="text-xl font-semibold text-destructive">{t("payment.paymentRejected")}</h2>
              <p className="text-muted-foreground">{t("payment.rejectedMsg")}</p>
              <a
                href={WHATSAPP_BASE}
                onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "egypt_payment_rejected" }); }}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1ebe5d] px-4 py-2 rounded-lg transition-colors"
              >
                {t("payment.contactWhatsApp")}
              </a>
            </CardContent>
          </Card>
        )}

        {/* Trust badges */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: "🔒", title: t("payment.secureUpload"), desc: t("payment.secureUploadDesc") },
            { icon: "⚡", title: t("payment.fastReview"), desc: t("payment.fastReviewDesc") },
            { icon: "💬", title: t("payment.needHelp"), desc: t("payment.needHelpDesc") },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/50 border border-border rounded-xl p-3 text-center">
              <span className="text-xl block mb-1">{icon}</span>
              <p className="text-xs font-semibold text-foreground">{title}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* WhatsApp fallback */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {t("payment.troubleText")}{" "}
          <a
            href={WHATSAPP_BASE}
            onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "egypt_payment_help" }); }}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 font-semibold hover:underline"
          >
            {t("payment.whatsappUs")}
          </a>{" "}
          {t("payment.troubleHelp")}
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default EgyptPaymentPage;

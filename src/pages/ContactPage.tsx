import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

const WA_DIRECT = `${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I'm interested in learning Korean with Klovers. Can you tell me more?")}`;
const WA_GROUP = "https://chat.whatsapp.com/BOg8xaXYnl00gjj6gnB9dq";

const ContactPage = () => {
  useSEO({ title: "Contact Us", description: "Get in touch with Klovers Korean Lovers Academy. We would love to hear from you about courses, enrollment, or any questions.", canonical: "https://kloversegy.com/contact" });
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Thank you!", description: "Please continue in our Telegram group." });
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => {
      window.open("https://t.me/+Fu5T7d4wLMsxNDY9", "_blank", "noopener,noreferrer");
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
                {t("contactPage", "title")}
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("contactPage", "subtitle")}
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-6">

              {/* ── Primary: Direct WhatsApp DM ── */}
              <a
                href={WA_DIRECT}
                onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WA_DIRECT, { cta_label: "contact_direct" }); }}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-2xl px-6 py-5 shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg leading-tight">{isAr ? "تحدث عبر واتساب" : "Chat on WhatsApp"}</p>
                  <p className="text-white/80 text-sm">{isAr ? "أسرع طريقة للتواصل — نرد خلال دقائق" : "Fastest way to reach us — reply within minutes"}</p>
                </div>
                <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-70" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
              </a>

              {/* ── Secondary: Join WhatsApp group ── */}
              <a
                href={WA_GROUP}
                onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WA_GROUP, { cta_label: "contact_group" }); }}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-card border border-border hover:border-[#25D366]/50 rounded-2xl px-6 py-4 transition-all hover:shadow-md"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#25D366]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{isAr ? "انضم لمجتمعنا على واتساب" : "Join our WhatsApp Community"}</p>
                  <p className="text-muted-foreground text-xs">{isAr ? "تواصل مع الطلاب واحصل على تحديثات ونصائح" : "Connect with students, get updates & tips"}</p>
                </div>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
              </a>

              {/* ── Tertiary: Contact form ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-4">{isAr ? "أو أرسل لنا رسالة" : "Or send us a message"}</p>
                <Card className="border-border">
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          {t("contactPage", "form.name")}
                        </label>
                        <Input
                          placeholder={t("contactPage", "form.namePlaceholder")}
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          {t("contactPage", "form.email")}
                        </label>
                        <Input
                          type="email"
                          placeholder={t("contactPage", "form.emailPlaceholder")}
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          {t("contactPage", "form.subject")}
                        </label>
                        <Input
                          placeholder={t("contactPage", "form.subjectPlaceholder")}
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          {t("contactPage", "form.message")}
                        </label>
                        <Textarea
                          placeholder={t("contactPage", "form.messagePlaceholder")}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          required
                          rows={5}
                        />
                      </div>
                      <Button type="submit" className="w-full gap-2">
                        <Send className="h-4 w-4" />
                        {t("contactPage", "form.send")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;

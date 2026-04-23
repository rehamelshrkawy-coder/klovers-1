import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Printer, Download, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CONSONANTS = [
  { char: "ㄱ", rom: "g / k",  ex: "가 (ga)" },
  { char: "ㄴ", rom: "n",      ex: "나 (na)" },
  { char: "ㄷ", rom: "d / t",  ex: "다 (da)" },
  { char: "ㄹ", rom: "r / l",  ex: "라 (ra)" },
  { char: "ㅁ", rom: "m",      ex: "마 (ma)" },
  { char: "ㅂ", rom: "b / p",  ex: "바 (ba)" },
  { char: "ㅅ", rom: "s",      ex: "사 (sa)" },
  { char: "ㅇ", rom: "– / ng", ex: "아 (a)" },
  { char: "ㅈ", rom: "j",      ex: "자 (ja)" },
  { char: "ㅊ", rom: "ch",     ex: "차 (cha)" },
  { char: "ㅋ", rom: "k",      ex: "카 (ka)" },
  { char: "ㅌ", rom: "t",      ex: "타 (ta)" },
  { char: "ㅍ", rom: "p",      ex: "파 (pa)" },
  { char: "ㅎ", rom: "h",      ex: "하 (ha)" },
];

const DOUBLE_CONSONANTS = [
  { char: "ㄲ", rom: "kk",  ex: "까 (kka)" },
  { char: "ㄸ", rom: "tt",  ex: "따 (tta)" },
  { char: "ㅃ", rom: "pp",  ex: "빠 (ppa)" },
  { char: "ㅆ", rom: "ss",  ex: "싸 (ssa)" },
  { char: "ㅉ", rom: "jj",  ex: "짜 (jja)" },
];

const VOWELS = [
  { char: "ㅏ", rom: "a",   ex: "아 (a)" },
  { char: "ㅑ", rom: "ya",  ex: "야 (ya)" },
  { char: "ㅓ", rom: "eo",  ex: "어 (eo)" },
  { char: "ㅕ", rom: "yeo", ex: "여 (yeo)" },
  { char: "ㅗ", rom: "o",   ex: "오 (o)" },
  { char: "ㅛ", rom: "yo",  ex: "요 (yo)" },
  { char: "ㅜ", rom: "u",   ex: "우 (u)" },
  { char: "ㅠ", rom: "yu",  ex: "유 (yu)" },
  { char: "ㅡ", rom: "eu",  ex: "으 (eu)" },
  { char: "ㅣ", rom: "i",   ex: "이 (i)" },
];

const COMPOUND_VOWELS = [
  { char: "ㅐ", rom: "ae",  ex: "애 (ae)" },
  { char: "ㅒ", rom: "yae", ex: "얘 (yae)" },
  { char: "ㅔ", rom: "e",   ex: "에 (e)" },
  { char: "ㅖ", rom: "ye",  ex: "예 (ye)" },
  { char: "ㅘ", rom: "wa",  ex: "와 (wa)" },
  { char: "ㅙ", rom: "wae", ex: "봬 (wae)" },
  { char: "ㅚ", rom: "oe",  ex: "외 (oe)" },
  { char: "ㅝ", rom: "wo",  ex: "워 (wo)" },
  { char: "ㅞ", rom: "we",  ex: "웨 (we)" },
  { char: "ㅟ", rom: "wi",  ex: "위 (wi)" },
  { char: "ㅢ", rom: "ui",  ex: "의 (ui)" },
];

type LetterRow = { char: string; rom: string; ex: string };

const LetterGrid = ({ items, label }: { items: LetterRow[]; label: string }) => (
  <div className="mb-10 print:mb-6">
    <h2 className="text-lg font-black text-foreground mb-3 border-b border-border pb-1">{label}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
      {items.map((item) => (
        <div
          key={item.char}
          className="flex flex-col items-center bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
        >
          <span className="text-3xl font-black text-foreground leading-none mb-1">{item.char}</span>
          <span className="text-xs font-bold text-primary">{item.rom}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{item.ex}</span>
        </div>
      ))}
    </div>
  </div>
);

const HangulStarterPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  useSEO({
    title: "Free Hangul Starter Sheet — Korean Alphabet | Klovers",
    description: "Learn the Korean alphabet (Hangul) for free. Complete consonants, vowels, and pronunciation guide — explained simply. Printable.",
    canonical: "https://kloversegy.com/hangul-starter",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16 print:pt-4">

        {/* Hero */}
        <section className="py-12 md:py-16 border-b border-border bg-primary/5 print:hidden">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <span className="inline-block text-4xl mb-3">🇰🇷</span>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">
              {isAr ? "ورقة هانغول المجانية" : "Free Hangul Starter Sheet"}
            </h1>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              {isAr
                ? "كل الحروف الكورية في مكان واحد — مع اللفظ الصح. اطبعها أو احفظها وابدأ تتعلم النهارده."
                : "Every Korean letter in one place — with correct pronunciation. Print it, save it, start today."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => window.print()} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                {isAr ? "اطبع" : "Print"}
              </Button>
              <Button asChild className="gap-2">
                <Link to="/free-trial">
                  {isAr ? "احجز حصة مجانية" : "Book a Free Class"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Alphabet tables */}
        <section className="py-12 print:py-4">
          <div className="container mx-auto px-4 max-w-4xl">

            {/* Syllable block explainer */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-10 print:mb-6 print:border-foreground">
              <h2 className="font-black text-foreground mb-2">
                {isAr ? "كيف تُكوَّن الكلمات الكورية" : "How Korean syllable blocks work"}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {isAr
                  ? "الكورية بتتكتب كـ'بلوكات' — كل بلوكة = مقطع صوتي. كل بلوكة فيها حرف ساكن + حرف مد (+ حرف ساكن اختياري في الآخر)."
                  : "Korean is written in syllable blocks — each block = one syllable sound. Each block contains a consonant + vowel (+ optional final consonant)."}
              </p>
              <div className="flex flex-wrap gap-6 items-center">
                {[
                  { syl: "가", breakdown: "ㄱ + ㅏ", meaning: isAr ? '"ga"' : '"ga"' },
                  { syl: "한", breakdown: "ㅎ + ㅏ + ㄴ", meaning: isAr ? '"han"' : '"han"' },
                  { syl: "국", breakdown: "ㄱ + ㅜ + ㄱ", meaning: isAr ? '"guk"' : '"guk"' },
                ].map(({ syl, breakdown, meaning }) => (
                  <div key={syl} className="flex items-center gap-3 bg-primary/10 rounded-xl px-4 py-3">
                    <span className="text-4xl font-black text-foreground">{syl}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{breakdown}</p>
                      <p className="text-xs text-muted-foreground">{meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <LetterGrid
              items={CONSONANTS}
              label={isAr ? "الحروف الساكنة الأساسية (١٤)" : "Basic Consonants (14)"}
            />
            <LetterGrid
              items={DOUBLE_CONSONANTS}
              label={isAr ? "الحروف الساكنة المضاعفة (٥)" : "Double Consonants (5)"}
            />
            <LetterGrid
              items={VOWELS}
              label={isAr ? "حروف المد الأساسية (١٠)" : "Basic Vowels (10)"}
            />
            <LetterGrid
              items={COMPOUND_VOWELS}
              label={isAr ? "حروف المد المركبة (١١)" : "Compound Vowels (11)"}
            />

            {/* Quick tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 print:hidden">
              <h2 className="font-black text-foreground mb-3">
                {isAr ? "٣ حقائق تسهّل عليك" : "3 facts that make Hangul easy"}
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✅ {isAr ? "هانغول اتصمم في ١٤٤٣ م — بيُتعلم في ساعات مش سنين." : "Hangul was designed in 1443 — it can be learned in hours, not years."}</li>
                <li>✅ {isAr ? "كل حرف شكله بيشبح طريقة لفظه." : "Each letter's shape reflects how your mouth moves to say it."}</li>
                <li>✅ {isAr ? "مش لازم تحفظ كل حاجة قبل ما تبدأ — مدرستك هتشرحلك كل حاجة." : "You don't need to memorize everything before starting — your teacher will guide you through it."}</li>
              </ul>
              <div className="mt-5">
                <Button asChild className="gap-2 w-full sm:w-auto">
                  <Link to="/free-trial">
                    {isAr ? "ابدأ مع مدرسة حقيقية — مجانًا" : "Start with a real teacher — free"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HangulStarterPage;

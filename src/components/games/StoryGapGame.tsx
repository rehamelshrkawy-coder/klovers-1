import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trophy, ArrowRight, BookOpen } from "lucide-react";

interface StoryGap {
  index: number; // position of blank in parts
  options: string[];
  correct: string;
  hint: string;
}

interface Story {
  title: string;
  emoji: string;
  level: string;
  parts: string[]; // even indices = text, odd indices = gap markers "[  ]"
  gaps: StoryGap[];
  english: string;
}

const STORIES: Story[] = [
  {
    title: "민준의 아침",
    emoji: "🌅",
    level: "Intermediate",
    english: "Minjun's Morning",
    parts: [
      "민준은 매일 아침 7시에 ",
      " 일어나요. 먼저 샤워를 하고 ",
      " 아침밥을 먹어요. 오늘은 달걀과 밥을 ",
      " 먹었어요. 그 다음에 가방을 챙기고 학교에 ",
      ".",
    ],
    gaps: [
      { index: 1, options: ["정도", "쯤", "만큼", "까지"], correct: "쯤", hint: "approximately / around" },
      { index: 3, options: ["그리고", "하지만", "그래서", "그런데"], correct: "그리고", hint: "and then" },
      { index: 5, options: ["맛있게", "빨리", "천천히", "조금"], correct: "맛있게", hint: "deliciously" },
      { index: 7, options: ["갔어요", "왔어요", "있었어요", "달려갔어요"], correct: "갔어요", hint: "went" },
    ],
  },
  {
    title: "서울 여행",
    emoji: "🗼",
    level: "Intermediate",
    english: "A Trip to Seoul",
    parts: [
      "지난 주말에 친구와 서울에 ",
      " 갔어요. 경복궁을 ",
      " 다음에 인사동에서 전통 음식을 먹었어요. 음식이 정말 ",
      " 맛있었어요! 저녁에는 남산타워에 올라가서 야경을 ",
      ".",
    ],
    gaps: [
      { index: 1, options: ["같이", "혼자", "빨리", "천천히"], correct: "같이", hint: "together" },
      { index: 3, options: ["구경한", "먹은", "산", "읽은"], correct: "구경한", hint: "after sightseeing" },
      { index: 5, options: ["너무", "별로", "조금", "거의"], correct: "너무", hint: "so / really (very)" },
      { index: 7, options: ["봤어요", "찍었어요", "먹었어요", "샀어요"], correct: "봤어요", hint: "saw / watched" },
    ],
  },
  {
    title: "한국어 공부",
    emoji: "📚",
    level: "Beginner–Intermediate",
    english: "Studying Korean",
    parts: [
      "저는 6개월 전부터 한국어를 ",
      " 있어요. 처음에는 한글을 배웠고 지금은 ",
      " 열심히 공부하고 있어요. 드라마를 보면서 ",
      " 많이 늘었어요. 내년에는 한국에 ",
      " 싶어요.",
    ],
    gaps: [
      { index: 1, options: ["공부하고", "배우고", "가르치고", "읽고"], correct: "공부하고", hint: "studying (and)" },
      { index: 3, options: ["문법을", "한글을", "영어를", "수학을"], correct: "문법을", hint: "grammar (object)" },
      { index: 5, options: ["듣기가", "말하기가", "쓰기가", "읽기가"], correct: "듣기가", hint: "listening ability" },
      { index: 7, options: ["가고", "오고", "살고", "여행하고"], correct: "가고", hint: "go (and)" },
    ],
  },
  {
    title: "카페에서",
    emoji: "☕",
    level: "Beginner",
    english: "At the Café",
    parts: [
      "오늘 오후에 도서관 근처 카페에 ",
      ". 아메리카노를 한 잔 ",
      " 자리에 앉았어요. 노트북을 꺼내서 숙제를 ",
      " 시작했어요. 한 시간 후에 친구가 ",
      " 같이 이야기했어요.",
    ],
    gaps: [
      { index: 1, options: ["갔어요", "왔어요", "있었어요", "앉았어요"], correct: "갔어요", hint: "went" },
      { index: 3, options: ["시키고", "마시고", "주문하고", "사고"], correct: "시키고", hint: "ordered (and)" },
      { index: 5, options: ["하기", "먹기", "보기", "쓰기"], correct: "하기", hint: "do (기 nominalizer)" },
      { index: 7, options: ["와서", "가서", "있어서", "만나서"], correct: "와서", hint: "came and" },
    ],
  },
  {
    title: "날씨가 추워요",
    emoji: "❄️",
    level: "Intermediate",
    english: "The Weather is Cold",
    parts: [
      "오늘은 날씨가 ",
      " 추워요. 아침에 일어나 보니 창문에 성에가 ",
      " 있었어요. 두꺼운 코트를 입고 장갑도 ",
      " 밖에 나갔어요. 길을 걷다가 미끄러워서 ",
      " 뻔했어요.",
    ],
    gaps: [
      { index: 1, options: ["정말", "조금", "별로", "가끔"], correct: "정말", hint: "really / truly" },
      { index: 3, options: ["끼어", "맺혀", "있어", "녹아"], correct: "맺혀", hint: "formed (on the window)" },
      { index: 5, options: ["끼고", "쓰고", "입고", "신고"], correct: "끼고", hint: "put on (gloves) and" },
      { index: 7, options: ["넘어질", "떨어질", "미끄러질", "쓰러질"], correct: "넘어질", hint: "almost fell (넘어지다)" },
    ],
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const StoryGapGame = ({ onGameComplete }: { onGameComplete?: (score: number, total: number) => void }) => {
  const [stories] = useState(() => shuffleArray(STORIES).slice(0, 4));
  const [storyIdx, setStoryIdx] = useState(0);
  const [gapIdx, setGapIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [storyScore, setStoryScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const called = useRef(false);

  const story = stories[storyIdx];
  const gap = story?.gaps[gapIdx];

  useEffect(() => {
    if (gameOver && !called.current) {
      called.current = true;
      const total = stories.reduce((s, st) => s + st.gaps.length, 0);
      onGameComplete?.(totalScore, total);
    }
  }, [gameOver, totalScore, stories, onGameComplete]);

  const handleSelect = (opt: string) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === gap.correct;
    if (correct) { setStoryScore(s => s + 1); setTotalScore(s => s + 1); }
    setTotalAnswered(t => t + 1);
    setAnswers(prev => [...prev, opt]);
  };

  const next = () => {
    if (gapIdx + 1 >= story.gaps.length) {
      setStoryDone(true);
      return;
    }
    setGapIdx(g => g + 1);
    setSelected(null);
  };

  const nextStory = () => {
    if (storyIdx + 1 >= stories.length) { setGameOver(true); return; }
    setStoryIdx(s => s + 1);
    setGapIdx(0);
    setAnswers([]);
    setSelected(null);
    setStoryScore(0);
    setStoryDone(false);
  };

  const restart = () => {
    called.current = false;
    setStoryIdx(0); setGapIdx(0); setAnswers([]);
    setSelected(null); setStoryScore(0); setTotalScore(0);
    setTotalAnswered(0); setStoryDone(false); setGameOver(false);
  };

  // Render the story with answered blanks filled
  const renderStory = (withCurrent = false) => {
    const filledAnswers = withCurrent && selected ? [...answers.slice(0, -1), selected] : answers;
    return story.parts.map((part, i) => {
      if (i % 2 === 0) return <span key={i}>{part}</span>;
      const gapNumber = Math.floor(i / 2);
      const answer = filledAnswers[gapNumber];
      const isCurrentGap = gapNumber === gapIdx;
      const thisGap = story.gaps[gapNumber];
      if (answer) {
        const isCorrect = answer === thisGap.correct;
        return (
          <span key={i} className={`font-bold mx-0.5 px-1 rounded ${isCorrect ? "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30" : "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 line-through"}`}>
            {answer}
          </span>
        );
      }
      if (isCurrentGap) {
        return <span key={i} className="inline-block border-b-2 border-primary text-primary font-bold px-2 min-w-[3rem] text-center">___</span>;
      }
      return <span key={i} className="inline-block border-b-2 border-muted-foreground/30 px-2 min-w-[3rem] text-center text-muted-foreground">___</span>;
    });
  };

  if (gameOver) {
    const total = stories.reduce((s, st) => s + st.gaps.length, 0);
    const pct = Math.round((totalScore / total) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold">All Stories Complete! 📖</h2>
        <p className="text-muted-foreground">{totalScore}/{total} gaps correct ({pct}%)</p>
        <div className="text-3xl">{pct >= 80 ? "🌟 Story master!" : pct >= 60 ? "👍 Great reading!" : "📚 Keep at it!"}</div>
        <Button onClick={restart} className="gap-2"><RotateCcw className="h-4 w-4" /> Play Again</Button>
      </div>
    );
  }

  if (storyDone) {
    return (
      <div className="flex flex-col gap-5 max-w-xl mx-auto px-2">
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{story.emoji}</span>
            <div>
              <p className="font-bold text-foreground">{story.title}</p>
              <p className="text-xs text-muted-foreground">{story.english}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-foreground">{renderStory(false)}</p>
        </Card>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{storyScore}/{story.gaps.length} gaps correct</p>
        </div>
        <Button onClick={nextStory} className="w-full gap-2">
          {storyIdx + 1 >= stories.length ? <><Trophy className="h-4 w-4" /> Finish!</> : <><ArrowRight className="h-4 w-4" /> Next Story</>}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto px-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Story {storyIdx + 1}/{stories.length} · Gap {gapIdx + 1}/{story.gaps.length}</span>
        <span className="font-medium text-foreground" aria-live="polite" aria-atomic="true">{totalScore} correct</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(gapIdx / story.gaps.length) * 100}%` }} />
      </div>

      {/* Story */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{story.emoji}</span>
          <div>
            <p className="font-bold text-foreground">{story.title}</p>
            <Badge variant="secondary" className="text-xs">{story.level}</Badge>
          </div>
        </div>
        <p className="text-sm leading-7 text-foreground">{renderStory(true)}</p>
      </Card>

      {/* Current gap hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" />
        <span>Fill gap {gapIdx + 1}: <span className="italic">{gap.hint}</span></span>
      </div>

      {selected && (
        <Card className={`p-3 border-l-4 text-sm ${selected === gap.correct ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
          <p className="font-semibold">{selected === gap.correct ? `✅ Correct! "${gap.correct}"` : `❌ Answer: "${gap.correct}"`}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        {gap.options.map(opt => {
          let extra = "";
          if (selected) {
            if (opt === gap.correct) extra = "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
            else if (opt === selected) extra = "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 line-through";
          }
          return (
            <button key={opt} onClick={() => handleSelect(opt)} disabled={!!selected}
              className={`w-full text-center px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150 ${selected ? extra || "border-border opacity-50" : "border-border hover:border-primary hover:bg-primary/5"}`}>
              {opt}
            </button>
          );
        })}
      </div>

      {selected && (
        <Button onClick={next} className="w-full gap-2">
          {gapIdx + 1 >= story.gaps.length ? <><BookOpen className="h-4 w-4" /> Review Story</> : <><ArrowRight className="h-4 w-4" /> Next Gap</>}
        </Button>
      )}
    </div>
  );
};

export default StoryGapGame;

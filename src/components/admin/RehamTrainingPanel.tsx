import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeech } from "@/hooks/useSpeech";
import {
  GraduationCap, BookOpen, Mic, ListChecks, Volume2,
  ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, Play,
  Brain, Timer, FolderOpen, FileText, Languages, Layers,
  Shuffle, Eye, EyeOff, ArrowLeft, Clock, Star, Plus, Trash2, Pencil,
  Pause, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

/* ─── Data: Self-Introduction Script (line-by-line) ─── */

interface ScriptLine {
  id: number;
  korean: string;
  english: string;
  section: string;
}

const SELF_INTRO_LINES: ScriptLine[] = [
  { id: 1, section: "Greeting", korean: "안녕하세요, 제 이름은 리함입니다.", english: "Hello, my name is Reham." },
  { id: 2, section: "Education", korean: "저는 이집트 출신이며, 아인샴스 대학교에서 한국어학 및 한국문학을 전공했습니다.", english: "I am from Egypt and majored in Korean Linguistics and Literature at Ain Shams University." },
  { id: 3, section: "Summary", korean: "저는 13년 이상의 국제 경험을 가진 Operations 및 Sales Operations 전문가입니다.", english: "I am an Operations and Sales Operations specialist with over 13 years of international experience." },
  { id: 4, section: "Summary", korean: "이집트, 말레이시아, 헝가리에서 근무하며 다양한 산업 분야에서 경력을 쌓았습니다.", english: "I have built my career across diverse industries, working in Egypt, Malaysia, and Hungary." },
  { id: 5, section: "Summary", korean: "현재는 웹 개발과 디지털 프로젝트도 함께 진행하고 있습니다.", english: "Currently, I am also working on web development and digital projects." },
  { id: 6, section: "Projects", korean: "특히 Explore-Saudi 프로젝트에서는 웹사이트 구조 설계, SEO 최적화, 그리고 데이터 품질 개선을 직접 담당했습니다.", english: "In the Explore-Saudi project, I was directly responsible for website structure design, SEO optimization, and data quality improvement." },
  { id: 7, section: "Languages", korean: "아랍어, 한국어, 영어를 포함하여 6개 언어를 구사할 수 있으며, 여러 언어 환경에서 일해왔기 때문에 언어의 정확성과 맥락의 중요성을 잘 이해하고 있습니다.", english: "I speak 6 languages including Arabic, Korean, and English, and having worked in multilingual environments, I understand the importance of language accuracy and context." },
  { id: 8, section: "Motivation", korean: "이 역할에 관심이 있는 이유는 데이터 품질이 AI 시스템의 성능에 직접적인 영향을 준다고 생각하기 때문입니다.", english: "I am interested in this role because I believe data quality directly impacts AI system performance." },
  { id: 9, section: "Motivation", korean: "저는 이전 경험을 통해 정확성과 일관성을 유지하는 것이 얼마나 중요한지 배웠습니다.", english: "Through my previous experience, I learned how important it is to maintain accuracy and consistency." },
  { id: 10, section: "Accenture", korean: "Accenture에서 콘텐츠 모더레이터로 근무하면서 하루 최대 800개의 데이터를 처리하며 95% 이상의 정확도를 유지했습니다.", english: "As a content moderator at Accenture, I processed up to 800 data items per day while maintaining over 95% accuracy." },
  { id: 11, section: "Kerry", korean: "또한 Kerry에서 F&B 분야 다국적 고객사의 주문 관리를 담당하며 월 1,000건 이상의 주문을 96% 이상의 정확도로 관리했습니다.", english: "At Kerry, I managed order operations for multinational F&B clients, handling over 1,000 orders per month with over 96% accuracy." },
  { id: 12, section: "Kerry", korean: "이러한 경험을 통해 대량 데이터 속에서도 높은 품질을 유지하는 능력을 갖추게 되었습니다.", english: "Through these experiences, I developed the ability to maintain high quality even with large volumes of data." },
  { id: 13, section: "Web Dev", korean: "또한 웹 개발 프로젝트에서는 SEO와 콘텐츠 구조를 최적화하며 데이터의 일관성과 정확성을 지속적으로 개선했습니다.", english: "In web development projects, I continuously improved data consistency and accuracy by optimizing SEO and content structure." },
  { id: 14, section: "Strengths", korean: "제 강점은 세부 사항에 대한 높은 집중력과 체계적인 분석 능력입니다.", english: "My strengths are a high level of attention to detail and systematic analytical ability." },
  { id: 15, section: "Strengths", korean: "또한 다양한 문화와 언어 환경에서 협업해온 경험을 바탕으로, 맥락을 이해하며 데이터를 평가할 수 있습니다.", english: "With experience collaborating in diverse cultural and linguistic environments, I can evaluate data with contextual understanding." },
  { id: 16, section: "Strengths", korean: "새로운 시스템에도 빠르게 적응하는 편입니다.", english: "I also adapt quickly to new systems." },
  { id: 17, section: "Closing", korean: "이 기회를 주셔서 감사합니다. 제 경험과 언어 능력을 통해 이 역할에 의미 있는 기여를 할 수 있다고 생각합니다. 감사합니다.", english: "Thank you for this opportunity. I believe I can make a meaningful contribution to this role through my experience and language skills. Thank you." },
];

/* ─── Data: Interview Conversation Exchanges ─── */

interface ConversationExchange {
  id: number;
  topic: string;
  interviewer: { korean: string; english: string };
  reham: { korean: string; english: string };
}

const CONVERSATION_DATA: ConversationExchange[] = [
  /* ── Opening & Introduction ── */
  {
    id: 1,
    topic: "Self Introduction",
    interviewer: { korean: "자기소개를 해 주세요.", english: "Please introduce yourself." },
    reham: {
      korean: "안녕하세요, 제 이름은 리함입니다. 저는 이집트 출신이며, 아인샴스 대학교에서 한국어학 및 한국문학을 전공했습니다. 13년 이상의 국제 경험을 가진 Operations 및 Sales Operations 전문가이며, 이집트, 말레이시아, 헝가리에서 근무한 경험이 있습니다. 현재는 웹 개발과 디지털 프로젝트도 함께 진행하고 있습니다.",
      english: "Hello, my name is Reham. I am from Egypt and majored in Korean Linguistics and Literature at Ain Shams University. I am an Operations and Sales Operations specialist with over 13 years of international experience, having worked in Egypt, Malaysia, and Hungary. I am currently also working on web development and digital projects.",
    },
  },
  {
    id: 2,
    topic: "Relevant Experience",
    interviewer: { korean: "관련 경험에 대해 말씀해 주세요.", english: "Please tell me about your relevant experience." },
    reham: {
      korean: "여러 언어 환경에서 일해왔기 때문에 언어의 정확성과 맥락의 중요성을 잘 이해하고 있습니다. 특히 Explore-Saudi 프로젝트에서는 웹사이트 구조 설계, SEO 최적화, 그리고 데이터 품질 개선을 직접 담당했습니다.",
      english: "Having worked in multilingual environments, I understand the importance of language accuracy and context. In the Explore-Saudi project, I was directly responsible for website structure design, SEO optimization, and data quality improvement.",
    },
  },
  /* ── Performance & Metrics ── */
  {
    id: 3,
    topic: "Data Accuracy",
    interviewer: { korean: "데이터 처리 정확도에 대해 말씀해 주세요.", english: "Please tell me about your data handling accuracy." },
    reham: {
      korean: "Accenture에서 콘텐츠 모더레이터로 근무하면서 하루 최대 800개의 데이터를 처리하며 95% 이상의 정확도를 유지했습니다. 또한 Kerry에서는 월 1,000건 이상의 주문을 96% 이상의 정확도로 관리했습니다.",
      english: "At Accenture, I processed up to 800 data items per day as a content moderator while maintaining over 95% accuracy. At Kerry, I managed over 1,000 orders per month with over 96% accuracy.",
    },
  },
  {
    id: 4,
    topic: "KPI & Targets",
    interviewer: { korean: "이전 직장에서 어떤 KPI를 관리했으며, 목표를 어떻게 달성했습니까?", english: "What KPIs did you manage at your previous job, and how did you achieve your targets?" },
    reham: {
      korean: "주요 KPI는 데이터 정확도, 일일 처리량, 그리고 응답 시간이었습니다. 저는 체크리스트 기반의 검증 프로세스를 도입하여 오류율을 50% 이상 줄였습니다. 또한 우선순위를 정해 긴급 건을 먼저 처리하는 시스템을 만들었습니다.",
      english: "Key KPIs were data accuracy, daily throughput, and response time. I introduced a checklist-based verification process that reduced the error rate by over 50%. I also created a prioritization system to handle urgent cases first.",
    },
  },
  /* ── Strengths & Weaknesses ── */
  {
    id: 5,
    topic: "Strengths",
    interviewer: { korean: "본인의 강점은 무엇입니까?", english: "What are your strengths?" },
    reham: {
      korean: "제 강점은 세부 사항에 대한 높은 집중력과 체계적인 분석 능력입니다. 또한 다양한 문화와 언어 환경에서 협업해온 경험을 바탕으로, 맥락을 이해하며 데이터를 평가할 수 있습니다. 새로운 시스템에도 빠르게 적응하는 편입니다.",
      english: "My strengths are a high level of attention to detail and systematic analytical ability. With experience collaborating across diverse cultural and linguistic environments, I can evaluate data with contextual understanding. I also adapt quickly to new systems.",
    },
  },
  {
    id: 6,
    topic: "Weaknesses",
    interviewer: { korean: "본인의 약점은 무엇이라고 생각하시나요?", english: "What do you consider your weaknesses?" },
    reham: {
      korean: "때때로 완벽주의적인 성향 때문에 하나의 작업에 필요 이상으로 시간을 투자하는 경향이 있었습니다. 이를 개선하기 위해 타임박싱 기법을 활용하고, 품질과 효율성의 균형을 맞추는 연습을 하고 있습니다.",
      english: "I sometimes tend to spend more time than necessary on a task due to perfectionism. To improve this, I've been using timeboxing techniques and practicing how to balance quality with efficiency.",
    },
  },
  /* ── Motivation & Company Fit ── */
  {
    id: 7,
    topic: "Why This Role",
    interviewer: { korean: "왜 이 직무에 관심이 있으신가요?", english: "Why are you interested in this role?" },
    reham: {
      korean: "이 역할에 관심이 있는 이유는 데이터 품질이 AI 시스템의 성능에 직접적인 영향을 준다고 생각하기 때문입니다. 저는 이전 경험을 통해 정확성과 일관성을 유지하는 것이 얼마나 중요한지 배웠습니다.",
      english: "I am interested in this role because I believe data quality directly impacts AI system performance. Through my previous experience, I learned how important it is to maintain accuracy and consistency.",
    },
  },
  {
    id: 8,
    topic: "Why This Company",
    interviewer: { korean: "왜 저희 회사에 지원하셨나요?", english: "Why did you apply to our company?" },
    reham: {
      korean: "귀사는 AI 기술 분야에서 혁신적인 성과를 이루고 있으며, 데이터 품질에 높은 기준을 두고 있다고 알고 있습니다. 저의 데이터 관리 경험과 다국어 능력이 귀사의 글로벌 프로젝트에 기여할 수 있다고 확신합니다.",
      english: "I understand your company is achieving innovative results in AI technology and maintains high standards for data quality. I am confident that my data management experience and multilingual abilities can contribute to your global projects.",
    },
  },
  /* ── Behavioral Questions (STAR Method) ── */
  {
    id: 9,
    topic: "Problem Solving",
    interviewer: { korean: "어려운 문제를 해결했던 경험을 말씀해 주세요.", english: "Tell me about a time you solved a difficult problem." },
    reham: {
      korean: "Kerry에서 주문 오류율이 갑자기 증가했을 때, 저는 데이터를 분석하여 특정 공급업체의 입력 형식 변경이 원인임을 파악했습니다. 즉시 검증 규칙을 업데이트하고 팀에 교육을 실시하여 일주일 내에 오류율을 정상 수준으로 복원했습니다.",
      english: "When order error rates suddenly increased at Kerry, I analyzed the data and identified that a specific supplier's input format change was the cause. I immediately updated validation rules and trained the team, restoring error rates to normal within a week.",
    },
  },
  {
    id: 10,
    topic: "Teamwork",
    interviewer: { korean: "팀에서 갈등이 있었을 때 어떻게 해결하셨나요?", english: "How did you resolve a conflict within your team?" },
    reham: {
      korean: "Accenture에서 팀원 간 업무 분배에 대한 의견 차이가 있었습니다. 저는 각 팀원의 강점을 파악하여 역할을 재조정하는 방안을 제안했고, 정기 미팅을 통해 진행 상황을 공유하며 투명한 소통을 유지했습니다. 결과적으로 팀 생산성이 20% 향상되었습니다.",
      english: "At Accenture, there was a disagreement about task distribution among team members. I proposed reassigning roles based on each member's strengths and maintained transparent communication through regular meetings. As a result, team productivity improved by 20%.",
    },
  },
  {
    id: 11,
    topic: "Handling Pressure",
    interviewer: { korean: "마감 기한이 촉박한 상황에서 어떻게 대처하셨나요?", english: "How did you handle a situation with a tight deadline?" },
    reham: {
      korean: "Kerry에서 월말 마감 시 주문량이 평소의 두 배로 증가한 적이 있습니다. 저는 작업을 긴급도별로 분류하고, 반복 작업을 자동화하는 간단한 템플릿을 만들어 팀과 공유했습니다. 이를 통해 마감 기한 내에 모든 주문을 정확하게 처리할 수 있었습니다.",
      english: "At Kerry, month-end order volume doubled. I categorized tasks by urgency, created simple templates to automate repetitive work, and shared them with the team. This enabled us to process all orders accurately within the deadline.",
    },
  },
  {
    id: 12,
    topic: "Leadership",
    interviewer: { korean: "리더십을 발휘했던 경험을 말씀해 주세요.", english: "Tell me about a time you demonstrated leadership." },
    reham: {
      korean: "Explore-Saudi 프로젝트에서 SEO 최적화 전략을 주도했습니다. 팀원들에게 SEO 모범 사례를 교육하고, 주간 리뷰 세션을 도입하여 콘텐츠 품질을 지속적으로 개선했습니다. 3개월 만에 검색 엔진 순위가 크게 향상되었습니다.",
      english: "I led the SEO optimization strategy for the Explore-Saudi project. I trained team members on SEO best practices and introduced weekly review sessions to continuously improve content quality. Within 3 months, search engine rankings improved significantly.",
    },
  },
  {
    id: 13,
    topic: "Mistake & Learning",
    interviewer: { korean: "실수를 했던 경험과 그것에서 무엇을 배웠는지 말씀해 주세요.", english: "Tell me about a mistake you made and what you learned from it." },
    reham: {
      korean: "초기에 데이터 검증 없이 대량 업로드를 진행하여 오류가 발생한 적이 있습니다. 이 경험을 통해 항상 샘플 검증을 먼저 수행하는 습관을 갖게 되었고, 이후에는 업로드 전 체크리스트를 만들어 팀 전체에 적용했습니다.",
      english: "Early on, I made a bulk upload without data validation, which caused errors. This taught me to always perform sample verification first. After that, I created a pre-upload checklist and applied it across the entire team.",
    },
  },
  /* ── Technical & Skills ── */
  {
    id: 14,
    topic: "Web Development",
    interviewer: { korean: "웹 개발 경험에 대해 말씀해 주세요.", english: "Tell me about your web development experience." },
    reham: {
      korean: "Explore-Saudi 프로젝트에서 웹사이트 구조 설계와 SEO 최적화를 담당했습니다. 또한 웹 개발 프로젝트에서는 SEO와 콘텐츠 구조를 최적화하며 데이터의 일관성과 정확성을 지속적으로 개선했습니다.",
      english: "In the Explore-Saudi project, I was responsible for website structure design and SEO optimization. In web development projects, I continuously improved data consistency and accuracy by optimizing SEO and content structure.",
    },
  },
  {
    id: 15,
    topic: "Tools & Technology",
    interviewer: { korean: "어떤 도구와 기술을 사용해 보셨나요?", english: "What tools and technologies have you used?" },
    reham: {
      korean: "Excel과 Google Sheets를 활용한 데이터 분석, CRM 시스템 관리, SEO 도구 (Google Analytics, Search Console), 그리고 웹 개발에서는 React, TypeScript, Supabase를 사용해 보았습니다. 또한 AI 도구를 활용한 콘텐츠 생성과 데이터 처리 경험도 있습니다.",
      english: "I have experience with data analysis using Excel and Google Sheets, CRM system management, SEO tools (Google Analytics, Search Console), and React, TypeScript, and Supabase for web development. I also have experience using AI tools for content generation and data processing.",
    },
  },
  {
    id: 16,
    topic: "Multilingual Skills",
    interviewer: { korean: "다국어 능력이 업무에 어떻게 도움이 되었나요?", english: "How have your multilingual skills helped in your work?" },
    reham: {
      korean: "아랍어, 영어, 한국어를 구사할 수 있어 다국적 팀과의 소통이 원활했습니다. 특히 콘텐츠 모더레이션 업무에서 아랍어 콘텐츠의 맥락과 뉘앙스를 정확하게 판단할 수 있었고, 이는 데이터 품질 향상에 직접적으로 기여했습니다.",
      english: "Being able to speak Arabic, English, and Korean enabled smooth communication with multinational teams. Especially in content moderation, I could accurately judge the context and nuances of Arabic content, which directly contributed to improving data quality.",
    },
  },
  /* ── Situational & Future ── */
  {
    id: 17,
    topic: "Adaptability",
    interviewer: { korean: "새로운 환경이나 시스템에 어떻게 적응하시나요?", english: "How do you adapt to new environments or systems?" },
    reham: {
      korean: "저는 먼저 시스템의 문서와 가이드를 꼼꼼히 읽고, 실제로 사용해 보면서 이해를 심화합니다. 모르는 부분은 동료에게 적극적으로 질문하고, 배운 내용을 정리하여 나만의 참고 자료를 만듭니다. 이 방법으로 대부분의 새 시스템에 1~2주 내에 능숙해질 수 있었습니다.",
      english: "I first thoroughly read system documentation and guides, then deepen my understanding through hands-on use. I actively ask colleagues about things I don't know and organize what I learn into personal reference materials. This approach has allowed me to become proficient in most new systems within 1-2 weeks.",
    },
  },
  {
    id: 18,
    topic: "Career Goals",
    interviewer: { korean: "5년 후의 커리어 목표는 무엇인가요?", english: "What are your career goals in 5 years?" },
    reham: {
      korean: "5년 후에는 AI 데이터 품질 분야에서 전문가로 성장하고 싶습니다. 팀을 리드하며 데이터 품질 표준을 수립하고, 자동화된 검증 프로세스를 개발하여 조직의 AI 시스템 성능 향상에 기여하고 싶습니다.",
      english: "In 5 years, I want to grow as an expert in AI data quality. I aim to lead a team, establish data quality standards, and develop automated verification processes to contribute to improving the organization's AI system performance.",
    },
  },
  {
    id: 19,
    topic: "Salary Expectations",
    interviewer: { korean: "희망하시는 급여 수준이 있으신가요?", english: "Do you have salary expectations?" },
    reham: {
      korean: "시장 조사를 통해 이 직무의 평균 급여 범위를 파악하고 있습니다. 저의 경험과 기술 수준을 고려했을 때, 합리적인 범위 내에서 유연하게 논의할 수 있습니다. 무엇보다 성장 기회와 업무 환경이 중요하다고 생각합니다.",
      english: "I've researched the average salary range for this position. Considering my experience and skill level, I'm flexible to discuss within a reasonable range. Most importantly, I value growth opportunities and the work environment.",
    },
  },
  /* ── SAP & Operations Deep Dive ── */
  {
    id: 20,
    topic: "SAP ERP Experience",
    interviewer: { korean: "SAP ERP 시스템 사용 경험에 대해 자세히 말씀해 주세요.", english: "Please tell me in detail about your SAP ERP experience." },
    reham: {
      korean: "Kerry에서 SAP ERP의 Order-to-Cash 모듈을 3년 이상 사용했습니다. 주문 입력, 배송 처리, 송장 발행까지 전체 프로세스를 관리했으며, 다국가 포트폴리오에서 Oil & Energy, F&B 산업의 복잡한 워크플로우를 처리했습니다. 또한 신입 팀원 10~15명에게 SAP 시스템 교육을 직접 진행했습니다.",
      english: "At Kerry, I used SAP ERP's Order-to-Cash module for over 3 years. I managed the entire process from order entry, shipment processing, to invoicing, handling complex workflows across multi-country portfolios in Oil & Energy and F&B industries. I also personally trained 10-15 new team members on SAP systems.",
    },
  },
  {
    id: 21,
    topic: "Order-to-Cash Process",
    interviewer: { korean: "Order-to-Cash 프로세스를 처음부터 끝까지 설명해 주시겠어요?", english: "Can you walk me through the Order-to-Cash process from start to finish?" },
    reham: {
      korean: "Order-to-Cash 프로세스는 고객 주문 접수부터 시작됩니다. 먼저 주문을 SAP에 입력하고 재고 확인 및 가격 검증을 합니다. 그 다음 배송 일정을 조율하고, 출하 후 송장을 발행합니다. 마지막으로 대금 수금까지 추적합니다. Kerry에서 월 1,000건 이상의 주문을 이 프로세스로 96% 이상의 정확도로 관리했습니다.",
      english: "The Order-to-Cash process starts with receiving customer orders. First, I enter orders into SAP and verify inventory and pricing. Then I coordinate shipping schedules, issue invoices after shipment, and finally track payment collection. At Kerry, I managed over 1,000 orders monthly through this process with 96%+ accuracy.",
    },
  },
  {
    id: 22,
    topic: "Process Optimization",
    interviewer: { korean: "운영 프로세스를 개선했던 구체적인 사례를 말씀해 주세요.", english: "Give me a specific example of how you improved an operational process." },
    reham: {
      korean: "Kerry에서 주문 처리 시 반복되는 수작업 오류를 발견했습니다. 표준화된 검증 체크리스트를 만들고, 자주 사용하는 주문 유형에 대한 템플릿을 도입했습니다. 이를 통해 처리 시간을 30% 단축하고 오류율을 크게 줄였습니다. 이 체크리스트는 이후 팀 전체의 표준 절차가 되었습니다.",
      english: "At Kerry, I identified recurring manual errors in order processing. I created a standardized verification checklist and introduced templates for frequently used order types. This reduced processing time by 30% and significantly lowered error rates. The checklist later became the standard procedure for the entire team.",
    },
  },
  /* ── Kerry (F&B) Specific ── */
  {
    id: 23,
    topic: "Client Management",
    interviewer: { korean: "50개 이상의 고객사를 어떻게 관리하셨나요?", english: "How did you manage relationships with 50+ clients?" },
    reham: {
      korean: "고객을 우선순위별로 분류하고, 각 고객의 특수 요구사항을 문서화했습니다. 주요 고객에 대해서는 정기적인 상태 업데이트를 제공하고, 문제 발생 시 선제적으로 소통했습니다. CRM 시스템을 활용하여 모든 상호작용을 기록하고, 100% 정시 배송 성과를 유지했습니다.",
      english: "I categorized clients by priority and documented each client's special requirements. For key accounts, I provided regular status updates and communicated proactively when issues arose. Using CRM systems, I logged all interactions and maintained 100% on-time delivery performance.",
    },
  },
  {
    id: 24,
    topic: "Customer Escalation",
    interviewer: { korean: "고가치 고객의 불만을 어떻게 처리하셨나요?", english: "How did you handle a high-value customer complaint?" },
    reham: {
      korean: "Kerry에서 주요 고객의 대량 주문에 배송 지연이 발생한 적이 있습니다. 즉시 고객에게 연락하여 상황을 투명하게 공유하고, 대안적인 배송 경로를 찾아 제안했습니다. 동시에 내부 팀과 협력하여 근본 원인을 파악하고 재발 방지 조치를 수립했습니다. 고객은 신속한 대응에 만족하여 거래 관계가 오히려 강화되었습니다.",
      english: "At Kerry, a major client experienced a shipping delay on a large order. I immediately contacted the client to transparently share the situation and found an alternative shipping route. Simultaneously, I worked with internal teams to identify the root cause and establish preventive measures. The client was satisfied with the quick response, which actually strengthened the business relationship.",
    },
  },
  /* ── Accenture & Content Moderation ── */
  {
    id: 25,
    topic: "Content Moderation",
    interviewer: { korean: "콘텐츠 모더레이션 업무에서 어떤 종류의 콘텐츠를 처리하셨나요?", english: "What types of content did you handle in content moderation?" },
    reham: {
      korean: "Accenture에서 3년 이상 다양한 클라이언트 프로젝트의 콘텐츠를 검토했습니다. 정책 위반 콘텐츠를 식별하고, 문화적 맥락을 고려한 판단을 내렸습니다. 특히 아랍어 콘텐츠의 뉘앙스와 문화적 민감성을 정확하게 평가할 수 있었고, 하루 300~800건을 95% 이상의 품질 정확도로 처리했습니다.",
      english: "At Accenture, I reviewed content across multiple client projects for over 3 years. I identified policy-violating content and made judgments considering cultural context. I could accurately assess the nuances and cultural sensitivity of Arabic content, processing 300-800 items daily with 95%+ quality accuracy.",
    },
  },
  {
    id: 26,
    topic: "Quality Under Volume",
    interviewer: { korean: "대량의 업무를 처리하면서 품질을 어떻게 유지하셨나요?", english: "How did you maintain quality while handling high volumes?" },
    reham: {
      korean: "세 가지 전략을 사용했습니다. 첫째, 작업을 시간 블록으로 나누어 집중력을 유지했습니다. 둘째, 자주 발생하는 유형에 대한 개인 참고 가이드를 만들어 판단 속도를 높였습니다. 셋째, 정기적으로 자가 품질 검사를 실시하여 일관성을 확인했습니다. 이 방법으로 속도와 정확성을 모두 유지할 수 있었습니다.",
      english: "I used three strategies. First, I divided work into time blocks to maintain focus. Second, I created personal reference guides for frequently occurring types to speed up decision-making. Third, I conducted regular self-quality checks to verify consistency. This approach allowed me to maintain both speed and accuracy.",
    },
  },
  /* ── Klivvr & Fintech ── */
  {
    id: 27,
    topic: "Fintech Experience",
    interviewer: { korean: "핀테크 환경에서의 고객 서비스 경험에 대해 말씀해 주세요.", english: "Tell me about your customer service experience in a fintech environment." },
    reham: {
      korean: "Klivvr에서 하루 50~100건 이상의 고객 상호작용을 처리했습니다. 핀테크 환경이기 때문에 금융 데이터 기밀 유지가 매우 중요했습니다. 엄격한 컴플라이언스 기준을 준수하면서 고객 문제를 신속하게 해결했고, CRM 시스템을 활용하여 모든 상호작용을 체계적으로 관리했습니다.",
      english: "At Klivvr, I handled 50-100+ customer interactions daily. Since it was a fintech environment, maintaining financial data confidentiality was critical. I resolved customer issues quickly while adhering to strict compliance standards, and systematically managed all interactions using CRM systems.",
    },
  },
  {
    id: 28,
    topic: "Data Confidentiality",
    interviewer: { korean: "민감한 데이터를 다룰 때 어떻게 보안을 유지하셨나요?", english: "How did you maintain security when handling sensitive data?" },
    reham: {
      korean: "항상 회사의 데이터 보안 정책을 철저히 따랐습니다. 고객 정보는 승인된 시스템을 통해서만 접근하고, 작업 완료 후 민감한 데이터를 화면에 남기지 않았습니다. 또한 의심스러운 활동이 발견되면 즉시 보안 팀에 보고하는 절차를 따랐습니다. 핀테크에서의 경험을 통해 데이터 보안의 중요성을 깊이 이해하게 되었습니다.",
      english: "I always strictly followed the company's data security policies. I accessed customer information only through authorized systems and never left sensitive data visible on screen after completing tasks. I also followed procedures to immediately report suspicious activities to the security team. My fintech experience deepened my understanding of data security importance.",
    },
  },
  /* ── Klovers & Entrepreneurship ── */
  {
    id: 29,
    topic: "Entrepreneurship",
    interviewer: { korean: "Klovers 커뮤니티를 설립하고 운영한 경험에 대해 말씀해 주세요.", english: "Tell me about founding and running the Klovers community." },
    reham: {
      korean: "2013년에 Klovers를 설립하여 현재까지 13년간 운영하고 있습니다. 15개국 이상에서 1,000명 이상의 학생들에게 한국어를 가르치고 있습니다. 다양한 수준의 커리큘럼을 개발하고, 글로벌 학습자를 위한 맞춤형 학습 경로를 설계했습니다. 이 경험을 통해 팀 관리, 커리큘럼 개발, 그리고 지속 가능한 비즈니스 성장에 대해 깊이 배웠습니다.",
      english: "I founded Klovers in 2013 and have been running it for 13 years. I teach Korean to over 1,000 students across 15+ countries. I developed multi-level curricula and designed customized learning paths for global learners. This experience taught me deeply about team management, curriculum development, and sustainable business growth.",
    },
  },
  {
    id: 30,
    topic: "Training & Development",
    interviewer: { korean: "팀원 교육 및 역량 개발 경험에 대해 말씀해 주세요.", english: "Tell me about your experience in training and developing team members." },
    reham: {
      korean: "Kerry에서 신입 팀원 10~15명에게 SAP 시스템과 운영 절차를 교육했습니다. 교육 자료를 직접 만들고, 단계별 학습 프로그램을 설계했습니다. 또한 Klovers에서 13년간 다양한 수준의 학생들을 가르치며 개인별 맞춤 교육 방법을 개발했습니다. 사람마다 학습 스타일이 다르기 때문에 다양한 접근법을 사용합니다.",
      english: "At Kerry, I trained 10-15 new team members on SAP systems and operational procedures. I created training materials and designed step-by-step learning programs. Additionally, at Klovers I've taught diverse-level students for 13 years, developing personalized teaching methods. Since everyone has different learning styles, I use various approaches.",
    },
  },
  /* ── Explore-Saudi & Digital ── */
  {
    id: 31,
    topic: "Digital Project Leadership",
    interviewer: { korean: "Explore-Saudi 프로젝트에서의 리더십 역할에 대해 말씀해 주세요.", english: "Tell me about your leadership role in the Explore-Saudi project." },
    reham: {
      korean: "Explore-Saudi 프로젝트에서 프리랜스 리드로서 럭셔리 여행 플랫폼의 디지털 브랜딩과 웹사이트 개발을 총괄했습니다. HTML, CSS, React를 사용하여 웹사이트 아키텍처를 설계하고 구축했으며, SEO 최적화, GA4 분석 구현, CMS 관리를 담당했습니다. AI 도구를 활용한 고품질 디지털 콘텐츠도 제작했습니다.",
      english: "As Freelance Lead for the Explore-Saudi project, I oversaw digital branding and website development for a luxury travel platform. I designed and built the website architecture using HTML, CSS, and React, and managed SEO optimization, GA4 analytics implementation, and CMS administration. I also created high-quality digital content using AI tools.",
    },
  },
  {
    id: 32,
    topic: "SEO & Analytics",
    interviewer: { korean: "SEO 최적화와 Google Analytics 경험에 대해 말씀해 주세요.", english: "Tell me about your SEO optimization and Google Analytics experience." },
    reham: {
      korean: "Explore-Saudi 프로젝트에서 SEO 전략을 수립하고 실행했습니다. 키워드 리서치, 메타 태그 최적화, 콘텐츠 구조 개선을 통해 검색 엔진 순위를 향상시켰습니다. GA4를 구현하여 사용자 행동을 분석하고, 데이터 기반으로 콘텐츠 전략을 조정했습니다. 또한 Klovers 웹사이트에서도 지속적으로 SEO와 콘텐츠 품질을 개선하고 있습니다.",
      english: "I developed and executed SEO strategies for the Explore-Saudi project. I improved search engine rankings through keyword research, meta tag optimization, and content structure improvements. I implemented GA4 to analyze user behavior and adjusted content strategy based on data. I also continuously improve SEO and content quality on the Klovers website.",
    },
  },
  /* ── Team Lead / Manager Target Role ── */
  {
    id: 33,
    topic: "Management Style",
    interviewer: { korean: "팀을 관리할 때 어떤 리더십 스타일을 사용하시나요?", english: "What leadership style do you use when managing a team?" },
    reham: {
      korean: "저는 서번트 리더십과 결과 중심 리더십을 결합합니다. 팀원들이 필요한 자원과 교육을 제공하면서, 명확한 목표와 기대치를 설정합니다. 정기적인 일대일 미팅을 통해 개인의 성장을 지원하고, 팀 전체의 성과를 투명하게 공유합니다. Kerry에서 팀원 교육을 담당하며 이 스타일이 효과적임을 확인했습니다.",
      english: "I combine servant leadership with results-oriented leadership. I provide team members with necessary resources and training while setting clear goals and expectations. Through regular one-on-one meetings, I support individual growth and transparently share overall team performance. While training team members at Kerry, I confirmed this style was effective.",
    },
  },
  {
    id: 34,
    topic: "Remote Team Management",
    interviewer: { korean: "원격 팀을 관리한 경험이 있으신가요?", english: "Do you have experience managing remote teams?" },
    reham: {
      korean: "네, Klovers를 통해 13년간 15개국 이상의 학생들과 원격으로 작업해왔습니다. 또한 Explore-Saudi 프로젝트도 완전 원격으로 진행했습니다. 시간대 차이를 관리하고, 비동기 커뮤니케이션 도구를 효과적으로 활용하며, 명확한 문서화를 통해 모든 팀원이 같은 방향으로 일할 수 있도록 했습니다.",
      english: "Yes, through Klovers I've worked remotely with students across 15+ countries for 13 years. The Explore-Saudi project was also fully remote. I managed timezone differences, effectively used asynchronous communication tools, and ensured all team members worked in the same direction through clear documentation.",
    },
  },
  {
    id: 35,
    topic: "Cross-Cultural Communication",
    interviewer: { korean: "다문화 환경에서의 협업 경험을 말씀해 주세요.", english: "Tell me about your experience collaborating in multicultural environments." },
    reham: {
      korean: "말레이시아, 이집트, 헝가리에서 근무하며 다양한 문화권의 동료들과 협업했습니다. 6개 언어를 구사할 수 있어 언어 장벽을 줄이고, 문화적 차이를 이해하며 소통할 수 있었습니다. Kerry에서는 다국적 고객사와의 소통을, Accenture에서는 다국어 콘텐츠의 문화적 맥락을 정확히 판단하는 역할을 수행했습니다.",
      english: "Working in Malaysia, Egypt, and Hungary, I've collaborated with colleagues from diverse cultural backgrounds. Speaking 6 languages, I could reduce language barriers and communicate with cultural understanding. At Kerry, I communicated with multinational clients, and at Accenture, I accurately assessed the cultural context of multilingual content.",
    },
  },
  /* ── Situational - Target Roles ── */
  {
    id: 36,
    topic: "Prioritization",
    interviewer: { korean: "여러 긴급한 업무가 동시에 들어오면 어떻게 우선순위를 정하시나요?", english: "How do you prioritize when multiple urgent tasks come in at the same time?" },
    reham: {
      korean: "먼저 각 업무의 영향도와 긴급성을 평가합니다. 고객 영향이 큰 건과 마감이 임박한 건을 최우선으로 처리합니다. Kerry에서 월말 대량 주문 시 이 방법을 자주 사용했습니다. 필요한 경우 팀원에게 업무를 위임하고, 진행 상황을 실시간으로 관리자에게 보고합니다.",
      english: "First, I assess each task's impact and urgency. I prioritize tasks with high customer impact and imminent deadlines. I frequently used this method during month-end high-volume periods at Kerry. When necessary, I delegate tasks to team members and report progress to managers in real-time.",
    },
  },
  {
    id: 37,
    topic: "Handling Ambiguity",
    interviewer: { korean: "명확한 지침이 없는 상황에서 어떻게 업무를 진행하시나요?", english: "How do you proceed when there are no clear guidelines?" },
    reham: {
      korean: "먼저 유사한 사례나 기존 정책을 참고합니다. 그래도 불명확하면 관련 이해관계자에게 확인을 요청합니다. Accenture에서 새로운 유형의 콘텐츠를 처리할 때 이런 상황이 자주 있었는데, 팀 리드와 상의하여 새로운 가이드라인을 수립하는 데 기여했습니다. 모호한 상황에서도 최선의 판단을 내리되, 항상 문서화하여 팀 전체에 공유합니다.",
      english: "First, I reference similar cases or existing policies. If still unclear, I reach out to relevant stakeholders for clarification. At Accenture, this happened often when handling new content types — I contributed to establishing new guidelines by consulting with team leads. Even in ambiguous situations, I make the best judgment possible while always documenting and sharing with the team.",
    },
  },
  {
    id: 38,
    topic: "Continuous Improvement",
    interviewer: { korean: "자기 개발을 위해 어떤 노력을 하고 계시나요?", english: "What efforts are you making for self-development?" },
    reham: {
      korean: "지속적으로 새로운 기술을 배우고 있습니다. 최근에는 React와 TypeScript를 활용한 웹 개발 역량을 강화했고, Vibe Coding Gold 인증을 취득했습니다. 또한 AI 도구 활용 능력도 개발하고 있습니다. Klovers를 통해 가르치면서 동시에 배우는 것이 가장 효과적인 학습 방법이라고 믿습니다.",
      english: "I continuously learn new skills. Recently, I've strengthened my web development capabilities with React and TypeScript, and obtained the Vibe Coding Gold certification. I'm also developing AI tool proficiency. Through Klovers, I believe teaching while learning simultaneously is the most effective learning method.",
    },
  },
  {
    id: 39,
    topic: "Why Should We Hire You",
    interviewer: { korean: "저희가 왜 당신을 채용해야 하나요?", english: "Why should we hire you?" },
    reham: {
      korean: "저는 13년 이상의 국제 운영 경험, 6개 언어 구사 능력, 그리고 검증된 데이터 처리 정확도를 갖추고 있습니다. Kerry에서 96% 이상의 주문 정확도, Accenture에서 95% 이상의 품질 정확도를 달성했습니다. SAP ERP 전문성, 웹 개발 역량, 그리고 13년간의 커뮤니티 리더십 경험까지 결합하면, 다양한 역할에서 즉시 가치를 제공할 수 있습니다.",
      english: "I bring 13+ years of international operations experience, fluency in 6 languages, and proven data processing accuracy. I achieved 96%+ order accuracy at Kerry and 95%+ quality accuracy at Accenture. Combined with SAP ERP expertise, web development skills, and 13 years of community leadership, I can deliver immediate value across diverse roles.",
    },
  },
  /* ── Closing ── */
  {
    id: 40,
    topic: "Questions for Interviewer",
    interviewer: { korean: "저희에게 궁금한 점이 있으신가요?", english: "Do you have any questions for us?" },
    reham: {
      korean: "네, 두 가지 질문이 있습니다. 첫째, 이 팀의 일반적인 하루 업무 흐름은 어떻게 되나요? 둘째, 입사 후 첫 3개월 동안 기대하시는 성과는 무엇인가요? 이 역할에서 빠르게 기여하고 싶습니다.",
      english: "Yes, I have two questions. First, what does a typical day look like for this team? Second, what outcomes do you expect in the first 3 months? I want to contribute quickly in this role.",
    },
  },
  {
    id: 41,
    topic: "Closing",
    interviewer: { korean: "마지막으로 하고 싶은 말씀이 있으신가요?", english: "Any final words you'd like to share?" },
    reham: {
      korean: "이 기회를 주셔서 감사합니다. 제 경험과 언어 능력을 통해 이 역할에 의미 있는 기여를 할 수 있다고 생각합니다. 데이터 품질에 대한 열정과 13년 이상의 운영 경험을 바탕으로 팀에 가치를 더할 수 있다고 확신합니다. 감사합니다.",
      english: "Thank you for this opportunity. I believe I can make a meaningful contribution through my experience and language skills. I am confident I can add value to the team with my passion for data quality and over 13 years of operational experience. Thank you.",
    },
  },
  /* ── El Zenouki / Interpretation ── */
  {
    id: 42,
    topic: "Interpretation Experience",
    interviewer: { korean: "통역 경험에 대해 말씀해 주세요.", english: "Please tell me about your interpretation experience." },
    reham: {
      korean: "El Zenouki Group에서 통역 서비스 코디네이터로 근무하며 아랍어, 한국어, 영어 간의 전문 통역을 담당했습니다. 국제 비즈니스 미팅과 기술 협의에서 주요 소통 역할을 수행했으며, 다국어 서신 관리와 국제 프로젝트 조율을 통해 원활한 협업을 보장했습니다.",
      english: "At El Zenouki Group, I served as Interpreter Services Coordinator, providing professional interpretation between Arabic, Korean, and English. I was the primary communication link for international business meetings and technical discussions, managing multilingual correspondence and international project coordination.",
    },
  },
  /* ── Golden Dragon / International Trade ── */
  {
    id: 43,
    topic: "International Trade",
    interviewer: { korean: "수출 및 무역 경험에 대해 말씀해 주세요.", english: "Please tell me about your export and trade experience." },
    reham: {
      korean: "Golden Dragon에서 리테일 총괄 매니저로 장어 및 수산물의 국제 수출 운영을 관리했습니다. 국제 무역 규정과 위생 기준을 철저히 준수하면서 글로벌 물류와 선적을 조율했습니다. 또한 다국어로 계약 협상과 공급업체 관리를 수행하여 운영 효율성을 최적화했습니다.",
      english: "At Golden Dragon, as Retail General Manager, I managed international export operations for eels and seafood products. I ensured strict compliance with international trade regulations and health standards while coordinating global logistics and shipments. I also led contract negotiations and supplier management in multiple languages.",
    },
  },
  /* ── ERC / Large Team Administration ── */
  {
    id: 44,
    topic: "Large Team Management",
    interviewer: { korean: "50명 규모의 팀을 관리한 경험에 대해 말씀해 주세요.", english: "Tell me about your experience managing a team of 50 people." },
    reham: {
      korean: "Egyptian Refining Company(ERC)에서 DAEAH E&C와 협력하여 50명 규모의 행정 부서를 총괄했습니다. 프로젝트의 주요 연락 창구로서 행정팀, 경영진, 외부 이해관계자 간의 소통을 중앙 집중화했습니다. 모든 사무 서비스 감독, 조달 관리, 벤더 청구 관리를 담당하며 고압적인 산업 환경에서 운영 안정성을 유지했습니다.",
      english: "At ERC, collaborating with DAEAH E&C, I led an administrative department of 50 on-site personnel for a major Oil & Energy project. As the primary contact point, I centralized communication between the admin team, executive leadership, and external stakeholders. I supervised all office services, managed procurement and vendor billing, maintaining operational stability in a high-pressure industrial environment.",
    },
  },
  /* ── Teaching Abroad ── */
  {
    id: 45,
    topic: "Teaching Abroad",
    interviewer: { korean: "해외에서 아랍어를 가르친 경험에 대해 말씀해 주세요.", english: "Tell me about your experience teaching Arabic abroad." },
    reham: {
      korean: "헝가리 부다페스트의 Nur School에서 영어 및 헝가리어를 사용하는 성인들에게 집중적인 아랍어 교육을 진행했습니다. 읽기, 쓰기, 말하기, 듣기를 포함한 맞춤형 커리큘럼을 개발하여 문화적, 언어적 차이를 극복했습니다. 이 경험을 통해 다양한 국제 환경에서의 적응력과 교육 리더십을 기를 수 있었습니다.",
      english: "At Nur School in Budapest, Hungary, I facilitated intensive Arabic language training for English and Hungarian-speaking adults. I developed customized curriculum covering reading, writing, speaking, and listening to bridge cultural and linguistic gaps. This experience demonstrated my adaptability and instructional leadership in a diverse international setting.",
    },
  },
  /* ── GLC Europe / Conference Sales ── */
  {
    id: 46,
    topic: "B2B Sales",
    interviewer: { korean: "B2B 영업 경험에 대해 말씀해 주세요.", english: "Tell me about your B2B sales experience." },
    reham: {
      korean: "GLC Europe에서 유럽 시장을 대상으로 고급 기업 컨퍼런스 및 전문 교육 프로그램의 홍보와 영업을 담당했습니다. 주요 업계 리더 및 의사결정자를 발굴하고 국제 행사에 대한 등록과 파트너십을 유도했습니다. 강한 설득력 있는 커뮤니케이션 능력과 시장 조사 역량이 요구되는 역할이었습니다.",
      english: "At GLC Europe, I managed the promotion and sales of high-end corporate conferences and professional training programs across the European market. I identified and engaged key industry leaders and decision-makers to drive registrations and partnerships for international events. This role required strong persuasive communication and market research skills.",
    },
  },
  /* ── Korean Cultural Centre ── */
  {
    id: 47,
    topic: "Cultural Events & Interpretation",
    interviewer: { korean: "한국문화원에서의 통역 및 행사 기획 경험에 대해 말씀해 주세요.", english: "Tell me about your interpretation and event planning experience at the Korean Cultural Centre." },
    reham: {
      korean: "카이로 한국문화원에서 2년 8개월간 대규모 문화 축제, 전시회, 기업 쇼케이스의 통역과 행사 기획을 담당했습니다. 국제 공연자, 기술팀, VIP 손님을 위한 주요 통역사로 활동하며 대규모 공공 행사의 원활한 운영을 보장했습니다. 다국어 행사 프로그래밍과 문화 교류 촉진을 통해 국제 문화 인식을 높이는 데 기여했습니다.",
      english: "At the Korean Cultural Centre in Cairo, I managed interpretation and event planning for cultural festivals, exhibitions, and corporate showcases for over 2.5 years. I served as the primary interpreter for international performers, technical teams, and VIP guests, ensuring seamless operations during large public events. I facilitated multilingual event programming and cross-cultural exchanges to promote international cultural awareness.",
    },
  },
  /* ── Education Background ── */
  {
    id: 48,
    topic: "Education",
    interviewer: { korean: "학력에 대해 말씀해 주세요.", english: "Please tell me about your educational background." },
    reham: {
      korean: "저는 이집트 아인샴스 대학교에서 한국어학 및 한국문학을 전공했습니다. 대학에서 한국어 언어학과 문학을 체계적으로 공부하며 한국어에 대한 깊은 이해를 갖추게 되었습니다. 이 학문적 배경이 13년 이상의 한국어 교육과 통역 경력의 기초가 되었습니다.",
      english: "I studied Korean Linguistics and Literature at Ain Shams University in Egypt. Through systematic study of Korean linguistics and literature at university, I developed a deep understanding of the Korean language. This academic background became the foundation for my 13+ years of Korean language teaching and interpretation career.",
    },
  },
  /* ── Why Korea / Korean Language ── */
  {
    id: 49,
    topic: "Why Korean",
    interviewer: { korean: "왜 한국어를 공부하게 되셨나요?", english: "Why did you start studying Korean?" },
    reham: {
      korean: "어릴 때부터 한국 문화에 관심이 많았고, 이 관심이 아인샴스 대학교에서 한국어를 전공하는 계기가 되었습니다. 졸업 후에는 한국문화원에서 통역사로 활동하며 실무 경험을 쌓았고, 2013년에 Klovers를 설립하여 전 세계 학생들에게 한국어를 가르치고 있습니다. 한국어는 제 커리어의 핵심이며, 언어를 통해 문화적 다리 역할을 하는 것에 큰 보람을 느낍니다.",
      english: "I had a strong interest in Korean culture from a young age, which led me to major in Korean at Ain Shams University. After graduation, I gained practical experience as an interpreter at the Korean Cultural Centre, and in 2013 I founded Klovers to teach Korean to students worldwide. Korean is at the core of my career, and I find great fulfillment in serving as a cultural bridge through language.",
    },
  },
  /* ── International Mobility ── */
  {
    id: 50,
    topic: "International Experience",
    interviewer: { korean: "여러 나라에서 근무한 경험에 대해 말씀해 주세요.", english: "Tell me about your experience working in multiple countries." },
    reham: {
      korean: "이집트, 말레이시아, 헝가리 세 나라에서 근무한 경험이 있습니다. 이집트에서는 통역, 무역, 행정 관리 분야에서 일했고, 말레이시아에서는 Accenture와 Kerry에서 다국적 환경의 콘텐츠 관리와 주문 운영을 담당했습니다. 헝가리에서는 아랍어 강사와 컨퍼런스 영업을 경험했습니다. 각 국가에서 다른 업무 문화를 경험하며 유연성과 문화적 적응력을 기를 수 있었습니다.",
      english: "I have worked in three countries: Egypt, Malaysia, and Hungary. In Egypt, I worked in interpretation, trade, and administration. In Malaysia, I handled multilingual content management at Accenture and order operations at Kerry. In Hungary, I taught Arabic and managed conference sales. Working across different work cultures in each country helped me develop flexibility and cultural adaptability.",
    },
  },
  /* ── AI / Data Roles ── */
  {
    id: 51,
    topic: "AI Data Annotation",
    interviewer: { korean: "AI 모델을 위한 학습 데이터 어노테이션 작업을 어떻게 진행하시나요?", english: "How would you approach annotating training data for an AI model?" },
    reham: {
      korean: "먼저 어노테이션 가이드라인을 꼼꼼히 숙지하고, 샘플 데이터를 통해 기준을 확인합니다. 작업 중에는 일관성을 유지하기 위해 애매한 사례를 별도로 기록하고 팀과 공유합니다. Accenture에서 대량 데이터를 처리한 경험을 바탕으로, 효율적이면서도 정확한 어노테이션 프로세스를 구축할 수 있습니다.",
      english: "I first thoroughly study the annotation guidelines and verify standards through sample data. During work, I record ambiguous cases separately and share them with the team to maintain consistency. Based on my experience processing large volumes of data at Accenture, I can build an efficient yet accurate annotation process.",
    },
  },
  {
    id: 52,
    topic: "Bias Detection",
    interviewer: { korean: "학습 데이터에서 편향을 어떻게 식별하고 처리하시나요?", english: "How do you identify and handle bias in training data?" },
    reham: {
      korean: "데이터의 분포와 패턴을 분석하여 특정 그룹이나 관점이 과대 또는 과소 대표되는지 확인합니다. 다국어 콘텐츠 모더레이션 경험을 통해 문화적 편향을 인식하는 능력을 키웠습니다. 편향이 발견되면 문서화하고 팀 리드에게 보고하여 가이드라인을 업데이트합니다.",
      english: "I analyze data distribution and patterns to check if certain groups or perspectives are over- or under-represented. My multilingual content moderation experience developed my ability to recognize cultural biases. When bias is found, I document it and report to the team lead to update guidelines.",
    },
  },
  {
    id: 53,
    topic: "Annotation Guidelines",
    interviewer: { korean: "어노테이션 가이드라인이 불명확할 때 어떻게 대처하시나요?", english: "How do you handle ambiguous cases when annotation guidelines are unclear?" },
    reham: {
      korean: "먼저 기존 가이드라인에서 유사한 사례를 찾아봅니다. 그래도 불명확하면 해당 사례를 스크린샷과 함께 문서화하고, 팀 리드에게 명확한 판단 기준을 요청합니다. Accenture에서 새로운 유형의 콘텐츠를 처리할 때 이런 방식으로 가이드라인 개선에 기여했습니다.",
      english: "First, I look for similar cases in existing guidelines. If still unclear, I document the case with screenshots and request clear criteria from the team lead. At Accenture, I contributed to guideline improvements this way when handling new types of content.",
    },
  },
  {
    id: 54,
    topic: "AI Ethics",
    interviewer: { korean: "윤리적 AI와 데이터 책임에 대한 생각을 말씀해 주세요.", english: "What are your thoughts on ethical AI and data responsibility?" },
    reham: {
      korean: "AI 시스템의 품질은 학습 데이터의 품질에 직접적으로 의존합니다. 데이터 어노테이터로서 편향 없는 정확한 데이터를 제공하는 것이 윤리적 책임이라고 생각합니다. 또한 개인정보 보호와 데이터 보안을 철저히 준수해야 합니다. Klivvr에서 금융 데이터를 다루며 이런 원칙을 실천했습니다.",
      english: "AI system quality directly depends on training data quality. As a data annotator, I believe it's an ethical responsibility to provide accurate, unbiased data. Data privacy and security must also be strictly observed. I practiced these principles handling financial data at Klivvr.",
    },
  },
  {
    id: 55,
    topic: "AI Tools & Platforms",
    interviewer: { korean: "어떤 AI 도구나 플랫폼을 사용해 보셨나요?", english: "What AI tools and platforms have you worked with?" },
    reham: {
      korean: "데이터 처리와 분석에 Excel, Google Sheets를 활용했고, 웹 개발에서는 AI 기반 코드 생성 도구를 사용한 경험이 있습니다. Klovers 웹사이트에서는 AI를 활용한 콘텐츠 생성과 SEO 최적화를 진행했습니다. 새로운 도구에 빠르게 적응하는 편이며, 보통 1~2주 내에 새 플랫폼을 숙련할 수 있습니다.",
      english: "I've used Excel and Google Sheets for data processing and analysis, and have experience with AI-based code generation tools in web development. For the Klovers website, I used AI for content generation and SEO optimization. I adapt quickly to new tools and can typically master new platforms within 1-2 weeks.",
    },
  },
  /* ── Operations ── */
  {
    id: 56,
    topic: "Supply Chain Disruption",
    interviewer: { korean: "공급망 차질이 발생했을 때 어떻게 대처하셨나요?", english: "How did you handle a supply chain disruption?" },
    reham: {
      korean: "Kerry에서 주요 공급업체의 배송 지연이 발생했을 때, 즉시 대안 공급업체를 파악하고 긴급 주문을 조율했습니다. 동시에 영향을 받는 고객사에 사전 통보하여 기대치를 관리했습니다. 이 경험을 통해 위기 상황에서의 신속한 의사결정과 이해관계자 소통의 중요성을 배웠습니다.",
      english: "When a key supplier experienced delivery delays at Kerry, I immediately identified alternative suppliers and coordinated emergency orders. Simultaneously, I proactively notified affected clients to manage expectations. This taught me the importance of rapid decision-making and stakeholder communication during crises.",
    },
  },
  {
    id: 57,
    topic: "Cross-Department Coordination",
    interviewer: { korean: "부서 간 협력을 통해 운영 목표를 달성한 경험을 말씀해 주세요.", english: "Describe coordinating between departments to meet an operational deadline." },
    reham: {
      korean: "Kerry에서 월말 마감 시 물류, 재무, 고객 서비스 부서와 긴밀히 협력했습니다. 매일 진행 상황 미팅을 주최하고, 공유 대시보드를 만들어 실시간 상태를 추적했습니다. 각 부서의 병목 현상을 사전에 파악하고 해결함으로써 마감 기한을 100% 준수했습니다.",
      english: "At Kerry, I closely coordinated with logistics, finance, and customer service departments during month-end closings. I hosted daily progress meetings and created shared dashboards for real-time status tracking. By proactively identifying and resolving bottlenecks across departments, we achieved 100% deadline compliance.",
    },
  },
  {
    id: 58,
    topic: "System Migration",
    interviewer: { korean: "시스템 마이그레이션 경험이 있으신가요? 어떻게 관리하셨나요?", english: "Have you experienced a system migration? How did you manage it?" },
    reham: {
      korean: "Kerry에서 주문 관리 프로세스의 업데이트를 경험했습니다. 기존 데이터의 무결성을 확인하기 위해 마이그레이션 전후 검증 체크리스트를 만들었고, 팀원들에게 새 시스템 교육을 진행했습니다. 단계별 전환 방식을 채택하여 업무 중단을 최소화하면서 성공적으로 전환을 완료했습니다.",
      english: "At Kerry, I experienced an order management process update. I created pre- and post-migration verification checklists to ensure data integrity and trained team members on the new system. By adopting a phased transition approach, we completed the migration successfully while minimizing business disruption.",
    },
  },
  /* ── Customer Care ── */
  {
    id: 59,
    topic: "Difficult Customer",
    interviewer: { korean: "매우 불만족한 고객을 어떻게 응대하셨나요?", english: "Describe handling an extremely dissatisfied customer." },
    reham: {
      korean: "Klivvr에서 거래 오류로 매우 화가 난 고객을 응대한 적이 있습니다. 먼저 고객의 말을 끝까지 경청하고 공감을 표현했습니다. 그 다음 문제의 원인을 신속하게 파악하여 즉시 해결 방안을 제시했습니다. 후속 연락을 통해 문제가 완전히 해결되었는지 확인했고, 고객은 결국 긍정적인 피드백을 남겼습니다.",
      english: "At Klivvr, I handled a very upset customer due to a transaction error. I first listened completely and expressed empathy. Then I quickly identified the cause and immediately provided a resolution. Through follow-up contact, I confirmed the issue was fully resolved, and the customer eventually left positive feedback.",
    },
  },
  {
    id: 60,
    topic: "Customer Retention",
    interviewer: { korean: "고객 유지를 위해 어떤 전략을 사용하셨나요?", english: "What strategies have you used to retain customers?" },
    reham: {
      korean: "Kerry에서 고객 이탈 징후를 조기에 파악하기 위해 주문 빈도와 커뮤니케이션 패턴을 모니터링했습니다. 불만 사항이 감지되면 선제적으로 연락하여 솔루션을 제안했습니다. 또한 주요 고객에 대해 정기적인 만족도 조사를 실시하여 잠재적 문제를 사전에 해결했습니다. 이 접근법으로 고객 유지율을 높게 유지했습니다.",
      english: "At Kerry, I monitored order frequency and communication patterns to detect early signs of customer churn. When dissatisfaction was detected, I proactively reached out to propose solutions. I also conducted regular satisfaction surveys for key clients to address potential issues before they escalated. This approach helped maintain high customer retention rates.",
    },
  },
  {
    id: 61,
    topic: "Multilingual Customer Support",
    interviewer: { korean: "다국어 능력이 고객 서비스에 어떻게 도움이 되었나요?", english: "How do your language skills help in customer service?" },
    reham: {
      korean: "6개 언어를 구사할 수 있어 다양한 국적의 고객과 직접 소통할 수 있었습니다. 아랍어와 한국어 고객의 경우 모국어로 응대하면 신뢰감이 크게 높아졌습니다. Klivvr에서는 아랍어 고객을, Kerry에서는 다국적 고객을 언어 장벽 없이 지원하여 더 빠르고 정확한 서비스를 제공했습니다.",
      english: "Speaking 6 languages allowed me to communicate directly with customers of various nationalities. For Arabic and Korean customers, responding in their native language significantly increased trust. At Klivvr I supported Arabic customers, and at Kerry multinational clients, providing faster and more accurate service without language barriers.",
    },
  },
  {
    id: 62,
    topic: "CRM Workflow Improvement",
    interviewer: { korean: "고객 서비스 워크플로우를 개선한 경험을 말씀해 주세요.", english: "Describe a time you improved a customer service workflow." },
    reham: {
      korean: "Klivvr에서 고객 문의 유형을 분석하여 자주 발생하는 질문에 대한 표준 응답 템플릿을 만들었습니다. 이를 CRM 시스템에 통합하여 응답 시간을 40% 단축했습니다. 또한 문의 유형별 에스컬레이션 기준을 명확히 하여 복잡한 문제가 더 빨리 전문가에게 전달되도록 개선했습니다.",
      english: "At Klivvr, I analyzed customer inquiry types and created standard response templates for frequently asked questions. Integrating these into the CRM system reduced response time by 40%. I also clarified escalation criteria by inquiry type so complex issues reached specialists faster.",
    },
  },
  /* ── Translator / Interpreter ── */
  {
    id: 63,
    topic: "Simultaneous vs Consecutive",
    interviewer: { korean: "동시통역과 순차통역 경험에 대해 말씀해 주세요.", english: "What is your experience with simultaneous vs consecutive interpretation?" },
    reham: {
      korean: "한국문화원에서 대규모 행사 시 순차통역을 주로 담당했고, 비즈니스 미팅에서는 동시통역도 수행했습니다. 순차통역은 정확성이, 동시통역은 속도와 집중력이 중요합니다. 상황에 따라 적절한 방식을 선택하며, 두 가지 모두에서 높은 품질을 유지하기 위해 사전 준비를 철저히 합니다.",
      english: "At the Korean Cultural Centre, I primarily handled consecutive interpretation for large events and performed simultaneous interpretation in business meetings. Consecutive requires accuracy while simultaneous demands speed and focus. I choose the appropriate method based on the situation and prepare thoroughly to maintain high quality in both.",
    },
  },
  {
    id: 64,
    topic: "Technical Terminology",
    interviewer: { korean: "전문 분야의 통역을 위해 어떻게 준비하시나요?", english: "How do you prepare for interpreting in a specialized/technical field?" },
    reham: {
      korean: "통역 전에 해당 분야의 전문 용어집을 작성하고 관련 자료를 미리 학습합니다. El Zenouki에서 제조업 관련 통역 시 기술 용어를 한국어, 아랍어, 영어로 정리한 개인 용어집을 만들어 활용했습니다. 또한 발표자와 사전 미팅을 하여 핵심 내용과 맥락을 파악합니다.",
      english: "Before interpreting, I create a glossary of specialized terms and study related materials in advance. At El Zenouki, I built a personal glossary with technical manufacturing terms in Korean, Arabic, and English. I also hold pre-meetings with speakers to understand key content and context.",
    },
  },
  {
    id: 65,
    topic: "Translation Quality",
    interviewer: { korean: "번역의 정확성을 보장하기 위해 어떤 프로세스를 따르시나요?", english: "What process do you follow to ensure translation accuracy?" },
    reham: {
      korean: "번역 후 반드시 자체 검토를 수행하고, 가능하면 제3자 리뷰도 진행합니다. 원문의 의미뿐만 아니라 문화적 맥락과 뉘앙스도 정확히 전달되는지 확인합니다. Accenture에서 다국어 콘텐츠를 검토한 경험을 통해 체계적인 품질 보증 프로세스의 중요성을 깊이 이해하고 있습니다.",
      english: "I always perform self-review after translation and arrange third-party review when possible. I verify not only the meaning but also that cultural context and nuances are accurately conveyed. My experience reviewing multilingual content at Accenture gave me deep understanding of systematic quality assurance processes.",
    },
  },
  {
    id: 66,
    topic: "Cultural Localization",
    interviewer: { korean: "문화적 적절성을 위해 콘텐츠를 현지화한 경험을 말씀해 주세요.", english: "Give an example of adapting content for cultural appropriateness." },
    reham: {
      korean: "한국문화원에서 한국 문화 행사를 이집트 관객에게 소개할 때, 단순 번역이 아닌 문화적 맥락을 고려한 현지화를 진행했습니다. 한국의 관습이나 표현을 아랍 문화에서 이해할 수 있는 비유나 설명으로 변환했습니다. 또한 Klovers에서 한국어 교육 콘텐츠를 아랍어권 학습자에게 맞게 조정하며 13년간 이 능력을 발전시켜왔습니다.",
      english: "At the Korean Cultural Centre, when introducing Korean cultural events to Egyptian audiences, I performed localization considering cultural context rather than simple translation. I converted Korean customs and expressions into analogies and explanations understandable in Arab culture. I've also developed this skill for 13 years at Klovers, adapting Korean learning content for Arabic-speaking learners.",
    },
  },
  /* ── Translator / Interpreter — Extended ── */
  {
    id: 67,
    topic: "Korean Language Proficiency",
    interviewer: { korean: "한국어 능력 수준이 어떻게 되시나요? 공인 자격증이 있으신가요?", english: "What is your Korean language proficiency level? Do you have any official certifications?" },
    reham: {
      korean: "아인샴스 대학교에서 한국어학 및 한국문학을 전공하여 학술적 기반을 갖추고 있습니다. 13년 이상 한국어를 가르치고 통역 업무를 수행하며 실무 능력을 지속적으로 발전시켜왔습니다. 비즈니스 한국어, 일상 회화, 그리고 전문 분야 통역까지 폭넓게 대응할 수 있습니다.",
      english: "I have an academic foundation from majoring in Korean Linguistics and Literature at Ain Shams University. I've continuously developed my practical skills through 13+ years of teaching Korean and performing interpretation work. I can handle business Korean, everyday conversation, and specialized field interpretation.",
    },
  },
  {
    id: 68,
    topic: "Arabic-Korean Translation",
    interviewer: { korean: "아랍어-한국어 번역에서 가장 어려운 점은 무엇인가요?", english: "What is the most challenging aspect of Arabic-Korean translation?" },
    reham: {
      korean: "아랍어와 한국어는 문장 구조, 경어법, 그리고 문화적 표현 방식이 매우 다릅니다. 특히 아랍어의 수사적 표현을 한국어의 존댓말 체계에 맞게 변환하는 것이 어렵습니다. 저는 13년간 두 언어를 가르치며 이런 차이점을 깊이 이해했고, 직역이 아닌 의미와 뉘앙스를 살린 번역을 합니다.",
      english: "Arabic and Korean differ greatly in sentence structure, honorific systems, and cultural expressions. Converting Arabic rhetorical expressions to fit Korean's honorific system is particularly challenging. Through 13 years of teaching both languages, I deeply understand these differences and translate for meaning and nuance rather than literally.",
    },
  },
  {
    id: 69,
    topic: "Interpretation Mistake Recovery",
    interviewer: { korean: "통역 중 실수를 했을 때 어떻게 대처하시나요?", english: "How do you handle mistakes during live interpretation?" },
    reham: {
      korean: "즉시 정정하는 것이 가장 중요합니다. '정정하겠습니다'라고 말하고 올바른 내용을 전달합니다. 한국문화원에서 대규모 행사 통역 시 이런 상황을 경험했는데, 침착하게 수정하면 오히려 전문성에 대한 신뢰를 높일 수 있습니다. 실수를 방지하기 위해 사전 준비를 철저히 하고, 통역 후에는 반드시 복기하여 같은 실수를 반복하지 않도록 합니다.",
      english: "Immediate correction is most important. I say 'Let me correct that' and deliver the right content. I experienced this during large event interpretation at the Korean Cultural Centre — calmly correcting actually builds trust in your professionalism. To prevent mistakes, I prepare thoroughly beforehand and always review after interpretation to avoid repeating the same errors.",
    },
  },
  {
    id: 70,
    topic: "Confidentiality in Interpretation",
    interviewer: { korean: "통역 시 기밀 정보를 어떻게 관리하시나요?", english: "How do you handle confidential information during interpretation?" },
    reham: {
      korean: "통역사로서 기밀 유지는 가장 기본적인 직업 윤리입니다. El Zenouki에서 비즈니스 협상 통역을 할 때 양측의 기밀 정보를 접했지만, 철저하게 비밀을 유지했습니다. 통역 자료는 업무 후 안전하게 폐기하고, 통역 내용을 제3자에게 절대 공유하지 않습니다. Klivvr에서 금융 데이터를 다룬 경험도 기밀 관리 능력을 강화해주었습니다.",
      english: "Confidentiality is the most fundamental professional ethic for an interpreter. At El Zenouki, I had access to confidential information during business negotiation interpretation but maintained strict confidentiality. I safely dispose of interpretation materials after work and never share content with third parties. My experience handling financial data at Klivvr also strengthened my confidentiality management skills.",
    },
  },
  {
    id: 71,
    topic: "High-Pressure Interpretation",
    interviewer: { korean: "VIP나 고위급 인사가 참석한 자리에서 통역한 경험이 있으신가요?", english: "Have you interpreted at events with VIPs or senior officials?" },
    reham: {
      korean: "네, 한국문화원에서 2년 8개월간 대규모 문화 축제, 전시회, 기업 쇼케이스에서 국제 공연자, 기술팀, VIP 손님을 위한 주요 통역사로 활동했습니다. 압박감이 큰 상황에서도 정확성을 유지하기 위해 사전에 행사 자료를 꼼꼼히 검토하고, 관련 용어를 미리 준비합니다. 침착하고 전문적인 태도가 VIP 환경에서 가장 중요합니다.",
      english: "Yes, at the Korean Cultural Centre for over 2.5 years, I served as the primary interpreter for international performers, technical teams, and VIP guests at cultural festivals, exhibitions, and corporate showcases. To maintain accuracy under high pressure, I thoroughly review event materials and prepare relevant terminology in advance. A calm and professional demeanor is most important in VIP settings.",
    },
  },
  {
    id: 72,
    topic: "Language Pair Flexibility",
    interviewer: { korean: "아랍어, 한국어, 영어 외에 다른 언어도 통역이 가능하신가요?", english: "Can you interpret in languages other than Arabic, Korean, and English?" },
    reham: {
      korean: "네, 6개 언어를 구사할 수 있습니다. 아랍어, 한국어, 영어가 주력이며, 헝가리에서 근무하며 헝가리어도 사용한 경험이 있습니다. 다국어 능력 덕분에 복잡한 다자간 미팅에서 중간 언어 없이 직접 통역이 가능하고, 이는 소통의 정확성과 속도를 높여줍니다.",
      english: "Yes, I speak 6 languages. Arabic, Korean, and English are my primary languages, and I also have experience using Hungarian from working in Hungary. My multilingual abilities allow direct interpretation in complex multilateral meetings without relay languages, which improves both accuracy and speed of communication.",
    },
  },
  {
    id: 73,
    topic: "Korean Honorific System",
    interviewer: { korean: "한국어 경어법을 번역에서 어떻게 처리하시나요?", english: "How do you handle Korean honorifics in translation?" },
    reham: {
      korean: "한국어의 존댓말 체계는 번역에서 매우 중요합니다. 상황, 상대방의 직위, 관계에 따라 적절한 경어 수준을 선택합니다. 비즈니스 환경에서는 합니다체를 기본으로 사용하고, 발표자의 의도와 톤을 정확히 전달하기 위해 맥락을 주의 깊게 파악합니다. 아인샴스 대학에서 한국어학을 전공하며 이 체계를 학술적으로 공부했고, 13년간의 실무에서 자연스럽게 적용하고 있습니다.",
      english: "Korean's honorific system is crucial in translation. I choose the appropriate level of formality based on the situation, the other person's position, and the relationship. In business settings, I default to formal polite style (hapnida-che), carefully reading context to accurately convey the speaker's intent and tone. I studied this system academically at Ain Shams University and have been naturally applying it through 13 years of practice.",
    },
  },
  {
    id: 74,
    topic: "Translation Speed & Volume",
    interviewer: { korean: "하루에 얼마나 많은 양의 번역을 처리할 수 있으신가요?", english: "How much translation volume can you handle per day?" },
    reham: {
      korean: "문서의 복잡도에 따라 다르지만, 일반 비즈니스 문서는 하루 3,000~5,000단어, 전문 기술 문서는 2,000~3,000단어를 번역할 수 있습니다. Accenture에서 하루 800건의 콘텐츠를 95% 이상의 정확도로 처리한 경험이 있어, 대량 작업에서도 품질을 유지하는 방법을 잘 알고 있습니다. 속도보다 정확성을 우선시하되, 효율적인 작업 프로세스로 둘 다 달성합니다.",
      english: "It depends on document complexity, but I can translate 3,000-5,000 words for general business documents and 2,000-3,000 for specialized technical documents per day. Having processed 800 content items daily at 95%+ accuracy at Accenture, I know how to maintain quality in high-volume work. I prioritize accuracy over speed but achieve both through efficient work processes.",
    },
  },
  {
    id: 75,
    topic: "Remote Interpretation",
    interviewer: { korean: "원격 통역 경험이 있으신가요? 어떤 도구를 사용하시나요?", english: "Do you have experience with remote interpretation? What tools do you use?" },
    reham: {
      korean: "네, Klovers에서 13년간 15개국 이상의 학생들과 온라인으로 작업하며 원격 소통에 매우 익숙합니다. Zoom, Google Meet, Microsoft Teams 등 주요 화상회의 도구를 능숙하게 사용합니다. 원격 통역 시에는 오디오 품질 확인, 네트워크 안정성 점검, 백업 장비 준비 등 기술적 준비를 철저히 합니다. 대면보다 비언어적 단서가 적기 때문에 더 집중하여 맥락을 파악합니다.",
      english: "Yes, I'm very comfortable with remote communication from 13 years of working online with students across 15+ countries at Klovers. I'm proficient with Zoom, Google Meet, Microsoft Teams, and other video conferencing tools. For remote interpretation, I thoroughly check audio quality, network stability, and prepare backup equipment. Since there are fewer non-verbal cues than in person, I focus more intensely on context.",
    },
  },
  {
    id: 76,
    topic: "Korean Business Culture",
    interviewer: { korean: "한국 비즈니스 문화에 대한 이해도가 어떻게 되시나요?", english: "How well do you understand Korean business culture?" },
    reham: {
      korean: "아인샴스 대학에서 한국 문화와 문학을 전공했고, 한국문화원에서 2년 8개월간 한국 기업인과 직접 교류하며 비즈니스 문화를 체험했습니다. 명함 교환 예절, 회의 문화, 상하 관계의 중요성을 잘 이해하고 있습니다. 또한 13년간 한국어를 가르치며 학생들에게 비즈니스 한국어와 문화도 함께 교육하고 있어, 이론과 실무 모두에서 깊은 이해를 갖추고 있습니다.",
      english: "I majored in Korean culture and literature at Ain Shams University and experienced Korean business culture firsthand during 2.5+ years of direct interaction with Korean business professionals at the Korean Cultural Centre. I understand business card exchange etiquette, meeting culture, and the importance of hierarchical relationships. Teaching Korean for 13 years, I also educate students on business Korean and culture, giving me deep understanding in both theory and practice.",
    },
  },
  {
    id: 77,
    topic: "Translation Portfolio",
    interviewer: { korean: "지금까지 어떤 분야의 번역/통역을 가장 많이 하셨나요?", english: "What fields have you translated/interpreted in most?" },
    reham: {
      korean: "주요 분야는 문화 행사, 비즈니스 협상, 제조업, 그리고 교육입니다. 한국문화원에서 문화 축제와 기업 행사 통역을 담당했고, El Zenouki에서 제조업 비즈니스 통역을 수행했습니다. 또한 Kerry에서 다국적 고객과의 소통에서 비즈니스 통역이 필요한 상황을 자주 처리했습니다. 교육 분야에서는 Klovers를 통해 13년간 교육 콘텐츠 번역과 개발을 지속해왔습니다.",
      english: "My main fields are cultural events, business negotiations, manufacturing, and education. At the Korean Cultural Centre, I handled cultural festival and corporate event interpretation. At El Zenouki, I performed manufacturing business interpretation. At Kerry, I frequently handled situations requiring business interpretation with multinational clients. In education, I've been continuously translating and developing educational content through Klovers for 13 years.",
    },
  },
  /* ── Interpretation / Medical ── */
  {
    id: 78,
    topic: "Interpreter Self Introduction",
    interviewer: { korean: "자기소개를 해 주세요.", english: "Please introduce yourself." },
    reham: {
      korean: "제 이름은 리햄입니다. 저는 12년 이상의 국제 업무 경험을 가진 다국어 전문가입니다. 아랍어, 영어, 한국어를 사용하며 다양한 문화권의 사람들과 소통해 왔습니다.",
      english: "My name is Reham Elshrkawy. I am a multilingual professional with more than 12 years of international experience working in Malaysia, Egypt, and Hungary. I speak Arabic, English, and Korean, and I have strong experience in customer communication, operations, and cross-cultural collaboration.",
    },
  },
  {
    id: 79,
    topic: "Interpreter Motivation",
    interviewer: { korean: "왜 통역사로 일하고 싶습니까?", english: "Why do you want to work as an interpreter?" },
    reham: {
      korean: "저는 언어 장벽을 넘어 사람들이 서로 이해하도록 돕는 일을 좋아합니다. 다양한 국제 환경에서 일한 경험이 있어 정확한 의사소통의 중요성을 잘 알고 있습니다.",
      english: "I enjoy helping people communicate across languages and cultures. My experience working with international clients and students taught me how important clear communication is, especially when people cannot understand each other directly.",
    },
  },
  {
    id: 80,
    topic: "Customer Communication",
    interviewer: { korean: "고객과 소통한 경험이 있습니까?", english: "Do you have experience communicating with customers?" },
    reham: {
      korean: "네, 고객 서비스 역할에서 하루에 50명에서 100명 이상의 고객을 응대한 경험이 있습니다.",
      english: "Yes. In my previous customer service role, I handled between 50 and 100 customer interactions daily, solving problems and ensuring clear communication.",
    },
  },
  {
    id: 81,
    topic: "Handling Unknown Words",
    interviewer: { korean: "통역 중 이해하지 못한 단어가 있으면 어떻게 하시겠습니까?", english: "What would you do if you do not understand a word during interpretation?" },
    reham: {
      korean: "정확한 통역을 위해 화자에게 정중하게 다시 말해 달라고 요청하겠습니다.",
      english: "I would politely ask the speaker to repeat or clarify the sentence to ensure the interpretation remains accurate.",
    },
  },
  {
    id: 82,
    topic: "Interpreter Neutrality",
    interviewer: { korean: "통역할 때 중립성을 어떻게 유지합니까?", english: "How do you maintain neutrality as an interpreter?" },
    reham: {
      korean: "통역사는 개인적인 의견을 추가하지 않고 말한 내용을 그대로 전달해야 한다고 생각합니다.",
      english: "I focus on delivering the exact message without adding personal opinions or changing the meaning. Neutrality is essential in interpretation.",
    },
  },
  {
    id: 83,
    topic: "Stressful Calls",
    interviewer: { korean: "스트레스가 있는 통화를 어떻게 처리합니까?", english: "How do you handle stressful calls?" },
    reham: {
      korean: "침착하게 상황을 듣고 정확하고 명확한 통역에 집중합니다.",
      english: "I stay calm, listen carefully, and focus on providing clear and accurate interpretation so both parties can understand each other.",
    },
  },
  {
    id: 84,
    topic: "International Work Experience",
    interviewer: { korean: "국제 환경에서 일한 경험이 있습니까?", english: "Do you have international work experience?" },
    reham: {
      korean: "네, 말레이시아, 이집트, 헝가리에서 일하며 다양한 국적의 팀과 협업했습니다.",
      english: "Yes. I worked in multinational environments in Malaysia and collaborated with clients from many countries.",
    },
  },
  {
    id: 85,
    topic: "Interpretation Accuracy",
    interviewer: { korean: "통역의 정확성을 어떻게 보장합니까?", english: "How do you ensure accuracy in interpretation?" },
    reham: {
      korean: "주의 깊게 듣고 단어 단위가 아니라 의미 중심으로 전달합니다.",
      english: "I focus on listening carefully and understanding the full meaning before translating. I avoid word-for-word translation and instead deliver the message clearly and accurately.",
    },
  },
  {
    id: 86,
    topic: "Working Under Pressure",
    interviewer: { korean: "압박 속에서 일할 수 있습니까?", english: "Can you work under pressure?" },
    reham: {
      korean: "네, 하루에 많은 업무를 처리해야 하는 환경에서 정확도를 유지하며 일한 경험이 있습니다.",
      english: "Yes. I worked in high-volume operational environments where accuracy and efficiency were essential.",
    },
  },
  {
    id: 87,
    topic: "Confidential Information",
    interviewer: { korean: "기밀 정보를 어떻게 처리합니까?", english: "How do you handle confidential information?" },
    reham: {
      korean: "고객 정보와 대화 내용은 항상 비밀을 유지해야 한다고 생각합니다.",
      english: "I treat all information as strictly confidential and follow professional ethics to protect privacy and trust.",
    },
  },
  {
    id: 88,
    topic: "Training Others",
    interviewer: { korean: "다른 사람을 교육한 경험이 있습니까?", english: "Do you have experience training others?" },
    reham: {
      korean: "네, 이전 직장에서 10명에서 15명 정도의 팀원을 교육한 경험이 있습니다.",
      english: "Yes. I trained 10–15 team members on operational processes and systems in my previous roles.",
    },
  },
  {
    id: 89,
    topic: "Polite Repeat Request",
    interviewer: { korean: "화자에게 정중하게 다시 말해 달라고 어떻게 요청합니까?", english: "How do you ask a speaker to repeat politely?" },
    reham: {
      korean: "정확한 이해를 위해 '다시 말씀해 주시겠습니까?'라고 요청하겠습니다.",
      english: "I would say: \"Could you please repeat that?\" or \"Could you please clarify that for me?\"",
    },
  },
  {
    id: 90,
    topic: "Different Accents",
    interviewer: { korean: "다양한 억양을 어떻게 이해합니까?", english: "How do you deal with different accents?" },
    reham: {
      korean: "국제 환경에서 일하며 다양한 억양에 익숙해졌습니다.",
      english: "I worked in multinational environments in Malaysia and collaborated with clients from many countries.",
    },
  },
  {
    id: 91,
    topic: "Languages Spoken",
    interviewer: { korean: "어떤 언어를 할 수 있습니까?", english: "What languages do you speak?" },
    reham: {
      korean: "아랍어, 영어, 한국어를 포함하여 여러 언어를 사용합니다.",
      english: "I speak Arabic as my native language, English professionally, and Korean at an intermediate-advanced level. I also have knowledge of Hungarian, German, and French.",
    },
  },
  {
    id: 92,
    topic: "Interpreter Key Skills",
    interviewer: { korean: "좋은 통역사가 되기 위한 기술은 무엇이라고 생각합니까?", english: "What skills make you a good interpreter?" },
    reham: {
      korean: "집중력, 정확성, 그리고 문화적 이해가 중요하다고 생각합니다.",
      english: "My multilingual background, international experience, and strong listening skills help me communicate clearly between people from different cultures.",
    },
  },
  {
    id: 93,
    topic: "Focus During Long Calls",
    interviewer: { korean: "긴 통화 중 집중력을 어떻게 유지합니까?", english: "How do you stay focused during long calls?" },
    reham: {
      korean: "대화의 흐름에 집중하고 필요한 정보를 정확하게 전달하는 데 집중합니다.",
      english: "I stay engaged in the conversation and concentrate on delivering accurate information without losing context.",
    },
  },
  {
    id: 94,
    topic: "Language Motivation",
    interviewer: { korean: "언어 분야에서 일하게 된 동기는 무엇입니까?", english: "What motivates you to work in languages?" },
    reham: {
      korean: "언어와 문화 교류에 관심이 많기 때문입니다.",
      english: "I have always been passionate about languages and cultural communication, and I enjoy helping people understand each other.",
    },
  },
  {
    id: 95,
    topic: "Teaching Experience",
    interviewer: { korean: "교육 경험이 있습니까?", english: "Do you have teaching experience?" },
    reham: {
      korean: "네, 전 세계 학생들을 가르친 경험이 있습니다.",
      english: "Yes. I trained 10–15 team members on operational processes and systems in my previous roles.",
    },
  },
  {
    id: 96,
    topic: "Unfamiliar Terminology",
    interviewer: { korean: "익숙하지 않은 용어를 어떻게 처리합니까?", english: "How do you deal with unfamiliar terminology?" },
    reham: {
      korean: "문맥을 이해하고 필요한 경우 화자에게 설명을 요청합니다.",
      english: "I would politely ask the speaker to repeat or clarify the sentence to ensure the interpretation remains accurate.",
    },
  },
  {
    id: 97,
    topic: "Why Hire You (Interpreter)",
    interviewer: { korean: "왜 당신을 채용해야 합니까?", english: "Why should we hire you?" },
    reham: {
      korean: "저는 다국어 능력과 국제 업무 경험이 있으며 다양한 환경에서 효과적으로 소통할 수 있기 때문입니다.",
      english: "I bring multilingual communication skills, international experience, and strong professionalism. I am reliable and focused on delivering accurate and clear communication.",
    },
  },
];

/* ─── Section color map ─── */

const SECTION_COLORS: Record<string, string> = {
  Greeting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Education: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  Summary: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Projects: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Languages: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Motivation: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  Accenture: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Kerry: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  "Web Dev": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  Strengths: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Closing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "AI Data": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200",
  Operations: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Customer Care": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  Translation: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
};

/* ─── Data: Categories mapping ─── */

const CATEGORIES: { name: string; icon: string; ids: number[] }[] = [
  { name: "Self-Introduction", icon: "👋", ids: [1, 48, 49] },
  { name: "Work Experience", icon: "💼", ids: [2, 4, 50] },
  { name: "Accenture", icon: "🏢", ids: [10, 25, 26] },
  { name: "Kerry (F&B)", icon: "📦", ids: [3, 20, 21, 22, 23, 24] },
  { name: "Klivvr / Fintech", icon: "💳", ids: [27, 28] },
  { name: "Klovers", icon: "🍀", ids: [29, 30] },
  { name: "El Zenouki / Interpretation", icon: "🗣️", ids: [42, 47] },
  { name: "ERC / Administration", icon: "🏗️", ids: [44] },
  { name: "International Trade", icon: "🚢", ids: [43] },
  { name: "Teaching Abroad", icon: "🎓", ids: [45, 47, 49] },
  { name: "Education & Background", icon: "📚", ids: [48, 49, 50] },
  { name: "Data Processing", icon: "📊", ids: [3, 4, 26] },
  { name: "Strengths & Weaknesses", icon: "💪", ids: [5, 6] },
  { name: "Motivation & Fit", icon: "🎯", ids: [7, 8] },
  { name: "Web Development", icon: "🌐", ids: [14, 31, 32] },
  { name: "Problem Solving", icon: "🧩", ids: [9, 11, 13, 36, 37] },
  { name: "Teamwork & Leadership", icon: "👥", ids: [10, 12, 33, 34, 44] },
  { name: "B2B Sales", icon: "💼", ids: [46] },
  { name: "Career & Self-Dev", icon: "📈", ids: [18, 38, 39] },
  { name: "Cross-Cultural", icon: "🌍", ids: [35, 42, 45, 50] },
  { name: "Closing", icon: "🤝", ids: [40, 41] },
  { name: "AI / Data Annotation", icon: "🤖", ids: [51, 52, 53, 54, 55] },
  { name: "Operations & Supply Chain", icon: "⚙️", ids: [56, 57, 58] },
  { name: "Customer Service", icon: "💬", ids: [59, 60, 61, 62] },
  { name: "Translation & Interpretation", icon: "🌐", ids: [63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77] },
  { name: "Interpretation / Medical", icon: "🏥", ids: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97] },
];

/* ─── Interview Field Configs ─── */

type InterviewField = "all" | "ai" | "operations" | "customer-care" | "translator" | "interpretation-medical";

interface FieldConfig {
  key: InterviewField;
  label: string;
  labelKr: string;
  icon: string;
  description: string;
  questionIds: number[];
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    key: "all",
    label: "All Questions",
    labelKr: "전체 질문",
    icon: "📋",
    description: "All interview questions across all fields",
    questionIds: [],
  },
  {
    key: "ai",
    label: "AI / Data Roles",
    labelKr: "AI / 데이터 직무",
    icon: "🤖",
    description: "AI Data Annotator, AI Trainer, Machine Learning",
    questionIds: [1, 2, 3, 4, 5, 6, 7, 8, 13, 14, 15, 16, 17, 25, 26, 38, 39, 40, 41, 51, 52, 53, 54, 55],
  },
  {
    key: "operations",
    label: "Operations",
    labelKr: "운영 관리",
    icon: "⚙️",
    description: "Order management, process optimization, SAP",
    questionIds: [1, 2, 3, 4, 5, 6, 9, 11, 17, 20, 21, 22, 23, 24, 36, 38, 39, 40, 41, 56, 57, 58],
  },
  {
    key: "customer-care",
    label: "Customer Care",
    labelKr: "고객 서비스",
    icon: "💬",
    description: "Customer service, complaint handling, CRM",
    questionIds: [1, 2, 5, 6, 10, 17, 23, 24, 27, 28, 35, 38, 39, 40, 41, 59, 60, 61, 62],
  },
  {
    key: "translator",
    label: "Translator / Interpreter",
    labelKr: "번역 / 통역",
    icon: "🌐",
    description: "Translation, interpretation, cultural mediation",
    questionIds: [1, 2, 5, 6, 16, 17, 35, 42, 45, 47, 49, 38, 39, 40, 41, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
  },
  {
    key: "interpretation-medical",
    label: "Interpretation / Medical",
    labelKr: "통역 / 의료",
    icon: "🏥",
    description: "Medical interpretation, OPI-style interpreter interviews",
    questionIds: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97],
  },
];

/* ─── Data: Key Metrics ─── */

const KEY_METRICS: { label: string; korean: string; english: string }[] = [
  { label: "Accenture Daily Volume", korean: "하루 최대 800건 처리", english: "Processed up to 800 items daily" },
  { label: "Accenture Accuracy", korean: "정확도 95% 이상 달성", english: "Achieved 95%+ accuracy" },
  { label: "Kerry Monthly Volume", korean: "월 1,000건 이상 주문 관리", english: "Managed 1,000+ orders monthly" },
  { label: "Kerry Accuracy", korean: "정확도 96% 이상 유지", english: "Maintained 96%+ accuracy" },
  { label: "Kerry Error Reduction", korean: "오류율 50% 이상 감소", english: "Reduced error rate by 50%+" },
  { label: "Kerry Process Time", korean: "처리 시간 30% 단축", english: "Reduced processing time by 30%" },
  { label: "Kerry Clients", korean: "50개 이상의 고객사 관리", english: "Managed 50+ client accounts" },
  { label: "Kerry SAP Experience", korean: "SAP ERP 3년 이상 사용", english: "3+ years SAP ERP experience" },
  { label: "Kerry Team Training", korean: "신입 10~15명 SAP 교육", english: "Trained 10-15 new hires on SAP" },
  { label: "Klivvr Daily Interactions", korean: "하루 50~100건 고객 상호작용", english: "50-100+ daily customer interactions" },
  { label: "International Experience", korean: "13년 이상의 국제 경험", english: "13+ years international experience" },
  { label: "Languages", korean: "6개 언어 구사", english: "Fluent in 6 languages" },
  { label: "Klovers Community", korean: "15개국 500명 이상 학생", english: "500+ students across 15+ countries" },
  { label: "Klovers Duration", korean: "13년간 운영", english: "Running for 13 years" },
  { label: "Team Productivity", korean: "팀 생산성 20% 향상", english: "Improved team productivity by 20%" },
  { label: "System Onboarding", korean: "1~2주 내 새 시스템 숙련", english: "Proficient in new systems within 1-2 weeks" },
  { label: "ERC Team Size", korean: "50명 규모의 행정부서 관리", english: "Managed administrative dept of 50 personnel" },
  { label: "Education", korean: "아인샴스 대학교 한국어과 졸업", english: "Ain Shams University Korean dept graduate" },
  { label: "Countries Worked", korean: "3개국 근무 경험 (이집트, 말레이시아, 헝가리)", english: "Worked in 3 countries (Egypt, Malaysia, Hungary)" },
  { label: "Korean Teaching", korean: "13년 이상의 한국어 교육 경험", english: "13+ years Korean language teaching" },
  { label: "Cultural Events", korean: "대규모 문화 행사 통역 담당", english: "Lead interpreter for large cultural events" },
  { label: "Korean Cultural Centre", korean: "한국문화원 2년 8개월 근무", english: "2 years 8 months at Korean Cultural Centre" },
];

/* ─── Data: Power Phrases ─── */

const POWER_PHRASES: { korean: string; romanization: string; english: string }[] = [
  { korean: "감사합니다", romanization: "gamsahamnida", english: "Thank you" },
  { korean: "최선을 다하겠습니다", romanization: "choeseon-eul dahagesseumnida", english: "I will do my best" },
  { korean: "경험을 바탕으로", romanization: "gyeongheom-eul batang-euro", english: "Based on my experience" },
  { korean: "기여할 수 있다고 확신합니다", romanization: "giyeohal su itdago hwaksinhamnida", english: "I am confident I can contribute" },
  { korean: "체계적으로 접근합니다", romanization: "chegyejeogeuro jeopgeunhamnida", english: "I approach systematically" },
  { korean: "데이터 품질에 대한 열정", romanization: "deiteo pumjire daehan yeoljeong", english: "Passion for data quality" },
  { korean: "빠르게 적응하는 편입니다", romanization: "ppareuge jeogeunghaneun pyeonimnida", english: "I adapt quickly" },
  { korean: "팀에 가치를 더할 수 있습니다", romanization: "time gachireul deohal su isseumnida", english: "I can add value to the team" },
  { korean: "지속적으로 개선하고 있습니다", romanization: "jisogjeogeuro gaeseonhago isseumnida", english: "I am continuously improving" },
  { korean: "즉시 가치를 제공할 수 있습니다", romanization: "jeuksi gachireul jegonghal su isseumnida", english: "I can deliver immediate value" },
  { korean: "이집트 출신입니다", romanization: "ijipteu chulshinimnida", english: "I am from Egypt" },
  { korean: "한국어학을 전공했습니다", romanization: "hangugeohageul jeonggonghaesseumnida", english: "I majored in Korean Linguistics" },
  { korean: "다양한 국가에서 근무한 경험이 있습니다", romanization: "dayanghan gugaeseo geunmuhan gyeongheomi isseumnida", english: "I have experience working in various countries" },
];

/* ─── Data: Company Summaries ─── */

const COMPANY_SUMMARIES: { name: string; korean: string; english: string }[] = [
  { name: "Kerry", korean: "F&B 분야 다국적 고객사의 주문 관리 담당 (3년 5개월, 쿠알라룸푸르)", english: "Order Management Representative for multinational F&B clients (3yr 5mo, KL Malaysia)" },
  { name: "Accenture", korean: "글로벌 IT 및 컨설팅 회사에서 다국어 콘텐츠 모더레이터로 3년 이상 근무 (쿠알라룸푸르)", english: "3+ years as multilingual content moderator at global IT & consulting firm (KL Malaysia)" },
  { name: "Explore-Saudi", korean: "럭셔리 여행 플랫폼의 디지털 브랜딩 및 웹 개발 리드 (원격)", english: "Digital branding & web development lead for luxury travel platform (remote)" },
  { name: "Klivvr", korean: "이집트 핀테크 스타트업에서 고객 서비스 전문가 (카이로)", english: "Customer Service Specialist at Egyptian fintech startup (Cairo)" },
  { name: "El Zenouki Group", korean: "제조 기업 통역 서비스 코디네이터 — 아랍어/한국어/영어 (카이로)", english: "Interpreter Services Coordinator at manufacturing corp — Arabic/Korean/English (Cairo)" },
  { name: "Golden Dragon", korean: "수산물 국제 수출 리테일 총괄 매니저 (카이로)", english: "Retail General Manager for international eel & seafood export (Cairo)" },
  { name: "ERC (DAEAH E&C)", korean: "석유 및 에너지 프로젝트 행정 관리자 — 50명 관리 (카이로)", english: "Administration Manager for Oil & Energy project — 50 personnel (Cairo)" },
  { name: "Korean Cultural Centre", korean: "문화 행사 통역 및 기획 담당 (카이로, 2년 8개월)", english: "Cultural event interpreter & planner (Cairo, 2yr 8mo)" },
  { name: "GLC Europe", korean: "유럽 시장 기업 컨퍼런스 영업 담당 (부다페스트)", english: "Conference sales executive for European market (Budapest)" },
  { name: "Nur School", korean: "헝가리에서 아랍어 강사로 성인 대상 교육 (부다페스트)", english: "Arabic instructor for adults in Hungary (Budapest)" },
];

/* ─── Data: Vocabulary Groups ─── */

const VOCAB_GROUPS: { name: string; words: { korean: string; romanization: string; english: string }[] }[] = [
  {
    name: "Greetings & Politeness",
    words: [
      { korean: "안녕하세요", romanization: "annyeonghaseyo", english: "Hello (formal)" },
      { korean: "감사합니다", romanization: "gamsahamnida", english: "Thank you (formal)" },
      { korean: "실례합니다", romanization: "sillyehamnida", english: "Excuse me" },
      { korean: "네, 알겠습니다", romanization: "ne, algesseumnida", english: "Yes, I understand" },
      { korean: "죄송합니다", romanization: "joesonghamnida", english: "I'm sorry (formal)" },
      { korean: "만나서 반갑습니다", romanization: "mannaseo bangapseumnida", english: "Nice to meet you" },
      { korean: "잘 부탁드립니다", romanization: "jal butakdeurimnida", english: "Please take care of me / I look forward to working with you" },
    ],
  },
  {
    name: "Transitions & Connectors",
    words: [
      { korean: "그리고", romanization: "geurigo", english: "And / Also" },
      { korean: "또한", romanization: "ttohan", english: "Furthermore" },
      { korean: "그래서", romanization: "geuraeseo", english: "Therefore / So" },
      { korean: "특히", romanization: "teukhi", english: "Especially" },
      { korean: "이를 통해", romanization: "ireul tonghae", english: "Through this" },
      { korean: "뿐만 아니라", romanization: "ppunman anira", english: "Not only ... but also" },
      { korean: "결과적으로", romanization: "gyeolgwajeogeuro", english: "As a result" },
      { korean: "먼저", romanization: "meonjeo", english: "First" },
      { korean: "마지막으로", romanization: "majimageuro", english: "Finally / Lastly" },
    ],
  },
  {
    name: "Action Verbs (Work)",
    words: [
      { korean: "처리하다", romanization: "cheorihada", english: "To process / handle" },
      { korean: "관리하다", romanization: "gwallihada", english: "To manage" },
      { korean: "분석하다", romanization: "bunseokada", english: "To analyze" },
      { korean: "개발하다", romanization: "gaebalhada", english: "To develop" },
      { korean: "개선하다", romanization: "gaeseonhada", english: "To improve" },
      { korean: "교육하다", romanization: "gyoyukada", english: "To train / educate" },
      { korean: "달성하다", romanization: "dalseonghada", english: "To achieve" },
      { korean: "유지하다", romanization: "yujihada", english: "To maintain" },
      { korean: "협업하다", romanization: "hyeopeopada", english: "To collaborate" },
      { korean: "도입하다", romanization: "doipada", english: "To introduce / implement" },
    ],
  },
  {
    name: "Numbers & Quantities",
    words: [
      { korean: "건 (件)", romanization: "geon", english: "Item / case (counter)" },
      { korean: "퍼센트 (%)", romanization: "peosenteu", english: "Percent" },
      { korean: "개월", romanization: "gaewol", english: "Months" },
      { korean: "년", romanization: "nyeon", english: "Year(s)" },
      { korean: "명", romanization: "myeong", english: "People (counter)" },
      { korean: "백 (100)", romanization: "baek", english: "Hundred" },
      { korean: "천 (1,000)", romanization: "cheon", english: "Thousand" },
      { korean: "만 (10,000)", romanization: "man", english: "Ten thousand" },
      { korean: "이상", romanization: "isang", english: "More than / above" },
      { korean: "최대", romanization: "choedae", english: "Maximum / up to" },
    ],
  },
  {
    name: "Education & Background",
    words: [
      { korean: "대학교", romanization: "daehakgyo", english: "University" },
      { korean: "전공", romanization: "jeongong", english: "Major / Specialization" },
      { korean: "졸업", romanization: "joreop", english: "Graduation" },
      { korean: "문학", romanization: "munhak", english: "Literature" },
      { korean: "언어학", romanization: "eoneohak", english: "Linguistics" },
      { korean: "통역", romanization: "tongyeok", english: "Interpretation" },
      { korean: "번역", romanization: "beonyeok", english: "Translation" },
      { korean: "무역", romanization: "muyeok", english: "Trade" },
      { korean: "수출", romanization: "suchul", english: "Export" },
      { korean: "행정", romanization: "haengjeong", english: "Administration" },
      { korean: "출신", romanization: "chulsin", english: "Origin / From" },
    ],
  },
  {
    name: "Closing & Follow-up",
    words: [
      { korean: "기회를 주셔서 감사합니다", romanization: "gihoereul jusyeoseo gamsahamnida", english: "Thank you for the opportunity" },
      { korean: "연락 주세요", romanization: "yeollak juseyo", english: "Please contact me" },
      { korean: "기회를 주시면", romanization: "gihoereul jusimyeon", english: "If you give me the opportunity" },
      { korean: "빠르게 기여하고 싶습니다", romanization: "ppareuge giyeohago sipseumnida", english: "I want to contribute quickly" },
      { korean: "의미 있는 기여", romanization: "uimi inneun giyeo", english: "Meaningful contribution" },
      { korean: "팀에 가치를 더하다", romanization: "time gachireul deohada", english: "To add value to the team" },
    ],
  },
];

/* ─── Data: TOPIK 2급–6급 Flash Cards ─── */

interface FlashCardWord {
  korean: string;
  romanization: string;
  english: string;
  sentence_kr: string;
  sentence_en: string;
}

type TopikLevel = 2 | 3 | 4 | 5 | 6;

const FLASHCARD_DATA: { level: TopikLevel; category: string; words: FlashCardWord[] }[] = [
  /* ══════════════════ TOPIK 2급 ══════════════════ */
  {
    level: 2, category: "Business & Work (비즈니스)",
    words: [
      { korean: "회의", romanization: "hoeui", english: "Meeting", sentence_kr: "오늘 오후에 중요한 회의가 있습니다.", sentence_en: "There is an important meeting this afternoon." },
      { korean: "보고서", romanization: "bogoseo", english: "Report", sentence_kr: "내일까지 보고서를 제출해야 합니다.", sentence_en: "I have to submit the report by tomorrow." },
      { korean: "출장", romanization: "chuljang", english: "Business trip", sentence_kr: "다음 주에 말레이시아로 출장을 갑니다.", sentence_en: "I'm going on a business trip to Malaysia next week." },
      { korean: "거래처", romanization: "georaecheo", english: "Client company", sentence_kr: "거래처와 좋은 관계를 유지하는 것이 중요합니다.", sentence_en: "It is important to maintain good relationships with clients." },
      { korean: "실적", romanization: "siljeok", english: "Performance results", sentence_kr: "이번 분기 실적이 매우 좋았습니다.", sentence_en: "This quarter's performance was very good." },
      { korean: "승진", romanization: "seungjin", english: "Promotion", sentence_kr: "열심히 일해서 승진할 수 있었습니다.", sentence_en: "I was able to get promoted by working hard." },
      { korean: "계약", romanization: "gyeyak", english: "Contract", sentence_kr: "새로운 고객과 계약을 체결했습니다.", sentence_en: "We signed a contract with a new customer." },
      { korean: "마감", romanization: "magam", english: "Deadline", sentence_kr: "마감 기한을 꼭 지켜 주세요.", sentence_en: "Please make sure to meet the deadline." },
    ],
  },
  {
    level: 2, category: "Communication (소통)",
    words: [
      { korean: "의견", romanization: "uigyeon", english: "Opinion", sentence_kr: "다른 의견이 있으시면 말씀해 주세요.", sentence_en: "Please share if you have a different opinion." },
      { korean: "제안", romanization: "jean", english: "Suggestion / proposal", sentence_kr: "새로운 프로젝트에 대한 제안을 준비했습니다.", sentence_en: "I prepared a proposal for the new project." },
      { korean: "설명", romanization: "seolmyeong", english: "Explanation", sentence_kr: "자세한 설명을 부탁드립니다.", sentence_en: "Could you please give a detailed explanation?" },
      { korean: "확인", romanization: "hwaghin", english: "Confirmation", sentence_kr: "이메일을 확인하셨나요?", sentence_en: "Did you check the email?" },
      { korean: "연락", romanization: "yeollak", english: "Contact", sentence_kr: "결과가 나오면 바로 연락드리겠습니다.", sentence_en: "I will contact you as soon as the results are out." },
      { korean: "상의", romanization: "sangui", english: "Consultation", sentence_kr: "팀장님과 상의한 후에 결정하겠습니다.", sentence_en: "I will decide after discussing with the team leader." },
      { korean: "전달", romanization: "jeondal", english: "Passing on info", sentence_kr: "이 내용을 팀원들에게 전달해 주세요.", sentence_en: "Please pass this information on to the team members." },
      { korean: "참석", romanization: "chamseok", english: "Attendance", sentence_kr: "내일 회의에 참석할 수 있으신가요?", sentence_en: "Can you attend tomorrow's meeting?" },
    ],
  },
  {
    level: 2, category: "Daily & Goals (일상)",
    words: [
      { korean: "약속", romanization: "yaksok", english: "Appointment / promise", sentence_kr: "내일 점심에 약속이 있습니다.", sentence_en: "I have an appointment at lunch tomorrow." },
      { korean: "준비", romanization: "junbi", english: "Preparation", sentence_kr: "면접 준비를 철저히 했습니다.", sentence_en: "I thoroughly prepared for the interview." },
      { korean: "계획", romanization: "gyehoek", english: "Plan", sentence_kr: "올해의 계획을 세웠습니다.", sentence_en: "I made plans for this year." },
      { korean: "결과", romanization: "gyeolgwa", english: "Result", sentence_kr: "노력의 결과가 좋았습니다.", sentence_en: "The results of my efforts were good." },
      { korean: "기회", romanization: "gihoe", english: "Opportunity", sentence_kr: "이번 기회를 놓치고 싶지 않습니다.", sentence_en: "I don't want to miss this opportunity." },
      { korean: "목표", romanization: "mokpyo", english: "Goal / target", sentence_kr: "올해의 목표는 TOPIK 4급 합격입니다.", sentence_en: "My goal this year is to pass TOPIK Level 4." },
      { korean: "노력", romanization: "noryeok", english: "Effort", sentence_kr: "매일 꾸준히 노력하고 있습니다.", sentence_en: "I make consistent effort every day." },
      { korean: "습관", romanization: "seupgwan", english: "Habit", sentence_kr: "좋은 습관을 만드는 것이 중요합니다.", sentence_en: "It is important to build good habits." },
    ],
  },
  {
    level: 2, category: "Interview Basics (면접)",
    words: [
      { korean: "지원하다", romanization: "jiwonhada", english: "To apply", sentence_kr: "이 회사에 지원한 이유는 성장 가능성 때문입니다.", sentence_en: "The reason I applied to this company is its growth potential." },
      { korean: "채용", romanization: "chaeyong", english: "Hiring", sentence_kr: "채용 공고를 보고 지원했습니다.", sentence_en: "I applied after seeing the job posting." },
      { korean: "면접관", romanization: "myeonjeobgwan", english: "Interviewer", sentence_kr: "면접관의 질문에 정확하게 답변했습니다.", sentence_en: "I answered the interviewer's questions accurately." },
      { korean: "이력서", romanization: "iryeokseo", english: "Resume / CV", sentence_kr: "이력서를 최신 상태로 업데이트했습니다.", sentence_en: "I updated my resume to the latest version." },
      { korean: "포부", romanization: "pobu", english: "Ambition", sentence_kr: "이 분야의 전문가가 되는 것이 제 포부입니다.", sentence_en: "My ambition is to become an expert in this field." },
      { korean: "기여하다", romanization: "giyeohada", english: "To contribute", sentence_kr: "팀의 성과에 기여하고 싶습니다.", sentence_en: "I want to contribute to the team's performance." },
      { korean: "동기", romanization: "donggi", english: "Motivation", sentence_kr: "지원 동기를 말씀해 주세요.", sentence_en: "Please tell me your motivation for applying." },
      { korean: "입사", romanization: "ipsa", english: "Joining a company", sentence_kr: "입사 후 첫 3개월 안에 빠르게 적응하겠습니다.", sentence_en: "I will adapt quickly within the first 3 months after joining." },
    ],
  },
  /* ══════════════════ TOPIK 3급 ══════════════════ */
  {
    level: 3, category: "Workplace (직장생활)",
    words: [
      { korean: "업무", romanization: "eopmu", english: "Work / duties", sentence_kr: "새로운 업무를 맡게 되었습니다.", sentence_en: "I have been assigned new duties." },
      { korean: "담당", romanization: "damdang", english: "In charge of", sentence_kr: "이 프로젝트의 담당자가 누구입니까?", sentence_en: "Who is in charge of this project?" },
      { korean: "부서", romanization: "buseo", english: "Department", sentence_kr: "다른 부서와 협력하여 일합니다.", sentence_en: "I work in cooperation with other departments." },
      { korean: "근무", romanization: "geunmu", english: "Work / service", sentence_kr: "해외에서 3년간 근무했습니다.", sentence_en: "I worked overseas for 3 years." },
      { korean: "야근", romanization: "yageun", english: "Overtime", sentence_kr: "마감 전에 야근을 해야 했습니다.", sentence_en: "I had to work overtime before the deadline." },
      { korean: "월급", romanization: "wolgeup", english: "Monthly salary", sentence_kr: "월급은 경력에 따라 다릅니다.", sentence_en: "The salary varies depending on experience." },
      { korean: "퇴근", romanization: "toegeun", english: "Leaving work", sentence_kr: "보통 7시에 퇴근합니다.", sentence_en: "I usually leave work at 7." },
      { korean: "출근", romanization: "chulgeun", english: "Going to work", sentence_kr: "매일 아침 8시에 출근합니다.", sentence_en: "I go to work at 8 every morning." },
    ],
  },
  {
    level: 3, category: "Skills & Traits (역량)",
    words: [
      { korean: "경험", romanization: "gyeongheom", english: "Experience", sentence_kr: "다양한 분야에서 경험을 쌓았습니다.", sentence_en: "I have gained experience in various fields." },
      { korean: "능력", romanization: "neungnyeok", english: "Ability", sentence_kr: "문제 해결 능력이 뛰어납니다.", sentence_en: "My problem-solving ability is excellent." },
      { korean: "자신감", romanization: "jasingam", english: "Confidence", sentence_kr: "면접에서 자신감을 보여 주는 것이 중요합니다.", sentence_en: "It is important to show confidence in an interview." },
      { korean: "책임감", romanization: "chaegimgam", english: "Responsibility", sentence_kr: "강한 책임감을 가지고 일합니다.", sentence_en: "I work with a strong sense of responsibility." },
      { korean: "성실하다", romanization: "seongsilhada", english: "Diligent", sentence_kr: "항상 성실하게 일하려고 노력합니다.", sentence_en: "I always try to work diligently." },
      { korean: "꼼꼼하다", romanization: "kkomkkomhada", english: "Meticulous", sentence_kr: "저는 업무를 꼼꼼하게 처리합니다.", sentence_en: "I handle my work meticulously." },
      { korean: "적극적", romanization: "jeokgeukjeok", english: "Proactive", sentence_kr: "새로운 프로젝트에 적극적으로 참여합니다.", sentence_en: "I actively participate in new projects." },
      { korean: "유연하다", romanization: "yuyeonhada", english: "Flexible", sentence_kr: "유연한 사고로 문제를 해결합니다.", sentence_en: "I solve problems with flexible thinking." },
    ],
  },
  {
    level: 3, category: "Social & Relations (관계)",
    words: [
      { korean: "인사", romanization: "insa", english: "Greeting / HR", sentence_kr: "인사 담당자에게 연락해 주세요.", sentence_en: "Please contact the HR manager." },
      { korean: "소개", romanization: "sogae", english: "Introduction", sentence_kr: "자기소개를 해 주세요.", sentence_en: "Please introduce yourself." },
      { korean: "존경", romanization: "jongyeong", english: "Respect", sentence_kr: "선배님을 존경합니다.", sentence_en: "I respect my senior." },
      { korean: "신뢰", romanization: "silloe", english: "Trust", sentence_kr: "팀원 간의 신뢰가 중요합니다.", sentence_en: "Trust between team members is important." },
      { korean: "배려", romanization: "baeryeo", english: "Consideration", sentence_kr: "동료에 대한 배려가 필요합니다.", sentence_en: "Consideration for colleagues is needed." },
      { korean: "갈등", romanization: "galdeung", english: "Conflict", sentence_kr: "갈등을 잘 해결하는 것이 중요합니다.", sentence_en: "It is important to resolve conflicts well." },
      { korean: "협조", romanization: "hyeopjo", english: "Cooperation", sentence_kr: "협조해 주셔서 감사합니다.", sentence_en: "Thank you for your cooperation." },
      { korean: "동료", romanization: "dongnyo", english: "Colleague", sentence_kr: "동료들과 좋은 관계를 유지하고 있습니다.", sentence_en: "I maintain good relationships with colleagues." },
    ],
  },
  /* ══════════════════ TOPIK 4급 ══════════════════ */
  {
    level: 4, category: "Professional (전문 용어)",
    words: [
      { korean: "전략", romanization: "jeollyak", english: "Strategy", sentence_kr: "새로운 마케팅 전략을 수립했습니다.", sentence_en: "We established a new marketing strategy." },
      { korean: "효율", romanization: "hyoyul", english: "Efficiency", sentence_kr: "업무 효율을 높이기 위해 프로세스를 개선했습니다.", sentence_en: "I improved processes to increase work efficiency." },
      { korean: "분석", romanization: "bunseok", english: "Analysis", sentence_kr: "데이터를 분석하여 문제의 원인을 파악했습니다.", sentence_en: "I analyzed data to identify the cause of the problem." },
      { korean: "평가", romanization: "pyeongga", english: "Evaluation", sentence_kr: "성과 평가에서 높은 점수를 받았습니다.", sentence_en: "I received a high score in the performance evaluation." },
      { korean: "개선", romanization: "gaeseon", english: "Improvement", sentence_kr: "서비스 품질을 지속적으로 개선하고 있습니다.", sentence_en: "We are continuously improving service quality." },
      { korean: "혁신", romanization: "hyeoksin", english: "Innovation", sentence_kr: "혁신적인 아이디어로 문제를 해결했습니다.", sentence_en: "I solved the problem with an innovative idea." },
      { korean: "성취", romanization: "seongchwi", english: "Achievement", sentence_kr: "큰 성취감을 느꼈습니다.", sentence_en: "I felt a great sense of achievement." },
      { korean: "수행", romanization: "suhaeng", english: "Execution", sentence_kr: "프로젝트를 성공적으로 수행했습니다.", sentence_en: "I successfully executed the project." },
    ],
  },
  {
    level: 4, category: "Management (관리)",
    words: [
      { korean: "예산", romanization: "yesan", english: "Budget", sentence_kr: "프로젝트 예산을 효율적으로 관리했습니다.", sentence_en: "I managed the project budget efficiently." },
      { korean: "일정", romanization: "iljeong", english: "Schedule", sentence_kr: "일정을 조율하여 회의를 잡겠습니다.", sentence_en: "I will coordinate the schedule to set up a meeting." },
      { korean: "절차", romanization: "jeolcha", english: "Procedure", sentence_kr: "정해진 절차에 따라 업무를 처리합니다.", sentence_en: "I handle tasks according to the established procedures." },
      { korean: "기준", romanization: "gijun", english: "Standard / criteria", sentence_kr: "높은 품질 기준을 유지합니다.", sentence_en: "I maintain high quality standards." },
      { korean: "조율", romanization: "joyul", english: "Coordination", sentence_kr: "여러 부서 간의 조율이 필요합니다.", sentence_en: "Coordination between multiple departments is needed." },
      { korean: "위임", romanization: "wiim", english: "Delegation", sentence_kr: "적절한 업무 위임이 효율성을 높입니다.", sentence_en: "Proper task delegation increases efficiency." },
      { korean: "감독", romanization: "gamdok", english: "Supervision", sentence_kr: "프로젝트 진행을 감독합니다.", sentence_en: "I supervise the project progress." },
      { korean: "보완", romanization: "bowan", english: "Supplementation", sentence_kr: "부족한 부분을 보완하겠습니다.", sentence_en: "I will supplement the lacking areas." },
    ],
  },
  {
    level: 4, category: "Problem Solving (문제 해결)",
    words: [
      { korean: "원인", romanization: "wonin", english: "Cause", sentence_kr: "문제의 근본 원인을 파악했습니다.", sentence_en: "I identified the root cause of the problem." },
      { korean: "해결책", romanization: "haegyeolchaek", english: "Solution", sentence_kr: "효과적인 해결책을 제시했습니다.", sentence_en: "I presented an effective solution." },
      { korean: "대안", romanization: "daean", english: "Alternative", sentence_kr: "여러 대안을 검토한 후 결정했습니다.", sentence_en: "I decided after reviewing several alternatives." },
      { korean: "위기", romanization: "wigi", english: "Crisis", sentence_kr: "위기 상황에서 침착하게 대응했습니다.", sentence_en: "I responded calmly in a crisis situation." },
      { korean: "조치", romanization: "jochi", english: "Measure / action", sentence_kr: "즉시 적절한 조치를 취했습니다.", sentence_en: "I took appropriate measures immediately." },
      { korean: "판단", romanization: "pandan", english: "Judgment", sentence_kr: "신속하고 정확한 판단이 중요합니다.", sentence_en: "Quick and accurate judgment is important." },
      { korean: "예방", romanization: "yebang", english: "Prevention", sentence_kr: "재발 방지를 위한 예방 조치를 수립했습니다.", sentence_en: "I established preventive measures to prevent recurrence." },
      { korean: "피드백", romanization: "pideubaek", english: "Feedback", sentence_kr: "고객의 피드백을 반영하여 개선했습니다.", sentence_en: "I improved by reflecting customer feedback." },
    ],
  },
  /* ══════════════════ TOPIK 5급 ══════════════════ */
  {
    level: 5, category: "Leadership (리더십)",
    words: [
      { korean: "주도하다", romanization: "judohada", english: "To lead / take initiative", sentence_kr: "프로젝트를 주도하여 성공적으로 완료했습니다.", sentence_en: "I led the project and completed it successfully." },
      { korean: "통솔력", romanization: "tongsollyeok", english: "Leadership ability", sentence_kr: "강한 통솔력으로 팀을 이끌었습니다.", sentence_en: "I led the team with strong leadership ability." },
      { korean: "의사결정", romanization: "uisagyeoljeong", english: "Decision-making", sentence_kr: "신속한 의사결정이 프로젝트 성공의 핵심이었습니다.", sentence_en: "Quick decision-making was key to the project's success." },
      { korean: "동기부여", romanization: "donggibuyeo", english: "Motivation (giving)", sentence_kr: "팀원들에게 동기부여를 하는 것을 중요하게 생각합니다.", sentence_en: "I value motivating team members." },
      { korean: "역량", romanization: "yeokryang", english: "Competency", sentence_kr: "핵심 역량을 강화하기 위해 노력합니다.", sentence_en: "I strive to strengthen core competencies." },
      { korean: "비전", romanization: "bijeon", english: "Vision", sentence_kr: "명확한 비전을 가지고 팀을 이끕니다.", sentence_en: "I lead the team with a clear vision." },
      { korean: "권한", romanization: "gwonhan", english: "Authority", sentence_kr: "팀원에게 적절한 권한을 부여합니다.", sentence_en: "I grant appropriate authority to team members." },
      { korean: "자율성", romanization: "jayulseong", english: "Autonomy", sentence_kr: "자율성을 존중하면서도 방향을 제시합니다.", sentence_en: "I provide direction while respecting autonomy." },
    ],
  },
  {
    level: 5, category: "Advanced Business (고급 비즈니스)",
    words: [
      { korean: "수익", romanization: "suik", english: "Profit / revenue", sentence_kr: "전년 대비 수익이 20% 증가했습니다.", sentence_en: "Revenue increased by 20% compared to last year." },
      { korean: "투자", romanization: "tuja", english: "Investment", sentence_kr: "신기술에 대한 투자가 필요합니다.", sentence_en: "Investment in new technology is needed." },
      { korean: "시장", romanization: "sijang", english: "Market", sentence_kr: "새로운 시장에 진출할 계획입니다.", sentence_en: "We plan to enter a new market." },
      { korean: "경쟁력", romanization: "gyeongjaengnyeok", english: "Competitiveness", sentence_kr: "경쟁력을 갖추기 위해 끊임없이 혁신합니다.", sentence_en: "We constantly innovate to maintain competitiveness." },
      { korean: "브랜드", romanization: "beuraendeu", english: "Brand", sentence_kr: "브랜드 가치를 높이는 데 기여했습니다.", sentence_en: "I contributed to enhancing brand value." },
      { korean: "매출", romanization: "maechul", english: "Sales revenue", sentence_kr: "매출 목표를 초과 달성했습니다.", sentence_en: "I exceeded the sales target." },
      { korean: "규모", romanization: "gyumo", english: "Scale / size", sentence_kr: "50명 규모의 부서를 관리했습니다.", sentence_en: "I managed a department of 50 people." },
      { korean: "납기", romanization: "napgi", english: "Delivery date", sentence_kr: "납기를 준수하기 위해 일정을 관리합니다.", sentence_en: "I manage the schedule to meet delivery dates." },
    ],
  },
  {
    level: 5, category: "Negotiations (협상)",
    words: [
      { korean: "협상", romanization: "hyeopsang", english: "Negotiation", sentence_kr: "유리한 조건으로 협상을 마무리했습니다.", sentence_en: "I concluded the negotiation on favorable terms." },
      { korean: "타협", romanization: "tahyeop", english: "Compromise", sentence_kr: "양측이 타협점을 찾았습니다.", sentence_en: "Both sides found a point of compromise." },
      { korean: "제시하다", romanization: "jesihada", english: "To present / propose", sentence_kr: "새로운 조건을 제시했습니다.", sentence_en: "I presented new conditions." },
      { korean: "수용하다", romanization: "suyonghada", english: "To accept", sentence_kr: "고객의 요청을 수용했습니다.", sentence_en: "I accepted the customer's request." },
      { korean: "거절하다", romanization: "geojeolhada", english: "To refuse", sentence_kr: "불합리한 조건은 정중하게 거절했습니다.", sentence_en: "I politely refused unreasonable conditions." },
      { korean: "양보", romanization: "yangbo", english: "Concession", sentence_kr: "상호 양보를 통해 합의에 도달했습니다.", sentence_en: "We reached an agreement through mutual concessions." },
      { korean: "합의", romanization: "habui", english: "Agreement", sentence_kr: "최종 합의에 성공적으로 도달했습니다.", sentence_en: "We successfully reached a final agreement." },
      { korean: "조건", romanization: "jogeon", english: "Condition / terms", sentence_kr: "계약 조건을 꼼꼼히 검토했습니다.", sentence_en: "I carefully reviewed the contract terms." },
    ],
  },
  /* ══════════════════ TOPIK 6급 ══════════════════ */
  {
    level: 6, category: "Corporate Strategy (경영 전략)",
    words: [
      { korean: "구조조정", romanization: "gujojojeong", english: "Restructuring", sentence_kr: "효율적인 구조조정을 통해 조직을 개편했습니다.", sentence_en: "We reorganized the structure through efficient restructuring." },
      { korean: "인수합병", romanization: "insuhapbyeong", english: "Mergers & acquisitions", sentence_kr: "인수합병을 통해 시장 점유율을 높였습니다.", sentence_en: "We increased market share through mergers and acquisitions." },
      { korean: "지속가능성", romanization: "jisokganeungseong", english: "Sustainability", sentence_kr: "지속가능한 성장을 위한 전략을 수립했습니다.", sentence_en: "We established a strategy for sustainable growth." },
      { korean: "거버넌스", romanization: "geobeoneonseu", english: "Governance", sentence_kr: "투명한 거버넌스 체계를 구축했습니다.", sentence_en: "We built a transparent governance system." },
      { korean: "이해관계자", romanization: "ihaegwangyeja", english: "Stakeholder", sentence_kr: "이해관계자의 요구를 균형 있게 반영합니다.", sentence_en: "I reflect stakeholder needs in a balanced way." },
      { korean: "시너지", romanization: "sineoji", english: "Synergy", sentence_kr: "부서 간 시너지를 극대화합니다.", sentence_en: "I maximize synergy between departments." },
      { korean: "패러다임", romanization: "paereodaim", english: "Paradigm", sentence_kr: "새로운 패러다임에 적응해야 합니다.", sentence_en: "We must adapt to the new paradigm." },
      { korean: "벤치마킹", romanization: "benchimaking", english: "Benchmarking", sentence_kr: "글로벌 기업을 벤치마킹하여 프로세스를 개선했습니다.", sentence_en: "I improved processes by benchmarking global companies." },
    ],
  },
  {
    level: 6, category: "Critical Thinking (비판적 사고)",
    words: [
      { korean: "논리적", romanization: "nollijeok", english: "Logical", sentence_kr: "논리적인 근거를 바탕으로 주장합니다.", sentence_en: "I argue based on logical grounds." },
      { korean: "객관적", romanization: "gaekgwanjeok", english: "Objective", sentence_kr: "객관적인 데이터로 의사결정을 합니다.", sentence_en: "I make decisions based on objective data." },
      { korean: "타당성", romanization: "tadangseong", english: "Validity", sentence_kr: "제안의 타당성을 검증했습니다.", sentence_en: "I verified the validity of the proposal." },
      { korean: "모순", romanization: "mosun", english: "Contradiction", sentence_kr: "보고서에서 모순되는 부분을 발견했습니다.", sentence_en: "I found contradictory parts in the report." },
      { korean: "근거", romanization: "geungeo", english: "Basis / evidence", sentence_kr: "충분한 근거를 가지고 결정을 내렸습니다.", sentence_en: "I made the decision with sufficient evidence." },
      { korean: "통찰력", romanization: "tongchallyeok", english: "Insight", sentence_kr: "깊은 통찰력으로 시장 변화를 예측했습니다.", sentence_en: "I predicted market changes with deep insight." },
      { korean: "관점", romanization: "gwanjeom", english: "Perspective", sentence_kr: "다양한 관점에서 문제를 바라봅니다.", sentence_en: "I look at problems from various perspectives." },
      { korean: "함의", romanization: "hamui", english: "Implication", sentence_kr: "이 결과의 함의를 분석했습니다.", sentence_en: "I analyzed the implications of these results." },
    ],
  },
  {
    level: 6, category: "Formal Expressions (격식 표현)",
    words: [
      { korean: "견해", romanization: "gyeonhae", english: "View / opinion (formal)", sentence_kr: "이 문제에 대한 견해를 말씀해 주십시오.", sentence_en: "Please share your view on this matter." },
      { korean: "수립하다", romanization: "suriphada", english: "To establish (formal)", sentence_kr: "장기적인 계획을 수립했습니다.", sentence_en: "I established a long-term plan." },
      { korean: "도모하다", romanization: "domohada", english: "To pursue / promote", sentence_kr: "상호 발전을 도모하고자 합니다.", sentence_en: "I wish to pursue mutual development." },
      { korean: "요망하다", romanization: "yomanghada", english: "To desire / request", sentence_kr: "적극적인 협조를 요망합니다.", sentence_en: "Active cooperation is requested." },
      { korean: "취지", romanization: "chwiji", english: "Purpose / intent", sentence_kr: "이 정책의 취지를 설명하겠습니다.", sentence_en: "I will explain the purpose of this policy." },
      { korean: "일환", romanization: "ilhwan", english: "Part of / as part of", sentence_kr: "혁신의 일환으로 시스템을 개편했습니다.", sentence_en: "We revamped the system as part of the innovation effort." },
      { korean: "여지", romanization: "yeoji", english: "Room / possibility", sentence_kr: "개선의 여지가 충분합니다.", sentence_en: "There is plenty of room for improvement." },
      { korean: "소신", romanization: "sosin", english: "Conviction / belief", sentence_kr: "소신을 가지고 의견을 말합니다.", sentence_en: "I speak my opinion with conviction." },
    ],
  },
];

/* ─── Play Button Component ─── */

function PlayBtn({ onClick, label, variant = "kr", disabled }: {
  onClick: () => void; label?: string; variant?: "kr" | "en" | "slow"; disabled?: boolean;
}) {
  const colors = {
    kr: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
    en: "text-green-600 hover:text-green-800 hover:bg-green-50",
    slow: "text-orange-600 hover:text-orange-800 hover:bg-orange-50",
  };
  return (
    <Button
      size="sm"
      variant="ghost"
      className={cn("h-8 gap-1 text-xs", colors[variant])}
      onClick={onClick}
      disabled={disabled}
    >
      <Volume2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

/* ─── Main Component ─── */

/* ─── Shuffle helper ─── */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RehamTrainingPanel() {
  const { speak, speakKorean, speakEnglish, isSpeaking, isPaused, togglePause, cancel } = useSpeech();
  const [activeSubTab, setActiveSubTab] = useState("introduction");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  /* Interview Field state */
  const [selectedField, setSelectedField] = useState<InterviewField>(() => {
    try {
      const saved = localStorage.getItem("reham-training-field");
      if (saved && ["all", "ai", "operations", "customer-care", "translator"].includes(saved)) {
        return saved as InterviewField;
      }
    } catch {}
    return "all";
  });

  const activeFieldConfig = FIELD_CONFIGS.find((f) => f.key === selectedField)!;

  const filteredConversationData = useMemo(() => {
    if (selectedField === "all") return CONVERSATION_DATA;
    return activeFieldConfig.questionIds
      .map((id) => CONVERSATION_DATA.find((c) => c.id === id))
      .filter(Boolean) as ConversationExchange[];
  }, [selectedField]);

  const filteredCategories = useMemo(() => {
    if (selectedField === "all") return CATEGORIES;
    const fieldIds = new Set(activeFieldConfig.questionIds);
    return CATEGORIES
      .map((cat) => ({ ...cat, ids: cat.ids.filter((id) => fieldIds.has(id)) }))
      .filter((cat) => cat.ids.length > 0);
  }, [selectedField]);

  // Persist field selection
  useEffect(() => {
    localStorage.setItem("reham-training-field", selectedField);
  }, [selectedField]);

  // Reset navigation state on field change & switch to Practice tab
  useEffect(() => {
    setCurrentIndex(0);
    setCompleted(new Set());
    setRevealedAnswers(new Set());
    setConfidence(new Map());
    setMockPhase("setup");
    setSelectedCategory(null);
    setCatIndex(0);
    if (selectedField !== "all") {
      setActiveSubTab("practice");
    }
  }, [selectedField]);

  /* Quiz Mode state */
  const [quizShuffle, setQuizShuffle] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [confidence, setConfidence] = useState<Map<number, 1 | 2 | 3>>(new Map());
  const quizOrder = useMemo(
    () => (quizShuffle ? shuffleArray(filteredConversationData) : filteredConversationData),
    [quizShuffle, filteredConversationData],
  );

  /* Mock Interview state */
  const [mockPhase, setMockPhase] = useState<"setup" | "question" | "thinking" | "answer" | "done">("setup");
  const [mockCount, setMockCount] = useState(5);
  const [mockQuestions, setMockQuestions] = useState<ConversationExchange[]>([]);
  const [mockCurrent, setMockCurrent] = useState(0);
  const [thinkingTime, setThinkingTime] = useState(30);
  const [mockStartTime, setMockStartTime] = useState(0);
  const [mockEndTime, setMockEndTime] = useState(0);

  /* Category Practice state */
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [catIndex, setCatIndex] = useState(0);

  /* Vocabulary state */
  const [learnedVocab, setLearnedVocab] = useState<Set<string>>(new Set());

  /* Starred & Collections state */
  interface StarredCollection {
    id: string;
    name: string;
    questionIds: number[];
    introIds: number[];
  }
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const [collections, setCollections] = useState<StarredCollection[]>([]);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const initialLoadDone = useRef(false);

  // Debounced save to Supabase
  const saveToSupabase = useCallback((starredArr: number[], cols: StarredCollection[]) => {
    if (!userId) return;
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      supabase.from("training_starred").upsert({
        user_id: userId,
        starred: starredArr,
        collections: cols as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      });
    }, 500);
  }, [userId]);

  // Load starred items from Supabase (if auth'd) or localStorage
  useEffect(() => {
    const defaultCol: StarredCollection = { id: "default", name: "My Favorites", questionIds: [], introIds: [] };

    function applyLocal() {
      try {
        const savedStarred = localStorage.getItem("reham-training-starred");
        const savedCollections = localStorage.getItem("reham-training-collections");
        if (savedStarred) setStarred(new Set(JSON.parse(savedStarred)));
        if (savedCollections) {
          const parsed = JSON.parse(savedCollections);
          setCollections(parsed);
          if (parsed.length > 0) setSelectedCollectionId(parsed[0].id);
        } else {
          setCollections([defaultCol]);
          setSelectedCollectionId("default");
        }
        return { starred: savedStarred, collections: savedCollections };
      } catch {
        setCollections([defaultCol]);
        setSelectedCollectionId("default");
        return { starred: null, collections: null };
      }
    }

    async function loadStarred() {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);

      if (uid) {
        const { data } = await supabase
          .from("training_starred")
          .select("starred, collections")
          .eq("user_id", uid)
          .maybeSingle();

        if (data) {
          const starredArr = (data.starred ?? []) as number[];
          const cols = (data.collections ?? [defaultCol]) as unknown as StarredCollection[];
          setStarred(new Set(starredArr));
          setCollections(cols);
          setSelectedCollectionId(cols[0]?.id ?? null);
          localStorage.setItem("reham-training-starred", JSON.stringify(starredArr));
          localStorage.setItem("reham-training-collections", JSON.stringify(cols));
          initialLoadDone.current = true;
          return;
        }

        // No remote row — load localStorage and migrate up
        const local = applyLocal();
        initialLoadDone.current = true;
        if (local.starred || local.collections) {
          const starredArr = local.starred ? JSON.parse(local.starred) : [];
          const colsArr = local.collections ? JSON.parse(local.collections) : [defaultCol];
          await supabase.from("training_starred").upsert({
            user_id: uid,
            starred: starredArr,
            collections: colsArr as unknown as Record<string, unknown>,
            updated_at: new Date().toISOString(),
          });
        }
        return;
      }

      // Not auth'd — localStorage only
      applyLocal();
      initialLoadDone.current = true;
    }
    loadStarred();
  }, []);

  // Save starred items to localStorage + Supabase whenever they change
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const arr = [...starred];
    localStorage.setItem("reham-training-starred", JSON.stringify(arr));
    saveToSupabase(arr, collections);
  }, [starred]);

  // Save collections to localStorage + Supabase whenever they change
  useEffect(() => {
    if (!initialLoadDone.current) return;
    localStorage.setItem("reham-training-collections", JSON.stringify(collections));
    saveToSupabase([...starred], collections);
  }, [collections]);

  // Helper functions for starred items
  const toggleStar = (id: number, isIntroLine = false) => {
    const wasStarred = starred.has(id);
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Sync with selected collection
    const colId = selectedCollectionId;
    if (!colId) return;
    setCollections((prev) =>
      prev.map((col) => {
        if (col.id !== colId) return col;
        const next = { ...col };
        if (isIntroLine) {
          if (wasStarred) next.introIds = next.introIds.filter((i) => i !== id);
          else if (!next.introIds.includes(id)) next.introIds = [...next.introIds, id];
        } else {
          if (wasStarred) next.questionIds = next.questionIds.filter((i) => i !== id);
          else if (!next.questionIds.includes(id)) next.questionIds = [...next.questionIds, id];
        }
        return next;
      })
    );
  };

  const toggleStarInCollection = (id: number, isIntroLine: boolean) => {
    const collectionId = selectedCollectionId;
    if (!collectionId) return;

    setCollections((prev) =>
      prev.map((col) => {
        if (col.id !== collectionId) return col;
        const next = { ...col };
        if (isIntroLine) {
          if (next.introIds.includes(id)) {
            next.introIds = next.introIds.filter((i) => i !== id);
          } else {
            next.introIds.push(id);
          }
        } else {
          if (next.questionIds.includes(id)) {
            next.questionIds = next.questionIds.filter((i) => i !== id);
          } else {
            next.questionIds.push(id);
          }
        }
        return next;
      })
    );
  };

  const addCollection = () => {
    const newId = `col-${Date.now()}`;
    const newCollection: StarredCollection = { id: newId, name: "New Collection", questionIds: [], introIds: [] };
    setCollections((prev) => [...prev, newCollection]);
    setSelectedCollectionId(newId);
  };

  const renameCollection = (id: string, newName: string) => {
    setCollections((prev) =>
      prev.map((col) => (col.id === id ? { ...col, name: newName } : col))
    );
  };

  const deleteCollection = (id: string) => {
    setCollections((prev) => prev.filter((col) => col.id !== id));
    if (selectedCollectionId === id) {
      const remaining = collections.filter((col) => col.id !== id);
      if (remaining.length > 0) {
        setSelectedCollectionId(remaining[0].id);
      }
    }
  };

  /* Flash Card state */
  const [fcLevel, setFcLevel] = useState<TopikLevel | 0>(0); // 0 = all levels
  const [fcCategoryIdx, setFcCategoryIdx] = useState(0);
  const [fcCardIdx, setFcCardIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcShuffle, setFcShuffle] = useState(false);
  const [fcMastered, setFcMastered] = useState<Set<string>>(new Set());
  const [fcSeen, setFcSeen] = useState<Set<string>>(new Set());
  const fcFiltered = useMemo(
    () => fcLevel === 0 ? FLASHCARD_DATA : FLASHCARD_DATA.filter((c) => c.level === fcLevel),
    [fcLevel],
  );
  const fcCategory = fcFiltered[fcCategoryIdx] || fcFiltered[0];
  const fcWords = useMemo(
    () => fcCategory ? (fcShuffle ? shuffleArray(fcCategory.words) : fcCategory.words) : [],
    [fcCategory, fcShuffle],
  );
  const fcCurrent = fcWords[fcCardIdx] || fcWords[0];

  // Mark current card as seen whenever it changes
  useEffect(() => {
    if (fcCurrent) {
      setFcSeen((prev) => {
        if (prev.has(fcCurrent.korean)) return prev;
        const next = new Set(prev);
        next.add(fcCurrent.korean);
        return next;
      });
    }
  }, [fcCurrent]);

  // Find next unmastered card index
  const fcNextUnlearned = useMemo(() => {
    for (let i = fcCardIdx + 1; i < fcWords.length; i++) {
      if (!fcMastered.has(fcWords[i].korean)) return i;
    }
    for (let i = 0; i < fcCardIdx; i++) {
      if (!fcMastered.has(fcWords[i].korean)) return i;
    }
    return -1; // all mastered
  }, [fcCardIdx, fcWords, fcMastered]);

  // Stats for current category
  const fcStats = useMemo(() => {
    const total = fcWords.length;
    const mastered = fcWords.filter((w) => fcMastered.has(w.korean)).length;
    const seen = fcWords.filter((w) => fcSeen.has(w.korean) && !fcMastered.has(w.korean)).length;
    const unseen = total - mastered - seen;
    return { total, mastered, seen, unseen };
  }, [fcWords, fcMastered, fcSeen]);

  /* Mock Interview timer */
  useEffect(() => {
    if (mockPhase !== "thinking") return;
    if (thinkingTime <= 0) {
      setMockPhase("answer");
      return;
    }
    const t = setTimeout(() => setThinkingTime((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [mockPhase, thinkingTime]);

  const startMock = useCallback(() => {
    const shuffled = shuffleArray(filteredConversationData);
    const count = mockCount === 0 ? filteredConversationData.length : mockCount;
    setMockQuestions(shuffled.slice(0, count));
    setMockCurrent(0);
    setMockStartTime(Date.now());
    setThinkingTime(30);
    setMockPhase("question");
  }, [mockCount]);

  const mockNext = useCallback(() => {
    if (mockCurrent + 1 >= mockQuestions.length) {
      setMockEndTime(Date.now());
      setMockPhase("done");
    } else {
      setMockCurrent((p) => p + 1);
      setThinkingTime(30);
      setMockPhase("question");
    }
  }, [mockCurrent, mockQuestions.length]);

  const current = filteredConversationData[currentIndex];
  const progress = ((currentIndex + 1) / filteredConversationData.length) * 100;

  const markComplete = () => {
    setCompleted((prev) => new Set(prev).add(current.id));
  };

  const goTo = (i: number) => {
    cancel();
    setCurrentIndex(i);
  };

  const jumpToPractice = (i: number) => {
    setCurrentIndex(i);
    setActiveSubTab("practice");
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Interview Training — Reham (리함)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Practice your Korean interview responses with text-to-speech. Listen, repeat, and master each answer.
        </p>
      </CardHeader>
      <CardContent>
        {/* ── Interview Field Selector ── */}
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Interview Field</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {FIELD_CONFIGS.map((field) => (
              <button
                key={field.key}
                onClick={() => setSelectedField(field.key)}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                  selectedField === field.key
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-lg">{field.icon}</span>
                <span className="text-xs font-semibold">{field.label}</span>
                <span className="text-[10px] text-muted-foreground">{field.labelKr}</span>
              </button>
            ))}
          </div>
          {selectedField !== "all" && (
            <p className="text-xs text-muted-foreground">
              {activeFieldConfig.description} — {filteredConversationData.length} questions
            </p>
          )}
        </div>

        {/* ── Speaking Controls (visible when TTS is active) ── */}
        {isSpeaking && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 animate-in fade-in">
            <Volume2 className="h-4 w-4 text-blue-600 animate-pulse shrink-0" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 flex-1">
              {isPaused ? "Paused" : "Speaking..."}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
              onClick={togglePause}
            >
              {isPaused ? <><Play className="h-3 w-3" /> Resume</> : <><Pause className="h-3 w-3" /> Pause</>}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
              onClick={cancel}
            >
              <Square className="h-3 w-3" /> Stop
            </Button>
          </div>
        )}

        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList className="mb-4 grid h-auto w-full grid-cols-3 gap-1 md:inline-flex md:h-10 md:w-auto md:gap-0">
            <TabsTrigger value="introduction" className="gap-1 text-xs py-2 md:py-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Script
            </TabsTrigger>
            <TabsTrigger value="practice" className="gap-1 text-xs py-2 md:py-1.5">
              <Mic className="h-3.5 w-3.5" /> Practice
            </TabsTrigger>
            <TabsTrigger value="recap" className="gap-1 text-xs py-2 md:py-1.5">
              <ListChecks className="h-3.5 w-3.5" /> Recap
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1 text-xs py-2 md:py-1.5">
              <Brain className="h-3.5 w-3.5" /> Quiz
            </TabsTrigger>
            <TabsTrigger value="mock" className="gap-1 text-xs py-2 md:py-1.5">
              <Timer className="h-3.5 w-3.5" /> Mock
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1 text-xs py-2 md:py-1.5">
              <FolderOpen className="h-3.5 w-3.5" /> Categories
            </TabsTrigger>
            <TabsTrigger value="cheatsheet" className="gap-1 text-xs py-2 md:py-1.5">
              <FileText className="h-3.5 w-3.5" /> Cheat Sheet
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="gap-1 text-xs py-2 md:py-1.5">
              <Languages className="h-3.5 w-3.5" /> Vocab
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="gap-1 text-xs py-2 md:py-1.5">
              <Layers className="h-3.5 w-3.5" /> Flash Cards
            </TabsTrigger>
            <TabsTrigger value="starred" className="gap-1 text-xs">
              <Star className="h-3.5 w-3.5" /> Starred
            </TabsTrigger>
          </TabsList>

          {/* ── Introduction Script Tab ── */}
          <TabsContent value="introduction">
            <ScrollArea className="h-[600px] pr-3">
              <div className="space-y-3">
                {SELF_INTRO_LINES.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-1 shrink-0 text-[10px] font-medium",
                        SECTION_COLORS[line.section] ?? "",
                      )}
                    >
                      {line.section}
                    </Badge>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium leading-relaxed">{line.korean}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{line.english}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleStar(line.id, true)}
                      >
                        <Star
                          className={cn("h-4 w-4", starred.has(line.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                        />
                      </Button>
                      <PlayBtn onClick={() => speakKorean(line.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speakEnglish(line.english)} label="EN" variant="en" disabled={isSpeaking} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Practice Mode Tab ── */}
          <TabsContent value="practice">
            <div className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Question {currentIndex + 1} of {filteredConversationData.length}</span>
                  <span>{completed.size} / {filteredConversationData.length} practiced</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Exchange Card */}
              <Card className="rounded-xl border-2">
                <CardContent className="p-5 space-y-5">
                  {/* Question Number + Topic with Star */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{currentIndex + 1}</span>
                    <Badge variant="outline" className="text-xs">{current.topic}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleStar(current.id)}
                    >
                      <Star
                        className={cn("h-4 w-4", starred.has(current.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                      />
                    </Button>
                  </div>

                  {/* Interviewer */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Interviewer</span>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                      <p className="text-sm font-medium">{current.interviewer.korean}</p>
                      <p className="text-xs text-muted-foreground">{current.interviewer.english}</p>
                    </div>
                    <div className="flex gap-1">
                      <PlayBtn onClick={() => speakKorean(current.interviewer.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speakEnglish(current.interviewer.english)} label="EN" variant="en" disabled={isSpeaking} />
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  {/* Reham's Answer */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-green-600">Reham (리함)</span>
                      {completed.has(current.id) && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 space-y-1">
                      <p className="text-sm font-medium leading-relaxed">{current.reham.korean}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{current.reham.english}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <PlayBtn onClick={() => speakKorean(current.reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speakEnglish(current.reham.english)} label="EN" variant="en" disabled={isSpeaking} />
                      <PlayBtn
                        onClick={() => speak(current.reham.korean, { language: "ko-KR", rate: 0.75 })}
                        label="Slow (repeat)"
                        variant="slow"
                        disabled={isSpeaking}
                      />
                    </div>
                  </div>

                  {/* Repeat After Me Section */}
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <RotateCcw className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">Repeat After Me</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Click play to hear the answer slowly, then repeat out loud. Practice until it feels natural.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                      onClick={() => speak(current.reham.korean, { language: "ko-KR", rate: 0.65 })}
                      disabled={isSpeaking}
                    >
                      <Play className="h-3.5 w-3.5" />
                      {isSpeaking ? "Speaking..." : "Play Slowly & Repeat"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>

                <Button
                  size="sm"
                  variant={completed.has(current.id) ? "secondary" : "default"}
                  onClick={markComplete}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completed.has(current.id) ? "Practiced" : "Mark as Practiced"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goTo(currentIndex + 1)}
                  disabled={currentIndex === filteredConversationData.length - 1}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Question List — numbered, scrollable */}
              <div className="mt-4 border rounded-xl p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  All {filteredConversationData.length} Questions — tap to jump
                </p>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {filteredConversationData.map((ex, i) => (
                    <button
                      key={ex.id}
                      onClick={() => goTo(i)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors ${
                        i === currentIndex
                          ? "bg-primary/10 border border-primary/30 font-semibold"
                          : completed.has(ex.id)
                          ? "bg-green-50 dark:bg-green-950/20 hover:bg-green-100"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0 ${
                        i === currentIndex
                          ? "bg-primary text-primary-foreground"
                          : completed.has(ex.id)
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>{i + 1}</span>
                      <span className="truncate flex-1">{ex.interviewer.korean}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{ex.topic}</span>
                      {completed.has(ex.id) && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Recap Tab ── */}
          <TabsContent value="recap">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                All interview questions at a glance. Click play to hear, or jump to practice mode.
              </p>
              {filteredConversationData.map((ex, i) => (
                <div
                  key={ex.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    completed.has(ex.id)
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-card hover:bg-accent/30",
                  )}
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ex.interviewer.korean}</p>
                    <p className="text-xs text-muted-foreground truncate">{ex.interviewer.english}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">{ex.topic}</Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {completed.has(ex.id) && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleStar(ex.id)}
                    >
                      <Star
                        className={cn("h-4 w-4", starred.has(ex.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                      />
                    </Button>
                    <PlayBtn
                      onClick={() => speakKorean(ex.interviewer.korean)}
                      label="KR"
                      variant="kr"
                      disabled={isSpeaking}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs gap-1"
                      onClick={() => jumpToPractice(i)}
                    >
                      <Play className="h-3 w-3" /> Practice
                    </Button>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-sm font-medium">
                  {completed.size === filteredConversationData.length
                    ? "All questions practiced! Great job, Reham! 🎉"
                    : `${completed.size} of ${filteredConversationData.length} questions practiced`}
                </p>
              </div>
            </div>
          </TabsContent>
          {/* ── Quiz Mode Tab ── */}
          <TabsContent value="quiz">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Test your recall — reveal answers and rate your confidence.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={quizShuffle ? "default" : "outline"}
                    className="gap-1 text-xs h-8"
                    onClick={() => {
                      setQuizShuffle(!quizShuffle);
                      setRevealedAnswers(new Set());
                      setConfidence(new Map());
                    }}
                  >
                    <Shuffle className="h-3.5 w-3.5" /> {quizShuffle ? "Shuffled" : "Sequential"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs h-8"
                    onClick={() => {
                      setRevealedAnswers(new Set());
                      setConfidence(new Map());
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                </div>
              </div>

              {/* Score Summary */}
              {confidence.size > 0 && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs font-medium">{[...confidence.values()].filter((v) => v === 3).length} Confident</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-xs font-medium">{[...confidence.values()].filter((v) => v === 2).length} Getting there</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs font-medium">{[...confidence.values()].filter((v) => v === 1).length} Need practice</span>
                  </div>
                </div>
              )}

              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-3">
                  {quizOrder.map((ex) => (
                    <Card key={ex.id} className="rounded-xl">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-[10px]">{ex.topic}</Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleStar(ex.id)}
                              >
                                <Star
                                  className={cn("h-3.5 w-3.5", starred.has(ex.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                                />
                              </Button>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                              <p className="text-sm font-medium">{ex.interviewer.korean}</p>
                              <p className="text-xs text-muted-foreground">{ex.interviewer.english}</p>
                            </div>
                            <div className="flex gap-1 mt-1">
                              <PlayBtn onClick={() => speakKorean(ex.interviewer.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                            </div>
                          </div>
                        </div>

                        {revealedAnswers.has(ex.id) ? (
                          <>
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 space-y-1">
                              <p className="text-sm font-medium leading-relaxed">{ex.reham.korean}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{ex.reham.english}</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <PlayBtn onClick={() => speakKorean(ex.reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                              <PlayBtn onClick={() => speak(ex.reham.korean, { language: "ko-KR", rate: 0.75 })} label="Slow" variant="slow" disabled={isSpeaking} />
                            </div>
                            {/* Confidence rating */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Rate:</span>
                              {([1, 2, 3] as const).map((level) => {
                                const colors = { 1: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100", 2: "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100", 3: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" };
                                const labels = { 1: "Need practice", 2: "Getting there", 3: "Confident" };
                                return (
                                  <Button
                                    key={level}
                                    size="sm"
                                    variant="outline"
                                    className={cn("h-7 text-xs", confidence.get(ex.id) === level ? colors[level] : "")}
                                    onClick={() => setConfidence((prev) => new Map(prev).set(ex.id, level))}
                                  >
                                    {labels[level]}
                                  </Button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 w-full"
                            onClick={() => setRevealedAnswers((prev) => new Set(prev).add(ex.id))}
                          >
                            <Eye className="h-3.5 w-3.5" /> Show Answer
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* ── Mock Interview Tab ── */}
          <TabsContent value="mock">
            <div className="space-y-4">
              {mockPhase === "setup" && (
                <Card className="rounded-xl">
                  <CardContent className="p-6 space-y-4 text-center">
                    <Timer className="h-10 w-10 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Mock Interview Simulation</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Simulate a real interview. You'll see each question, have 30 seconds to think, then review the answer.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm">Questions:</span>
                      {[5, 10, 15, 0].map((n) => (
                        <Button
                          key={n}
                          size="sm"
                          variant={mockCount === n ? "default" : "outline"}
                          onClick={() => setMockCount(n)}
                          className="text-xs"
                        >
                          {n === 0 ? "All" : n}
                        </Button>
                      ))}
                    </div>
                    <Button onClick={startMock} className="gap-2">
                      <Play className="h-4 w-4" /> Start Interview
                    </Button>
                  </CardContent>
                </Card>
              )}

              {mockPhase === "question" && mockQuestions[mockCurrent] && (
                <Card className="rounded-xl border-2 border-blue-200">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Question {mockCurrent + 1} of {mockQuestions.length}</span>
                      <Badge variant="outline">{mockQuestions[mockCurrent].topic}</Badge>
                    </div>
                    <Progress value={((mockCurrent + 1) / mockQuestions.length) * 100} className="h-2" />
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-2">
                      <p className="text-base font-medium">{mockQuestions[mockCurrent].interviewer.korean}</p>
                      <p className="text-sm text-muted-foreground">{mockQuestions[mockCurrent].interviewer.english}</p>
                    </div>
                    <div className="flex gap-1">
                      <PlayBtn onClick={() => speakKorean(mockQuestions[mockCurrent].interviewer.korean)} label="Listen KR" variant="kr" disabled={isSpeaking} />
                    </div>
                    <Button
                      onClick={() => { setThinkingTime(30); setMockPhase("thinking"); }}
                      className="w-full gap-2"
                    >
                      <Clock className="h-4 w-4" /> Start Thinking Timer (30s)
                    </Button>
                  </CardContent>
                </Card>
              )}

              {mockPhase === "thinking" && mockQuestions[mockCurrent] && (
                <Card className="rounded-xl border-2 border-orange-200">
                  <CardContent className="p-5 space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">Think about your answer...</p>
                    <div className="text-5xl font-bold tabular-nums text-orange-600">{thinkingTime}</div>
                    <Progress value={(thinkingTime / 30) * 100} className="h-3" />
                    <p className="text-sm font-medium">{mockQuestions[mockCurrent].interviewer.korean}</p>
                    <Button
                      onClick={() => setMockPhase("answer")}
                      variant="outline"
                      className="gap-2"
                    >
                      I'm Ready — Show Answer
                    </Button>
                  </CardContent>
                </Card>
              )}

              {mockPhase === "answer" && mockQuestions[mockCurrent] && (
                <Card className="rounded-xl border-2 border-green-200">
                  <CardContent className="p-5 space-y-4">
                    <Badge variant="outline" className="text-xs">{mockQuestions[mockCurrent].topic}</Badge>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                      <p className="text-sm font-medium">{mockQuestions[mockCurrent].interviewer.korean}</p>
                      <p className="text-xs text-muted-foreground">{mockQuestions[mockCurrent].interviewer.english}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 space-y-1">
                      <p className="text-sm font-medium leading-relaxed">{mockQuestions[mockCurrent].reham.korean}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{mockQuestions[mockCurrent].reham.english}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <PlayBtn onClick={() => speakKorean(mockQuestions[mockCurrent].reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speak(mockQuestions[mockCurrent].reham.korean, { language: "ko-KR", rate: 0.75 })} label="Slow" variant="slow" disabled={isSpeaking} />
                    </div>
                    <Button onClick={mockNext} className="w-full gap-2">
                      {mockCurrent + 1 >= mockQuestions.length ? "Finish Interview" : "Next Question"} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {mockPhase === "done" && (
                <Card className="rounded-xl">
                  <CardContent className="p-6 space-y-4 text-center">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-green-500" />
                    <h3 className="text-lg font-semibold">Interview Complete!</h3>
                    <div className="flex justify-center gap-6 text-sm">
                      <div>
                        <div className="text-2xl font-bold">{mockQuestions.length}</div>
                        <div className="text-muted-foreground text-xs">Questions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{Math.round((mockEndTime - mockStartTime) / 1000)}s</div>
                        <div className="text-muted-foreground text-xs">Total Time</div>
                      </div>
                    </div>
                    <ScrollArea className="h-[300px] text-left">
                      <div className="space-y-2">
                        {mockQuestions.map((q, i) => (
                          <div key={q.id} className="flex items-center gap-2 p-2 rounded-lg border text-xs">
                            <span className="font-bold w-5 text-center text-muted-foreground">{i + 1}</span>
                            <span className="flex-1 truncate">{q.interviewer.korean}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                const idx = filteredConversationData.findIndex((c) => c.id === q.id);
                                if (idx >= 0) jumpToPractice(idx);
                              }}
                            >
                              <Play className="h-3 w-3" /> Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Button onClick={() => setMockPhase("setup")} variant="outline" className="gap-2">
                      <RotateCcw className="h-4 w-4" /> New Interview
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Category Practice Tab ── */}
          <TabsContent value="categories">
            {selectedCategory === null ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Practice by topic. Click a category to drill into its questions.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredCategories.map((cat) => {
                    const catCompleted = cat.ids.filter((id) => completed.has(id)).length;
                    const pct = Math.round((catCompleted / cat.ids.length) * 100);
                    return (
                      <Card
                        key={cat.name}
                        className="rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => { setSelectedCategory(cat.name); setCatIndex(0); }}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{cat.ids.length} questions</span>
                            <span>{catCompleted}/{cat.ids.length}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (() => {
              const cat = filteredCategories.find((c) => c.name === selectedCategory)!;
              const catExchanges = cat.ids
                .map((id) => CONVERSATION_DATA.find((c) => c.id === id))
                .filter(Boolean) as ConversationExchange[];
              const ex = catExchanges[catIndex];
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="gap-1 h-8" onClick={() => setSelectedCategory(null)}>
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-semibold">{cat.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {catIndex + 1} / {catExchanges.length}
                    </span>
                  </div>
                  <Progress value={((catIndex + 1) / catExchanges.length) * 100} className="h-2" />

                  {ex && (
                    <Card className="rounded-xl border-2">
                      <CardContent className="p-5 space-y-4">
                        <Badge variant="outline" className="text-xs">{ex.topic}</Badge>
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                          <p className="text-sm font-medium">{ex.interviewer.korean}</p>
                          <p className="text-xs text-muted-foreground">{ex.interviewer.english}</p>
                        </div>
                        <div className="flex gap-1">
                          <PlayBtn onClick={() => speakKorean(ex.interviewer.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                          <PlayBtn onClick={() => speakEnglish(ex.interviewer.english)} label="EN" variant="en" disabled={isSpeaking} />
                        </div>
                        <div className="w-full h-px bg-border" />
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 space-y-1">
                          <p className="text-sm font-medium leading-relaxed">{ex.reham.korean}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{ex.reham.english}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <PlayBtn onClick={() => speakKorean(ex.reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                          <PlayBtn onClick={() => speakEnglish(ex.reham.english)} label="EN" variant="en" disabled={isSpeaking} />
                          <PlayBtn onClick={() => speak(ex.reham.korean, { language: "ko-KR", rate: 0.75 })} label="Slow" variant="slow" disabled={isSpeaking} />
                        </div>
                        <Button
                          size="sm"
                          variant={completed.has(ex.id) ? "secondary" : "default"}
                          onClick={() => setCompleted((prev) => new Set(prev).add(ex.id))}
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {completed.has(ex.id) ? "Practiced" : "Mark as Practiced"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="outline" onClick={() => setCatIndex((p) => p - 1)} disabled={catIndex === 0} className="gap-1">
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCatIndex((p) => p + 1)} disabled={catIndex >= catExchanges.length - 1} className="gap-1">
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* ── Cheat Sheet Tab ── */}
          <TabsContent value="cheatsheet">
            <ScrollArea className="h-[600px] pr-3">
              <div className="space-y-6">
                {/* Key Metrics */}
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">📊 Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      {KEY_METRICS.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/30 transition-colors">
                          <Badge variant="secondary" className="text-[10px] shrink-0 w-40 justify-center">{m.label}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{m.korean}</p>
                            <p className="text-xs text-muted-foreground">{m.english}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <PlayBtn onClick={() => speakKorean(m.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Power Phrases */}
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">💬 Power Phrases</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      {POWER_PHRASES.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{p.korean}</p>
                            <p className="text-xs text-muted-foreground italic">{p.romanization}</p>
                            <p className="text-xs text-muted-foreground">{p.english}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <PlayBtn onClick={() => speakKorean(p.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                            <PlayBtn onClick={() => speak(p.korean, { language: "ko-KR", rate: 0.75 })} label="Slow" variant="slow" disabled={isSpeaking} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Company Summaries */}
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">🏢 Company Summaries</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      {COMPANY_SUMMARIES.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                          <Badge variant="outline" className="text-xs shrink-0 w-28 justify-center">{c.name}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{c.korean}</p>
                            <p className="text-xs text-muted-foreground">{c.english}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <PlayBtn onClick={() => speakKorean(c.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Vocabulary Tab ── */}
          <TabsContent value="vocabulary">
            <ScrollArea className="h-[600px] pr-3">
              <div className="space-y-6">
                {VOCAB_GROUPS.map((group) => {
                  const learned = group.words.filter((w) => learnedVocab.has(w.korean)).length;
                  const pct = Math.round((learned / group.words.length) * 100);
                  return (
                    <Card key={group.name} className="rounded-xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{group.name}</CardTitle>
                          <span className="text-xs text-muted-foreground">{learned}/{group.words.length} learned</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {group.words.map((w) => (
                            <div
                              key={w.korean}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                                learnedVocab.has(w.korean)
                                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                  : "hover:bg-accent/30",
                              )}
                            >
                              <button
                                className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                  learnedVocab.has(w.korean)
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-muted-foreground/30 hover:border-green-400",
                                )}
                                onClick={() => {
                                  setLearnedVocab((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(w.korean)) next.delete(w.korean);
                                    else next.add(w.korean);
                                    return next;
                                  });
                                }}
                              >
                                {learnedVocab.has(w.korean) && <CheckCircle2 className="h-3 w-3" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{w.korean}</p>
                                <p className="text-[10px] text-muted-foreground italic">{w.romanization}</p>
                                <p className="text-xs text-muted-foreground">{w.english}</p>
                              </div>
                              <PlayBtn onClick={() => speakKorean(w.korean)} variant="kr" disabled={isSpeaking} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          {/* ── Flash Cards Tab (TOPIK 2급–6급) ── */}
          <TabsContent value="flashcards">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">TOPIK 2–6급</Badge>
                    Flash Cards
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fcMastered.size} / {fcFiltered.reduce((s, c) => s + c.words.length, 0)} words mastered
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={fcShuffle ? "default" : "outline"}
                  className="gap-1 text-xs h-8"
                  onClick={() => { setFcShuffle(!fcShuffle); setFcCardIdx(0); setFcFlipped(false); }}
                >
                  <Shuffle className="h-3.5 w-3.5" /> {fcShuffle ? "Shuffled" : "In Order"}
                </Button>
              </div>

              {/* Level Selector */}
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-muted-foreground font-medium">Level:</span>
                {([0, 2, 3, 4, 5, 6] as const).map((lv) => {
                  const lvColors: Record<number, string> = {
                    0: "", 2: "bg-green-100 text-green-800 border-green-300", 3: "bg-blue-100 text-blue-800 border-blue-300",
                    4: "bg-purple-100 text-purple-800 border-purple-300", 5: "bg-orange-100 text-orange-800 border-orange-300",
                    6: "bg-red-100 text-red-800 border-red-300",
                  };
                  return (
                    <Button
                      key={lv}
                      size="sm"
                      variant={fcLevel === lv ? "default" : "outline"}
                      className={cn("text-xs h-7 px-2.5", fcLevel === lv && lv !== 0 && lvColors[lv])}
                      onClick={() => { setFcLevel(lv as TopikLevel | 0); setFcCategoryIdx(0); setFcCardIdx(0); setFcFlipped(false); }}
                    >
                      {lv === 0 ? "All" : `${lv}급`}
                    </Button>
                  );
                })}
              </div>

              {/* Category Selector */}
              <div className="flex gap-2 flex-wrap">
                {fcFiltered.map((cat, i) => (
                  <Button
                    key={`${cat.level}-${cat.category}`}
                    size="sm"
                    variant={fcCategoryIdx === i ? "default" : "outline"}
                    className="text-xs h-7"
                    onClick={() => { setFcCategoryIdx(i); setFcCardIdx(0); setFcFlipped(false); }}
                  >
                    {fcLevel === 0 && <span className="mr-1 opacity-60">{cat.level}급</span>}
                    {cat.category.split("(")[0].trim()}
                    <Badge variant="secondary" className="ml-1 text-[10px] h-4">
                      {cat.words.filter((w) => fcMastered.has(w.korean)).length}/{cat.words.length}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="text-muted-foreground">Unseen {fcStats.unseen}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-muted-foreground">Seen {fcStats.seen}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Mastered {fcStats.mastered}</span>
                </div>
                <span className="ml-auto font-medium">{Math.round((fcStats.mastered / fcStats.total) * 100)}%</span>
              </div>

              {/* Progress */}
              <Progress value={((fcCardIdx + 1) / fcWords.length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Card {fcCardIdx + 1} of {fcWords.length} — {fcCategory.category}
              </p>

              {/* Flash Card */}
              <div
                className={cn(
                  "relative min-h-[320px] rounded-2xl border-2 cursor-pointer transition-all duration-300",
                  fcFlipped
                    ? "bg-green-50 dark:bg-green-950/30 border-green-300"
                    : "bg-blue-50 dark:bg-blue-950/30 border-blue-300",
                  fcMastered.has(fcCurrent.korean) && "ring-2 ring-green-400",
                )}
                onClick={() => setFcFlipped(!fcFlipped)}
              >
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", fcMastered.has(fcCurrent.korean)
                      ? "bg-green-100 text-green-700 border-green-300"
                      : fcSeen.has(fcCurrent.korean)
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-gray-100 text-gray-600 border-gray-300")}
                  >
                    {fcMastered.has(fcCurrent.korean) ? "✓ Mastered" : fcSeen.has(fcCurrent.korean) ? "Seen" : "New"}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="text-[10px]">
                    {fcFlipped ? "Click to flip back" : "Click to reveal"}
                  </Badge>
                </div>

                {!fcFlipped ? (
                  /* Front: Korean word */
                  <div className="flex flex-col items-center justify-center h-full min-h-[320px] p-6 text-center">
                    <p className="text-4xl font-bold mb-3">{fcCurrent.korean}</p>
                    <p className="text-sm text-muted-foreground italic mb-6">{fcCurrent.romanization}</p>
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <PlayBtn onClick={() => speakKorean(fcCurrent.korean)} label="Listen" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speak(fcCurrent.korean, { language: "ko-KR", rate: 0.7 })} label="Slow" variant="slow" disabled={isSpeaking} />
                    </div>
                  </div>
                ) : (
                  /* Back: English + example sentence */
                  <div className="flex flex-col items-center justify-center h-full min-h-[320px] p-6 text-center space-y-4">
                    <p className="text-2xl font-bold">{fcCurrent.korean}</p>
                    <p className="text-lg text-green-700 dark:text-green-300 font-semibold">{fcCurrent.english}</p>
                    <div className="w-full max-w-md p-4 rounded-xl bg-white/60 dark:bg-black/20 border space-y-2">
                      <p className="text-sm font-medium">{fcCurrent.sentence_kr}</p>
                      <p className="text-xs text-muted-foreground">{fcCurrent.sentence_en}</p>
                    </div>
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <PlayBtn onClick={() => speakKorean(fcCurrent.sentence_kr)} label="Sentence KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speakEnglish(fcCurrent.sentence_en)} label="Sentence EN" variant="en" disabled={isSpeaking} />
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setFcCardIdx(Math.max(0, fcCardIdx - 1)); setFcFlipped(false); }}
                  disabled={fcCardIdx === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>

                <Button
                  size="sm"
                  variant={fcMastered.has(fcCurrent.korean) ? "secondary" : "default"}
                  className="gap-1"
                  onClick={() => {
                    const wasMastered = fcMastered.has(fcCurrent.korean);
                    setFcMastered((prev) => {
                      const next = new Set(prev);
                      if (next.has(fcCurrent.korean)) next.delete(fcCurrent.korean);
                      else next.add(fcCurrent.korean);
                      return next;
                    });
                    // Auto-advance to next unlearned card after marking mastered
                    if (!wasMastered && fcNextUnlearned !== -1) {
                      setTimeout(() => { setFcCardIdx(fcNextUnlearned); setFcFlipped(false); }, 300);
                    }
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {fcMastered.has(fcCurrent.korean) ? "Undo" : "Mastered"}
                </Button>

                {fcNextUnlearned !== -1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => { setFcCardIdx(fcNextUnlearned); setFcFlipped(false); }}
                  >
                    Next Unlearned
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setFcCardIdx(Math.min(fcWords.length - 1, fcCardIdx + 1)); setFcFlipped(false); }}
                  disabled={fcCardIdx === fcWords.length - 1}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Word Grid Overview */}
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">All words in this category:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {fcWords.map((w, i) => {
                    const isMastered = fcMastered.has(w.korean);
                    const isSeen = fcSeen.has(w.korean);
                    return (
                      <button
                        key={w.korean}
                        className={cn(
                          "text-left p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5",
                          fcCardIdx === i && "ring-2 ring-blue-400",
                          isMastered
                            ? "bg-green-50 dark:bg-green-950/20 border-green-300"
                            : isSeen
                              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200"
                              : "border-gray-200 hover:bg-accent/30",
                        )}
                        onClick={() => { setFcCardIdx(i); setFcFlipped(false); }}
                      >
                        <span className={cn(
                          "inline-block w-2 h-2 rounded-full shrink-0",
                          isMastered ? "bg-green-500" : isSeen ? "bg-amber-400" : "bg-gray-300",
                        )} />
                        <span className="font-medium">{w.korean}</span>
                        <span className="text-muted-foreground truncate">{w.english}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Starred Items Tab ── */}
          <TabsContent value="starred">
            <div className="space-y-4">
              {/* Collections Sidebar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Collections</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 h-7 text-xs"
                    onClick={addCollection}
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer",
                        selectedCollectionId === col.id
                          ? "bg-blue-50 border-blue-300 dark:bg-blue-950/20"
                          : "bg-card hover:bg-accent/30",
                      )}
                    >
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => setSelectedCollectionId(col.id)}
                      >
                        {editingCollectionId === col.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={editingCollectionName}
                            onChange={(e) => setEditingCollectionName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                renameCollection(col.id, editingCollectionName);
                                setEditingCollectionId(null);
                              } else if (e.key === "Escape") {
                                setEditingCollectionId(null);
                              }
                            }}
                            onBlur={() => {
                              if (editingCollectionName.trim()) {
                                renameCollection(col.id, editingCollectionName);
                              }
                              setEditingCollectionId(null);
                            }}
                            className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-gray-900"
                          />
                        ) : (
                          <p className="text-sm font-medium truncate">
                            {col.name} <span className="text-xs text-muted-foreground">({col.questionIds.length + col.introIds.length})</span>
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingCollectionId(col.id);
                          setEditingCollectionName(col.name);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        onClick={() => deleteCollection(col.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Starred Items in Selected Collection */}
              {selectedCollectionId && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold">
                    Starred Questions ({(collections.find((c) => c.id === selectedCollectionId)?.questionIds.length || 0) + (collections.find((c) => c.id === selectedCollectionId)?.introIds.length || 0)})
                  </h3>

                  <ScrollArea className="h-[500px] pr-3">
                    <div className="space-y-2">
                      {/* Intro Lines */}
                      {collections
                        .find((c) => c.id === selectedCollectionId)
                        ?.introIds.map((lineId) => {
                          const line = SELF_INTRO_LINES.find((l) => l.id === lineId);
                          return line ? (
                            <div
                              key={`intro-${lineId}`}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                            >
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "mt-1 shrink-0 text-[10px] font-medium",
                                  SECTION_COLORS[line.section] ?? "",
                                )}
                              >
                                {line.section}
                              </Badge>
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-sm font-medium leading-relaxed">{line.korean}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{line.english}</p>
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => toggleStarInCollection(lineId, true)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                                <PlayBtn onClick={() => speakKorean(line.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                                <PlayBtn onClick={() => speakEnglish(line.english)} label="EN" variant="en" disabled={isSpeaking} />
                              </div>
                            </div>
                          ) : null;
                        })}

                      {/* Conversation Questions */}
                      {collections
                        .find((c) => c.id === selectedCollectionId)
                        ?.questionIds.map((qId) => {
                          const ex = CONVERSATION_DATA.find((c) => c.id === qId);
                          return ex ? (
                            <Card key={`q-${qId}`} className="rounded-lg">
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <Badge variant="outline" className="text-[10px] mb-1">{ex.topic}</Badge>
                                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 space-y-1">
                                      <p className="text-xs font-medium">{ex.interviewer.korean}</p>
                                      <p className="text-xs text-muted-foreground">{ex.interviewer.english}</p>
                                    </div>
                                    <div className="p-2 rounded bg-green-50 dark:bg-green-950/30 space-y-1 mt-1">
                                      <p className="text-xs font-medium">{ex.reham.korean}</p>
                                      <p className="text-xs text-muted-foreground">{ex.reham.english}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => toggleStarInCollection(qId, false)}
                                  >
                                    <Trash2 className="h-3 w-3" /> Remove
                                  </Button>
                                  <PlayBtn onClick={() => speakKorean(ex.reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                                  <PlayBtn onClick={() => speakEnglish(ex.reham.english)} label="EN" variant="en" disabled={isSpeaking} />
                                </div>
                              </CardContent>
                            </Card>
                          ) : null;
                        })}

                      {((collections.find((c) => c.id === selectedCollectionId)?.questionIds.length || 0) +
                        (collections.find((c) => c.id === selectedCollectionId)?.introIds.length || 0) ===
                        0) && (
                        <div className="text-center py-8">
                          <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No starred items in this collection yet. Star items from the tabs above to add them here.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

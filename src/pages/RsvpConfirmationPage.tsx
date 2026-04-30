import { useSearchParams } from "react-router-dom";

export default function RsvpConfirmationPage() {
  const [params] = useSearchParams();
  const r    = params.get("r");     // "yes" | "no"
  const name = params.get("name") || "there";
  const day  = params.get("day")  || "";
  const time = params.get("time") || "";

  const isYes = r === "yes";

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">

        {/* Logo */}
        <img
          src="/klovers-logo.jpg"
          alt="Klovers"
          className="w-16 h-16 rounded-full border-2 border-[#FFFF00] mx-auto mb-6 object-cover"
        />

        {/* Emoji */}
        <div className="text-6xl mb-5">
          {isYes ? "🎉" : "😢"}
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-[#FFFF00] mb-3">
          {isYes
            ? `See you soon, ${name}!`
            : `We'll miss you, ${name}!`}
        </h1>

        {/* Message */}
        <p className="text-[#cccccc] text-[15px] leading-relaxed mb-6">
          {isYes ? (
            <>
              Your attendance for{" "}
              <span className="text-white font-semibold">
                {day} at {time} Cairo time
              </span>{" "}
              is confirmed.
              <br /><br />
              We'll send you the class link closer to the date. See you there! 🇰🇷
            </>
          ) : (
            <>
              We're sorry you can't make it.
              <br /><br />
              We'll reach out soon to reschedule your trial class at a better time.
            </>
          )}
        </p>

        {/* RSVP confirmation badge */}
        <div className="inline-flex items-center gap-2 bg-[#111111] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm mb-6">
          <span className={isYes ? "text-green-400" : "text-red-400"}>
            {isYes ? "✅" : "❌"}
          </span>
          <span className="text-[#888]">
            Attendance: <span className="text-white font-medium">{isYes ? "Confirmed" : "Declined"}</span>
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-[#2a2a2a] pt-5 mt-2">
          <p className="text-[#666] text-[13px]">— The Klovers Team 🇰🇷</p>
          <a
            href="https://kloversegy.com"
            className="text-[#FFFF00] text-[12px] hover:underline mt-1 inline-block"
          >
            kloversegy.com
          </a>
        </div>
      </div>
    </div>
  );
}

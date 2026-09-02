"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { missions } from "@/lib/game/mockData";

export default function MissionPage() {
    const [missionIndex, setMissionIndex] = useState(0);
  const searchParams = useSearchParams();
const experience = searchParams.get("experience") || "freshman";
  const [answer, setAnswer] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [message, setMessage] = useState("");

 const experienceMissions = missions.filter(
  (mission) => mission.experience === experience
);

const mission =
  experienceMissions[missionIndex] || experienceMissions[0];

  const correctAnswer = mission.answer;

  function checkAnswer() {
    if (answer.trim().toLowerCase() === correctAnswer) {
      setMessage("correct");
    } else {
      setMessage("wrong");
    }
  }

  function useHint() {
    if (hintLevel < 2) {
      setHintLevel(hintLevel + 1);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white md:px-12">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-blue-400">
            CAMPUS CRYPTIC
          </p>
          <h1 className="mt-2 text-2xl font-bold">MISSION CONTROL</h1>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
          <p className="text-xs text-slate-400">TOTAL XP</p>
          <p className="text-xl font-bold text-yellow-400">120 XP</p>
        </div>
      </header>

      {/* Main Game Area */}
      <section className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Mission */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400">
  {experience.toUpperCase()} EXPLORER
</span>

            <span className="text-sm text-slate-500">
  Difficulty: {mission.difficulty}
</span>
          </div>

          <div className="mt-10">
            <p className="text-sm uppercase tracking-widest text-purple-400">
              Encrypted Destination
            </p>

            <h2 className="mt-4 whitespace-pre-line text-3xl font-black leading-tight md:text-5xl">
  {mission.puzzle}
</h2>
          </div>

          {/* Answer */}
          <div className="mt-10">
            <label className="text-sm text-slate-400">
              ENTER YOUR ANSWER
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    checkAnswer();
                  }
                }}
                placeholder="Type your answer..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-blue-400"
              />

              <button
                onClick={checkAnswer}
                className="rounded-xl bg-blue-500 px-6 py-4 font-bold transition hover:bg-blue-400"
              >
                DECRYPT →
              </button>
            </div>

            {message === "wrong" && (
              <p className="mt-4 text-sm text-red-400">
                Not quite. The campus still holds its secret.
              </p>
            )}

            {message === "correct" && (
              <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
                <p className="font-bold text-green-400">
                  🔓 LOCATION UNLOCKED!
                </p>

                <h3 className="mt-3 text-2xl font-bold">
  {mission.location}
</h3>

                <p className="mt-2 text-slate-400">
                  {mission.description}
            
                </p>

                <p className="mt-4 text-sm text-yellow-400">
  +{mission.xp} XP EARNED
</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <aside className="space-y-6">
          {/* Player */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs tracking-widest text-slate-500">
              PLAYER STATUS
            </p>

            <div className="mt-5">
              <div className="flex justify-between text-sm">
                <span>Explorer Level 1</span>
                <span className="text-blue-400">120 / 200 XP</span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              </div>
            </div>
          </div>

          {/* Hints */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs tracking-widest text-slate-500">
              INTELLIGENCE ASSIST
            </p>

            <h3 className="mt-3 text-xl font-bold">Need a clue?</h3>

            {hintLevel === 0 && (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                The AI Game Master is waiting.
              </p>
            )}

            {hintLevel >= 1 && (
              <div className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-blue-300">
                💡 Hint 1: {mission.hint1}
              </div>
            )}

            {hintLevel >= 2 && (
              <div className="mt-3 rounded-xl bg-slate-950 p-4 text-sm text-purple-300">
                🔎 Hint 2: {mission.hint2}
              </div>
            )}

            <button
              onClick={useHint}
              disabled={hintLevel >= 2}
              className="mt-5 w-full rounded-xl border border-blue-500/40 px-4 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/10 disabled:opacity-40"
            >
              {hintLevel >= 2 ? "ALL HINTS USED" : "REQUEST AI HINT ✦"}
            </button>
          </div>

          {/* Progress */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs tracking-widest text-slate-500">
              DISCOVERY PROGRESS
            </p>

            <p className="mt-3 text-3xl font-black">
              1 <span className="text-lg text-slate-500">/ 8</span>
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Campus locations discovered
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
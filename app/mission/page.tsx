"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { missions } from "@/lib/game/mockData";

export default function MissionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const experience = searchParams.get("experience") || "freshman";

  const experienceMissions = missions.filter(
    (item) => item.experience === experience
  );

  const [missionIndex, setMissionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [message, setMessage] = useState("");
  const [xp, setXp] = useState(0);
const [discoveredLocations, setDiscoveredLocations] = useState<string[]>([]);
const [wrongAttempts, setWrongAttempts] = useState(0);
const [recommendedDifficulty, setRecommendedDifficulty] =
  useState("Calculating...");

  const mission = experienceMissions[missionIndex];
  
  useEffect(() => {
  async function getAdaptiveDifficulty() {
    try {
      const response = await fetch(
        `https://campus-cryptic-api.onrender.com/adaptive-difficulty?wrong_attempts=${wrongAttempts}`
      );

      const data = await response.json();

      setRecommendedDifficulty(data.recommended_difficulty);
    } catch {
      setRecommendedDifficulty("Offline");
    }
  }

  getAdaptiveDifficulty();
}, [wrongAttempts]);
  function checkAnswer() {
    if (
      answer.trim().toLowerCase() ===
      mission.answer.trim().toLowerCase()
    ) {
      if (message !== "correct") {
        setXp((currentXp) => currentXp + mission.xp);

        setDiscoveredLocations((currentLocations) => [
          ...currentLocations,
          mission.location,
        ]);
      }

      setMessage("correct");
    } else {
      setWrongAttempts((attempts) => attempts + 1);
      setMessage("wrong");
    }
  }

  function useHint() {
    if (hintLevel < 2) {
      setHintLevel((level) => level + 1);
    }
  }

  function nextMission() {
    if (missionIndex < experienceMissions.length - 1) {
      setMissionIndex((index) => index + 1);
      setAnswer("");
      setHintLevel(0);
      setMessage("");
      setWrongAttempts(0);
    }
  }

  function restartAdventure() {
    setMissionIndex(0);
    setAnswer("");
    setHintLevel(0);
    setMessage("");
    setXp(0);
    setWrongAttempts(0);
    setDiscoveredLocations([]);
  }

  const isAdventureComplete =
    missionIndex === experienceMissions.length - 1 &&
    message === "correct";

  const level = Math.floor(xp / 100) + 1;
  const progressPercentage = Math.min((xp / 200) * 100, 100);

  if (isAdventureComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-2xl text-center">
          <div className="mb-6 text-7xl">🏆</div>

          <p className="text-sm font-bold tracking-[0.3em] text-blue-400">
            CAMPUS CRYPTIC
          </p>

          <h1 className="mt-4 text-5xl font-black">
            ADVENTURE COMPLETE!
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
            You solved every cryptic mission and uncovered hidden parts of
            the campus.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6">
              <p className="text-sm text-slate-400">TOTAL XP</p>
              <p className="mt-2 text-4xl font-black text-yellow-400">
                {xp}
              </p>
            </div>

            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
              <p className="text-sm text-slate-400">LOCATIONS DISCOVERED</p>
              <p className="mt-2 text-4xl font-black text-green-400">
                {discoveredLocations.length}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left">
            <p className="text-xs tracking-widest text-slate-500">
              DISCOVERED LOCATIONS
            </p>

            <div className="mt-4 space-y-3">
              {discoveredLocations.map((location) => (
                <div
                  key={location}
                  className="flex items-center gap-3 rounded-xl bg-slate-950 p-3"
                >
                  <span>🔓</span>
                  <span>{location}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={restartAdventure}
            className="mt-8 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 font-bold transition hover:scale-105"
          >
            PLAY AGAIN →
          </button>

          <button
            onClick={() => router.push("/")}
            className="ml-4 mt-8 rounded-xl border border-slate-700 px-8 py-4 font-bold text-slate-300 transition hover:bg-slate-900"
          >
            HOME
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white md:px-12">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <button onClick={() => router.push("/")} className="text-left">
          <p className="text-xs tracking-[0.3em] text-blue-400">
            CAMPUS CRYPTIC
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            MISSION CONTROL
          </h1>
        </button>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
          <p className="text-xs text-slate-400">TOTAL XP</p>
          <p className="text-xl font-bold text-yellow-400">
            {xp} XP
          </p>
        </div>
      </header>

      <section className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400">
              {experience.toUpperCase()} EXPLORER
            </span>

            <span className="text-sm text-slate-500">
              Difficulty: {mission.difficulty}
            </span>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            MISSION {missionIndex + 1} OF {experienceMissions.length}
          </p>

          <div className="mt-6">
            <p className="text-sm uppercase tracking-widest text-purple-400">
              {mission.title}
            </p>

            <h2 className="mt-4 whitespace-pre-line text-3xl font-black leading-tight md:text-5xl">
              {mission.puzzle}
            </h2>
          </div>

          <div className="mt-10">
            <label className="text-sm text-slate-400">
              ENTER YOUR ANSWER
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={answer}
                disabled={message === "correct"}
                onChange={(event) => setAnswer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    checkAnswer();
                  }
                }}
                placeholder="Type your answer..."
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-blue-400 disabled:opacity-50"
              />

              <button
                onClick={checkAnswer}
                disabled={message === "correct"}
                className="rounded-xl bg-blue-500 px-6 py-4 font-bold transition hover:bg-blue-400 disabled:opacity-50"
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

                <p className="mt-3 text-sm text-blue-300">
                  💡 {mission.trivia}
                </p>

                {missionIndex < experienceMissions.length - 1 && (
                  <button
                    onClick={nextMission}
                    className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-bold transition hover:scale-105"
                  >
                    NEXT MISSION →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs tracking-widest text-slate-500">
              PLAYER STATUS
            </p>

            <div className="mt-5">
              <div className="flex justify-between text-sm">
                <span>Explorer Level {level}</span>
                <span className="text-blue-400">{xp} XP</span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs tracking-widest text-slate-500">
              INTELLIGENCE ASSIST
            </p>

            <h3 className="mt-3 text-xl font-bold">
              Need a clue?
            </h3>

            <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
  <p className="text-xs text-slate-500">
    ADAPTIVE ENGINE
  </p>

  <p className="mt-1 font-bold text-purple-300">
    Recommended Challenge: {recommendedDifficulty}
  </p>
</div>

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
              disabled={hintLevel >= 2 || message === "correct"}
              className="mt-5 w-full rounded-xl border border-blue-500/40 px-4 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/10 disabled:opacity-40"
            >
              {hintLevel >= 2
                ? "ALL HINTS USED"
                : "REQUEST AI HINT ✦"}
            </button>

            {wrongAttempts >= 2 && (
              <p className="mt-4 text-xs text-orange-400">
                Adaptive system detected repeated struggle.
                The next mission may be adjusted.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs tracking-widest text-slate-500">
              DISCOVERY PROGRESS
            </p>

            <p className="mt-3 text-3xl font-black">
              {discoveredLocations.length}{" "}
              <span className="text-lg text-slate-500">
                / {experienceMissions.length}
              </span>
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
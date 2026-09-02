"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Mission = {
  node_id?: number;
  campus_name?: string;
  experience?: string;
  location_name: string;
  description: string;
  puzzle: string;
  correct_answer: string;
  difficulty: string;
  hint_1: string;
  hint_2: string;
  xp_reward: number;
};

const API_URL = "https://campus-cryptic-api.onrender.com";

function MissionContent() {
  const searchParams = useSearchParams();

  const experience =
    searchParams.get("experience") || "freshman";

  const [mission, setMission] =
    useState<Mission | null>(null);

  const [answer, setAnswer] =
    useState("");

  const [hintLevel, setHintLevel] =
    useState(0);

  const [message, setMessage] =
    useState("");

  const [xp, setXp] =
    useState(0);

  const [discoveredLocations, setDiscoveredLocations] =
    useState<string[]>([]);

  const [wrongAttempts, setWrongAttempts] =
    useState(0);

  const [recommendedDifficulty, setRecommendedDifficulty] =
    useState("Connecting...");

  const [reason, setReason] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [missionRefresh, setMissionRefresh] =
    useState(0);

  useEffect(() => {
    async function loadAdaptiveMission() {
      try {
        setLoading(true);

        const genieResponse = await fetch(
          `${API_URL}/genie-mission?campus_name=BMSCE&experience=${encodeURIComponent(
            experience
          )}&wrong_attempts=${wrongAttempts}`
        );

        if (!genieResponse.ok) {
          const errorText =
            await genieResponse.text();

          throw new Error(
            `Failed to fetch Genie mission: ${errorText}`
          );
        }

        const genieData =
          await genieResponse.json();

        if (!genieData.mission) {
          throw new Error(
            "Genie did not return a mission"
          );
        }

        setMission(genieData.mission);

        setRecommendedDifficulty(
          genieData.recommended_difficulty ||
            genieData.mission.difficulty ||
            "Unknown"
        );

        setReason(
          genieData.reason ||
            "Databricks Genie selected this challenge based on your performance."
        );

        setAnswer("");
        setHintLevel(0);
        setMessage("");
      } catch (error) {
        console.error(
          "Mission loading error:",
          error
        );

        setMission(null);

        setRecommendedDifficulty("Offline");

        setReason(
          error instanceof Error
            ? error.message
            : "Unable to connect to the Databricks AI Game Master."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAdaptiveMission();
  }, [
    experience,
    wrongAttempts,
    missionRefresh,
  ]);

  function checkAnswer() {
    if (!mission || loading) return;

    const userAnswer =
      answer.trim().toLowerCase();

    const correctAnswer =
      mission.correct_answer
        .trim()
        .toLowerCase();

    if (userAnswer === correctAnswer) {
      setMessage("correct");

      if (
        !discoveredLocations.includes(
          mission.location_name
        )
      ) {
        setXp(
          (currentXp) =>
            currentXp + mission.xp_reward
        );

        setDiscoveredLocations(
          (locations) => [
            ...locations,
            mission.location_name,
          ]
        );
      }
    } else {
      setMessage("wrong");

      setWrongAttempts(
        (attempts) => attempts + 1
      );
    }
  }

  function useHint() {
    if (hintLevel < 2) {
      setHintLevel(
        (level) => level + 1
      );
    }
  }

  function newAdaptiveMission() {
    setAnswer("");
    setHintLevel(0);
    setMessage("");

    // Start a fresh Hard challenge
    setWrongAttempts(0);

    // Force reload even if attempts are already 0
    setMissionRefresh(
      (current) => current + 1
    );
  }

  if (loading && !mission) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-xl font-bold">
            Loading AI mission...
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Databricks Genie is selecting your challenge
          </p>
        </div>
      </main>
    );
  }

  if (!mission) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-xl font-bold">
            No mission available.
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {reason}
          </p>

          <button
            onClick={() =>
              setMissionRefresh(
                (current) => current + 1
              )
            }
            className="mt-6 rounded-xl bg-blue-500 px-6 py-3 font-bold hover:bg-blue-400"
          >
            TRY AGAIN
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white md:px-12">
      {/* HEADER */}

      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-blue-400">
            CAMPUS CRYPTIC
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            MISSION CONTROL
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            BMS College of Engineering •{" "}
            {experience.toUpperCase()}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
          <p className="text-xs text-slate-400">
            TOTAL XP
          </p>

          <p className="text-xl font-bold text-yellow-400">
            {xp} XP
          </p>
        </div>
      </header>

      {/* MAIN GAME */}

      <section className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[2fr_1fr]">
        {/* MISSION */}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400">
              DATABRICKS GENIE MISSION
            </span>

            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                mission.difficulty === "Hard"
                  ? "bg-red-500/10 text-red-400"
                  : mission.difficulty === "Medium"
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-green-500/10 text-green-400"
              }`}
            >
              Difficulty: {mission.difficulty}
            </span>
          </div>

          <div className="mt-10">
            <p className="text-sm uppercase tracking-widest text-purple-400">
              AI Generated Campus Challenge
            </p>

            <h2 className="mt-4 whitespace-pre-line text-3xl font-black leading-tight md:text-5xl">
              {mission.puzzle}
            </h2>
          </div>

          {loading && (
            <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-300">
              Genie is adapting your next challenge...
            </div>
          )}

          {/* ANSWER */}

          <div className="mt-10">
            <label className="text-sm text-slate-400">
              ENTER YOUR ANSWER
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={answer}
                onChange={(event) =>
                  setAnswer(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    checkAnswer();
                  }
                }}
                placeholder="Type your answer..."
                disabled={
                  loading ||
                  message === "correct"
                }
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none transition focus:border-blue-400 disabled:opacity-50"
              />

              <button
                onClick={checkAnswer}
                disabled={
                  loading ||
                  message === "correct"
                }
                className="rounded-xl bg-blue-500 px-6 py-4 font-bold transition hover:bg-blue-400 disabled:opacity-50"
              >
                DECRYPT →
              </button>
            </div>

            {message === "wrong" &&
              !loading && (
                <p className="mt-4 text-sm text-red-400">
                  Incorrect. Databricks Genie is
                  recalculating your next challenge...
                </p>
              )}

            {message === "correct" && (
              <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
                <p className="font-bold text-green-400">
                  🔓 LOCATION UNLOCKED!
                </p>

                <h3 className="mt-3 text-2xl font-bold">
                  {mission.location_name}
                </h3>

                <p className="mt-2 text-slate-400">
                  {mission.description}
                </p>

                <p className="mt-4 text-sm text-yellow-400">
                  +{mission.xp_reward} XP EARNED
                </p>

                <button
                  onClick={newAdaptiveMission}
                  className="mt-5 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold hover:bg-purple-500"
                >
                  NEW AI MISSION →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SIDE PANEL */}

        <aside className="space-y-6">
          {/* PLAYER STATUS */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs tracking-widest text-slate-500">
              PLAYER STATUS
            </p>

            <div className="mt-5">
              <div className="flex justify-between text-sm">
                <span>Explorer</span>

                <span className="text-blue-400">
                  {xp} / 500 XP
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      (xp / 500) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* AI ENGINE */}

          <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6">
            <p className="text-xs tracking-widest text-purple-300">
              DATABRICKS GENIE AI
            </p>

            <h3 className="mt-3 text-xl font-bold">
              Recommended Challenge
            </h3>

            <p className="mt-3 text-3xl font-black text-purple-300">
              {recommendedDifficulty}
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              {reason}
            </p>

            <div className="mt-4 border-t border-purple-500/20 pt-4">
              <p className="text-xs text-slate-500">
                Wrong attempts: {wrongAttempts}
              </p>

              <p className="mt-1 text-xs text-green-400">
                ● Genie Connected
              </p>
            </div>
          </div>

          {/* HINTS */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs tracking-widest text-slate-500">
              INTELLIGENCE ASSIST
            </p>

            <h3 className="mt-3 text-xl font-bold">
              Need a clue?
            </h3>

            {hintLevel === 0 && (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                The Databricks AI Game Master is ready
                to assist you.
              </p>
            )}

            {hintLevel >= 1 && (
              <div className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-blue-300">
                💡 Hint 1: {mission.hint_1}
              </div>
            )}

            {hintLevel >= 2 && (
              <div className="mt-3 rounded-xl bg-slate-950 p-4 text-sm text-purple-300">
                🔎 Hint 2: {mission.hint_2}
              </div>
            )}

            <button
              onClick={useHint}
              disabled={
                hintLevel >= 2 ||
                loading
              }
              className="mt-5 w-full rounded-xl border border-blue-500/40 px-4 py-3 text-sm font-semibold text-blue-400 transition hover:bg-blue-500/10 disabled:opacity-40"
            >
              {hintLevel >= 2
                ? "ALL HINTS USED"
                : "REQUEST AI HINT ✦"}
            </button>
          </div>

          {/* PROGRESS */}

          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-xs tracking-widest text-slate-500">
              DISCOVERY PROGRESS
            </p>

            <p className="mt-3 text-3xl font-black">
              {discoveredLocations.length}
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

export default function MissionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          Loading mission...
        </main>
      }
    >
      <MissionContent />
    </Suspense>
  );
}
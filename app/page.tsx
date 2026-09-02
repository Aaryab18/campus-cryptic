"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const experiences = [
  {
    id: "freshman",
    icon: "🧭",
    title: "Freshman Explorer",
    description:
      "Discover your campus through simple clues and hidden stories.",
  },
  {
    id: "tech",
    icon: "⚡",
    title: "Tech Explorer",
    description:
      "Solve logic, coding, and technical challenges.",
  },
  {
    id: "campus",
    icon: "🏛️",
    title: "Campus Explorer",
    description:
      "Unlock campus trivia, landmarks, and secret locations.",
  },
];

export default function HomePage() {
  const router = useRouter();

  const [selectedExperience, setSelectedExperience] = useState("");

  function startAdventure() {
    if (!selectedExperience) return;

    router.push(`/mission?experience=${selectedExperience}`);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.15),_transparent_35%)]" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div>
          <h1 className="text-xl font-black tracking-wider">
            CAMPUS <span className="text-blue-400">CRYPTIC</span>
          </h1>

          <p className="text-xs text-slate-500">
            EXPLORE • SOLVE • UNLOCK
          </p>
        </div>

        <div className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs text-blue-300">
          Powered by Databricks Genie ✦
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
          AI-POWERED CAMPUS ADVENTURE
        </div>

        <h2 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
          Your campus is not a map.
          <br />

          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
            It&apos;s a world waiting to be unlocked.
          </span>
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
          Solve cryptic missions, uncover hidden campus locations, earn XP,
          and let AI adapt the adventure to your journey.
        </p>

        {/* Campus */}
        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 backdrop-blur">
          <span className="text-2xl">📍</span>

          <div className="text-left">
            <p className="text-xs uppercase tracking-widest text-slate-500">
              Demo Campus
            </p>

            <p className="font-semibold">
              BMS College of Engineering
            </p>
          </div>

          <span className="ml-4 rounded-lg bg-green-500/10 px-3 py-1 text-xs text-green-400">
            LIVE
          </span>
        </div>

        {/* Experiences */}
        <div className="mt-10 grid w-full max-w-5xl gap-4 md:grid-cols-3">
          {experiences.map((experience) => (
            <button
              key={experience.id}
              onClick={() => setSelectedExperience(experience.id)}
              className={`group rounded-2xl border p-6 text-left transition-all duration-300 ${
                selectedExperience === experience.id
                  ? "border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                  : "border-slate-800 bg-slate-900/60 hover:-translate-y-1 hover:border-slate-600"
              }`}
            >
              <div className="mb-4 text-3xl">
                {experience.icon}
              </div>

              <h3 className="text-lg font-bold">
                {experience.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {experience.description}
              </p>

              {selectedExperience === experience.id && (
                <p className="mt-4 text-xs font-semibold text-blue-400">
                  SELECTED ✓
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Start Button */}
        <button
          onClick={startAdventure}
          disabled={!selectedExperience}
          className="mt-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 font-bold transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selectedExperience
            ? "BEGIN YOUR ADVENTURE →"
            : "SELECT YOUR EXPERIENCE"}
        </button>

        <p className="mt-5 text-xs text-slate-600">
          Your next mission is selected based on your journey.
        </p>
      </section>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Player = {
  rank: number;
  name: string;
  xp: number;
  locations_discovered: number;
};

type Analytics = {
  total_missions: number;
  total_players: number;
  average_xp: number;
  most_discovered_location: string;
  completion_rate: string;
};

export default function DashboardPage() {
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [backendStatus, setBackendStatus] = useState("Connecting...");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [leaderboardResponse, analyticsResponse, statusResponse] =
          await Promise.all([
            fetch("https://campus-cryptic-api.onrender.com/leaderboard"),
            fetch("https://campus-cryptic-api.onrender.com/analytics"),
            fetch("https://campus-cryptic-api.onrender.com/"),
          ]);

        const leaderboardData = await leaderboardResponse.json();
        const analyticsData = await analyticsResponse.json();
        const statusData = await statusResponse.json();

        setLeaderboard(leaderboardData.leaderboard);
        setAnalytics(analyticsData);

        if (statusData.status === "online") {
          setBackendStatus("Connected");
        }
      } catch {
        setBackendStatus("Offline");
      }
    }

    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white md:px-12">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/">
          <div>
            <p className="text-xs tracking-[0.3em] text-blue-400">
              CAMPUS CRYPTIC
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              COMMAND CENTER
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              backendStatus === "Connected"
                ? "bg-green-400"
                : backendStatus === "Offline"
                ? "bg-red-400"
                : "bg-yellow-400"
            }`}
          />
          {backendStatus}
        </div>
      </header>

      <section className="mx-auto mt-12 max-w-6xl">
        {/* Title */}
        <div>
          <p className="text-sm font-semibold tracking-widest text-purple-400">
            LIVE GAME INTELLIGENCE
          </p>

          <h2 className="mt-3 text-4xl font-black md:text-5xl">
            Campus Intelligence Dashboard
          </h2>

          <p className="mt-4 max-w-2xl text-slate-400">
            Real-time player analytics, mission insights, and adaptive
            gameplay intelligence powered by the Campus Cryptic backend.
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="TOTAL PLAYERS"
            value={analytics?.total_players ?? "—"}
            icon="👥"
          />

          <StatCard
            label="MISSIONS"
            value={analytics?.total_missions ?? "—"}
            icon="🗺️"
          />

          <StatCard
            label="AVERAGE XP"
            value={analytics?.average_xp ?? "—"}
            icon="⚡"
          />

          <StatCard
            label="COMPLETION RATE"
            value={analytics?.completion_rate ?? "—"}
            icon="🏆"
          />
        </div>

        {/* Main Grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Leaderboard */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-widest text-slate-500">
                  GLOBAL RANKINGS
                </p>

                <h3 className="mt-2 text-2xl font-bold">
                  🏆 Leaderboard
                </h3>
              </div>

              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                LIVE
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {leaderboard.map((player) => (
                <div
                  key={player.rank}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-yellow-400">
                      #{player.rank}
                    </span>

                    <div>
                      <p className="font-bold">{player.name}</p>

                      <p className="text-xs text-slate-500">
                        {player.locations_discovered} locations discovered
                      </p>
                    </div>
                  </div>

                  <p className="font-bold text-blue-400">
                    {player.xp} XP
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Intelligence Panel */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
              <p className="text-xs tracking-widest text-purple-300">
                AI GAME MASTER
              </p>

              <h3 className="mt-3 text-xl font-bold">
                Adaptive Difficulty Engine
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                The system analyzes player attempts and adjusts mission
                difficulty to maintain engagement and prevent frustration.
              </p>

              <div className="mt-5 rounded-xl bg-slate-950 p-4">
                <p className="text-xs text-slate-500">
                  CURRENT STATUS
                </p>

                <p className="mt-1 font-bold text-green-400">
                  ● AI ENGINE ONLINE
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
              <p className="text-xs tracking-widest text-blue-300">
                MOST DISCOVERED
              </p>

              <h3 className="mt-3 text-xl font-bold">
                📍 {analytics?.most_discovered_location ?? "Loading..."}
              </h3>

              <p className="mt-3 text-sm text-slate-400">
                The most frequently discovered location based on player
                activity data.
              </p>
            </div>

            <Link
              href="/"
              className="block rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-center font-bold transition hover:scale-[1.02]"
            >
              START NEW ADVENTURE →
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-widest text-slate-500">
          {label}
        </p>

        <span className="text-xl">{icon}</span>
      </div>

      <p className="mt-5 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}
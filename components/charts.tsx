"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { CheckIn, PlannedSession, RunLog, StrengthLog } from "@/lib/types";

export function WeightTrend({ checkIns }: { checkIns: CheckIn[] }) {
  const data = checkIns
    .filter((item) => item.bodyweightKg !== null)
    .map((item, index, arr) => {
      const window = arr.slice(Math.max(0, index - 2), index + 1);
      const average = window.reduce((sum, point) => sum + Number(point.bodyweightKg), 0) / window.length;
      return {
        date: item.checkinDate.slice(5),
        weight: item.bodyweightKg,
        average: Number(average.toFixed(2))
      };
    });

  return (
    <ChartShell empty={!data.length}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7dfd2" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#81766a" />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 12 }} stroke="#81766a" />
          <Tooltip />
          <Area type="monotone" dataKey="weight" stroke="#55798b" fill="#55798b33" strokeWidth={2} />
          <Line type="monotone" dataKey="average" stroke="#b85f42" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function StrengthTrend({ logs }: { logs: StrengthLog[] }) {
  const grouped = new Map<string, number>();
  for (const log of logs) {
    grouped.set(log.sessionDate, (grouped.get(log.sessionDate) ?? 0) + (log.reps ?? 0) + Math.round((log.seconds ?? 0) / 10));
  }

  const data = [...grouped.entries()].map(([date, volume]) => ({ date: date.slice(5), volume }));

  return (
    <ChartShell empty={!data.length}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7dfd2" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#81766a" />
          <YAxis tick={{ fontSize: 12 }} stroke="#81766a" />
          <Tooltip />
          <Bar dataKey="volume" fill="#486047" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function RunTrend({ runs }: { runs: RunLog[] }) {
  const data = runs.map((run) => ({
    date: run.runDate.slice(5),
    minutes: run.durationMinutes,
    distance: run.distanceKm ?? 0
  }));

  return (
    <ChartShell empty={!data.length}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7dfd2" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#81766a" />
          <YAxis tick={{ fontSize: 12 }} stroke="#81766a" />
          <Tooltip />
          <Line type="monotone" dataKey="minutes" stroke="#d4a73f" strokeWidth={2} />
          <Line type="monotone" dataKey="distance" stroke="#55798b" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function PuffinessTrend({ checkIns }: { checkIns: CheckIn[] }) {
  const data = checkIns
    .filter((item) => item.facePuffiness !== null)
    .map((item) => ({
      date: item.checkinDate.slice(5),
      puffiness: item.facePuffiness,
      sleep: item.sleepQuality ?? 0
    }));

  return (
    <ChartShell empty={!data.length}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7dfd2" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#81766a" />
          <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} stroke="#81766a" />
          <Tooltip />
          <Line type="monotone" dataKey="puffiness" stroke="#b85f42" strokeWidth={2} />
          <Line type="monotone" dataKey="sleep" stroke="#486047" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ConsistencyHeatmap({ sessions }: { sessions: PlannedSession[] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {sessions.map((session) => (
        <div key={session.id} className="space-y-2">
          <div
            className={`h-12 rounded-md border ${
              session.status === "completed"
                ? "border-moss bg-moss"
                : session.status === "skipped"
                  ? "border-clay bg-clay/20"
                  : "border-ink/10 bg-white"
            }`}
            title={`${session.title}: ${session.status}`}
          />
          <p className="truncate text-center text-[11px] text-ink/55">{session.sessionDate.slice(5)}</p>
        </div>
      ))}
    </div>
  );
}

export function MuscleBalance({ logs }: { logs: StrengthLog[] }) {
  const buckets = [
    { group: "Push", value: count(logs, /push|dip|pike/i) },
    { group: "Pull", value: count(logs, /row|pull|hang|chin/i) },
    { group: "Legs", value: count(logs, /squat|lunge|step|calf|bridge/i) },
    { group: "Core", value: count(logs, /plank|bug|hollow/i) }
  ];

  return (
    <ChartShell empty={!logs.length}>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={buckets}>
          <PolarGrid stroke="#e7dfd2" />
          <PolarAngleAxis dataKey="group" tick={{ fontSize: 12, fill: "#5f574e" }} />
          <Radar dataKey="value" stroke="#486047" fill="#48604755" />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function AdherenceRing({ value }: { value: number }) {
  const data = [
    { name: "done", value },
    { name: "left", value: Math.max(0, 100 - value) }
  ];

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0, top: 45, bottom: 45 }}>
        <XAxis type="number" hide domain={[0, 100]} />
        <YAxis type="category" hide dataKey="name" />
        <Bar dataKey="value" radius={8}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.name === "done" ? "#486047" : "#e7dfd2"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function count(logs: StrengthLog[], pattern: RegExp) {
  return logs.filter((log) => pattern.test(log.exerciseName)).reduce((sum, log) => sum + (log.reps ?? 1), 0);
}

function ChartShell({ children, empty }: { children: React.ReactNode; empty: boolean }) {
  if (empty) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-md border border-dashed border-ink/15 bg-white/45 text-sm text-ink/45">
        Log a few entries to unlock this chart.
      </div>
    );
  }

  return children;
}

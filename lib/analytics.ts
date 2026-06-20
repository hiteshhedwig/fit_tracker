import { differenceInCalendarDays, parseISO } from "date-fns";
import type { CheckIn, PlannedSession, RunLog, StrengthLog } from "@/lib/types";

export function adherence(sessions: PlannedSession[]) {
  const trainable = sessions.filter((session) => session.sessionType !== "rest");
  if (!trainable.length) return 0;
  return Math.round((trainable.filter((session) => session.status === "completed").length / trainable.length) * 100);
}

export function streak(sessions: PlannedSession[]) {
  const completed = sessions
    .filter((session) => session.status === "completed")
    .map((session) => session.sessionDate)
    .sort()
    .reverse();

  let count = 0;
  let last: string | null = null;
  for (const date of completed) {
    if (!last || differenceInCalendarDays(parseISO(last), parseISO(date)) <= 2) {
      count += 1;
      last = date;
    }
  }
  return count;
}

export function weeklyRunMinutes(runs: RunLog[]) {
  return runs.reduce((total, run) => total + run.durationMinutes, 0);
}

export function totalReps(logs: StrengthLog[], matcher: (name: string) => boolean) {
  return logs.filter((log) => matcher(log.exerciseName)).reduce((total, log) => total + (log.reps ?? 0), 0);
}

export function latestWeight(checkIns: CheckIn[]) {
  return [...checkIns].reverse().find((checkIn) => checkIn.bodyweightKg !== null)?.bodyweightKg ?? null;
}

export function generateInsights(sessions: PlannedSession[], strengthLogs: StrengthLog[], runs: RunLog[], checkIns: CheckIn[]) {
  const insights: string[] = [];
  const completion = adherence(sessions);
  const runMinutes = weeklyRunMinutes(runs);
  const pullReps = totalReps(strengthLogs, (name) => /row|pull|hang|chin/i.test(name));
  const pushReps = totalReps(strengthLogs, (name) => /push|dip/i.test(name));
  const lastTwoWeights = checkIns.filter((checkIn) => checkIn.bodyweightKg !== null).slice(-2);
  const latestPuff = [...checkIns].reverse().find((checkIn) => checkIn.facePuffiness !== null);

  if (completion >= 80) insights.push(`You completed ${completion}% of this week's trainable sessions. Keep the same structure.`);
  if (completion > 0 && completion < 60) insights.push("Do not chase intensity yet. Get the planned days back first.");
  if (runMinutes > 55) insights.push("Running volume is getting high for a lean-gain phase. Keep runs easy and protect strength days.");
  if (pushReps > pullReps * 1.4 && pushReps > 40) insights.push("Push work is ahead of pull work. Prioritize rows and hangs this week.");
  if (lastTwoWeights.length === 2) {
    const change = Number(lastTwoWeights[1].bodyweightKg) - Number(lastTwoWeights[0].bodyweightKg);
    if (change < -0.3) insights.push("Bodyweight is trending down. Add a little food and keep running controlled.");
    if (change > 0.7) insights.push("Weight jumped quickly. Check salty late-night food and keep the bulk clean.");
  }
  if (latestPuff?.facePuffiness && latestPuff.facePuffiness >= 4) {
    insights.push("Face puffiness is high. Look at sleep, water, and salty junk before changing training.");
  }

  if (!insights.length) {
    insights.push("Log two or three sessions and check-ins. The app will start separating progress from random exercise.");
  }

  return insights.slice(0, 5);
}

"use client";

import { Activity, CalendarDays, Check, Dumbbell, HeartPulse, Route, TrendingUp } from "lucide-react";
import { useActionState, useState } from "react";
import {
  logRunAction,
  logStrengthAction,
  saveCheckInAction,
  saveProfileAction,
  updateSessionStatusAction,
  type ActionState
} from "@/app/actions";
import { PuffinessTrend, RunTrend, StrengthTrend, WeightTrend } from "@/components/charts";
import { ActionToast, SubmitButton, ToastProvider } from "@/components/feedback";
import { displayDate } from "@/lib/date";
import { findWorkout, warmup } from "@/lib/plan";
import type { DashboardData, PlannedSession, StrengthLog } from "@/lib/types";

const blankState: ActionState = { ok: false, message: "" };

export function MobileApp({
  data,
  today,
  todaySession,
  nextSession,
  completion,
  currentStreak,
  runMinutes,
  bodyweight,
  pushReps,
  pullReps,
  insights
}: {
  data: DashboardData;
  today: string;
  todaySession?: PlannedSession;
  nextSession?: PlannedSession;
  completion: number;
  currentStreak: number;
  runMinutes: number;
  bodyweight: number | null;
  pushReps: number;
  pullReps: number;
  insights: string[];
}) {
  const [tab, setTab] = useState<"today" | "plan" | "log" | "check" | "stats">("today");

  return (
    <ToastProvider>
      <div className="mx-auto max-w-xl px-3 pb-24 pt-3 lg:hidden">
        {tab === "today" ? (
          <TodayScreen
            today={today}
            todaySession={todaySession}
            nextSession={nextSession}
            completion={completion}
            currentStreak={currentStreak}
            runMinutes={runMinutes}
            bodyweight={bodyweight}
            pushReps={pushReps}
            pullReps={pullReps}
            setTab={setTab}
          />
        ) : null}
        {tab === "plan" ? <PlanScreen sessions={data.sessions} today={today} /> : null}
        {tab === "log" ? <LogScreen sessions={data.sessions} logs={data.strengthLogs} today={today} /> : null}
        {tab === "check" ? <CheckScreen today={today} nickname={data.profile.nickname} /> : null}
        {tab === "stats" ? (
          <StatsScreen
            data={data}
            completion={completion}
            runMinutes={runMinutes}
            bodyweight={bodyweight}
            insights={insights}
          />
        ) : null}
      </div>
      <MobileTabBar active={tab} setTab={setTab} />
    </ToastProvider>
  );
}

function TodayScreen({
  today,
  todaySession,
  nextSession,
  completion,
  currentStreak,
  runMinutes,
  bodyweight,
  pushReps,
  pullReps,
  setTab
}: {
  today: string;
  todaySession?: PlannedSession;
  nextSession?: PlannedSession;
  completion: number;
  currentStreak: number;
  runMinutes: number;
  bodyweight: number | null;
  pushReps: number;
  pullReps: number;
  setTab: (tab: "today" | "plan" | "log" | "check" | "stats") => void;
}) {
  const [state, action] = useActionState(updateSessionStatusAction, blankState);
  const workout = findWorkout(todaySession?.workoutKey);
  const primaryTab = todaySession?.sessionType === "strength" || todaySession?.sessionType === "run" ? "log" : "check";

  return (
    <div className="grid gap-3">
      <ActionToast state={state} />
      <section className="card p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-clay">{displayDate(today)}</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h2 className="text-3xl font-black leading-tight text-ink">{todaySession?.title ?? "Recovery / check-in day"}</h2>
          <span className="rounded-md bg-moss/12 px-2 py-1 text-xs font-black uppercase text-moss">{todaySession?.sessionType ?? "rest"}</span>
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-ink/68">{todayCopy(todaySession)}</p>
        <button className="btn btn-primary mt-4 w-full" onClick={() => setTab(primaryTab)}>
          {todaySession?.sessionType === "strength" ? "Start Workout" : todaySession?.sessionType === "run" ? "Start Run" : "Open Check-In"}
        </button>
        {todaySession ? (
          <form action={action} className="mt-3 grid grid-cols-3 gap-2">
            <input type="hidden" name="sessionId" value={todaySession.id} />
            <SubmitButton className="btn btn-secondary text-xs" pendingLabel="Saving" name="status" value="completed">
              Done
            </SubmitButton>
            <SubmitButton className="btn btn-secondary text-xs" pendingLabel="Saving" name="status" value="modified">
              Modify
            </SubmitButton>
            <SubmitButton className="btn btn-secondary text-xs" pendingLabel="Saving" name="status" value="skipped">
              Skip
            </SubmitButton>
          </form>
        ) : nextSession ? (
          <p className="mt-3 rounded-md bg-white/60 p-3 text-sm font-semibold text-ink/65">
            Next: {displayDate(nextSession.sessionDate)} · {nextSession.title}
          </p>
        ) : null}
      </section>

      {workout ? (
        <section className="card p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">{workout.focus}</p>
          <div className="mt-3 grid gap-2">
            {workout.exercises.map((exercise) => (
              <div key={exercise.name} className="rounded-md border border-ink/10 bg-white/55 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-ink">{exercise.name}</p>
                  <p className="max-w-[45%] text-right text-xs font-bold leading-5 text-ink/55">{exercise.prescription}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-2">
        <MobileStat label="Week" value={`${completion}%`} />
        <MobileStat label="Streak" value={String(currentStreak)} />
        <MobileStat label="Run" value={`${runMinutes}m`} />
        <MobileStat label="Weight" value={bodyweight ? `${bodyweight}kg` : "--"} />
        <MobileStat label="Push reps" value={String(pushReps)} />
        <MobileStat label="Pull reps" value={String(pullReps)} />
      </section>
    </div>
  );
}

function PlanScreen({ sessions, today }: { sessions: PlannedSession[]; today: string }) {
  const [state, action] = useActionState(updateSessionStatusAction, blankState);

  return (
    <section className="card p-4">
      <ActionToast state={state} />
      <ScreenTitle eyebrow="This week" title="Plan" />
      <div className="mt-4 grid gap-2">
        {sessions.map((session) => (
          <div key={session.id} className={`rounded-md border p-3 ${session.sessionDate === today ? "border-moss bg-moss/10" : "border-ink/10 bg-white/55"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-ink">{session.title}</p>
                <p className="mt-1 text-xs text-ink/50">{displayDate(session.sessionDate)} · {session.status}</p>
              </div>
              <span className="rounded-md bg-ink/5 px-2 py-1 text-[10px] font-black uppercase text-ink/55">{session.sessionType}</span>
            </div>
            <form action={action} className="mt-3 grid grid-cols-3 gap-2">
              <input type="hidden" name="sessionId" value={session.id} />
              <SubmitButton className="btn btn-secondary min-h-9 text-xs" pendingLabel="Saving" name="status" value="completed">Done</SubmitButton>
              <SubmitButton className="btn btn-secondary min-h-9 text-xs" pendingLabel="Saving" name="status" value="modified">Mod</SubmitButton>
              <SubmitButton className="btn btn-secondary min-h-9 text-xs" pendingLabel="Saving" name="status" value="skipped">Skip</SubmitButton>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}

function LogScreen({ sessions, logs, today }: { sessions: PlannedSession[]; logs: StrengthLog[]; today: string }) {
  const todaySession = sessions.find((session) => session.sessionDate === today);

  return (
    <div className="grid gap-3">
      <ScreenTitle eyebrow={displayDate(today)} title={todaySession?.sessionType === "run" ? "Run Log" : "Workout Log"} />
      {todaySession?.sessionType === "run" ? <RunQuickLog today={today} /> : <WorkoutMode sessions={sessions} logs={logs} today={today} />}
      {todaySession?.sessionType !== "run" ? <RunQuickLog today={today} compact /> : null}
    </div>
  );
}

function WorkoutMode({ sessions, logs, today }: { sessions: PlannedSession[]; logs: StrengthLog[]; today: string }) {
  const [state, action] = useActionState(logStrengthAction, blankState);
  const todayStrength = sessions.find((session) => session.sessionDate === today && session.sessionType === "strength");
  const nextStrength = todayStrength ?? sessions.find((session) => session.sessionType === "strength" && session.status !== "completed") ?? sessions.find((session) => session.workoutKey);
  const workout = findWorkout(nextStrength?.workoutKey) ?? findWorkout("A");
  const [exerciseName, setExerciseName] = useState(workout?.exercises[0]?.name ?? "");
  const selected = workout?.exercises.find((exercise) => exercise.name === exerciseName) ?? workout?.exercises[0];
  const previous = logs.filter((log) => log.exerciseName === selected?.name).slice(-4);

  if (!workout || !selected) return null;

  return (
    <section className="card p-4">
      <ActionToast state={state} />
      <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">{workout.title} · {workout.focus}</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {workout.exercises.map((exercise) => (
          <button
            key={exercise.name}
            className={`min-w-fit rounded-md border px-3 py-2 text-xs font-black ${exercise.name === selected.name ? "border-ink bg-ink text-bone" : "border-ink/10 bg-white/60 text-ink/65"}`}
            onClick={() => setExerciseName(exercise.name)}
          >
            {exercise.name}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-ink/10 bg-white/60 p-3">
        <h3 className="text-xl font-black text-ink">{selected.name}</h3>
        <p className="mt-1 text-sm font-semibold text-ink/60">{selected.prescription}</p>
        <p className="mt-2 text-xs font-bold text-ink/45">{selected.target}</p>
      </div>
      <form action={action} className="mt-3 grid gap-3">
        <input type="hidden" name="sessionDate" value={nextStrength?.sessionDate ?? today} />
        <input type="hidden" name="workoutKey" value={workout.key} />
        <input type="hidden" name="exerciseName" value={selected.name} />
        <select className="field" name="variation">
          {selected.variations.map((variation) => <option key={variation}>{variation}</option>)}
        </select>
        <div className="grid grid-cols-4 gap-2">
          <NumberField label="Reps" name="reps" />
          <NumberField label="Sec" name="seconds" />
          <NumberField label="RPE" name="rpe" step="0.5" />
          <NumberField label="Rest" name="restSeconds" />
        </div>
        <textarea className="field" name="notes" placeholder="Form, tempo, discomfort, or progression" rows={2} />
        <SubmitButton pendingLabel="Saving set...">
          <Check size={18} />
          Save Set
        </SubmitButton>
      </form>
      <div className="mt-4 grid gap-2">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-ink/45">Recent</p>
        {previous.length ? previous.map((log) => (
          <p key={log.id} className="rounded-md bg-white/55 px-3 py-2 text-xs font-semibold text-ink/60">
            {log.sessionDate}: set {log.setNumber}, {log.reps ?? `${log.seconds}s`} · {log.variation}
          </p>
        )) : <p className="text-sm text-ink/45">No previous sets yet.</p>}
      </div>
      <details className="mt-4 rounded-md border border-ink/10 bg-white/45 p-3">
        <summary className="text-sm font-black text-ink">Warm-up</summary>
        <div className="mt-2 grid gap-1 text-xs font-semibold text-ink/55">
          {warmup.map((item) => <span key={item}>{item}</span>)}
        </div>
      </details>
    </section>
  );
}

function RunQuickLog({ today, compact = false }: { today: string; compact?: boolean }) {
  const [state, action] = useActionState(logRunAction, blankState);

  return (
    <section className="card p-4">
      <ActionToast state={state} />
      <h2 className="text-xl font-black text-ink">{compact ? "Optional easy run" : "Run"}</h2>
      <p className="mt-1 text-sm font-semibold text-ink/60">Keep it easy. Strength and recovery stay first.</p>
      <form action={action} className="mt-3 grid gap-3">
        <input className="field" name="runDate" type="date" defaultValue={today} />
        <div className="grid grid-cols-3 gap-2">
          <NumberField label="Min" name="durationMinutes" defaultValue="20" />
          <NumberField label="Km" name="distanceKm" step="0.01" />
          <NumberField label="Effort" name="effort" step="0.5" />
        </div>
        <textarea className="field" name="notes" placeholder="Route or feel" rows={2} />
        <SubmitButton pendingLabel="Saving run...">
          <Route size={18} />
          Save Run
        </SubmitButton>
      </form>
    </section>
  );
}

function CheckScreen({ today, nickname }: { today: string; nickname: string }) {
  const [state, action] = useActionState(saveCheckInAction, blankState);
  const [profileState, profileAction] = useActionState(saveProfileAction, blankState);

  return (
    <div className="grid gap-3">
      <ActionToast state={state} />
      <ActionToast state={profileState} />
      <ScreenTitle eyebrow={displayDate(today)} title="Check-In" />
      <section className="card p-4">
        <form action={action} className="grid gap-3">
          <input className="field" name="checkinDate" type="date" defaultValue={today} />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Weight kg" name="bodyweightKg" step="0.1" />
            <NumberField label="Puffiness" name="facePuffiness" min="1" max="5" />
            <NumberField label="Sleep" name="sleepQuality" min="1" max="5" />
            <NumberField label="Energy" name="energy" min="1" max="5" />
            <NumberField label="Sore" name="soreness" min="1" max="5" />
            <NumberField label="Mood" name="mood" min="1" max="5" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-black text-ink/65">
            <label className="rounded-md border border-ink/10 bg-white/55 p-3"><input name="proteinHit" type="checkbox" /> Protein</label>
            <label className="rounded-md border border-ink/10 bg-white/55 p-3"><input name="waterHit" type="checkbox" /> Water</label>
            <label className="rounded-md border border-ink/10 bg-white/55 p-3"><input name="saltyJunk" type="checkbox" /> Salty</label>
          </div>
          <input className="field" name="appetite" placeholder="Appetite: low, normal, high" />
          <textarea className="field" name="notes" placeholder="Context" rows={2} />
          <SubmitButton pendingLabel="Saving check-in...">
            <HeartPulse size={18} />
            Save Check-In
          </SubmitButton>
        </form>
      </section>
      <section className="card p-4">
        <h2 className="text-lg font-black text-ink">Profile</h2>
        <form action={profileAction} className="mt-3 grid gap-3">
          <input className="field" name="nickname" placeholder="Nickname" defaultValue={nickname} />
          <input className="field" name="bodyweightKg" type="number" step="0.1" placeholder="Current bodyweight kg" />
          <select className="field" name="preferredPlan" defaultValue="standard">
            <option value="standard">Standard: 3 strength + 2 runs</option>
            <option value="merged">Merged: strength then easy run</option>
            <option value="fewer-days">Fewer days: 3-4 sessions</option>
          </select>
          <SubmitButton className="btn btn-secondary w-full" pendingLabel="Saving profile...">Save Profile</SubmitButton>
        </form>
      </section>
    </div>
  );
}

function StatsScreen({
  data,
  completion,
  runMinutes,
  bodyweight,
  insights
}: {
  data: DashboardData;
  completion: number;
  runMinutes: number;
  bodyweight: number | null;
  insights: string[];
}) {
  return (
    <div className="grid gap-3">
      <ScreenTitle eyebrow="Progress" title="Stats" />
      <section className="grid grid-cols-3 gap-2">
        <MobileStat label="Week" value={`${completion}%`} />
        <MobileStat label="Run" value={`${runMinutes}m`} />
        <MobileStat label="Weight" value={bodyweight ? `${bodyweight}kg` : "--"} />
      </section>
      <section className="card p-4">
        <h2 className="text-lg font-black text-ink">Insights</h2>
        <div className="mt-3 grid gap-2">
          {insights.map((insight) => <p key={insight} className="rounded-md bg-white/55 p-3 text-sm font-semibold leading-6 text-ink/68">{insight}</p>)}
        </div>
      </section>
      <ChartCard title="Strength" icon={<Dumbbell size={18} />}><StrengthTrend logs={data.strengthLogs} /></ChartCard>
      <ChartCard title="Weight" icon={<TrendingUp size={18} />}><WeightTrend checkIns={data.checkIns} /></ChartCard>
      <ChartCard title="Running" icon={<Route size={18} />}><RunTrend runs={data.runLogs} /></ChartCard>
      <ChartCard title="Puffiness" icon={<HeartPulse size={18} />}><PuffinessTrend checkIns={data.checkIns} /></ChartCard>
    </div>
  );
}

function MobileTabBar({
  active,
  setTab
}: {
  active: string;
  setTab: (tab: "today" | "plan" | "log" | "check" | "stats") => void;
}) {
  const tabs = [
    ["today", "Today", Activity],
    ["plan", "Plan", CalendarDays],
    ["log", "Log", Dumbbell],
    ["check", "Check", HeartPulse],
    ["stats", "Stats", TrendingUp]
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-bone/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2 shadow-soft backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 text-center text-[10px] font-black">
        {tabs.map(([key, label, Icon]) => (
          <button key={key} className={`rounded-md px-2 py-2 ${active === key ? "bg-ink text-bone" : "text-ink/65"}`} onClick={() => setTab(key)}>
            <Icon className="mx-auto mb-1" size={17} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function ScreenTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="px-1">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-clay">{eyebrow}</p>
      <h2 className="text-3xl font-black text-ink">{title}</h2>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white/60 p-3 text-center">
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-ink/45">{label}</p>
      <p className="mt-1 truncate text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function NumberField({
  label,
  name,
  step,
  defaultValue,
  min,
  max
}: {
  label: string;
  name: string;
  step?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
}) {
  return (
    <label className="text-xs font-black uppercase tracking-[0.08em] text-ink/55">
      {label}
      <input className="field mt-1" name={name} type="number" step={step} defaultValue={defaultValue} min={min} max={max} />
    </label>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-ink">{title}</h2>
        <span className="text-moss">{icon}</span>
      </div>
      {children}
    </section>
  );
}

function todayCopy(session?: PlannedSession) {
  if (!session) return "No hard training today. Check in, recover, and keep protein steady.";
  if (session.sessionType === "strength") return "Strength first. Log controlled sets and chase one small progression.";
  if (session.sessionType === "run") return "Easy run only. This supports health without stealing muscle gain.";
  if (session.sessionType === "walk") return "Walk or rest. Recovery is part of the plan.";
  return "Rest. Eat enough, sleep well, and let the body adapt.";
}

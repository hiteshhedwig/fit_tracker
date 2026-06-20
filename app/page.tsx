import {
  Activity,
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  HeartPulse,
  Lock,
  LogOut,
  Moon,
  RotateCcw,
  Route,
  Shield,
  Sparkles,
  TrendingUp,
  Utensils
} from "lucide-react";
import { format } from "date-fns";
import { loginAction, logRunAction, logStrengthAction, logoutAction, saveCheckInAction, saveProfileAction, updateSessionStatusAction } from "@/app/actions";
import { AdherenceRing, ConsistencyHeatmap, MuscleBalance, PuffinessTrend, RunTrend, StrengthTrend, WeightTrend } from "@/components/charts";
import { adherence, generateInsights, latestWeight, streak, totalReps, weeklyRunMinutes } from "@/lib/analytics";
import { getDashboardData, hasDatabase } from "@/lib/db";
import { hasPasswordConfigured, isAuthed } from "@/lib/auth";
import { findWorkout, motivationMessages, warmup, workouts } from "@/lib/plan";
import type { DashboardData, PlannedSession, StrengthLog } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  if (!hasDatabase()) {
    return <SetupScreen />;
  }

  const authed = await isAuthed();
  const params = await searchParams;
  if (!authed) {
    return <LoginScreen error={params?.error} />;
  }

  const data = await getDashboardData();
  return <Dashboard data={data} />;
}

function SetupScreen() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[80vh] max-w-3xl items-center">
        <div className="card w-full p-6 sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-ink text-bone">
            <Shield size={24} />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-moss">Cloud database required</p>
          <h1 className="mt-3 text-3xl font-black tracking-normal text-ink sm:text-5xl">Shape Log is ready for private cloud sync.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70">
            Add a Neon Postgres connection string before using the app. This avoids local-only storage and keeps your training logs backed by a cloud database.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-ink/75">
            <code className="rounded-md bg-ink p-3 text-bone">DATABASE_URL=postgres://...</code>
            <code className="rounded-md bg-ink p-3 text-bone">APP_PASSWORD=your-private-password</code>
            <code className="rounded-md bg-ink p-3 text-bone">SESSION_SECRET=random-long-secret</code>
          </div>
          <p className="mt-5 text-sm text-ink/55">Vercel can store these in Project Settings &gt; Environment Variables.</p>
        </div>
      </section>
    </main>
  );
}

function LoginScreen({ error }: { error?: string }) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <form action={loginAction} className="card w-full p-6 sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-ink text-bone">
            <Lock size={23} />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-moss">Private app</p>
          <h1 className="mt-3 text-3xl font-black text-ink">Shape Log</h1>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            {hasPasswordConfigured()
              ? "Enter your app password to open your training dashboard."
              : "Development mode uses the temporary password: fit"}
          </p>
          <input className="field mt-6" name="password" type="password" placeholder="Password" autoComplete="current-password" />
          {error === "bad-password" ? <p className="mt-3 text-sm font-semibold text-clay">Incorrect password.</p> : null}
          <button className="btn btn-primary mt-5 w-full" type="submit">
            <Lock size={18} />
            Open dashboard
          </button>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ data }: { data: DashboardData }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const todaySession = data.sessions.find((session) => session.sessionDate === today) ?? data.sessions.find((session) => session.status === "planned");
  const completion = adherence(data.sessions);
  const currentStreak = streak(data.sessions);
  const runMinutes = weeklyRunMinutes(data.runLogs);
  const pushReps = totalReps(data.strengthLogs, (name) => /push|dip/i.test(name));
  const pullReps = totalReps(data.strengthLogs, (name) => /row|pull|hang|chin/i.test(name));
  const bodyweight = latestWeight(data.checkIns);
  const insights = generateInsights(data.sessions, data.strengthLogs, data.runLogs, data.checkIns);
  const message = motivationMessages[new Date().getDay() % motivationMessages.length];

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-bone/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-moss sm:text-xs">Private training cockpit</p>
            <h1 className="text-xl font-black text-ink sm:text-2xl">Shape Log</h1>
          </div>
          <form action={logoutAction}>
            <button className="btn btn-secondary" title="Sign out">
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </header>

      <MobileDashboard
        data={data}
        todaySession={todaySession}
        completion={completion}
        currentStreak={currentStreak}
        runMinutes={runMinutes}
        bodyweight={bodyweight}
        pushReps={pushReps}
        pullReps={pullReps}
        insights={insights}
        message={message}
      />

      <div className="mx-auto hidden max-w-7xl px-4 py-6 sm:px-6 lg:block lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="card overflow-hidden p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-6 md:flex-row">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-clay">{data.profile.goal}</p>
                <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-ink sm:text-6xl">
                  {todaySession ? todaySession.title : "Recovery day"}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68">{message}</p>
              </div>
              <div className="grid min-w-[220px] grid-cols-2 gap-3">
                <Metric label="Adherence" value={`${completion}%`} icon={<Check size={18} />} />
                <Metric label="Streak" value={`${currentStreak}`} icon={<Flame size={18} />} />
                <Metric label="Run min" value={`${runMinutes}`} icon={<Route size={18} />} />
                <Metric label="Weight" value={bodyweight ? `${bodyweight} kg` : "--"} icon={<TrendingUp size={18} />} />
              </div>
            </div>
          </div>
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-ink">Week Score</h2>
              <Activity className="text-moss" size={22} />
            </div>
            <div className="relative">
              <AdherenceRing value={completion} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-ink">{completion}%</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Push reps" value={String(pushReps)} icon={<Dumbbell size={18} />} />
          <Metric label="Pull reps" value={String(pullReps)} icon={<RotateCcw size={18} />} />
          <Metric label="Protein hits" value={String(data.checkIns.filter((item) => item.proteinHit).length)} icon={<Utensils size={18} />} />
          <Metric label="Sleep logs" value={String(data.checkIns.filter((item) => item.sleepQuality).length)} icon={<Moon size={18} />} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Planner sessions={data.sessions} />
          <Insights insights={insights} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <StrengthLogger sessions={data.sessions} logs={data.strengthLogs} />
          <div className="grid gap-5">
            <RunLogger />
            <CheckInForm />
            <ProfileForm nickname={data.profile.nickname} />
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <ChartCard title="Strength Volume" icon={<Dumbbell size={19} />}>
            <StrengthTrend logs={data.strengthLogs} />
          </ChartCard>
          <ChartCard title="Bodyweight Guardrail" icon={<TrendingUp size={19} />}>
            <WeightTrend checkIns={data.checkIns} />
          </ChartCard>
          <ChartCard title="Running Load" icon={<Route size={19} />}>
            <RunTrend runs={data.runLogs} />
          </ChartCard>
          <ChartCard title="Puffiness vs Sleep" icon={<HeartPulse size={19} />}>
            <PuffinessTrend checkIns={data.checkIns} />
          </ChartCard>
          <ChartCard title="Consistency Heatmap" icon={<CalendarDays size={19} />}>
            <ConsistencyHeatmap sessions={data.sessions} />
          </ChartCard>
          <ChartCard title="Muscle Balance" icon={<Sparkles size={19} />}>
            <MuscleBalance logs={data.strengthLogs} />
          </ChartCard>
        </section>
      </div>
    </main>
  );
}

function MobileDashboard({
  data,
  todaySession,
  completion,
  currentStreak,
  runMinutes,
  bodyweight,
  pushReps,
  pullReps,
  insights,
  message
}: {
  data: DashboardData;
  todaySession?: PlannedSession;
  completion: number;
  currentStreak: number;
  runMinutes: number;
  bodyweight: number | null;
  pushReps: number;
  pullReps: number;
  insights: string[];
  message: string;
}) {
  return (
    <div className="mx-auto max-w-xl px-3 pb-24 pt-3 lg:hidden">
      <section id="m-today" className="card scroll-mt-20 overflow-hidden p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-clay">Today</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-ink">
              {todaySession ? todaySession.title : "Recovery day"}
            </h2>
          </div>
          <span className="rounded-md bg-moss/12 px-2 py-1 text-xs font-black text-moss">{completion}%</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-ink/68">{message}</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <MobileStat label="Streak" value={String(currentStreak)} />
          <MobileStat label="Run" value={`${runMinutes}m`} />
          <MobileStat label="Push" value={String(pushReps)} />
          <MobileStat label="Pull" value={String(pullReps)} />
        </div>
        {todaySession ? (
          <form action={updateSessionStatusAction} className="mt-4 grid grid-cols-3 gap-2">
            <input type="hidden" name="sessionId" value={todaySession.id} />
            <button className="btn btn-primary text-xs" name="status" value="completed">
              Done
            </button>
            <button className="btn btn-secondary text-xs" name="status" value="modified">
              Modified
            </button>
            <button className="btn btn-secondary text-xs" name="status" value="skipped">
              Skip
            </button>
          </form>
        ) : null}
      </section>

      <nav className="sticky top-[69px] z-30 -mx-3 mt-3 border-y border-ink/10 bg-paper/90 px-3 py-2 backdrop-blur-xl">
        <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-black text-ink/65">
          <a className="rounded-md bg-white/70 px-2 py-2" href="#m-today">Today</a>
          <a className="rounded-md bg-white/70 px-2 py-2" href="#m-plan">Plan</a>
          <a className="rounded-md bg-white/70 px-2 py-2" href="#m-log">Log</a>
          <a className="rounded-md bg-white/70 px-2 py-2" href="#m-checkin">Check</a>
          <a className="rounded-md bg-white/70 px-2 py-2" href="#m-progress">Stats</a>
        </div>
      </nav>

      <div className="mt-3 grid gap-3">
        <MobilePanel id="m-plan" title="Weekly Plan" icon={<CalendarDays size={18} />} open>
          <MobilePlan sessions={data.sessions} />
        </MobilePanel>

        <MobilePanel id="m-log" title="Log Training" icon={<Dumbbell size={18} />} open>
          <div className="grid gap-3">
            <StrengthLogger sessions={data.sessions} logs={data.strengthLogs} />
            <RunLogger />
          </div>
        </MobilePanel>

        <MobilePanel id="m-checkin" title="Check-In" icon={<HeartPulse size={18} />}>
          <CheckInForm />
        </MobilePanel>

        <MobilePanel id="m-insights" title="Insights" icon={<Sparkles size={18} />}>
          <Insights insights={insights} />
        </MobilePanel>

        <MobilePanel id="m-progress" title="Progress" icon={<TrendingUp size={18} />}>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <MobileStat label="Adherence" value={`${completion}%`} />
              <MobileStat label="Weight" value={bodyweight ? `${bodyweight}kg` : "--"} />
            </div>
            <ChartCard title="Strength" icon={<Dumbbell size={18} />}>
              <StrengthTrend logs={data.strengthLogs} />
            </ChartCard>
            <ChartCard title="Weight" icon={<TrendingUp size={18} />}>
              <WeightTrend checkIns={data.checkIns} />
            </ChartCard>
            <ChartCard title="Running" icon={<Route size={18} />}>
              <RunTrend runs={data.runLogs} />
            </ChartCard>
            <ChartCard title="Puffiness" icon={<HeartPulse size={18} />}>
              <PuffinessTrend checkIns={data.checkIns} />
            </ChartCard>
          </div>
        </MobilePanel>

        <MobilePanel id="m-setup" title="Setup" icon={<Shield size={18} />}>
          <ProfileForm nickname={data.profile.nickname} />
        </MobilePanel>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-bone/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2 shadow-soft backdrop-blur-xl">
        <div className="mx-auto grid max-w-xl grid-cols-5 gap-1 text-center text-[10px] font-black text-ink/65">
          <a className="rounded-md px-2 py-2" href="#m-today"><Activity className="mx-auto mb-1" size={17} />Today</a>
          <a className="rounded-md px-2 py-2" href="#m-plan"><CalendarDays className="mx-auto mb-1" size={17} />Plan</a>
          <a className="rounded-md px-2 py-2" href="#m-log"><Dumbbell className="mx-auto mb-1" size={17} />Log</a>
          <a className="rounded-md px-2 py-2" href="#m-checkin"><HeartPulse className="mx-auto mb-1" size={17} />Check</a>
          <a className="rounded-md px-2 py-2" href="#m-progress"><TrendingUp className="mx-auto mb-1" size={17} />Stats</a>
        </div>
      </nav>
    </div>
  );
}

function MobilePanel({
  id,
  title,
  icon,
  children,
  open = false
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details id={id} className="card scroll-mt-32 overflow-hidden" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span className="flex items-center gap-2 text-base font-black text-ink">
          <span className="text-moss">{icon}</span>
          {title}
        </span>
        <span className="text-xl font-black text-ink/45">+</span>
      </summary>
      <div className="border-t border-ink/10 p-3">{children}</div>
    </details>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white/60 p-2 text-center">
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-ink/45">{label}</p>
      <p className="mt-1 truncate text-base font-black text-ink">{value}</p>
    </div>
  );
}

function MobilePlan({ sessions }: { sessions: PlannedSession[] }) {
  return (
    <div className="grid gap-2">
      {sessions.map((session) => (
        <div key={session.id} className="rounded-md border border-ink/10 bg-white/55 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-ink">{session.title}</p>
              <p className="mt-1 text-xs text-ink/50">{session.sessionDate.slice(5)} · {session.status}</p>
            </div>
            <span className="rounded-md bg-ink/5 px-2 py-1 text-[10px] font-black uppercase text-ink/55">{session.sessionType}</span>
          </div>
          <form action={updateSessionStatusAction} className="mt-3 grid grid-cols-3 gap-2">
            <input type="hidden" name="sessionId" value={session.id} />
            <button className="btn btn-secondary min-h-9 text-xs" name="status" value="completed">Done</button>
            <button className="btn btn-secondary min-h-9 text-xs" name="status" value="modified">Mod</button>
            <button className="btn btn-secondary min-h-9 text-xs" name="status" value="skipped">Skip</button>
          </form>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card p-4 shadow-none">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-ink text-bone">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink/45">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function Planner({ sessions }: { sessions: PlannedSession[] }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss">Weekly plan</p>
          <h2 className="text-xl font-black text-ink">Strength first, running controlled</h2>
        </div>
        <CalendarDays className="text-moss" />
      </div>
      <div className="grid gap-3">
        {sessions.map((session) => (
          <div key={session.id} className="grid gap-3 rounded-md border border-ink/10 bg-white/50 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-sm font-black text-ink">{session.title}</p>
              <p className="text-xs text-ink/55">
                {session.sessionDate} · {session.sessionType} · {session.status}
              </p>
            </div>
            <form action={updateSessionStatusAction} className="flex gap-2 overflow-x-auto">
              <input type="hidden" name="sessionId" value={session.id} />
              {["completed", "skipped", "modified"].map((status) => (
                <button key={status} className="btn btn-secondary min-w-fit text-xs" name="status" value={status}>
                  {status}
                </button>
              ))}
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}

function Insights({ insights }: { insights: string[] }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">Personal insights</p>
          <h2 className="text-xl font-black text-ink">Progress, not random effort</h2>
        </div>
        <Sparkles className="text-clay" />
      </div>
      <div className="grid gap-3">
        {insights.map((insight) => (
          <div key={insight} className="rounded-md border border-ink/10 bg-white/55 p-4 text-sm font-semibold leading-6 text-ink/72">
            {insight}
          </div>
        ))}
      </div>
    </section>
  );
}

function StrengthLogger({ sessions, logs }: { sessions: PlannedSession[]; logs: StrengthLog[] }) {
  const nextStrength = sessions.find((session) => session.sessionType === "strength" && session.status !== "completed") ?? sessions.find((session) => session.workoutKey);
  const workout = findWorkout(nextStrength?.workoutKey) ?? workouts[0];
  const previous = logs.filter((log) => log.workoutKey === workout.key).slice(-6);

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-moss">Workout logger</p>
          <h2 className="text-xl font-black text-ink">{workout.title}: {workout.focus}</h2>
        </div>
        <Dumbbell className="text-moss" />
      </div>

      <div className="mb-4 grid gap-2 rounded-md border border-ink/10 bg-white/45 p-3 text-xs text-ink/60 sm:grid-cols-2">
        {warmup.map((item) => (
          <span key={item}>· {item}</span>
        ))}
      </div>

      <form action={logStrengthAction} className="grid gap-3">
        <input type="hidden" name="workoutKey" value={workout.key} />
        <label className="text-sm font-bold text-ink/70">
          Date
          <input className="field mt-1" name="sessionDate" type="date" defaultValue={nextStrength?.sessionDate ?? format(new Date(), "yyyy-MM-dd")} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold text-ink/70">
            Exercise
            <select className="field mt-1" name="exerciseName">
              {workout.exercises.map((exercise) => (
                <option key={exercise.name}>{exercise.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-ink/70">
            Variation
            <select className="field mt-1" name="variation">
              {workout.exercises.flatMap((exercise) => exercise.variations).map((variation) => (
                <option key={variation}>{variation}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField label="Reps" name="reps" />
          <NumberField label="Seconds" name="seconds" />
          <NumberField label="RPE" name="rpe" step="0.5" />
          <NumberField label="Rest sec" name="restSeconds" />
        </div>
        <textarea className="field" name="notes" placeholder="Form note, pain, tempo, or progression idea" rows={2} />
        <button className="btn btn-primary w-full sm:w-fit">
          <Check size={18} />
          Log set
        </button>
      </form>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-black text-ink">Previous work</h3>
        <div className="grid gap-2">
          {previous.length ? previous.map((log) => (
            <p key={log.id} className="rounded-md bg-white/50 px-3 py-2 text-xs text-ink/65">
              {log.sessionDate}: {log.exerciseName}, set {log.setNumber}, {log.reps ?? `${log.seconds}s`} · {log.variation}
            </p>
          )) : <p className="text-sm text-ink/45">Log your first sets to see progression targets.</p>}
        </div>
      </div>
    </section>
  );
}

function RunLogger() {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-ink">Run log</h2>
        <Route className="text-gold" />
      </div>
      <form action={logRunAction} className="grid gap-3">
        <input className="field" name="runDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Minutes" name="durationMinutes" defaultValue="20" />
          <NumberField label="Km" name="distanceKm" step="0.01" />
          <NumberField label="Effort" name="effort" step="0.5" />
        </div>
        <textarea className="field" name="notes" placeholder="Route, pace, easy/moderate feel" rows={2} />
        <button className="btn btn-primary w-full">
          <Route size={18} />
          Log run
        </button>
      </form>
    </section>
  );
}

function CheckInForm() {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-ink">Daily check-in</h2>
        <HeartPulse className="text-clay" />
      </div>
      <form action={saveCheckInAction} className="grid gap-3">
        <input className="field" name="checkinDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Weight kg" name="bodyweightKg" step="0.1" />
          <NumberField label="Puffiness 1-5" name="facePuffiness" min="1" max="5" />
          <NumberField label="Sleep 1-5" name="sleepQuality" min="1" max="5" />
          <NumberField label="Energy 1-5" name="energy" min="1" max="5" />
          <NumberField label="Soreness 1-5" name="soreness" min="1" max="5" />
          <NumberField label="Mood 1-5" name="mood" min="1" max="5" />
        </div>
        <div className="grid gap-2 text-sm font-semibold text-ink/70 sm:grid-cols-3">
          <label className="flex items-center gap-2"><input name="proteinHit" type="checkbox" /> Protein</label>
          <label className="flex items-center gap-2"><input name="waterHit" type="checkbox" /> Water</label>
          <label className="flex items-center gap-2"><input name="saltyJunk" type="checkbox" /> Salty junk</label>
        </div>
        <input className="field" name="appetite" placeholder="Appetite: low, normal, high" />
        <textarea className="field" name="notes" placeholder="Sleep, stress, posture, face puffiness context" rows={2} />
        <button className="btn btn-primary w-full">
          <HeartPulse size={18} />
          Save check-in
        </button>
      </form>
    </section>
  );
}

function ProfileForm({ nickname }: { nickname: string }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 text-xl font-black text-ink">Setup</h2>
      <form action={saveProfileAction} className="grid gap-3">
        <input className="field" name="nickname" placeholder="Nickname" defaultValue={nickname} />
        <input className="field" name="bodyweightKg" type="number" step="0.1" placeholder="Current bodyweight kg" />
        <select className="field" name="preferredPlan" defaultValue="standard">
          <option value="standard">Standard: 3 strength + 2 runs</option>
          <option value="merged">Merged: strength then easy run</option>
          <option value="fewer-days">Fewer days: 3-4 sessions</option>
        </select>
        <button className="btn btn-secondary w-full">Save profile</button>
      </form>
    </section>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-ink">{title}</h2>
        <span className="text-moss">{icon}</span>
      </div>
      {children}
    </section>
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
    <label className="text-sm font-bold text-ink/70">
      {label}
      <input className="field mt-1" name={name} type="number" step={step} defaultValue={defaultValue} min={min} max={max} />
    </label>
  );
}

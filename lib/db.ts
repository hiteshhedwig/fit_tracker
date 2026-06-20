import { neon } from "@neondatabase/serverless";
import { format } from "date-fns";
import { addDaysToKey, getTodayKey, mondayForDateKey } from "@/lib/date";
import { defaultWeek } from "@/lib/plan";
import type { CheckIn, DashboardData, PlannedSession, RunLog, StrengthLog } from "@/lib/types";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export function hasDatabase() {
  return Boolean(connectionString);
}

function sqlClient() {
  if (!connectionString) {
    throw new Error("DATABASE_URL or POSTGRES_URL is required.");
  }

  return neon(connectionString);
}

export async function ensureSchema() {
  const sql = sqlClient();

  await sql`
    CREATE TABLE IF NOT EXISTS app_profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      nickname TEXT NOT NULL DEFAULT 'You',
      goal TEXT NOT NULL DEFAULT 'Lean muscle gain / recomposition',
      current_bodyweight_kg NUMERIC,
      equipment TEXT[] NOT NULL DEFAULT ARRAY['bench', 'railing', 'pull-up bar', 'backpack'],
      preferred_plan TEXT NOT NULL DEFAULT 'standard',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT one_profile CHECK (id = 1)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS planned_sessions (
      id SERIAL PRIMARY KEY,
      session_date DATE NOT NULL,
      session_type TEXT NOT NULL,
      title TEXT NOT NULL,
      workout_key TEXT,
      status TEXT NOT NULL DEFAULT 'planned',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS planned_sessions_unique_day_type_workout
    ON planned_sessions (session_date, session_type, COALESCE(workout_key, ''))
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS strength_logs (
      id SERIAL PRIMARY KEY,
      session_date DATE NOT NULL,
      workout_key TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      variation TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER,
      seconds INTEGER,
      rpe NUMERIC,
      rest_seconds INTEGER,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS run_logs (
      id SERIAL PRIMARY KEY,
      run_date DATE NOT NULL,
      duration_minutes INTEGER NOT NULL,
      distance_km NUMERIC,
      effort NUMERIC,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS checkins (
      id SERIAL PRIMARY KEY,
      checkin_date DATE NOT NULL UNIQUE,
      bodyweight_kg NUMERIC,
      face_puffiness INTEGER,
      sleep_quality INTEGER,
      energy INTEGER,
      soreness INTEGER,
      mood INTEGER,
      protein_hit BOOLEAN NOT NULL DEFAULT false,
      water_hit BOOLEAN NOT NULL DEFAULT false,
      salty_junk BOOLEAN NOT NULL DEFAULT false,
      appetite TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`INSERT INTO app_profile (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
}

export async function seedCurrentWeek() {
  const sql = sqlClient();
  const week = defaultWeek(getTodayKey());

  for (const session of week) {
    await sql`
      INSERT INTO planned_sessions (session_date, session_type, title, workout_key)
      VALUES (${session.date}, ${session.type}, ${session.title}, ${session.workoutKey})
      ON CONFLICT DO NOTHING
    `;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  await ensureSchema();
  await seedCurrentWeek();

  const sql = sqlClient();
  const start = mondayForDateKey(getTodayKey());
  const end = addDaysToKey(start, 6);

  const [profile] = await sql`
    SELECT nickname, goal FROM app_profile WHERE id = 1
  `;
  const sessions = await sql`
    SELECT id, session_date, session_type, title, workout_key, status, notes
    FROM planned_sessions
    WHERE session_date BETWEEN ${start} AND ${end}
    ORDER BY session_date ASC
  `;
  const strengthLogs = await sql`
    SELECT id, session_date, workout_key, exercise_name, variation, set_number, reps, seconds, rpe, rest_seconds, notes
    FROM strength_logs
    WHERE session_date >= CURRENT_DATE - INTERVAL '90 days'
    ORDER BY session_date ASC, id ASC
  `;
  const runLogs = await sql`
    SELECT id, run_date, duration_minutes, distance_km, effort, notes
    FROM run_logs
    WHERE run_date >= CURRENT_DATE - INTERVAL '90 days'
    ORDER BY run_date ASC
  `;
  const checkIns = await sql`
    SELECT id, checkin_date, bodyweight_kg, face_puffiness, sleep_quality, energy, soreness, mood, protein_hit, water_hit, salty_junk, appetite, notes
    FROM checkins
    WHERE checkin_date >= CURRENT_DATE - INTERVAL '90 days'
    ORDER BY checkin_date ASC
  `;

  return {
    profile: {
      nickname: String(profile?.nickname ?? "You"),
      goal: String(profile?.goal ?? "Lean muscle gain / recomposition")
    },
    sessions: sessions.map(mapSession),
    strengthLogs: strengthLogs.map(mapStrengthLog),
    runLogs: runLogs.map(mapRunLog),
    checkIns: checkIns.map(mapCheckIn)
  };
}

function dateOnly(value: unknown) {
  if (value instanceof Date) return format(value, "yyyy-MM-dd");
  return String(value).slice(0, 10);
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function mapSession(row: Record<string, unknown>): PlannedSession {
  return {
    id: Number(row.id),
    sessionDate: dateOnly(row.session_date),
    sessionType: String(row.session_type),
    title: String(row.title),
    workoutKey: row.workout_key ? String(row.workout_key) : null,
    status: String(row.status) as PlannedSession["status"],
    notes: row.notes ? String(row.notes) : null
  };
}

function mapStrengthLog(row: Record<string, unknown>): StrengthLog {
  return {
    id: Number(row.id),
    sessionDate: dateOnly(row.session_date),
    workoutKey: String(row.workout_key),
    exerciseName: String(row.exercise_name),
    variation: String(row.variation),
    setNumber: Number(row.set_number),
    reps: numberOrNull(row.reps),
    seconds: numberOrNull(row.seconds),
    rpe: numberOrNull(row.rpe),
    restSeconds: numberOrNull(row.rest_seconds),
    notes: row.notes ? String(row.notes) : null
  };
}

function mapRunLog(row: Record<string, unknown>): RunLog {
  return {
    id: Number(row.id),
    runDate: dateOnly(row.run_date),
    durationMinutes: Number(row.duration_minutes),
    distanceKm: numberOrNull(row.distance_km),
    effort: numberOrNull(row.effort),
    notes: row.notes ? String(row.notes) : null
  };
}

function mapCheckIn(row: Record<string, unknown>): CheckIn {
  return {
    id: Number(row.id),
    checkinDate: dateOnly(row.checkin_date),
    bodyweightKg: numberOrNull(row.bodyweight_kg),
    facePuffiness: numberOrNull(row.face_puffiness),
    sleepQuality: numberOrNull(row.sleep_quality),
    energy: numberOrNull(row.energy),
    soreness: numberOrNull(row.soreness),
    mood: numberOrNull(row.mood),
    proteinHit: Boolean(row.protein_hit),
    waterHit: Boolean(row.water_hit),
    saltyJunk: Boolean(row.salty_junk),
    appetite: row.appetite ? String(row.appetite) : null,
    notes: row.notes ? String(row.notes) : null
  };
}

export async function query() {
  await ensureSchema();
  return sqlClient();
}

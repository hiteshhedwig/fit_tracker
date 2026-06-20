"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSession, createSession, verifyPassword } from "@/lib/auth";
import { query } from "@/lib/db";

export type ActionState = {
  ok: boolean;
  message: string;
  intent?: string;
};

const initialState: ActionState = { ok: false, message: "" };

function resolveFormData(stateOrFormData: FormData | ActionState, maybeFormData?: FormData) {
  return maybeFormData ?? (stateOrFormData instanceof FormData ? stateOrFormData : new FormData());
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(formData: FormData, key: string) {
  const value = text(formData, key);
  return value ? Number(value) : null;
}

export async function loginAction(formData: FormData) {
  const password = text(formData, "password");
  if (!verifyPassword(password)) {
    redirect("/?error=bad-password");
  }

  await createSession();
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function saveProfileAction(stateOrFormData: FormData | ActionState = initialState, maybeFormData?: FormData): Promise<ActionState> {
  const formData = resolveFormData(stateOrFormData, maybeFormData);
  const sql = await query();
  const nickname = text(formData, "nickname") || "You";
  const bodyweight = numberOrNull(formData, "bodyweightKg");
  const preferredPlan = text(formData, "preferredPlan") || "standard";

  await sql`
    UPDATE app_profile
    SET nickname = ${nickname},
        current_bodyweight_kg = ${bodyweight},
        preferred_plan = ${preferredPlan},
        updated_at = NOW()
    WHERE id = 1
  `;

  revalidatePath("/");
  return { ok: true, message: "Profile saved.", intent: "profile" };
}

export async function updateSessionStatusAction(stateOrFormData: FormData | ActionState = initialState, maybeFormData?: FormData): Promise<ActionState> {
  const formData = resolveFormData(stateOrFormData, maybeFormData);
  const sql = await query();
  const id = z.coerce.number().parse(formData.get("sessionId"));
  const status = z.enum(["planned", "completed", "skipped", "moved", "modified"]).parse(formData.get("status"));

  await sql`
    UPDATE planned_sessions
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `;

  revalidatePath("/");
  return { ok: true, message: `Session marked ${status}.`, intent: "session" };
}

export async function logStrengthAction(stateOrFormData: FormData | ActionState = initialState, maybeFormData?: FormData): Promise<ActionState> {
  const formData = resolveFormData(stateOrFormData, maybeFormData);
  const sql = await query();
  const sessionDate = text(formData, "sessionDate");
  const workoutKey = text(formData, "workoutKey");
  const exerciseName = text(formData, "exerciseName");
  const variation = text(formData, "variation");
  const reps = numberOrNull(formData, "reps");
  const seconds = numberOrNull(formData, "seconds");
  const rpe = numberOrNull(formData, "rpe");
  const restSeconds = numberOrNull(formData, "restSeconds");
  const notes = text(formData, "notes") || null;

  const existing = await sql`
    SELECT COALESCE(MAX(set_number), 0) AS max_set
    FROM strength_logs
    WHERE session_date = ${sessionDate}
      AND workout_key = ${workoutKey}
      AND exercise_name = ${exerciseName}
  `;
  const setNumber = Number(existing[0]?.max_set ?? 0) + 1;

  await sql`
    INSERT INTO strength_logs (
      session_date, workout_key, exercise_name, variation, set_number, reps, seconds, rpe, rest_seconds, notes
    )
    VALUES (${sessionDate}, ${workoutKey}, ${exerciseName}, ${variation}, ${setNumber}, ${reps}, ${seconds}, ${rpe}, ${restSeconds}, ${notes})
  `;

  await sql`
    UPDATE planned_sessions
    SET status = 'completed', updated_at = NOW()
    WHERE session_date = ${sessionDate} AND workout_key = ${workoutKey}
  `;

  revalidatePath("/");
  const value = reps ? `${reps} reps` : seconds ? `${seconds} sec` : "set";
  return { ok: true, message: `${exerciseName} set ${setNumber} saved: ${value}.`, intent: "strength" };
}

export async function logRunAction(stateOrFormData: FormData | ActionState = initialState, maybeFormData?: FormData): Promise<ActionState> {
  const formData = resolveFormData(stateOrFormData, maybeFormData);
  const sql = await query();
  const runDate = text(formData, "runDate");
  const durationMinutes = z.coerce.number().min(1).parse(formData.get("durationMinutes"));
  const distanceKm = numberOrNull(formData, "distanceKm");
  const effort = numberOrNull(formData, "effort");
  const notes = text(formData, "notes") || null;

  await sql`
    INSERT INTO run_logs (run_date, duration_minutes, distance_km, effort, notes)
    VALUES (${runDate}, ${durationMinutes}, ${distanceKm}, ${effort}, ${notes})
  `;

  await sql`
    UPDATE planned_sessions
    SET status = 'completed', updated_at = NOW()
    WHERE session_date = ${runDate} AND session_type = 'run'
  `;

  revalidatePath("/");
  return { ok: true, message: `Run saved: ${durationMinutes} minutes.`, intent: "run" };
}

export async function saveCheckInAction(stateOrFormData: FormData | ActionState = initialState, maybeFormData?: FormData): Promise<ActionState> {
  const formData = resolveFormData(stateOrFormData, maybeFormData);
  const sql = await query();
  const checkinDate = text(formData, "checkinDate");
  const bodyweightKg = numberOrNull(formData, "bodyweightKg");
  const facePuffiness = numberOrNull(formData, "facePuffiness");
  const sleepQuality = numberOrNull(formData, "sleepQuality");
  const energy = numberOrNull(formData, "energy");
  const soreness = numberOrNull(formData, "soreness");
  const mood = numberOrNull(formData, "mood");
  const proteinHit = formData.get("proteinHit") === "on";
  const waterHit = formData.get("waterHit") === "on";
  const saltyJunk = formData.get("saltyJunk") === "on";
  const appetite = text(formData, "appetite") || null;
  const notes = text(formData, "notes") || null;

  await sql`
    INSERT INTO checkins (
      checkin_date, bodyweight_kg, face_puffiness, sleep_quality, energy, soreness, mood,
      protein_hit, water_hit, salty_junk, appetite, notes
    )
    VALUES (
      ${checkinDate}, ${bodyweightKg}, ${facePuffiness}, ${sleepQuality}, ${energy}, ${soreness}, ${mood},
      ${proteinHit}, ${waterHit}, ${saltyJunk}, ${appetite}, ${notes}
    )
    ON CONFLICT (checkin_date) DO UPDATE SET
      bodyweight_kg = EXCLUDED.bodyweight_kg,
      face_puffiness = EXCLUDED.face_puffiness,
      sleep_quality = EXCLUDED.sleep_quality,
      energy = EXCLUDED.energy,
      soreness = EXCLUDED.soreness,
      mood = EXCLUDED.mood,
      protein_hit = EXCLUDED.protein_hit,
      water_hit = EXCLUDED.water_hit,
      salty_junk = EXCLUDED.salty_junk,
      appetite = EXCLUDED.appetite,
      notes = EXCLUDED.notes,
      updated_at = NOW()
  `;

  revalidatePath("/");
  return { ok: true, message: "Check-in saved.", intent: "checkin" };
}

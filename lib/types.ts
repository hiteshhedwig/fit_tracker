export type PlannedSession = {
  id: number;
  sessionDate: string;
  sessionType: string;
  title: string;
  workoutKey: string | null;
  status: "planned" | "completed" | "skipped" | "moved" | "modified";
  notes: string | null;
};

export type StrengthLog = {
  id: number;
  sessionDate: string;
  workoutKey: string;
  exerciseName: string;
  variation: string;
  setNumber: number;
  reps: number | null;
  seconds: number | null;
  rpe: number | null;
  restSeconds: number | null;
  notes: string | null;
};

export type RunLog = {
  id: number;
  runDate: string;
  durationMinutes: number;
  distanceKm: number | null;
  effort: number | null;
  notes: string | null;
};

export type CheckIn = {
  id: number;
  checkinDate: string;
  bodyweightKg: number | null;
  facePuffiness: number | null;
  sleepQuality: number | null;
  energy: number | null;
  soreness: number | null;
  mood: number | null;
  proteinHit: boolean;
  waterHit: boolean;
  saltyJunk: boolean;
  appetite: string | null;
  notes: string | null;
};

export type DashboardData = {
  profile: {
    nickname: string;
    goal: string;
  };
  sessions: PlannedSession[];
  strengthLogs: StrengthLog[];
  runLogs: RunLog[];
  checkIns: CheckIn[];
};

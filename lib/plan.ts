import { addDaysToKey, getTodayKey, mondayForDateKey } from "@/lib/date";

export type ExerciseDefinition = {
  name: string;
  target: string;
  prescription: string;
  variations: string[];
};

export type WorkoutDefinition = {
  key: "A" | "B" | "C";
  title: string;
  focus: string;
  exercises: ExerciseDefinition[];
};

export const warmup = [
  "2 min brisk walk",
  "20 arm circles",
  "15 bodyweight squats",
  "10 lunges each leg",
  "10 incline push-ups on bench",
  "30 sec light jogging"
];

export const workouts: WorkoutDefinition[] = [
  {
    key: "A",
    title: "Workout A",
    focus: "Push + legs",
    exercises: [
      {
        name: "Push-ups",
        target: "Chest, shoulders, triceps",
        prescription: "4 x 6-15 reps",
        variations: ["Incline push-up", "Normal push-up", "Decline push-up"]
      },
      {
        name: "Pike push-ups",
        target: "Shoulders",
        prescription: "3 x 5-12 reps",
        variations: ["High incline pike", "Pike push-up", "Feet-elevated pike"]
      },
      {
        name: "Bulgarian split squats",
        target: "Quads, glutes",
        prescription: "3 x 8-12 reps / leg",
        variations: ["Bodyweight", "Backpack loaded"]
      },
      {
        name: "Step-ups on bench",
        target: "Legs",
        prescription: "3 x 10 reps / leg",
        variations: ["Low bench", "Bench", "Backpack loaded"]
      },
      {
        name: "Calf raises",
        target: "Calves",
        prescription: "3 x 15-25 reps",
        variations: ["Two-leg", "Single-leg", "Backpack loaded"]
      },
      {
        name: "Plank",
        target: "Core",
        prescription: "3 x 30-60 sec",
        variations: ["Knee plank", "Plank", "Long-lever plank"]
      }
    ]
  },
  {
    key: "B",
    title: "Workout B",
    focus: "Pull + core + posterior chain",
    exercises: [
      {
        name: "Inverted rows",
        target: "Back, biceps",
        prescription: "4 x 5-12 reps",
        variations: ["Bent-knee row", "Straight-leg row", "Feet-elevated row"]
      },
      {
        name: "Hang / pull-up progression",
        target: "Back, grip",
        prescription: "3 sets",
        variations: ["Dead hang", "Negative pull-up", "Chin-up", "Pull-up"]
      },
      {
        name: "Walking lunges",
        target: "Legs",
        prescription: "3 x 12-20 steps",
        variations: ["Bodyweight", "Backpack loaded"]
      },
      {
        name: "Single-leg glute bridge",
        target: "Glutes, hamstrings",
        prescription: "3 x 10-15 reps / leg",
        variations: ["Glute bridge", "Single-leg", "Elevated single-leg"]
      },
      {
        name: "Side plank",
        target: "Obliques",
        prescription: "3 x 20-45 sec / side",
        variations: ["Knee side plank", "Side plank", "Star side plank"]
      },
      {
        name: "Dead bug",
        target: "Core control",
        prescription: "3 x 10 reps / side",
        variations: ["Bent-knee", "Dead bug", "Slow dead bug"]
      }
    ]
  },
  {
    key: "C",
    title: "Workout C",
    focus: "Full body shape day",
    exercises: [
      {
        name: "Push-up variation",
        target: "Chest, shoulders",
        prescription: "3 x 8-15 reps",
        variations: ["Incline push-up", "Normal push-up", "Decline push-up"]
      },
      {
        name: "Rows / band rows",
        target: "Back",
        prescription: "4 x 8-15 reps",
        variations: ["Band row", "Railing row", "Feet-elevated row"]
      },
      {
        name: "Split squats",
        target: "Legs",
        prescription: "3 x 8-12 reps / leg",
        variations: ["Bodyweight", "Backpack loaded"]
      },
      {
        name: "Slow squats",
        target: "Legs",
        prescription: "3 x 15-25 reps, 3 sec down",
        variations: ["Bodyweight", "Pause squat", "Backpack loaded"]
      },
      {
        name: "Bench dips / close-grip push-ups",
        target: "Triceps, chest",
        prescription: "2-3 x 8-12 reps",
        variations: ["Close-grip push-up", "Bench dip"]
      },
      {
        name: "Hollow hold / plank",
        target: "Core",
        prescription: "3 x 20-45 sec",
        variations: ["Plank", "Hollow tuck", "Hollow hold"]
      }
    ]
  }
];

export const motivationMessages = [
  "Small progression beats heroic inconsistency.",
  "You are building shape, not just burning calories.",
  "Strength first. Keep the run easy.",
  "Do the boring work. Repeated weeks change the body.",
  "Today is about completing the plan, not proving a point."
];

export function defaultWeek(anchor = getTodayKey()) {
  const monday = mondayForDateKey(anchor);
  return [
    { date: monday, type: "strength", title: "Strength Workout A", workoutKey: "A" },
    { date: addDaysToKey(monday, 1), type: "run", title: "Run 20 minutes", workoutKey: null },
    { date: addDaysToKey(monday, 2), type: "strength", title: "Strength Workout B", workoutKey: "B" },
    { date: addDaysToKey(monday, 3), type: "walk", title: "Rest or walk", workoutKey: null },
    { date: addDaysToKey(monday, 4), type: "strength", title: "Strength Workout C", workoutKey: "C" },
    { date: addDaysToKey(monday, 5), type: "run", title: "Run 20-25 minutes easy", workoutKey: null },
    { date: addDaysToKey(monday, 6), type: "rest", title: "Rest", workoutKey: null }
  ] as const;
}

export function findWorkout(key?: string | null) {
  return workouts.find((workout) => workout.key === key);
}

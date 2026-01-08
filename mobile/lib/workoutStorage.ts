import AsyncStorage from '@react-native-async-storage/async-storage';

export type WorkoutLoggedSet = {
  setId: string;
  targetReps?: number;
  weightKg?: number;
  reps?: number;
  done: boolean;
};

export type WorkoutLoggedExercise = {
  exerciseId: string;
  name: string;
  restSeconds?: number;
  sets: WorkoutLoggedSet[];
};

export type WorkoutLogEntry = {
  id: string;
  createdAtISO: string;
  sessionId?: string;
  sessionTitle: string;
  durationSeconds: number;
  volumeTotal: number;
  completedExercises: number;
  totalExercises: number;
  rpe?: number;
  notes?: string;
  exercises: WorkoutLoggedExercise[];
};

export type WorkoutLogDraft = Omit<WorkoutLogEntry, 'rpe' | 'notes'>;

const WORKOUT_LOGS_KEY = 'workout_logs_v1';
const WORKOUT_DRAFTS_KEY = 'workout_log_drafts_v1';
const WORKOUT_LOGS_KEY_LEGACY = 'workout_logs';
const WORKOUT_DRAFTS_KEY_LEGACY = 'workout_log_drafts';

function parseWorkoutLogsFromUnknown(parsed: unknown): WorkoutLogEntry[] | null {
  if (!Array.isArray(parsed)) return null;

  return parsed
    .filter((x): x is WorkoutLogEntry =>
      typeof x === 'object' &&
      x !== null &&
      'id' in x &&
      'createdAtISO' in x &&
      'sessionTitle' in x &&
      typeof (x as any).id === 'string' &&
      typeof (x as any).createdAtISO === 'string' &&
      typeof (x as any).sessionTitle === 'string'
    )
    .map((x) => x);
}

async function loadWorkoutLogsRaw(key: string): Promise<WorkoutLogEntry[] | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseWorkoutLogsFromUnknown(parsed);
  } catch {
    return null;
  }
}

function parseDraftMapFromUnknown(parsed: unknown): Record<string, WorkoutLogDraft> | null {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  return parsed as Record<string, WorkoutLogDraft>;
}

async function loadDraftMapRaw(key: string): Promise<Record<string, WorkoutLogDraft> | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseDraftMapFromUnknown(parsed);
  } catch {
    return null;
  }
}

export async function loadWorkoutLogs(): Promise<WorkoutLogEntry[]> {
  const current = await loadWorkoutLogsRaw(WORKOUT_LOGS_KEY);
  if (current) return current;

  const legacy = await loadWorkoutLogsRaw(WORKOUT_LOGS_KEY_LEGACY);
  if (!legacy) return [];

  await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(legacy));
  await AsyncStorage.removeItem(WORKOUT_LOGS_KEY_LEGACY);
  return legacy;
}

export async function saveWorkoutLogs(entries: WorkoutLogEntry[]): Promise<void> {
  await AsyncStorage.setItem(WORKOUT_LOGS_KEY, JSON.stringify(entries));
}

export async function addWorkoutLog(entry: WorkoutLogEntry): Promise<void> {
  const prev = await loadWorkoutLogs();
  await saveWorkoutLogs([...prev, entry]);
}

async function loadDraftMap(): Promise<Record<string, WorkoutLogDraft>> {
  const current = await loadDraftMapRaw(WORKOUT_DRAFTS_KEY);
  if (current) return current;

  const legacy = await loadDraftMapRaw(WORKOUT_DRAFTS_KEY_LEGACY);
  if (!legacy) return {};

  await AsyncStorage.setItem(WORKOUT_DRAFTS_KEY, JSON.stringify(legacy));
  await AsyncStorage.removeItem(WORKOUT_DRAFTS_KEY_LEGACY);
  return legacy;
}

async function saveDraftMap(map: Record<string, WorkoutLogDraft>): Promise<void> {
  await AsyncStorage.setItem(WORKOUT_DRAFTS_KEY, JSON.stringify(map));
}

export async function saveWorkoutDraft(draft: WorkoutLogDraft): Promise<void> {
  const map = await loadDraftMap();
  map[draft.id] = draft;
  await saveDraftMap(map);
}

export async function loadWorkoutDraft(id: string): Promise<WorkoutLogDraft | null> {
  const map = await loadDraftMap();
  return map[id] ?? null;
}

export async function deleteWorkoutDraft(id: string): Promise<void> {
  const map = await loadDraftMap();
  delete map[id];
  await saveDraftMap(map);
}

export async function getWorkoutLogById(id: string): Promise<WorkoutLogEntry | null> {
  const logs = await loadWorkoutLogs();
  return logs.find((l) => l.id === id) ?? null;
}

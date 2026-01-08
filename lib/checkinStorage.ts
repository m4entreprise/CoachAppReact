import AsyncStorage from '@react-native-async-storage/async-storage';

export type CheckInEntry = {
  id: string;
  dateISO: string;
  sleep: number;
  stress: number;
  energy: number;
  nutritionAdherence: number;
  painNotes?: string;
};

const CHECKINS_KEY = 'checkins_v1';
const CHECKINS_KEY_LEGACY = 'checkins';

function isValidScore(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 1 && x <= 10;
}

function parseCheckInsFromUnknown(parsed: unknown): CheckInEntry[] | null {
  if (!Array.isArray(parsed)) return null;

  return parsed
    .filter((x): x is CheckInEntry =>
      typeof x === 'object' &&
      x !== null &&
      'id' in x &&
      'dateISO' in x &&
      'sleep' in x &&
      'stress' in x &&
      'energy' in x &&
      'nutritionAdherence' in x &&
      typeof (x as any).id === 'string' &&
      typeof (x as any).dateISO === 'string' &&
      isValidScore((x as any).sleep) &&
      isValidScore((x as any).stress) &&
      isValidScore((x as any).energy) &&
      isValidScore((x as any).nutritionAdherence)
    )
    .map((x) => ({
      id: x.id,
      dateISO: x.dateISO,
      sleep: x.sleep,
      stress: x.stress,
      energy: x.energy,
      nutritionAdherence: x.nutritionAdherence,
      painNotes: typeof x.painNotes === 'string' ? x.painNotes : undefined,
    }));
}

async function loadCheckInsRaw(key: string): Promise<CheckInEntry[] | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseCheckInsFromUnknown(parsed);
  } catch {
    return null;
  }
}

export async function loadCheckIns(): Promise<CheckInEntry[]> {
  const current = await loadCheckInsRaw(CHECKINS_KEY);
  if (current) return current;

  const legacy = await loadCheckInsRaw(CHECKINS_KEY_LEGACY);
  if (!legacy) return [];

  await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(legacy));
  await AsyncStorage.removeItem(CHECKINS_KEY_LEGACY);
  return legacy;
}

export async function saveCheckIns(entries: CheckInEntry[]): Promise<void> {
  await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(entries));
}

export async function addCheckIn(entry: CheckInEntry): Promise<void> {
  const prev = await loadCheckIns();
  await saveCheckIns([...prev, entry]);
}

export async function updateCheckIn(entry: CheckInEntry): Promise<void> {
  const prev = await loadCheckIns();
  const next = prev.map((e) => (e.id === entry.id ? entry : e));
  await saveCheckIns(next);
}

export async function deleteCheckIn(id: string): Promise<void> {
  const prev = await loadCheckIns();
  const next = prev.filter((e) => e.id !== id);
  await saveCheckIns(next);
}

export async function getCheckInById(id: string): Promise<CheckInEntry | null> {
  const all = await loadCheckIns();
  return all.find((c) => c.id === id) ?? null;
}

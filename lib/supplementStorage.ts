import AsyncStorage from '@react-native-async-storage/async-storage';

import { MOCK_DATA } from '@/constants/mockData';

export type SupplementTiming = 'Matin' | 'Soir' | 'Pre-Workout';

export type SupplementProtocolItem = {
  id: string;
  nom: string;
  dosage: string;
  description?: string;
  timing: SupplementTiming;
  frequency?: string;
};

export type SupplementTakenState = {
  taken: boolean;
  takenAtISO?: string;
};

export type SupplementComplianceDay = {
  dayKey: string; // YYYY-MM-DD
  updatedAtISO: string;
  takenById: Record<string, SupplementTakenState>;
};

const SUPPLEMENT_PROTOCOL_KEY = 'supplement_protocol_v1';
const SUPPLEMENT_COMPLIANCE_KEY = 'supplement_compliance_v1';

function buildDefaultProtocol(): SupplementProtocolItem[] {
  return MOCK_DATA.supplements.map((s) => ({
    id: s.id,
    nom: s.nom,
    dosage: s.dosage,
    description: s.description,
    timing: s.timing,
    frequency: 'Quotidien',
  }));
}

export function getDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDayKeyToDate(dayKey: string): Date {
  return new Date(`${dayKey}T12:00:00.000Z`);
}

async function loadComplianceMap(): Promise<Record<string, SupplementComplianceDay>> {
  const raw = await AsyncStorage.getItem(SUPPLEMENT_COMPLIANCE_KEY);
  if (!raw) return {};

  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== 'object' || parsed === null) return {};

  return parsed as Record<string, SupplementComplianceDay>;
}

async function saveComplianceMap(map: Record<string, SupplementComplianceDay>): Promise<void> {
  await AsyncStorage.setItem(SUPPLEMENT_COMPLIANCE_KEY, JSON.stringify(map));
}

export async function ensureSupplementProtocolInitialized(): Promise<SupplementProtocolItem[]> {
  const existing = await loadSupplementProtocol();
  if (existing.length > 0) return existing;

  const seeded = buildDefaultProtocol();
  await saveSupplementProtocol(seeded);
  return seeded;
}

export async function loadSupplementProtocol(): Promise<SupplementProtocolItem[]> {
  const raw = await AsyncStorage.getItem(SUPPLEMENT_PROTOCOL_KEY);
  if (!raw) return [];

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((x): x is SupplementProtocolItem =>
      typeof x === 'object' &&
      x !== null &&
      'id' in x &&
      'nom' in x &&
      'dosage' in x &&
      'timing' in x &&
      typeof (x as any).id === 'string' &&
      typeof (x as any).nom === 'string' &&
      typeof (x as any).dosage === 'string' &&
      typeof (x as any).timing === 'string'
    )
    .map((x) => ({
      id: x.id,
      nom: x.nom,
      dosage: x.dosage,
      timing: x.timing as SupplementTiming,
      description: typeof x.description === 'string' ? x.description : undefined,
      frequency: typeof x.frequency === 'string' ? x.frequency : undefined,
    }));
}

export async function saveSupplementProtocol(items: SupplementProtocolItem[]): Promise<void> {
  await AsyncStorage.setItem(SUPPLEMENT_PROTOCOL_KEY, JSON.stringify(items));
}

export async function addSupplementProtocolItem(item: SupplementProtocolItem): Promise<void> {
  const prev = await loadSupplementProtocol();
  await saveSupplementProtocol([...prev, item]);
}

export async function updateSupplementProtocolItem(item: SupplementProtocolItem): Promise<void> {
  const prev = await loadSupplementProtocol();
  const next = prev.map((s) => (s.id === item.id ? item : s));
  await saveSupplementProtocol(next);
}

export async function deleteSupplementProtocolItem(id: string): Promise<void> {
  const prev = await loadSupplementProtocol();
  const next = prev.filter((s) => s.id !== id);
  await saveSupplementProtocol(next);
}

export async function loadSupplementComplianceDay(dayKey: string): Promise<SupplementComplianceDay> {
  const map = await loadComplianceMap();
  const existing = map[dayKey];
  if (existing && typeof existing === 'object') return existing;

  return {
    dayKey,
    updatedAtISO: new Date().toISOString(),
    takenById: {},
  };
}

export async function setSupplementTakenForDay(
  dayKey: string,
  supplementId: string,
  taken: boolean
): Promise<SupplementComplianceDay> {
  const map = await loadComplianceMap();

  const day: SupplementComplianceDay = map[dayKey] ?? {
    dayKey,
    updatedAtISO: new Date().toISOString(),
    takenById: {},
  };

  const prev = day.takenById[supplementId];

  const nextState: SupplementTakenState = taken
    ? {
        taken: true,
        takenAtISO: prev?.takenAtISO ?? new Date().toISOString(),
      }
    : {
        taken: false,
      };

  const nextDay: SupplementComplianceDay = {
    ...day,
    updatedAtISO: new Date().toISOString(),
    takenById: {
      ...day.takenById,
      [supplementId]: nextState,
    },
  };

  map[dayKey] = nextDay;
  await saveComplianceMap(map);

  return nextDay;
}

export async function getSupplementComplianceDays(): Promise<string[]> {
  const map = await loadComplianceMap();
  return Object.keys(map).sort((a, b) => b.localeCompare(a));
}

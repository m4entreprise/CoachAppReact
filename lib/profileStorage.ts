import AsyncStorage from '@react-native-async-storage/async-storage';

export type MeasurementEntry = {
  id: string;
  dateISO: string;
  weightKg?: number;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
};

export type PersonalInfo = {
  firstName?: string;
  lastName?: string;
  heightCm?: number;
  goal?: string;
  profilePhotoUri?: string;
};

export type ProgressPhotoEntry = {
  id: string;
  dateISO: string;
  frontUri?: string;
  sideUri?: string;
  backUri?: string;
};

const MEASUREMENTS_KEY = 'profile_measurements_v1';
const PERSONAL_KEY = 'profile_personal_v1';
const PROGRESS_PHOTOS_KEY = 'profile_progress_photos_v1';
const MEASUREMENTS_KEY_LEGACY = 'profile_measurements';
const PERSONAL_KEY_LEGACY = 'profile_personal';
const PROGRESS_PHOTOS_KEY_LEGACY = 'profile_progress_photos';

function toFiniteNumberOrUndefined(x: unknown): number | undefined {
  return typeof x === 'number' && Number.isFinite(x) ? x : undefined;
}

function parseMeasurementsFromUnknown(parsed: unknown): MeasurementEntry[] | null {
  if (!Array.isArray(parsed)) return null;

  return parsed
    .filter((x): x is MeasurementEntry =>
      typeof x === 'object' &&
      x !== null &&
      'id' in x &&
      'dateISO' in x &&
      typeof (x as any).id === 'string' &&
      typeof (x as any).dateISO === 'string'
    )
    .map((x) => ({
      id: x.id,
      dateISO: x.dateISO,
      weightKg: toFiniteNumberOrUndefined((x as any).weightKg),
      waistCm: toFiniteNumberOrUndefined((x as any).waistCm),
      hipsCm: toFiniteNumberOrUndefined((x as any).hipsCm),
      chestCm: toFiniteNumberOrUndefined((x as any).chestCm),
      armCm: toFiniteNumberOrUndefined((x as any).armCm),
      thighCm: toFiniteNumberOrUndefined((x as any).thighCm),
    }));
}

async function loadMeasurementsRaw(key: string): Promise<MeasurementEntry[] | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseMeasurementsFromUnknown(parsed);
  } catch {
    return null;
  }
}

function parsePersonalFromUnknown(parsed: unknown): PersonalInfo | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  return {
    firstName: typeof obj.firstName === 'string' ? obj.firstName : undefined,
    lastName: typeof obj.lastName === 'string' ? obj.lastName : undefined,
    heightCm: typeof obj.heightCm === 'number' ? obj.heightCm : undefined,
    goal: typeof obj.goal === 'string' ? obj.goal : undefined,
    profilePhotoUri: typeof obj.profilePhotoUri === 'string' ? obj.profilePhotoUri : undefined,
  };
}

async function loadPersonalRaw(key: string): Promise<PersonalInfo | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsePersonalFromUnknown(parsed);
  } catch {
    return null;
  }
}

function parseProgressPhotosFromUnknown(parsed: unknown): ProgressPhotoEntry[] | null {
  if (!Array.isArray(parsed)) return null;

  return parsed
    .filter((x): x is ProgressPhotoEntry =>
      typeof x === 'object' &&
      x !== null &&
      'id' in x &&
      'dateISO' in x &&
      typeof (x as any).id === 'string' &&
      typeof (x as any).dateISO === 'string'
    )
    .map((x) => ({
      id: x.id,
      dateISO: x.dateISO,
      frontUri: typeof x.frontUri === 'string' ? x.frontUri : undefined,
      sideUri: typeof x.sideUri === 'string' ? x.sideUri : undefined,
      backUri: typeof x.backUri === 'string' ? x.backUri : undefined,
    }));
}

async function loadProgressPhotosRaw(key: string): Promise<ProgressPhotoEntry[] | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseProgressPhotosFromUnknown(parsed);
  } catch {
    return null;
  }
}

export async function loadMeasurements(): Promise<MeasurementEntry[]> {
  const current = await loadMeasurementsRaw(MEASUREMENTS_KEY);
  if (current) return current;

  const legacy = await loadMeasurementsRaw(MEASUREMENTS_KEY_LEGACY);
  if (!legacy) return [];

  await AsyncStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(legacy));
  await AsyncStorage.removeItem(MEASUREMENTS_KEY_LEGACY);
  return legacy;
}

export async function saveMeasurements(entries: MeasurementEntry[]): Promise<void> {
  await AsyncStorage.setItem(MEASUREMENTS_KEY, JSON.stringify(entries));
}

export async function addMeasurement(entry: MeasurementEntry): Promise<void> {
  const prev = await loadMeasurements();
  await saveMeasurements([...prev, entry]);
}

export async function updateMeasurement(entry: MeasurementEntry): Promise<void> {
  const prev = await loadMeasurements();
  const next = prev.map((e) => (e.id === entry.id ? entry : e));
  await saveMeasurements(next);
}

export async function deleteMeasurement(id: string): Promise<void> {
  const prev = await loadMeasurements();
  const next = prev.filter((e) => e.id !== id);
  await saveMeasurements(next);
}

export async function loadPersonalInfo(): Promise<PersonalInfo> {
  const current = await loadPersonalRaw(PERSONAL_KEY);
  if (current) return current;

  const legacy = await loadPersonalRaw(PERSONAL_KEY_LEGACY);
  if (!legacy) return {};

  await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(legacy));
  await AsyncStorage.removeItem(PERSONAL_KEY_LEGACY);
  return legacy;
}

export async function savePersonalInfo(info: PersonalInfo): Promise<void> {
  await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(info));
}

export async function loadProgressPhotos(): Promise<ProgressPhotoEntry[]> {
  const current = await loadProgressPhotosRaw(PROGRESS_PHOTOS_KEY);
  if (current) return current;

  const legacy = await loadProgressPhotosRaw(PROGRESS_PHOTOS_KEY_LEGACY);
  if (!legacy) return [];

  await AsyncStorage.setItem(PROGRESS_PHOTOS_KEY, JSON.stringify(legacy));
  await AsyncStorage.removeItem(PROGRESS_PHOTOS_KEY_LEGACY);
  return legacy;
}

export async function saveProgressPhotos(entries: ProgressPhotoEntry[]): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_PHOTOS_KEY, JSON.stringify(entries));
}

export async function addProgressPhoto(entry: ProgressPhotoEntry): Promise<void> {
  const prev = await loadProgressPhotos();
  await saveProgressPhotos([...prev, entry]);
}

export async function updateProgressPhoto(entry: ProgressPhotoEntry): Promise<void> {
  const prev = await loadProgressPhotos();
  const next = prev.map((e) => (e.id === entry.id ? entry : e));
  await saveProgressPhotos(next);
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  const prev = await loadProgressPhotos();
  const next = prev.filter((e) => e.id !== id);
  await saveProgressPhotos(next);
}

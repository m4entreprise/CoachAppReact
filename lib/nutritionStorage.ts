import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealType = 'Petit dej' | 'Déjeuner' | 'Dîner' | 'Snack';

export type MealEntry = {
  id: string;
  dateISO: string;
  type: MealType;
  photoUri?: string;
  notes?: string;
};

const MEALS_KEY = 'nutrition_meals_v1';

export async function loadMeals(): Promise<MealEntry[]> {
  const raw = await AsyncStorage.getItem(MEALS_KEY);
  if (!raw) return [];

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((x): x is MealEntry =>
      typeof x === 'object' &&
      x !== null &&
      'id' in x &&
      'dateISO' in x &&
      'type' in x &&
      typeof (x as any).id === 'string' &&
      typeof (x as any).dateISO === 'string' &&
      typeof (x as any).type === 'string'
    )
    .map((x) => ({
      id: x.id,
      dateISO: x.dateISO,
      type: x.type as MealType,
      photoUri: typeof x.photoUri === 'string' ? x.photoUri : undefined,
      notes: typeof x.notes === 'string' ? x.notes : undefined,
    }));
}

export async function saveMeals(entries: MealEntry[]): Promise<void> {
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(entries));
}

export async function addMeal(entry: MealEntry): Promise<void> {
  const prev = await loadMeals();
  await saveMeals([...prev, entry]);
}

export async function updateMeal(entry: MealEntry): Promise<void> {
  const prev = await loadMeals();
  const next = prev.map((e) => (e.id === entry.id ? entry : e));
  await saveMeals(next);
}

export async function deleteMeal(id: string): Promise<void> {
  const prev = await loadMeals();
  const next = prev.filter((e) => e.id !== id);
  await saveMeals(next);
}

export async function getMealById(id: string): Promise<MealEntry | null> {
  const meals = await loadMeals();
  return meals.find((m) => m.id === id) ?? null;
}

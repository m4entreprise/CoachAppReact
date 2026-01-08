import { useFocusEffect, useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    addMeasurement,
    deleteMeasurement,
    loadMeasurements,
    type MeasurementEntry,
    updateMeasurement,
} from '@/lib/profileStorage';

type Params = {
  id?: string;
};

const toNumberOrUndefined = (raw: string) => {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function ProfileEntryModal() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<Params>();

  const isEdit = typeof id === 'string' && id.length > 0;

  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<MeasurementEntry | null>(null);

  const [dateText, setDateText] = useState(() => new Date().toISOString().slice(0, 10));
  const [weightText, setWeightText] = useState('');
  const [waistText, setWaistText] = useState('');
  const [hipsText, setHipsText] = useState('');
  const [chestText, setChestText] = useState('');
  const [armText, setArmText] = useState('');
  const [thighText, setThighText] = useState('');

  const title = useMemo(() => (isEdit ? 'Modifier une mesure' : 'Ajouter une mesure'), [isEdit]);

  const hydrateFromEntry = useCallback((entry: MeasurementEntry) => {
    setDateText(new Date(entry.dateISO).toISOString().slice(0, 10));
    setWeightText(entry.weightKg !== undefined ? String(entry.weightKg) : '');
    setWaistText(entry.waistCm !== undefined ? String(entry.waistCm) : '');
    setHipsText(entry.hipsCm !== undefined ? String(entry.hipsCm) : '');
    setChestText(entry.chestCm !== undefined ? String(entry.chestCm) : '');
    setArmText(entry.armCm !== undefined ? String(entry.armCm) : '');
    setThighText(entry.thighCm !== undefined ? String(entry.thighCm) : '');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!isEdit) {
        setExisting(null);
        return;
      }
      const all = await loadMeasurements();
      const found = all.find((e) => e.id === id) ?? null;
      setExisting(found);
      if (found) hydrateFromEntry(found);
    } finally {
      setLoading(false);
    }
  }, [hydrateFromEntry, id, isEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const submit = async () => {
    const date = new Date(`${dateText}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return;

    const entry: MeasurementEntry = {
      id: isEdit ? String(id) : `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      dateISO: date.toISOString(),
      weightKg: toNumberOrUndefined(weightText),
      waistCm: toNumberOrUndefined(waistText),
      hipsCm: toNumberOrUndefined(hipsText),
      chestCm: toNumberOrUndefined(chestText),
      armCm: toNumberOrUndefined(armText),
      thighCm: toNumberOrUndefined(thighText),
    };

    const hasAnyValue =
      entry.weightKg !== undefined ||
      entry.waistCm !== undefined ||
      entry.hipsCm !== undefined ||
      entry.chestCm !== undefined ||
      entry.armCm !== undefined ||
      entry.thighCm !== undefined;

    if (!hasAnyValue) return;

    if (isEdit) {
      await updateMeasurement(entry);
    } else {
      await addMeasurement(entry);
    }

    router.back();
  };

  const onDelete = async () => {
    if (!isEdit) return;
    await deleteMeasurement(String(id));
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.heading}>
              {title}
            </Text>
            <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.text }]}>
              {loading ? 'Chargement…' : isEdit && !existing ? "Mesure introuvable" : 'Poids + mensurations'}
            </Text>
          </View>
          <Button mode="text" onPress={() => router.back()}>
            Fermer
          </Button>
        </View>

        <Card mode="contained" style={[styles.card, styles.flatCard]}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label="Date (YYYY-MM-DD)"
              value={dateText}
              onChangeText={setDateText}
              autoCapitalize="none"
              style={styles.input}
            />

            <Divider style={styles.divider} />

            <TextInput
              mode="outlined"
              label="Poids (kg)"
              value={weightText}
              onChangeText={setWeightText}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Tour de taille (cm)"
              value={waistText}
              onChangeText={setWaistText}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Hanches (cm)"
              value={hipsText}
              onChangeText={setHipsText}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Poitrine (cm)"
              value={chestText}
              onChangeText={setChestText}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Bras (cm)"
              value={armText}
              onChangeText={setArmText}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Cuisse (cm)"
              value={thighText}
              onChangeText={setThighText}
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.text }]}>
              Tu peux taper « 78,4 » (virgule acceptée).
            </Text>
          </Card.Content>

          <Card.Actions style={styles.actions}>
            <Button onPress={() => router.back()}>Annuler</Button>
            <Button mode="contained" onPress={() => void submit()}>
              Enregistrer
            </Button>
          </Card.Actions>
        </Card>

        {isEdit ? (
          <Card mode="contained" style={[styles.card, styles.dangerCard]}>
            <Card.Title title="Zone dangereuse" />
            <Card.Content>
              <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.text }]}>
                Supprime cette mesure de l’historique.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" buttonColor="#EF4444" textColor="#111111" onPress={() => void onDelete()}>
                Supprimer la mesure
              </Button>
            </Card.Actions>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  heading: {
    fontWeight: '800',
  },
  subheading: {
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  flatCard: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  input: {
    marginBottom: 10,
  },
  divider: {
    backgroundColor: '#333333',
    marginVertical: 10,
  },
  hint: {
    marginTop: 2,
    opacity: 0.7,
  },
  actions: {
    justifyContent: 'space-between',
  },
});

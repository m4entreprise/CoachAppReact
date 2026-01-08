import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';

import { addCheckIn, deleteCheckIn, getCheckInById, updateCheckIn, type CheckInEntry } from '@/lib/checkinStorage';

function isValidDateText(x: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(x);
}

function clampScore(x: number): number {
  if (Number.isNaN(x)) return 1;
  return Math.max(1, Math.min(10, Math.round(x)));
}

const formatDateText = (date: Date) => date.toISOString().slice(0, 10);

export default function CheckInEntryModal() {
  const router = useRouter();
  const theme = useTheme();

  const params = useLocalSearchParams();
  const idParam = typeof params.id === 'string' ? params.id : undefined;

  const editing = Boolean(idParam);

  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  const [dateText, setDateText] = useState(() => formatDateText(new Date()));
  const [sleepText, setSleepText] = useState('7');
  const [stressText, setStressText] = useState('5');
  const [energyText, setEnergyText] = useState('7');
  const [adherenceText, setAdherenceText] = useState('7');
  const [painNotes, setPainNotes] = useState('');

  const title = editing ? 'Modifier check-in' : 'Nouveau check-in';

  const loadExisting = useCallback(async () => {
    if (!idParam) return;

    setLoading(true);
    try {
      const existing = await getCheckInById(idParam);
      if (!existing) return;

      setDateText(existing.dateISO.slice(0, 10));
      setSleepText(String(existing.sleep));
      setStressText(String(existing.stress));
      setEnergyText(String(existing.energy));
      setAdherenceText(String(existing.nutritionAdherence));
      setPainNotes(existing.painNotes ?? '');
    } finally {
      setLoading(false);
    }
  }, [idParam]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  const parsed = useMemo(() => {
    const sleep = clampScore(Number(sleepText));
    const stress = clampScore(Number(stressText));
    const energy = clampScore(Number(energyText));
    const nutritionAdherence = clampScore(Number(adherenceText));

    return { sleep, stress, energy, nutritionAdherence };
  }, [sleepText, stressText, energyText, adherenceText]);

  const canSave = useMemo(() => {
    return !saving && isValidDateText(dateText);
  }, [dateText, saving]);

  const onSave = async () => {
    if (!isValidDateText(dateText)) return;

    setSaving(true);
    try {
      const date = new Date(`${dateText}T12:00:00.000Z`);

      const entry: CheckInEntry = {
        id: editing ? (idParam as string) : `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        dateISO: date.toISOString(),
        sleep: parsed.sleep,
        stress: parsed.stress,
        energy: parsed.energy,
        nutritionAdherence: parsed.nutritionAdherence,
        painNotes: painNotes.trim().length > 0 ? painNotes.trim() : undefined,
      };

      if (editing) {
        await updateCheckIn(entry);
      } else {
        await addCheckIn(entry);
      }

      router.back();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!idParam) return;

    Alert.alert('Supprimer', 'Supprimer ce check-in ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteCheckIn(idParam);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <IconButton icon="close" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.heading}>
          {title}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <Card mode="contained" style={[styles.card, styles.flatCard]}>
        <Card.Content style={styles.form}>
          <TextInput
            mode="outlined"
            label="Date (YYYY-MM-DD)"
            value={dateText}
            onChangeText={setDateText}
            disabled={saving}
          />

          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label="Sommeil (1-10)"
              value={sleepText}
              onChangeText={setSleepText}
              keyboardType="number-pad"
              disabled={saving}
              style={styles.half}
            />
            <TextInput
              mode="outlined"
              label="Stress (1-10)"
              value={stressText}
              onChangeText={setStressText}
              keyboardType="number-pad"
              disabled={saving}
              style={styles.half}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              mode="outlined"
              label="Énergie (1-10)"
              value={energyText}
              onChangeText={setEnergyText}
              keyboardType="number-pad"
              disabled={saving}
              style={styles.half}
            />
            <TextInput
              mode="outlined"
              label="Adhérence nutrition (1-10)"
              value={adherenceText}
              onChangeText={setAdherenceText}
              keyboardType="number-pad"
              disabled={saving}
              style={styles.half}
            />
          </View>

          <TextInput
            mode="outlined"
            label="Douleurs / notes (optionnel)"
            value={painNotes}
            onChangeText={setPainNotes}
            multiline
            disabled={saving}
          />

          {!isValidDateText(dateText) ? (
            <Text variant="bodySmall" style={{ color: theme.colors.error }}>
              Format de date invalide (attendu: YYYY-MM-DD)
            </Text>
          ) : null}

          {loading ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Chargement…
            </Text>
          ) : null}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        {editing ? (
          <Button mode="outlined" textColor={theme.colors.error} onPress={onDelete} disabled={saving}>
            Supprimer
          </Button>
        ) : null}
        <Button mode="contained" onPress={() => void onSave()} disabled={!canSave} loading={saving}>
          Enregistrer
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heading: {
    flex: 1,
    fontWeight: '800',
  },
  headerRight: {
    width: 44,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  flatCard: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  form: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
});

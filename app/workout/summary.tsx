import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type SummaryParams = {
  durationSeconds?: string;
  volumeTotal?: string;
  completedExercises?: string;
  totalExercises?: string;
  sessionTitle?: string;
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SummaryParams>();

  const durationSeconds = Number(params.durationSeconds ?? 0);
  const volumeTotal = Number(params.volumeTotal ?? 0);
  const completedExercises = Number(params.completedExercises ?? 0);
  const totalExercises = Number(params.totalExercises ?? 0);
  const sessionTitle = String(params.sessionTitle ?? 'Séance');

  const prettyVolume = useMemo(() => {
    if (!Number.isFinite(volumeTotal)) return '0';
    return Math.round(volumeTotal).toLocaleString('fr-FR');
  }, [volumeTotal]);

  const [rpe, setRpe] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleBlock}>
          <Text variant="headlineMedium">Séance Terminée ! 🎉</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {sessionTitle}
          </Text>
        </View>

        <Card mode="contained" style={styles.card}>
          <Card.Title title="Récapitulatif" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.rowBetween}>
              <Text variant="bodyMedium">Durée totale</Text>
              <Text variant="titleMedium">{formatDuration(durationSeconds)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text variant="bodyMedium">Volume total</Text>
              <Text variant="titleMedium">{prettyVolume}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text variant="bodyMedium">Exercices complétés</Text>
              <Text variant="titleMedium">
                {completedExercises}/{totalExercises}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card mode="elevated" style={styles.card}>
          <Card.Title title="Ressenti (RPE)" subtitle="1 = très facile • 10 = maximal" />
          <Card.Content style={styles.cardContent}>
            <View style={styles.rpeGrid}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => {
                const selected = value === rpe;
                return (
                  <Chip
                    key={value}
                    selected={selected}
                    onPress={() => setRpe(value)}
                    style={[styles.rpeChip, selected && styles.rpeChipSelected]}>
                    {value}
                  </Chip>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        <Card mode="elevated" style={styles.card}>
          <Card.Title title="Notes pour le coach" subtitle="Facultatif" />
          <Card.Content>
            <TextInput
              mode="outlined"
              placeholder="Ex: Bonne énergie, léger tiraillement genou droit sur les squats..."
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              style={styles.notes}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => router.push('/')}
          style={styles.primaryButton}
          contentStyle={styles.primaryButtonContent}>
          Valider et fermer
        </Button>
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
  titleBlock: {
    gap: 4,
  },
  subtitle: {
    opacity: 0.75,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardContent: {
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rpeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rpeChip: {
    minWidth: 44,
    justifyContent: 'center',
  },
  rpeChipSelected: {
    borderWidth: 1,
  },
  notes: {
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: 14,
  },
  primaryButtonContent: {
    paddingVertical: 8,
  },
});

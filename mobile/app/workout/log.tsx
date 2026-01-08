import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getWorkoutLogById, type WorkoutLogEntry } from '@/lib/workoutStorage';

type Params = {
  id?: string;
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const formatDateTimeFr = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function WorkoutLogDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<Params>();

  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState<WorkoutLogEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (typeof id !== 'string' || id.length === 0) {
        setLog(null);
        return;
      }

      const found = await getWorkoutLogById(id);
      setLog(found);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const prettyVolume = useMemo(() => {
    if (!log) return '0';
    return Math.round(log.volumeTotal).toLocaleString('fr-FR');
  }, [log]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.heading}>
              Séance
            </Text>
            <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
              {loading ? 'Chargement…' : log ? log.sessionTitle : 'Introuvable'}
            </Text>
          </View>
          <Button mode="text" onPress={() => router.back()}>
            Fermer
          </Button>
        </View>

        {!log ? (
          <Card mode="contained" style={[styles.card, styles.flatCard]}>
            <Card.Content>
              <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
                Cette séance n’existe pas (ou a été supprimée).
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Card mode="contained" style={[styles.card, styles.flatCard]}>
              <Card.Title title={log.sessionTitle} subtitle={formatDateTimeFr(log.createdAtISO)} />
              <Card.Content style={styles.metrics}>
                <View style={styles.metricRow}>
                  <Text variant="bodyMedium">Durée</Text>
                  <Text variant="titleMedium">{formatDuration(log.durationSeconds)}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text variant="bodyMedium">Volume</Text>
                  <Text variant="titleMedium">{prettyVolume}</Text>
                </View>
                <View style={styles.metricRow}>
                  <Text variant="bodyMedium">Exercices</Text>
                  <Text variant="titleMedium">
                    {log.completedExercises}/{log.totalExercises}
                  </Text>
                </View>
                <View style={styles.metricRow}>
                  <Text variant="bodyMedium">RPE</Text>
                  <Text variant="titleMedium">{typeof log.rpe === 'number' ? log.rpe : '—'}</Text>
                </View>
                {log.notes ? (
                  <>
                    <Divider style={styles.divider} />
                    <Text variant="titleSmall" style={styles.heading}>
                      Notes
                    </Text>
                    <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
                      {log.notes}
                    </Text>
                  </>
                ) : null}
              </Card.Content>
            </Card>

            <Text variant="titleMedium" style={[styles.heading, styles.sectionTitle]}>
              Détails
            </Text>

            <View style={styles.list}>
              {log.exercises.map((ex) => {
                return (
                  <Card key={ex.exerciseId} mode="contained" style={[styles.card, styles.flatCard]}>
                    <Card.Title title={ex.name} subtitle={`${ex.sets.filter((s) => s.done).length}/${ex.sets.length} séries`} />
                    <Card.Content style={styles.setsList}>
                      {ex.sets.map((s, idx) => {
                        const weight = typeof s.weightKg === 'number' ? `${s.weightKg} kg` : '—';
                        const reps = typeof s.reps === 'number' ? `${s.reps} reps` : '—';
                        const target = typeof s.targetReps === 'number' ? ` (cible ${s.targetReps})` : '';
                        return (
                          <View key={s.setId} style={styles.setRow}>
                            <Text variant="bodyMedium" style={styles.setLabel}>
                              S{idx + 1}
                            </Text>
                            <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
                              {weight} • {reps}{target}
                            </Text>
                          </View>
                        );
                      })}
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          </>
        )}
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
  heading: {
    fontWeight: '800',
  },
  subheading: {
    opacity: 0.8,
  },
  sectionTitle: {
    marginTop: 6,
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  flatCard: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  divider: {
    backgroundColor: '#333333',
    marginVertical: 10,
  },
  metrics: {
    gap: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  setsList: {
    gap: 8,
  },
  setRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'baseline',
  },
  setLabel: {
    width: 34,
    fontWeight: '800',
  },
});

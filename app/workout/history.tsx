import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadWorkoutLogs, type WorkoutLogEntry } from '@/lib/workoutStorage';

const formatDateTimeFr = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WorkoutLogEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await loadWorkoutLogs();
      setLogs(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const sorted = useMemo(() => {
    return [...logs].sort((a, b) => b.createdAtISO.localeCompare(a.createdAtISO));
  }, [logs]);

  const totalCount = sorted.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.heading}>
              Historique
            </Text>
            <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
              {loading ? 'Chargement…' : `${totalCount} séance(s)`}
            </Text>
          </View>
          <Button mode="text" onPress={() => router.back()}>
            Fermer
          </Button>
        </View>

        {sorted.length === 0 ? (
          <Card mode="contained" style={[styles.card, styles.flatCard]}>
            <Card.Content>
              <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
                Aucune séance terminée pour le moment.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.list}>
            {sorted.map((log, idx) => {
              const prettyVolume = Math.round(log.volumeTotal).toLocaleString('fr-FR');
              return (
                <Card
                  key={log.id}
                  mode="contained"
                  style={[styles.card, styles.flatCard]}
                  onPress={() =>
                    router.push({
                      pathname: '/workout/log' as const,
                      params: { id: log.id },
                    })
                  }>
                  <Card.Content style={styles.rowBetween}>
                    <View style={styles.leftCol}>
                      <Text variant="titleMedium" style={styles.heading}>
                        {log.sessionTitle}
                      </Text>
                      <Text variant="bodySmall" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
                        {formatDateTimeFr(log.createdAtISO)}
                      </Text>
                    </View>
                    <View style={styles.rightCol}>
                      <Text variant="labelLarge">{formatDuration(log.durationSeconds)}</Text>
                      <Text variant="bodySmall" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
                        Vol {prettyVolume}
                      </Text>
                    </View>
                  </Card.Content>
                  {idx < sorted.length - 1 ? <Divider style={styles.divider} /> : null}
                </Card>
              );
            })}
          </View>
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
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  leftCol: {
    flex: 1,
    gap: 4,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
});

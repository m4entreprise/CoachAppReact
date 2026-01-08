import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_DATA, type WeeklyProgramDay, type WorkoutDetailedSession } from '@/constants/mockData';

type DayParams = {
  dayId?: string;
};

function statusLabel(status: WeeklyProgramDay['status']): string {
  if (status === 'Done') return 'Fait';
  if (status === 'Rest') return 'Repos';
  return 'Prévu';
}

export default function WorkoutDayScreen() {
  const router = useRouter();
  const { dayId } = useLocalSearchParams<DayParams>();

  const day = useMemo(() => {
    return MOCK_DATA.weeklyProgram.jours.find((d) => d.id === dayId) ?? MOCK_DATA.weeklyProgram.jours[0];
  }, [dayId]);

  const detailedSession: WorkoutDetailedSession | null = useMemo(() => {
    if (!day.detailed_session_id) return null;
    return MOCK_DATA.workoutDetailedSessions.find((s) => s.id === day.detailed_session_id) ?? null;
  }, [day.detailed_session_id]);

  const canStart = day.status !== 'Rest' && Boolean(day.detailed_session_id);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.heading}>
              {day.jour}
            </Text>
            <Text variant="bodyMedium" style={styles.subheading}>
              {MOCK_DATA.weeklyProgram.semaine_label}
            </Text>
          </View>
          <Button mode="text" onPress={() => router.back()}>
            Fermer
          </Button>
        </View>

        <Card mode="contained" style={[styles.card, styles.flatCard]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.topRow}>
              <Chip style={styles.statusChip}>{statusLabel(day.status)}</Chip>
              {typeof day.duree === 'number' ? (
                <Text variant="labelMedium" style={styles.subheading}>
                  {day.duree} min
                </Text>
              ) : null}
            </View>
            <Text variant="titleLarge" style={styles.heading}>
              {day.titre}
            </Text>
            <Text variant="bodyMedium" style={styles.subheading}>
              {day.focus}
            </Text>

            <Button
              mode="contained"
              disabled={!canStart}
              onPress={() =>
                router.push({
                  pathname: '/workout/session',
                  params: { sessionId: String(day.detailed_session_id ?? '') },
                })
              }
              style={styles.startButton}
              contentStyle={styles.startButtonContent}>
              {day.status === 'Rest' ? 'Repos' : 'Démarrer cette séance'}
            </Button>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={[styles.sectionTitle, styles.heading]}>
          Détails
        </Text>

        {day.status === 'Rest' ? (
          <Card mode="contained" style={[styles.card, styles.flatCard]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="bodyMedium" style={styles.subheading}>
                Journée de récupération. Objectif : mobilité légère, marche, hydratation et sommeil.
              </Text>
            </Card.Content>
          </Card>
        ) : detailedSession ? (
          <Card mode="contained" style={[styles.card, styles.flatCard]}>
            <Card.Title title="Exercices" />
            <Card.Content style={styles.listContent}>
              {detailedSession.exercices.map((ex, idx) => (
                <View key={ex.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseHeader}>
                    <Text variant="titleMedium" style={styles.heading}>
                      {idx + 1}. {ex.nom}
                    </Text>
                    <Chip compact style={styles.weekChip}>
                      Repos {ex.repos_secondes}s
                    </Chip>
                  </View>
                  <Text variant="bodySmall" style={styles.subheading}>
                    {ex.series.length} séries • cibles: {ex.series.map((s) => s.reps_cibles).join(' / ')}
                  </Text>
                  {idx < detailedSession.exercices.length - 1 ? <Divider style={styles.divider} /> : null}
                </View>
              ))}
            </Card.Content>
          </Card>
        ) : (
          <Card mode="contained" style={[styles.card, styles.flatCard]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="bodyMedium" style={styles.subheading}>
                Aucun détail disponible pour cette séance.
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#111111',
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
    color: '#A1A1AA',
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
  sectionTitle: {
    marginTop: 6,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  flatCard: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardContent: {
    gap: 10,
  },
  listContent: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusChip: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
  },
  startButton: {
    marginTop: 8,
    borderRadius: 16,
  },
  startButtonContent: {
    paddingVertical: 8,
  },
  exerciseRow: {
    gap: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  weekChip: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333333',
  },
  divider: {
    backgroundColor: '#333333',
    marginTop: 10,
  },
});

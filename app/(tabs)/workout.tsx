import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Text, useTheme } from 'react-native-paper';

import { MOCK_DATA, type ProgramDayStatus, type Weekday, type WeeklyProgramDay } from '@/constants/mockData';

const WEEKDAY_BY_DATE_INDEX: Weekday[] = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

function statusLabel(status: ProgramDayStatus): string {
  if (status === 'Done') return 'Fait';
  if (status === 'Rest') return 'Repos';
  return 'Prévu';
}

export default function WorkoutScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { weeklyProgram } = MOCK_DATA;

  const todayWeekday = useMemo<Weekday>(() => {
    const idx = new Date().getDay();
    return WEEKDAY_BY_DATE_INDEX[idx] ?? 'Lundi';
  }, []);

  const todayPlan = useMemo<WeeklyProgramDay>(() => {
    return (
      weeklyProgram.jours.find((d) => d.jour === todayWeekday) ??
      weeklyProgram.jours.find((d) => d.status === 'Planned') ??
      weeklyProgram.jours[0]
    );
  }, [todayWeekday, weeklyProgram.jours]);

  const canStartToday = todayPlan.status !== 'Rest';
  const todaySessionId = todayPlan.detailed_session_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text variant="headlineSmall" style={styles.heading}>
            Training
          </Text>
          <Text variant="bodyMedium" style={styles.subheading}>
            {weeklyProgram.semaine_label} • Plan hebdo
          </Text>
        </View>
        <Button mode="text" onPress={() => router.push('/workout/history' as const)}> 
          Historique
        </Button>
      </View>

      <Text variant="titleMedium" style={[styles.sectionTitle, styles.heading]}>
        Séance du jour • {todayPlan.jour}
      </Text>

      <Card mode="contained" style={[styles.card, styles.flatCard]}>
        <ImageBackground
          source={{ uri: todayPlan.image_url ?? MOCK_DATA.workoutSession.image_url }}
          resizeMode="cover"
          imageStyle={styles.heroImage}
          style={styles.heroImageWrap}>
          <View style={styles.heroOverlayTop} />
          <View style={styles.heroOverlayBottom} />

          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <Chip
                style={styles.statusChip}
                textStyle={{ color: theme.colors.onSurface }}
                selectedColor={theme.colors.onSurface}>
                {statusLabel(todayPlan.status)}
              </Chip>
              {typeof todayPlan.duree === 'number' ? (
                <Text variant="labelMedium" style={styles.heroMeta}>
                  {todayPlan.duree} min
                </Text>
              ) : null}
            </View>

            <Text variant="titleLarge" style={styles.heroTitle}>
              {todayPlan.titre}
            </Text>
            <Text variant="bodyMedium" style={styles.heroMeta}>
              {todayPlan.focus}
            </Text>

            <Button
              mode="contained"
              disabled={!canStartToday}
              onPress={() =>
                router.push({
                  pathname: '/workout/session',
                  params: { sessionId: String(todaySessionId ?? '') },
                })
              }
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              style={styles.heroButton}
              contentStyle={styles.heroButtonContent}>
              {todayPlan.status === 'Rest' ? 'Repos' : 'Démarrer'}
            </Button>
          </View>
        </ImageBackground>
      </Card>

      <View style={styles.weekHeader}>
        <Text variant="titleMedium" style={styles.heading}>
          Programme de la semaine
        </Text>
        <Text variant="bodySmall" style={styles.subheading}>
          Vue d&apos;ensemble
        </Text>
      </View>

      <View style={styles.weekList}>
        {weeklyProgram.jours.map((day, idx) => {
          const isToday = day.jour === todayWeekday;
          const statusColor =
            day.status === 'Done'
              ? '#CCFF00'
              : day.status === 'Planned'
                ? '#A1A1AA'
                : '#333333';

          return (
            <Card
              key={day.id}
              mode="contained"
              style={[styles.weekCard, styles.flatCard]}
              onPress={() =>
                router.push({
                  pathname: '/workout/day',
                  params: { dayId: day.id },
                })
              }>
              <View style={styles.weekRow}>
                <View style={[styles.statusBar, { backgroundColor: statusColor, opacity: day.status === 'Done' ? 1 : 0.6 }]} />
                <View style={styles.weekMain}>
                  <View style={styles.weekTopRow}>
                    <Text variant="titleMedium" style={[styles.heading, isToday && styles.todayLabel]}>
                      {day.jour}
                    </Text>
                    <Chip compact style={styles.weekChip}>
                      {statusLabel(day.status)}
                    </Chip>
                  </View>
                  <Text variant="bodyMedium" style={styles.weekTitle}>
                    {day.titre}
                  </Text>
                  <Text variant="bodySmall" style={styles.subheading}>
                    {day.focus}
                  </Text>
                </View>
              </View>

              {idx < weeklyProgram.jours.length - 1 ? <Divider style={styles.divider} /> : null}
            </Card>
          );
        })}
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
    color: '#A1A1AA',
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
  heroImageWrap: {
    minHeight: 180,
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: 20,
  },
  heroOverlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroOverlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 130,
    backgroundColor: 'rgba(0,0,0,0.70)',
  },
  heroContent: {
    padding: 16,
    gap: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusChip: {
    backgroundColor: 'rgba(30,30,30,0.85)',
    borderWidth: 1,
    borderColor: '#333333',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroMeta: {
    color: '#A1A1AA',
  },
  heroButton: {
    marginTop: 8,
    borderRadius: 16,
  },
  heroButtonContent: {
    paddingVertical: 8,
  },
  weekHeader: {
    marginTop: 8,
    gap: 2,
  },
  weekList: {
    gap: 10,
  },
  weekCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  statusBar: {
    width: 6,
    borderRadius: 99,
    marginTop: 4,
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  weekMain: {
    flex: 1,
    gap: 4,
  },
  weekTopRow: {
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
  weekTitle: {
    color: '#FFFFFF',
  },
  todayLabel: {
    color: '#CCFF00',
  },
  divider: {
    backgroundColor: '#333333',
  },
});

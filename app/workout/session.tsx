import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_DATA, type WorkoutExercise } from '@/constants/mockData';

type SetInputState = {
  poids?: string;
  reps?: string;
  done: boolean;
};

type ExerciseDbExercise = {
  id?: string | number;
  name?: string;
  gifUrl?: string;
  gif_url?: string;
  imageUrl?: string;
  image_url?: string;
};

function normalizeExerciseName(input: string): string {
  return input
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractGifUrl(item: ExerciseDbExercise | null | undefined): string | null {
  if (!item) return null;
  const url = item.gifUrl ?? item.gif_url ?? item.imageUrl ?? item.image_url;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const session = useMemo(() => {
    if (typeof sessionId === 'string' && sessionId.length > 0) {
      return (
        MOCK_DATA.workoutDetailedSessions.find((s) => s.id === sessionId) ??
        MOCK_DATA.workoutDetailedSession
      );
    }

    return MOCK_DATA.workoutDetailedSession;
  }, [sessionId]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restLabel, setRestLabel] = useState<string>('');

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentWeight, setCurrentWeight] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  const [demoGifUrl, setDemoGifUrl] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const demoCache = useMemo(() => new Map<string, string | null>(), []);

  const initialSetState = useMemo(() => {
    const state: Record<string, SetInputState> = {};
    for (const ex of session.exercices) {
      for (const set of ex.series) {
        state[set.id] = { done: false };
      }
    }
    return state;
  }, [session.exercices]);

  const [setState, setSetState] = useState<Record<string, SetInputState>>(initialSetState);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (restSecondsLeft === null) return;
    if (restSecondsLeft <= 0) return;

    const id = setInterval(() => {
      setRestSecondsLeft((s) => (s === null ? null : Math.max(0, s - 1)));
    }, 1000);

    return () => clearInterval(id);
  }, [restSecondsLeft]);

  const totalSets = useMemo(() => {
    return session.exercices.reduce((acc, ex) => acc + ex.series.length, 0);
  }, [session.exercices]);

  const completedSets = useMemo(() => {
    return Object.values(setState).filter((s) => s.done).length;
  }, [setState]);

  const currentExercise = session.exercices[currentExerciseIndex];
  const currentSetPlan = currentExercise?.series[currentSetIndex];

  useEffect(() => {
    const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;

    if (!currentExercise?.nom) {
      setDemoGifUrl(null);
      setDemoError(null);
      return;
    }

    if (typeof apiKey !== 'string' || apiKey.length === 0) {
      setDemoGifUrl(null);
      setDemoError('missing_api_key');
      return;
    }

    const q = normalizeExerciseName(currentExercise.nom);
    if (q.length === 0) {
      setDemoGifUrl(null);
      setDemoError('invalid_query');
      return;
    }

    const cached = demoCache.get(q);
    if (cached !== undefined) {
      setDemoGifUrl(cached);
      setDemoError(cached ? null : 'not_found');
      return;
    }

    const abort = new AbortController();

    const run = async () => {
      try {
        setDemoLoading(true);
        setDemoError(null);

        const res = await fetch(
          `https://exercisedb-api1.p.rapidapi.com/api/v1/exercises/search?query=${encodeURIComponent(q)}`,
          {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'exercisedb-api1.p.rapidapi.com',
            },
            signal: abort.signal,
          },
        );

        if (!res.ok) {
          demoCache.set(q, null);
          setDemoGifUrl(null);
          setDemoError('http_error');
          return;
        }

        const data = (await res.json()) as unknown;
        const first = Array.isArray(data) ? (data[0] as ExerciseDbExercise | undefined) : null;
        const url = extractGifUrl(first);

        demoCache.set(q, url);
        setDemoGifUrl(url);
        setDemoError(url ? null : 'not_found');
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return;
        demoCache.set(q, null);
        setDemoGifUrl(null);
        setDemoError('network_error');
      } finally {
        setDemoLoading(false);
      }
    };

    run();
    return () => abort.abort();
  }, [currentExercise?.nom, demoCache]);

  const advanceAfterRest = () => {
    if (!currentExercise) return;

    const isLastSet = currentSetIndex >= currentExercise.series.length - 1;
    const isLastExercise = currentExerciseIndex >= session.exercices.length - 1;

    if (!isLastSet) {
      setCurrentSetIndex((i) => i + 1);
      return;
    }

    if (!isLastExercise) {
      setCurrentExerciseIndex((i) => i + 1);
      setCurrentSetIndex(0);
      return;
    }

    setIsFinished(true);
  };

  useEffect(() => {
    if (restSecondsLeft !== 0) return;
    setRestSecondsLeft(null);
    setRestLabel('');
    advanceAfterRest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restSecondsLeft]);

  useEffect(() => {
    if (!currentExercise || !currentSetPlan) return;
    const saved = setState[currentSetPlan.id];
    setCurrentWeight(saved?.poids ?? '');
    setCurrentReps(saved?.reps ?? '');
  }, [currentExerciseIndex, currentSetIndex, currentExercise, currentSetPlan, setState]);

  const startRest = (exercise: WorkoutExercise) => {
    setRestLabel(exercise.nom);
    setRestSecondsLeft(exercise.repos_secondes);
  };

  const updateSet = (setId: string, patch: Partial<SetInputState>) => {
    setSetState((prev) => ({
      ...prev,
      [setId]: {
        ...prev[setId],
        ...patch,
      },
    }));
  };

  const computeSummary = () => {
    let volumeTotal = 0;
    let completedExercises = 0;

    for (const ex of session.exercices) {
      let allSetsDone = true;
      for (const set of ex.series) {
        const state = setState[set.id];
        const done = Boolean(state?.done);
        if (!done) allSetsDone = false;

        if (done) {
          const poids = Number(String(state?.poids ?? '').replace(',', '.'));
          const reps = Number(String(state?.reps ?? '').replace(',', '.'));
          if (Number.isFinite(poids) && Number.isFinite(reps)) {
            volumeTotal += poids * reps;
          }
        }
      }

      if (allSetsDone && ex.series.length > 0) completedExercises += 1;
    }

    return {
      durationSeconds: elapsedSeconds,
      volumeTotal,
      completedExercises,
      totalExercises: session.exercices.length,
      sessionTitle: session.titre,
    };
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="titleLarge">Séance Active</Text>
            <Text variant="bodyMedium">{session.titre}</Text>
          </View>
          <View style={styles.headerRight}>
            <Chip icon="timer">{formatTimer(elapsedSeconds)}</Chip>
            <Button mode="text" onPress={() => router.back()}>
              Quitter
            </Button>
          </View>
        </View>

        {restSecondsLeft !== null ? (
          <Card mode="contained" style={styles.restCard}>
            <Card.Content style={styles.restContent}>
              <Text variant="titleMedium">Repos</Text>
              <Text variant="bodyMedium">
                {restLabel.length > 0 ? `${restLabel} • ` : ''}{restSecondsLeft}s
              </Text>
            </Card.Content>
          </Card>
        ) : null}

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.progressRow}>
            <Chip compact>
              {completedSets}/{totalSets} séries
            </Chip>
            <Chip compact>
              Ex {Math.min(currentExerciseIndex + 1, session.exercices.length)}/{session.exercices.length}
            </Chip>
          </View>

          {isFinished || !currentExercise || !currentSetPlan ? (
            <Card mode="contained" style={styles.exerciseCard}>
              <Card.Content style={styles.exerciseContent}>
                <Text variant="titleLarge">Séance terminée</Text>
                <Text variant="bodyMedium">Tu peux valider et fermer pour retourner au dashboard.</Text>
              </Card.Content>
            </Card>
          ) : (
            <Card mode="contained" style={styles.exerciseCard}>
              <Card.Content style={styles.exerciseContent}>
                <Text variant="headlineSmall" style={styles.exerciseTitle}>
                  {currentExercise.nom}
                </Text>

                <View style={styles.demoWrap}>
                  {demoGifUrl ? (
                    <Image source={{ uri: demoGifUrl }} style={styles.demoImage} resizeMode="cover" />
                  ) : (
                    <Video
                      source={require('@/518540514-9565e8f9-e35b-46f7-adf8-f49ab73b92c2.mp4')}
                      style={styles.demoImage}
                      resizeMode={ResizeMode.COVER}
                      isLooping
                      shouldPlay
                      isMuted
                    />
                  )}
                </View>

                {demoLoading ? (
                  <Text variant="bodySmall" style={styles.demoStatus}>
                    Chargement de la démo…
                  </Text>
                ) : demoError ? (
                  <Text variant="bodySmall" style={styles.demoStatus}>
                    Démo indisponible.
                  </Text>
                ) : null}

                <View style={styles.chipsRow}>
                  <Chip compact>Repos {currentExercise.repos_secondes}s</Chip>
                  <Chip compact>
                    Série {currentSetIndex + 1}/{currentExercise.series.length}
                  </Chip>
                  <Chip compact>Cible {currentSetPlan.reps_cibles} reps</Chip>
                </View>

                <View style={styles.inputsRow}>
                  <TextInput
                    mode="outlined"
                    label="Poids"
                    value={currentWeight}
                    onChangeText={setCurrentWeight}
                    keyboardType="numeric"
                    style={styles.input}
                    editable={restSecondsLeft === null}
                  />
                  <TextInput
                    mode="outlined"
                    label="Reps"
                    value={currentReps}
                    onChangeText={setCurrentReps}
                    keyboardType="numeric"
                    style={styles.input}
                    editable={restSecondsLeft === null}
                  />
                </View>

                <Button
                  mode="contained"
                  disabled={restSecondsLeft !== null}
                  onPress={() => {
                    updateSet(currentSetPlan.id, {
                      poids: currentWeight,
                      reps: currentReps,
                      done: true,
                    });
                    startRest(currentExercise);
                  }}
                  style={styles.validateButton}
                  contentStyle={styles.validateButtonContent}>
                  Valider la série
                </Button>
              </Card.Content>
            </Card>
          )}

          <Button
            mode="contained"
            onPress={() => {
              const summary = computeSummary();
              router.push({
                pathname: '/workout/summary' as const,
                params: {
                  durationSeconds: String(summary.durationSeconds),
                  volumeTotal: String(summary.volumeTotal),
                  completedExercises: String(summary.completedExercises),
                  totalExercises: String(summary.totalExercises),
                  sessionTitle: summary.sessionTitle,
                },
              });
            }}
            style={styles.finishButton}>
            Terminer la séance
          </Button>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  restCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  restContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  exerciseContent: {
    gap: 12,
  },
  exerciseTitle: {
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1E1E1E',
  },
  demoImage: {
    width: '100%',
    height: 220,
  },
  demoStatus: {
    marginTop: 8,
    color: '#A1A1AA',
  },
  demoPlaceholder: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
  },
  validateButton: {
    borderRadius: 14,
  },
  validateButtonContent: {
    paddingVertical: 8,
  },
  finishButton: {
    marginTop: 6,
    borderRadius: 14,
  },
});

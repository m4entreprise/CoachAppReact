import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Checkbox, ProgressBar, Text, useTheme } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';
import { Activity, Calendar, Camera, ChevronRight, Flame, Pill, Utensils } from 'lucide-react-native';

import { MOCK_DATA, type SupplementTiming } from '@/constants/mockData';
import {
    ensureSupplementProtocolInitialized,
    getDayKey,
    loadSupplementComplianceDay,
    setSupplementTakenForDay,
    type SupplementProtocolItem,
} from '@/lib/supplementStorage';

type TimingSection = 'Matin' | 'Midi' | 'Soir';

type DashboardSupplement = SupplementProtocolItem & {
  isTaken: boolean;
  takenAtISO?: string;
};

function timingToSection(timing: SupplementTiming): TimingSection {
  if (timing === 'Pre-Workout') return 'Midi';
  return timing;
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { dashboard, workoutSession } = MOCK_DATA;

  const [protocol, setProtocol] = useState<SupplementProtocolItem[]>([]);
  const [takenById, setTakenById] = useState<Record<string, { taken: boolean; takenAtISO?: string }>>({});

  const todayKey = useMemo(() => getDayKey(new Date()), []);

  const loadSupplements = useCallback(async () => {
    const p = await ensureSupplementProtocolInitialized();
    setProtocol(p);
    const day = await loadSupplementComplianceDay(todayKey);
    setTakenById(day.takenById);
  }, [todayKey]);

  useFocusEffect(
    useCallback(() => {
      void loadSupplements();
    }, [loadSupplements])
  );

  const supplements = useMemo<DashboardSupplement[]>(() => {
    return protocol.map((p) => {
      const state = takenById[p.id];
      return {
        ...p,
        isTaken: state?.taken ?? false,
        takenAtISO: state?.takenAtISO,
      };
    });
  }, [protocol, takenById]);

  const supplementsBySection = useMemo(() => {
    const grouped: Record<TimingSection, DashboardSupplement[]> = {
      Matin: [],
      Midi: [],
      Soir: [],
    };

    for (const s of supplements) {
      grouped[timingToSection(s.timing)].push(s);
    }

    return grouped;
  }, [supplements]);

  const takenCount = useMemo(() => supplements.filter((s) => s.isTaken).length, [supplements]);
  const supplementsProgress = supplements.length === 0 ? 0 : takenCount / supplements.length;

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).format(new Date());
  }, []);

  const openSupplements = () => router.push('/supplements');

  const toggleSupplement = async (id: string) => {
    const prev = takenById[id]?.taken ?? false;
    const updated = await setSupplementTakenForDay(todayKey, id, !prev);
    setTakenById(updated.takenById);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerTopLine}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.heading}>
              Aujourd&apos;hui
            </Text>
            <Text variant="bodyMedium" style={styles.subheading}>
              {dateLabel}
            </Text>
          </View>
          <View style={[styles.streakPill, { borderColor: theme.colors.outline }]}> 
            <Flame size={16} color={theme.colors.primary} />
            <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
              {dashboard.streak_jours} jours
            </Text>
          </View>
        </View>

        <Text variant="titleLarge" style={styles.heading}>
          Bonjour {dashboard.nom_eleve}
        </Text>
        <Text variant="bodyMedium" style={styles.subheading}>
          Focus du jour: séance + compléments.
        </Text>
      </View>

      <View style={styles.quickGrid}>
        <Pressable
          style={[styles.quickTile, { borderColor: theme.colors.outline }]}
          onPress={() => router.push('/workout')}
        >
          <View style={[styles.quickIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
            <Activity size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.quickText}>
            <Text variant="titleMedium" style={styles.heading}>
              Training
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Voir le plan
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
        </Pressable>

        <Pressable
          style={[styles.quickTile, { borderColor: theme.colors.outline }]}
          onPress={() => router.push('/nutrition')}
        >
          <View style={[styles.quickIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
            <Utensils size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.quickText}>
            <Text variant="titleMedium" style={styles.heading}>
              Nutrition
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Ajouter un repas
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
        </Pressable>

        <Pressable
          style={[styles.quickTile, { borderColor: theme.colors.outline }]}
          onPress={() => router.push('/profile/progress' as const)}
        >
          <View style={[styles.quickIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
            <Camera size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.quickText}>
            <Text variant="titleMedium" style={styles.heading}>
              Photos
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Nouvelle évolution
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
        </Pressable>

        <Pressable
          style={[styles.quickTile, { borderColor: theme.colors.outline }]}
          onPress={() => router.push('/checkin/entry' as const)}
        >
          <View style={[styles.quickIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
            <Calendar size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.quickText}>
            <Text variant="titleMedium" style={styles.heading}>
              Check-in
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              En 1 minute
            </Text>
          </View>
          <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <Card mode="contained" style={[styles.card, styles.flatCard]}>
        <Card.Content style={styles.dayCardContent}>
          <View style={styles.dayCardTop}>
            <View style={styles.dayCardTitle}>
              <View style={[styles.dayIcon, { borderColor: theme.colors.outline }]}> 
                <Pill size={18} color={theme.colors.primary} />
              </View>
              <View>
                <Text variant="titleMedium" style={styles.heading}>
                  Compléments
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Progression du jour
                </Text>
              </View>
            </View>

            <Pressable onPress={openSupplements} style={styles.inlineAction}>
              <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                Voir tout
              </Text>
              <ChevronRight size={16} color={theme.colors.primary} />
            </Pressable>
          </View>

          <View style={styles.rowBetween}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurface }}>
              {takenCount}/{supplements.length}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {Math.round(supplementsProgress * 100)}%
            </Text>
          </View>

          <ProgressBar progress={supplementsProgress} color={theme.colors.primary} style={styles.progress} />
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={[styles.sectionTitle, styles.heading]}>
        Séance du jour
      </Text>

      <Card mode="contained" style={[styles.card, styles.heroCard, styles.flatCard]}>
        <ImageBackground
          source={{ uri: workoutSession.image_url }}
          resizeMode="cover"
          imageStyle={styles.heroImage}
          style={styles.heroImageWrap}>
          <View style={styles.heroOverlayTop} />
          <View style={styles.heroOverlayBottom} />

          <View style={styles.heroContent}>
            <View style={styles.heroTagRow}>
              <View style={[styles.heroTag, { borderColor: 'rgba(255,255,255,0.18)' }]}> 
                <Activity size={16} color={theme.colors.primary} />
                <Text variant="labelMedium" style={{ color: '#FFFFFF' }}>
                  {workoutSession.duree} min
                </Text>
              </View>
              <Text variant="labelMedium" style={{ color: '#A1A1AA' }}>
                {workoutSession.status === 'Todo' ? 'À faire' : 'Fait'}
              </Text>
            </View>

            <Text variant="titleLarge" style={styles.heroTitle}>
              {workoutSession.titre}
            </Text>

            {workoutSession.status === 'Todo' ? (
              <Button
                mode="contained"
                onPress={() => router.push('/workout/session')}
                style={styles.heroButton}
                contentStyle={styles.heroButtonContent}>
                Démarrer
              </Button>
            ) : (
              <Button mode="outlined" onPress={() => router.push('/workout/history' as const)}>
                Voir l&apos;historique
              </Button>
            )}
          </View>
        </ImageBackground>
      </Card>

      <View style={styles.sectionHeaderRow}>
        <Text variant="titleMedium" style={styles.heading}>
          Suppléments (aujourd&apos;hui)
        </Text>
        <Button mode="text" onPress={openSupplements}>
          Gérer
        </Button>
      </View>

      {(['Matin', 'Midi', 'Soir'] as const).map((section) => {
        const items = supplementsBySection[section];
        if (items.length === 0) return null;

        return (
          <Card key={section} mode="contained" style={[styles.card, styles.flatCard]}>
            <Card.Title title={section} />
            <Card.Content style={styles.cardContentTight}>
              {items.map((s) => (
                <Checkbox.Item
                  key={s.id}
                  label={
                    s.isTaken && s.takenAtISO
                      ? `${s.nom} • ${s.dosage} • ${new Intl.DateTimeFormat('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(s.takenAtISO))}`
                      : `${s.nom} • ${s.dosage}`
                  }
                  status={s.isTaken ? 'checked' : 'unchecked'}
                  onPress={() => {
                    void toggleSupplement(s.id);
                  }}
                />
              ))}
            </Card.Content>
          </Card>
        );
      })}
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
    gap: 6,
  },
  headerTopLine: {
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
    color: '#A1A1AA',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
  },
  sectionTitle: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
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
    paddingTop: 12,
  },
  cardContentTight: {
    gap: 10,
  },
  quickGrid: {
    gap: 10,
  },
  quickTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quickText: {
    flex: 1,
  },
  dayCardContent: {
    gap: 12,
  },
  dayCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dayCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dayIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progress: {
    height: 10,
    borderRadius: 99,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCard: {
    padding: 0,
  },
  heroImageWrap: {
    minHeight: 170,
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
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  heroContent: {
    padding: 16,
    gap: 6,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
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
});

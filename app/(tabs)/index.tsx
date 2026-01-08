import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Checkbox, ProgressBar, Text, useTheme } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

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

  const toggleSupplement = async (id: string) => {
    const prev = takenById[id]?.taken ?? false;
    const updated = await setSupplementTakenForDay(todayKey, id, !prev);
    setTakenById(updated.takenById);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Avatar.Text
          size={44}
          label={dashboard.nom_eleve.slice(0, 1).toUpperCase()}
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
        />
        <View style={styles.headerText}>
          <Text variant="titleLarge" style={styles.heading}>
            Bonjour {dashboard.nom_eleve} 👋
          </Text>
          <Text variant="bodyMedium" style={styles.subheading}>
            {dashboard.streak_jours} jours de suite 🔥
          </Text>
        </View>
      </View>

      <Card mode="contained" style={[styles.card, styles.flatCard]}>
        <Card.Content style={styles.cardContentTight}>
          <View style={styles.rowBetween}>
            <Text variant="titleMedium" style={styles.heading}>
              Progression du jour
            </Text>
            <Text variant="labelMedium">
              {takenCount}/{supplements.length}
            </Text>
          </View>
          <ProgressBar
            progress={supplementsProgress}
            color={theme.colors.primary}
            style={styles.progress}
          />
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={[styles.sectionTitle, styles.heading]}>
        Ma Séance du jour
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
            <Text variant="titleLarge" style={styles.heroTitle}>
              {workoutSession.titre}
            </Text>
            <Text variant="bodyMedium" style={styles.heroMeta}>
              {workoutSession.duree} min • {workoutSession.status === 'Todo' ? 'À faire' : 'Fait'}
            </Text>

            {workoutSession.status === 'Todo' ? (
              <Button
                mode="contained"
                onPress={() => router.push('/workout/session')}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
                style={styles.heroButton}
                contentStyle={styles.heroButtonContent}>
                Démarrer
              </Button>
            ) : null}
          </View>
        </ImageBackground>
      </Card>

      <Text variant="titleMedium" style={[styles.sectionTitle, styles.heading]}>
        Mon Protocole (Suppléments)
      </Text>

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    borderRadius: 20,
  },
  headerText: {
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

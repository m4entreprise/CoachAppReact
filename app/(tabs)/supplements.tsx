import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Checkbox, Dialog, IconButton, List, Portal, Text, useTheme } from 'react-native-paper';

import {
    ensureSupplementProtocolInitialized,
    getDayKey,
    getSupplementComplianceDays,
    loadSupplementComplianceDay,
    parseDayKeyToDate,
    setSupplementTakenForDay,
    type SupplementProtocolItem,
    type SupplementTiming,
} from '@/lib/supplementStorage';

type SectionKey = SupplementTiming;

const SECTION_CONFIG: {
  key: SectionKey;
  title: string;
  description: string;
  icon: string;
}[] = [
 
  {
    key: 'Matin',
    title: '🌅 MATIN',
    description: 'Au réveil / Petit déj',
    icon: 'weather-sunset',
  },
  {
    key: 'Pre-Workout',
    title: '⚡ PRE-WORKOUT',
    description: '30min avant le sport',
    icon: 'flash',
  },
  {
    key: 'Soir',
    title: '🌙 SOIR',
    description: 'Avant de dormir',
    icon: 'weather-night',
  },
];

export default function SupplementsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [protocol, setProtocol] = useState<SupplementProtocolItem[]>([]);
  const [selectedDayKey, setSelectedDayKey] = useState(() => getDayKey(new Date()));
  const [takenById, setTakenById] = useState<Record<string, { taken: boolean; takenAtISO?: string }>>({});
  const [historyDays, setHistoryDays] = useState<string[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    Matin: true,
    'Pre-Workout': true,
    Soir: true,
  });

  const [selected, setSelected] = useState<SupplementProtocolItem | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await ensureSupplementProtocolInitialized();
      setProtocol(p);

      const day = await loadSupplementComplianceDay(selectedDayKey);
      setTakenById(day.takenById);

      const days = await getSupplementComplianceDays();
      setHistoryDays(days);
    } finally {
      setLoading(false);
    }
  }, [selectedDayKey]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const supplementsByTiming = useMemo(() => {
    const grouped: Record<SectionKey, SupplementProtocolItem[]> = {
      Matin: [],
      'Pre-Workout': [],
      Soir: [],
    };
    for (const s of protocol) grouped[s.timing].push(s);
    return grouped;
  }, [protocol]);

  const selectedDateLabel = useMemo(() => {
    const d = parseDayKeyToDate(selectedDayKey);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }, [selectedDayKey]);

  const setDayAndClose = (dayKey: string) => {
    setSelectedDayKey(dayKey);
    setHistoryVisible(false);
  };

  const toggleTaken = async (supplementId: string) => {
    const prev = takenById[supplementId]?.taken ?? false;
    const next = !prev;
    const updated = await setSupplementTakenForDay(selectedDayKey, supplementId, next);
    setTakenById(updated.takenById);

    const days = await getSupplementComplianceDays();
    setHistoryDays(days);
  };

  const openInfo = (supplement: SupplementProtocolItem) => {
    setSelected(supplement);
    setDialogVisible(true);
  };

  const closeInfo = () => {
    setDialogVisible(false);
    setSelected(null);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="titleLarge">Suppléments</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {loading ? 'Chargement…' : `Checklist du jour • ${selectedDateLabel}`}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Button
              mode="contained"
              onPress={() =>
                router.push({
                  pathname: '/supplements/protocol' as const,
                })
              }>
              Gérer
            </Button>
          </View>
        </View>

        <Card mode="contained" style={[styles.card, styles.flatCard]}>
          <Card.Content style={styles.dayRow}>
            <Text variant="titleMedium" style={styles.heading}>
              {selectedDateLabel}
            </Text>
            <View style={styles.dayActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setHistoryVisible(true);
                }}
              >
                Historique
              </Button>
              <Button
                mode="text"
                onPress={() => {
                  setSelectedDayKey(getDayKey(new Date()));
                }}
              >
                Aujourd’hui
              </Button>
            </View>
          </Card.Content>
        </Card>

        <List.Section>
          {SECTION_CONFIG.map((section) => {
            const items = supplementsByTiming[section.key];

            return (
              <List.Accordion
                key={section.key}
                title={section.title}
                description={section.description}
                left={(props) => <List.Icon {...props} icon={section.icon} />}
                expanded={expanded[section.key]}
                onPress={() =>
                  setExpanded((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
                }
                style={styles.accordion}>
                {items.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text variant="bodyMedium">Aucun complément prévu.</Text>
                  </View>
                ) : (
                  <View style={styles.cardsStack}>
                    {items.map((s) => (
                      <Card key={s.id} mode="elevated" style={styles.card}>
                        <Card.Title
                          title={s.nom}
                          subtitle={s.frequency ? `Complément • ${s.frequency}` : 'Complément'}
                          right={() => (
                            <View style={styles.cardRight}>
                              <Checkbox
                                status={takenById[s.id]?.taken ? 'checked' : 'unchecked'}
                                onPress={() => {
                                  void toggleTaken(s.id);
                                }}
                              />
                              <IconButton icon="information-outline" onPress={() => openInfo(s)} />
                            </View>
                          )}
                        />
                        <Card.Content>
                          <Text variant="titleMedium" style={styles.dosage}>
                            {s.dosage}
                          </Text>
                          {takenById[s.id]?.takenAtISO ? (
                            <Text variant="bodySmall" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                              Pris à{' '}
                              {new Intl.DateTimeFormat('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(new Date(takenById[s.id].takenAtISO as string))}
                            </Text>
                          ) : null}
                        </Card.Content>
                      </Card>
                    ))}
                  </View>
                )}
              </List.Accordion>
            );
          })}
        </List.Section>
      </ScrollView>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={closeInfo}
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}>
          <Dialog.Title style={styles.dialogTitle}>{selected?.nom ?? 'Info'}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogSubtitle}>
              Pourquoi prendre ce complément ?
            </Text>
            <Text variant="bodySmall" style={[styles.dialogText, { color: theme.colors.onSurfaceVariant }]}>
              {selected?.description ?? ''}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              mode="contained"
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              style={styles.dialogButton}
              onPress={closeInfo}>
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={historyVisible}
          onDismiss={() => setHistoryVisible(false)}
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}>
          <Dialog.Title style={styles.dialogTitle}>Historique</Dialog.Title>
          <Dialog.Content>
            {historyDays.length === 0 ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Aucun jour enregistré pour le moment.
              </Text>
            ) : (
              <View style={styles.historyList}>
                {historyDays.slice(0, 14).map((d) => (
                  <Button
                    key={d}
                    mode={d === selectedDayKey ? 'contained' : 'outlined'}
                    onPress={() => setDayAndClose(d)}>
                    {new Intl.DateTimeFormat('fr-FR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                    }).format(parseDayKeyToDate(d))}
                  </Button>
                ))}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setHistoryVisible(false)}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    justifyContent: 'center',
  },
  heading: {
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    opacity: 0.8,
  },
  flatCard: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  accordion: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardsStack: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dosage: {
    marginBottom: 6,
  },
  description: {
    opacity: 0.8,
  },
  emptyState: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  historyList: {
    gap: 8,
  },
  dialogText: {
    marginTop: 8,
    opacity: 0.95,
  },
  dialog: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  dialogTitle: {
    fontWeight: '800',
  },
  dialogSubtitle: {
    opacity: 0.85,
  },
  dialogButton: {
    borderRadius: 14,
  },
});

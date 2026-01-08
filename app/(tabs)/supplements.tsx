import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, IconButton, List, Portal, Text, useTheme } from 'react-native-paper';

import { MOCK_DATA, type Supplement, type SupplementTiming } from '@/constants/mockData';

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
  const theme = useTheme();
  const supplements = MOCK_DATA.supplements;
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    Matin: true,
    'Pre-Workout': true,
    Soir: true,
  });

  const [selected, setSelected] = useState<Supplement | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const supplementsByTiming = useMemo(() => {
    const grouped: Record<SectionKey, Supplement[]> = {
      Matin: [],
      'Pre-Workout': [],
      Soir: [],
    };
    for (const s of supplements) grouped[s.timing].push(s);
    return grouped;
  }, [supplements]);

  const openInfo = (supplement: Supplement) => {
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
        <Text variant="titleLarge">Nutrition / Protocoles</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Suis ton protocole comme une check-list, section par section.
        </Text>

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
                          subtitle="Complément"
                          right={() => (
                            <IconButton icon="information-outline" onPress={() => openInfo(s)} />
                          )}
                        />
                        <Card.Content>
                          <Text variant="titleMedium" style={styles.dosage}>
                            {s.dosage}
                          </Text>
                          <Text variant="bodySmall" style={styles.description}>
                            {s.description}
                          </Text>
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
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    opacity: 0.8,
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

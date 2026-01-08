import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text, useTheme } from 'react-native-paper';

import { loadCheckIns, type CheckInEntry } from '@/lib/checkinStorage';

const formatDateFr = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function CheckInHistoryModal() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CheckInEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await loadCheckIns();
      setItems(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const sorted = useMemo(() => [...items].sort((a, b) => b.dateISO.localeCompare(a.dateISO)), [items]);

  const openAdd = () => router.push('/checkin/entry' as const);

  const openEdit = (id: string) =>
    router.push({
      pathname: '/checkin/entry' as const,
      params: { id },
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <IconButton icon="close" onPress={() => router.back()} />
        <View style={styles.headerLeft}>
          <Text variant="titleLarge" style={styles.heading}>
            Check-in hebdo
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {loading ? 'Chargement…' : `${sorted.length} entrée(s)`}
          </Text>
        </View>
        <Button mode="contained" onPress={openAdd}>
          Ajouter
        </Button>
      </View>

      {sorted.length === 0 ? (
        <Card mode="contained" style={[styles.card, styles.flatCard]}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Ajoute ton premier check-in pour suivre ton ressenti (sommeil, stress, énergie…).
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={openAdd}>
              Ajouter
            </Button>
          </Card.Actions>
        </Card>
      ) : (
        <View style={styles.list}>
          {sorted.map((c, idx) => (
            <Pressable key={c.id} onPress={() => openEdit(c.id)}>
              <Card mode="contained" style={[styles.card, styles.flatCard]}>
                <Card.Content style={styles.rowBetween}>
                  <View style={styles.col}>
                    <Text variant="titleMedium" style={styles.heading}>
                      {formatDateFr(c.dateISO)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                      Sommeil {c.sleep}/10 • Stress {c.stress}/10 • Énergie {c.energy}/10
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Adhérence nutrition {c.nutritionAdherence}/10
                    </Text>
                    {c.painNotes ? (
                      <Text
                        variant="bodySmall"
                        numberOfLines={2}
                        style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                        {c.painNotes}
                      </Text>
                    ) : null}
                  </View>
                  <IconButton icon="pencil-outline" onPress={() => openEdit(c.id)} />
                </Card.Content>
                {idx < sorted.length - 1 ? <Divider style={styles.divider} /> : null}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
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
    gap: 10,
  },
  headerLeft: {
    flex: 1,
  },
  heading: {
    fontWeight: '800',
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
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
    paddingRight: 8,
  },
});

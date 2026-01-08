import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';

import { loadMeals, type MealEntry } from '@/lib/nutritionStorage';

const formatDateFr = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date);
};

const formatTimeFr = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function NutritionScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<MealEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await loadMeals();
      setMeals(all);
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
    return [...meals].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  }, [meals]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todayMeals = useMemo(() => sorted.filter((m) => m.dateISO.slice(0, 10) === todayKey), [sorted, todayKey]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text variant="headlineSmall" style={styles.heading}>
            Nutrition
          </Text>
          <Text variant="bodyMedium" style={styles.subheading}>
            {loading ? 'Chargement…' : `${todayMeals.length} repas aujourd’hui • ${sorted.length} au total`}
          </Text>
        </View>
        <Button mode="contained" onPress={() => router.push('/nutrition/entry' as const)}>
          Ajouter
        </Button>
      </View>

      <Card mode="contained" style={[styles.card, styles.flatCard]}>
        <Card.Title title="Résumé du jour" />
        <Card.Content style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <Text variant="bodyMedium">Repas</Text>
            <Text variant="titleMedium">{todayMeals.length}</Text>
          </View>
          <View style={styles.kpiRow}>
            <Text variant="bodyMedium">Photos</Text>
            <Text variant="titleMedium">{todayMeals.filter((m) => Boolean(m.photoUri)).length}</Text>
          </View>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={[styles.heading, styles.sectionTitle]}>
        Journal
      </Text>

      {sorted.length === 0 ? (
        <Card mode="contained" style={[styles.card, styles.flatCard]}>
          <Card.Content>
            <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
              Ajoute un repas (photo + note) pour commencer ton journal.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <View style={styles.list}>
          {sorted.map((m, idx) => (
            <Pressable
              key={m.id}
              onPress={() =>
                router.push({
                  pathname: '/nutrition/entry' as const,
                  params: { id: m.id },
                })
              }>
              <Card mode="contained" style={[styles.card, styles.flatCard]}>
                <Card.Content style={styles.mealRow}>
                  <View style={[styles.thumb, { borderColor: theme.colors.outline }]}> 
                    {m.photoUri ? (
                      <Image source={{ uri: m.photoUri }} style={styles.thumbImage} />
                    ) : (
                      <View style={styles.thumbEmpty}>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          —
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.mealMain}>
                    <Text variant="titleMedium" style={styles.heading}>
                      {m.type}
                    </Text>
                    <Text variant="bodySmall" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
                      {formatDateFr(m.dateISO)} • {formatTimeFr(m.dateISO)}
                    </Text>
                    {m.notes ? (
                      <Text
                        variant="bodySmall"
                        numberOfLines={2}
                        style={[styles.subheading, { color: theme.colors.onSurfaceVariant, marginTop: 6 }]}>
                        {m.notes}
                      </Text>
                    ) : null}
                  </View>
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
  kpiGrid: {
    gap: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealMain: {
    flex: 1,
  },
});

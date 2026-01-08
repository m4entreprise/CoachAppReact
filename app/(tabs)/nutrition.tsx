import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, useTheme } from 'react-native-paper';

import { Apple, CalendarDays, Camera, ChevronRight, Coffee, Sandwich, Soup } from 'lucide-react-native';

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

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).format(new Date());
  }, []);

  const todayPhotosCount = useMemo(() => todayMeals.filter((m) => Boolean(m.photoUri)).length, [todayMeals]);

  const iconForMealType = (t: MealEntry['type']) => {
    if (t === 'Petit dej') return Coffee;
    if (t === 'Déjeuner') return Sandwich;
    if (t === 'Dîner') return Soup;
    return Apple;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerTopLine}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.heading}>
              Nutrition
            </Text>
            <Text variant="bodyMedium" style={styles.subheading}>
              {dateLabel}
            </Text>
          </View>

          <View style={[styles.statsPill, { borderColor: theme.colors.outline }]}> 
            <CalendarDays size={16} color={theme.colors.primary} />
            <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
              {loading ? '—' : `${todayMeals.length} repas`}
            </Text>
          </View>
        </View>

        <Text variant="bodyMedium" style={styles.subheading}>
          {loading ? 'Chargement…' : `${sorted.length} entrée(s) au total`}
        </Text>

        <Button mode="contained" onPress={() => router.push('/nutrition/entry' as const)}>
          Ajouter un repas
        </Button>
      </View>

      <Card mode="contained" style={[styles.card, styles.flatCard]}>
        <Card.Content style={styles.summaryContent}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryTitle}>
              <View style={[styles.summaryIcon, { borderColor: theme.colors.outline }]}> 
                <CalendarDays size={18} color={theme.colors.primary} />
              </View>
              <View>
                <Text variant="titleMedium" style={styles.heading}>
                  Résumé du jour
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {todayKey}
                </Text>
              </View>
            </View>
            <View style={styles.summaryRight}>
              <View style={[styles.summaryMini, { borderColor: theme.colors.outline }]}> 
                <Camera size={16} color={theme.colors.primary} />
                <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
                  {todayPhotosCount}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Repas
              </Text>
              <Text variant="titleMedium">{todayMeals.length}</Text>
            </View>
            <View style={styles.kpiRow}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Photos
              </Text>
              <Text variant="titleMedium">{todayPhotosCount}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.sectionHeaderRow}>
        <Text variant="titleMedium" style={styles.heading}>
          Journal
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {loading ? '—' : `${sorted.length} entrée(s)`}
        </Text>
      </View>

      {sorted.length === 0 ? (
        <Card mode="contained" style={[styles.card, styles.flatCard]}>
          <Card.Content>
            <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
              Ajoute un repas (photo + note) pour commencer ton journal.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => router.push('/nutrition/entry' as const)}>
              Ajouter
            </Button>
          </Card.Actions>
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
                  <View style={[styles.typeIcon, { borderColor: theme.colors.outline }]}> 
                    {(() => {
                      const Icon = iconForMealType(m.type);
                      return <Icon size={18} color={theme.colors.primary} />;
                    })()}
                  </View>
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
                  <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
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
    gap: 8,
  },
  headerTopLine: {
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  statsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
  },
  summaryContent: {
    gap: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
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
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    marginTop: 2,
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

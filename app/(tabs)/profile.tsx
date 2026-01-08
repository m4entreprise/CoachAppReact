import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';

import WeightChart from '@/components/profile/WeightChart';
import {
    loadMeasurements,
    loadPersonalInfo,
    loadProgressPhotos,
    type MeasurementEntry,
    type PersonalInfo,
    type ProgressPhotoEntry,
} from '@/lib/profileStorage';

const formatDateFr = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [personal, setPersonal] = useState<PersonalInfo>({});
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhotoEntry[]>([]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  }, [entries]);

  const latest = sortedEntries[0];
  const previous = sortedEntries[1];

  const weightDeltaText = useMemo(() => {
    if (latest?.weightKg === undefined || previous?.weightKg === undefined) return null;
    const delta = latest.weightKg - previous.weightKg;
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)} kg`;
  }, [latest?.weightKg, previous?.weightKg]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, p, prog] = await Promise.all([loadMeasurements(), loadPersonalInfo(), loadProgressPhotos()]);
      setEntries(m);
      setPersonal(p);
      setProgressPhotos(prog);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const openAdd = () => router.push('/profile/entry');
  const openEdit = (id: string) =>
    router.push({
      pathname: '/profile/entry',
      params: { id },
    });
  const openPersonal = () => router.push('/profile/personal');

  const sortedProgress = useMemo(() => {
    return [...progressPhotos].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  }, [progressPhotos]);

  const openProgressAdd = () => router.push('/profile/progress');
  const openProgressEdit = (id: string) =>
    router.push({
      pathname: '/profile/progress',
      params: { id },
    });

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text variant="titleLarge">Mon Profil</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Suivi du poids et des mensurations dans le temps.
            </Text>
          </View>
          <IconButton icon="plus" onPress={openAdd} />
        </View>

         <Card mode="elevated" style={styles.card}>
           <Card.Title title="Informations personnelles" subtitle="Profil stable" />
           <Card.Content>
             <View style={styles.personalRow}>
               <View style={styles.avatarWrap}>
                 {personal.profilePhotoUri ? (
                   <Image source={{ uri: personal.profilePhotoUri }} style={styles.avatarImage} />
                 ) : (
                   <View style={[styles.avatarEmpty, { borderColor: theme.colors.outline }]}>
                     <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                       —
                     </Text>
                   </View>
                 )}
               </View>
               <View style={styles.personalText}>
                 <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                   {(personal.firstName || personal.lastName)
                     ? `${personal.firstName ?? ''} ${personal.lastName ?? ''}`.trim()
                     : 'À compléter'}
                 </Text>
                 <Text
                   variant="bodySmall"
                   style={[styles.muted, { color: theme.colors.onSurfaceVariant, marginTop: 6 }]}>
                   Taille : {personal.heightCm !== undefined ? `${personal.heightCm} cm` : '—'}
                 </Text>
                 <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                   Objectif : {personal.goal ?? '—'}
                 </Text>
               </View>
             </View>
           </Card.Content>
           <Card.Actions>
             <Button mode="contained" onPress={openPersonal}>
               Modifier
             </Button>
           </Card.Actions>
         </Card>

         <Card mode="elevated" style={styles.card}>
           <Card.Title title="Évolutions photo" subtitle={loading ? 'Chargement…' : `${sortedProgress.length} entrée(s)`} />
           <Card.Content>
             {sortedProgress.length === 0 ? (
               <Text variant="bodyMedium" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                 Ajoute tes photos (face / profil / dos) pour suivre ta progression.
               </Text>
             ) : (
               <View style={styles.progressGrid}>
                 {sortedProgress.slice(0, 3).map((p) => {
                   const previewUri = p.frontUri ?? p.sideUri ?? p.backUri;
                   return (
                     <Pressable key={p.id} onPress={() => openProgressEdit(p.id)} style={styles.progressItem}>
                       <View style={[styles.progressThumb, { borderColor: theme.colors.outline }]}> 
                         {previewUri ? (
                           <Image source={{ uri: previewUri }} style={styles.progressThumbImage} />
                         ) : (
                           <View style={styles.progressThumbEmpty}>
                             <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                               —
                             </Text>
                           </View>
                         )}
                       </View>
                       <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                         {formatDateFr(p.dateISO)}
                       </Text>
                     </Pressable>
                   );
                 })}
               </View>
             )}
           </Card.Content>
           <Card.Actions>
             <Button mode="contained" onPress={openProgressAdd}>
               Ajouter des photos
             </Button>
           </Card.Actions>
         </Card>

        <Card mode="elevated" style={styles.card}>
          <Card.Title title="Résumé" subtitle={loading ? 'Chargement…' : `${sortedEntries.length} entrée(s)`} />
          <Card.Content>
            {latest?.weightKg ? (
              <View style={styles.kpiRow}>
                <Text variant="titleMedium">{latest.weightKg.toFixed(1)} kg</Text>
                <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                  {weightDeltaText ? `Δ ${weightDeltaText}` : '—'}
                </Text>
              </View>
            ) : (
              <Text variant="bodyMedium" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                Ajoute une première entrée pour voir ton suivi.
              </Text>
            )}
            {latest ? (
              <Text variant="bodySmall" style={[styles.muted, { marginTop: 6, color: theme.colors.onSurfaceVariant }]}>
                Dernière mise à jour : {formatDateFr(latest.dateISO)}
              </Text>
            ) : null}

             <WeightChart
               points={sortedEntries
                 .filter((e) => e.weightKg !== undefined)
                 .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
                 .slice(-14)
                 .map((e) => ({ dateISO: e.dateISO, weightKg: e.weightKg as number }))}
             />
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={openAdd}>
              Ajouter une mesure
            </Button>
          </Card.Actions>
        </Card>

        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">Historique</Text>
        </View>

        {sortedEntries.length === 0 ? (
          <Card mode="outlined" style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                Aucune mesure enregistrée.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.stack}>
            {sortedEntries.map((e) => (
              <Card key={e.id} mode="elevated" style={styles.card}>
                <Card.Title
                  title={formatDateFr(e.dateISO)}
                  subtitle={e.weightKg !== undefined ? `${e.weightKg.toFixed(1)} kg` : '—'}
                  right={() => <IconButton icon="pencil-outline" onPress={() => openEdit(e.id)} />}
                />
                <Card.Content>
                  <View style={styles.measurementsGrid}>
                    <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                      Taille: {e.waistCm ?? '—'} cm
                    </Text>
                    <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                      Hanches: {e.hipsCm ?? '—'} cm
                    </Text>
                    <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                      Poitrine: {e.chestCm ?? '—'} cm
                    </Text>
                    <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                      Bras: {e.armCm ?? '—'} cm
                    </Text>
                    <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                      Cuisse: {e.thighCm ?? '—'} cm
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.8,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  emptyCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 8,
  },
  stack: {
    gap: 10,
  },
  muted: {
    opacity: 0.9,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  measurementsGrid: {
    gap: 6,
  },
  personalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 32,
  },
  personalText: {
    flex: 1,
  },
  progressGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  progressItem: {
    flex: 1,
  },
  progressThumb: {
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
  },
  progressThumbImage: {
    width: '100%',
    height: '100%',
  },
  progressThumbEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

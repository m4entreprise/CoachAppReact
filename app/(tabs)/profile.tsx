import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';

import { CalendarDays, Camera, ChevronRight, Settings, TrendingUp, User } from 'lucide-react-native';

import WeightChart from '@/components/profile/WeightChart';
import { loadCheckIns, type CheckInEntry } from '@/lib/checkinStorage';
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
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([]);

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

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).format(new Date());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, p, prog, checkins] = await Promise.all([
        loadMeasurements(),
        loadPersonalInfo(),
        loadProgressPhotos(),
        loadCheckIns(),
      ]);
      setEntries(m);
      setPersonal(p);
      setProgressPhotos(prog);
      setCheckIns(checkins);
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

  const openProgressGallery = () =>
    router.push({
      pathname: '/profile/gallery' as const,
    });

  const sortedCheckIns = useMemo(() => {
    return [...checkIns].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  }, [checkIns]);

  const latestCheckIn = sortedCheckIns[0];

  const openCheckInHistory = () =>
    router.push({
      pathname: '/checkin/history' as const,
    });

  const openCheckInAdd = () => router.push('/checkin/entry' as const);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerTopLine}>
            <View style={styles.headerLeft}>
              <Text variant="headlineSmall" style={styles.heading}>
                Profil
              </Text>
              <Text variant="bodyMedium" style={styles.subheading}>
                {dateLabel}
              </Text>
            </View>

            <View style={[styles.headerPill, { borderColor: theme.colors.outline }]}> 
              <TrendingUp size={16} color={theme.colors.primary} />
              <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>
                {loading ? '—' : `${sortedEntries.length} mesures`}
              </Text>
            </View>
          </View>

          <Text variant="bodyMedium" style={styles.subheading}>
            Suivi du poids, photos et check-ins.
          </Text>
        </View>

        <View style={styles.quickGrid}>
          <Pressable style={[styles.quickTile, { borderColor: theme.colors.outline }]} onPress={openPersonal}>
            <View style={[styles.quickIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
              <Settings size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.quickText}>
              <Text variant="titleMedium" style={styles.heading}>
                Profil
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Infos personnelles
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
          </Pressable>

          <Pressable style={[styles.quickTile, { borderColor: theme.colors.outline }]} onPress={openAdd}>
            <View style={[styles.quickIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
              <TrendingUp size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.quickText}>
              <Text variant="titleMedium" style={styles.heading}>
                Mesures
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Ajouter un poids
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.onSurfaceVariant} />
          </Pressable>

          <Pressable style={[styles.quickTile, { borderColor: theme.colors.outline }]} onPress={openProgressAdd}>
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

          <Pressable style={[styles.quickTile, { borderColor: theme.colors.outline }]} onPress={openCheckInAdd}>
            <View style={[styles.quickIcon, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}> 
              <CalendarDays size={20} color={theme.colors.primary} />
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
          <Card.Content style={styles.sectionCardContent}>
            <View style={styles.sectionHeaderBlock}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionIcon, { borderColor: theme.colors.outline }]}> 
                  <User size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.sectionTitleText}>
                  <Text variant="titleMedium" style={styles.heading}>
                    Informations personnelles
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Profil stable
                  </Text>
                </View>
              </View>

              <Pressable onPress={openPersonal} style={styles.inlineAction}>
                <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
                  Modifier
                </Text>
                <ChevronRight size={16} color={theme.colors.primary} />
              </Pressable>
            </View>

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
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
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
        </Card>

         <Card mode="contained" style={[styles.card, styles.flatCard]}>
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
             <Button mode="outlined" onPress={openProgressGallery}>
               Voir la galerie
             </Button>
           </Card.Actions>
         </Card>

        <Card mode="contained" style={[styles.card, styles.flatCard]}>
          <Card.Title title="Check-in hebdo" subtitle={loading ? 'Chargement…' : `${sortedCheckIns.length} entrée(s)`} />
          <Card.Content>
            {sortedCheckIns.length === 0 ? (
              <Text variant="bodyMedium" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                Ajoute un check-in (sommeil, stress, énergie…) pour suivre ton ressenti semaine après semaine.
              </Text>
            ) : (
              <View>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Dernier : {formatDateFr(latestCheckIn.dateISO)}
                </Text>
                <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.onSurfaceVariant, marginTop: 6 }]}>
                  Sommeil {latestCheckIn.sleep}/10 • Stress {latestCheckIn.stress}/10 • Énergie {latestCheckIn.energy}/10
                </Text>
                <Text variant="bodySmall" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                  Adhérence nutrition {latestCheckIn.nutritionAdherence}/10
                </Text>
              </View>
            )}
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={openCheckInHistory}>
              Ouvrir
            </Button>
          </Card.Actions>
        </Card>

        <Card mode="contained" style={[styles.card, styles.flatCard]}>
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

        <View style={styles.sectionHeaderRow}>
          <Text variant="titleMedium" style={styles.heading}>
            Historique
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {loading ? '—' : `${sortedEntries.length} entrée(s)`}
          </Text>
        </View>

        {sortedEntries.length === 0 ? (
          <Card mode="contained" style={[styles.card, styles.flatCard]}>
            <Card.Content>
              <Text variant="bodyMedium" style={[styles.muted, { color: theme.colors.onSurfaceVariant }]}>
                Aucune mesure enregistrée.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.stack}>
            {sortedEntries.map((e) => (
              <Card key={e.id} mode="contained" style={[styles.card, styles.flatCard]}>
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
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
  },
  heading: {
    fontWeight: '800',
  },
  subheading: {
    color: '#A1A1AA',
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  flatCard: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionHeader: {
    marginTop: 6,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  sectionCardContent: {
    gap: 12,
  },
  sectionHeaderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
  },
  sectionTitleText: {
    flex: 1,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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

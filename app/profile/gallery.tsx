import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text, useTheme } from 'react-native-paper';

import { loadProgressPhotos, type ProgressPhotoEntry } from '@/lib/profileStorage';

const formatDateFr = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export default function ProfileGalleryModal() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ProgressPhotoEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await loadProgressPhotos();
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

  const openAdd = () => router.push('/profile/progress' as const);

  const openEdit = (id: string) =>
    router.push({
      pathname: '/profile/progress' as const,
      params: { id },
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <IconButton icon="close" onPress={() => router.back()} />
        <View style={styles.headerLeft}>
          <Text variant="titleLarge" style={styles.heading}>
            Galerie évolutions
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
              Ajoute tes photos (face / profil / dos) pour suivre ta progression.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <View style={styles.list}>
          {sorted.map((p, idx) => {
            const previewUri = p.frontUri ?? p.sideUri ?? p.backUri;
            const photoCount = Number(Boolean(p.frontUri)) + Number(Boolean(p.sideUri)) + Number(Boolean(p.backUri));

            return (
              <Pressable key={p.id} onPress={() => openEdit(p.id)}>
                <Card mode="contained" style={[styles.card, styles.flatCard]}>
                  <Card.Content style={styles.row}>
                    <View style={[styles.thumb, { borderColor: theme.colors.outline }]}>
                      {previewUri ? (
                        <Image source={{ uri: previewUri }} style={styles.thumbImage} />
                      ) : (
                        <View style={styles.thumbEmpty}>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            —
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.main}>
                      <Text variant="titleMedium" style={styles.heading}>
                        {formatDateFr(p.dateISO)}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                        {photoCount} photo(s)
                      </Text>
                    </View>
                    <IconButton icon="pencil-outline" onPress={() => openEdit(p.id)} />
                  </Card.Content>
                  {idx < sorted.length - 1 ? <Divider style={styles.divider} /> : null}
                </Card>
              </Pressable>
            );
          })}
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
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
  main: {
    flex: 1,
  },
});

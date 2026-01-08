import { useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deletePersistedImageAsync, persistImageAsync } from '@/lib/imageStorage';
import {
    addProgressPhoto,
    deleteProgressPhoto,
    loadProgressPhotos,
    type ProgressPhotoEntry,
    updateProgressPhoto,
} from '@/lib/profileStorage';

type Params = {
  id?: string;
};

type SlotKey = 'front' | 'side' | 'back';

async function pickImageUri(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
  if (!permission.granted) return null;

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.9,
  });

  if (res.canceled) return null;
  const first = res.assets?.[0];
  return first?.uri ?? null;
}

export default function ProfileProgressModal() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<Params>();

  const isEdit = typeof id === 'string' && id.length > 0;

  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<ProgressPhotoEntry | null>(null);

  const [dateText, setDateText] = useState(() => new Date().toISOString().slice(0, 10));
  const [frontUri, setFrontUri] = useState<string | undefined>(undefined);
  const [sideUri, setSideUri] = useState<string | undefined>(undefined);
  const [backUri, setBackUri] = useState<string | undefined>(undefined);

  const title = useMemo(() => (isEdit ? 'Modifier une évolution' : 'Ajouter une évolution'), [isEdit]);

  const hydrate = useCallback((entry: ProgressPhotoEntry) => {
    setDateText(new Date(entry.dateISO).toISOString().slice(0, 10));
    setFrontUri(entry.frontUri);
    setSideUri(entry.sideUri);
    setBackUri(entry.backUri);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!isEdit) {
        setExisting(null);
        return;
      }

      const all = await loadProgressPhotos();
      const found = all.find((e) => e.id === id) ?? null;
      setExisting(found);
      if (found) hydrate(found);
    } finally {
      setLoading(false);
    }
  }, [hydrate, id, isEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  const setSlotUri = (slot: SlotKey, uri: string | undefined) => {
    if (slot === 'front') setFrontUri(uri);
    if (slot === 'side') setSideUri(uri);
    if (slot === 'back') setBackUri(uri);
  };

  const getSlotUri = (slot: SlotKey) => {
    if (slot === 'front') return frontUri;
    if (slot === 'side') return sideUri;
    return backUri;
  };

  const pickForSlot = async (slot: SlotKey) => {
    const picked = await pickImageUri();
    if (!picked) return;

    const persisted = await persistImageAsync(picked, `progress_${slot}`);

    const prev = getSlotUri(slot);
    setSlotUri(slot, persisted);

    if (prev && prev !== persisted) await deletePersistedImageAsync(prev);
  };

  const removeSlot = async (slot: SlotKey) => {
    const prev = getSlotUri(slot);
    setSlotUri(slot, undefined);
    await deletePersistedImageAsync(prev);
  };

  const submit = async () => {
    const date = new Date(`${dateText}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return;

    const entry: ProgressPhotoEntry = {
      id: isEdit ? String(id) : `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      dateISO: date.toISOString(),
      frontUri,
      sideUri,
      backUri,
    };

    const hasAny = Boolean(entry.frontUri || entry.sideUri || entry.backUri);
    if (!hasAny) return;

    if (isEdit) {
      await updateProgressPhoto(entry);
    } else {
      await addProgressPhoto(entry);
    }

    router.back();
  };

  const onDelete = async () => {
    if (!isEdit) return;

    await deletePersistedImageAsync(frontUri);
    await deletePersistedImageAsync(sideUri);
    await deletePersistedImageAsync(backUri);

    await deleteProgressPhoto(String(id));
    router.back();
  };

  const renderSlot = (slot: SlotKey, label: string, uri: string | undefined) => {
    return (
      <View style={styles.slot}>
        <Text variant="titleSmall" style={styles.heading}>
          {label}
        </Text>
        <View style={[styles.slotPreview, { borderColor: theme.colors.border }]}> 
          {uri ? (
            <Image source={{ uri }} style={styles.slotImage} resizeMode="cover" />
          ) : (
            <View style={styles.slotEmpty}>
              <Text variant="bodySmall" style={{ color: theme.colors.text }}>
                —
              </Text>
            </View>
          )}
        </View>
        <View style={styles.slotActions}>
          <Button mode="contained" onPress={() => void pickForSlot(slot)}>
            Choisir
          </Button>
          <Button disabled={!uri} onPress={() => void removeSlot(slot)}>
            Retirer
          </Button>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.heading}>
              {title}
            </Text>
            <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.text }]}>
              {loading ? 'Chargement…' : isEdit && !existing ? 'Évolution introuvable' : 'Photos face / profil / dos'}
            </Text>
          </View>
          <Button mode="text" onPress={() => router.back()}>
            Fermer
          </Button>
        </View>

        <Card mode="contained" style={[styles.card, styles.flatCard]}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label="Date (YYYY-MM-DD)"
              value={dateText}
              onChangeText={setDateText}
              autoCapitalize="none"
              style={styles.input}
            />

            <Divider style={styles.divider} />

            <View style={styles.slotsGrid}>
              {renderSlot('front', 'Face', frontUri)}
              {renderSlot('side', 'Profil', sideUri)}
              {renderSlot('back', 'Dos', backUri)}
            </View>
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button onPress={() => router.back()}>Annuler</Button>
            <Button mode="contained" onPress={() => void submit()}>
              Enregistrer
            </Button>
          </Card.Actions>
        </Card>

        {isEdit ? (
          <Card mode="contained" style={[styles.card, styles.flatCard]}>
            <Card.Title title="Zone dangereuse" />
            <Card.Content>
              <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.text }]}>
                Supprime cette évolution photo.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" buttonColor="#EF4444" textColor="#111111" onPress={() => void onDelete()}>
                Supprimer
              </Button>
            </Card.Actions>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  heading: {
    fontWeight: '800',
  },
  subheading: {
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  flatCard: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  input: {
    marginBottom: 10,
  },
  divider: {
    backgroundColor: '#333333',
    marginVertical: 10,
  },
  actions: {
    justifyContent: 'space-between',
  },
  slotsGrid: {
    gap: 12,
  },
  slot: {
    gap: 8,
  },
  slotPreview: {
    height: 240,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  slotEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
});

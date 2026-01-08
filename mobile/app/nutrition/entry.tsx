import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deletePersistedImageAsync, persistImageAsync } from '@/lib/imageStorage';
import { addMeal, deleteMeal, getMealById, type MealEntry, type MealType, updateMeal } from '@/lib/nutritionStorage';

type Params = {
  id?: string;
};

const MEAL_TYPES: MealType[] = ['Petit dej', 'Déjeuner', 'Dîner', 'Snack'];

export default function NutritionEntryModal() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<Params>();

  const isEdit = typeof id === 'string' && id.length > 0;

  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<MealEntry | null>(null);

  const [dateText, setDateText] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<MealType>('Déjeuner');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const [snackVisible, setSnackVisible] = useState(false);
  const [snackText, setSnackText] = useState('');

  const showSnack = (msg: string) => {
    setSnackText(msg);
    setSnackVisible(true);
  };

  const title = useMemo(() => (isEdit ? 'Modifier un repas' : 'Ajouter un repas'), [isEdit]);

  const hydrate = useCallback((entry: MealEntry) => {
    setDateText(new Date(entry.dateISO).toISOString().slice(0, 10));
    setType(entry.type);
    setPhotoUri(entry.photoUri);
    setNotes(entry.notes ?? '');
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!isEdit) {
        setExisting(null);
        return;
      }

      const found = await getMealById(String(id));
      setExisting(found);
      if (found) hydrate(found);
    } finally {
      setLoading(false);
    }
  }, [hydrate, id, isEdit]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
    if (!permission.granted) {
      showSnack("Permission galerie refusée. Tu peux l'activer dans les réglages.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });

    if (res.canceled) return;
    const picked = res.assets?.[0]?.uri;
    if (!picked) return;

    const persisted = await persistImageAsync(picked, 'meal');
    const prev = photoUri;
    setPhotoUri(persisted);
    if (prev && prev !== persisted) await deletePersistedImageAsync(prev);
  };

  const removePhoto = async () => {
    const prev = photoUri;
    setPhotoUri(undefined);
    await deletePersistedImageAsync(prev);
  };

  const submit = async () => {
    const now = new Date();
    const timePart = now.toISOString().slice(11, 19);
    const date = new Date(`${dateText}T${timePart}.000Z`);
    if (Number.isNaN(date.getTime())) return;

    const entry: MealEntry = {
      id: isEdit ? String(id) : `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      dateISO: date.toISOString(),
      type,
      photoUri,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    if (isEdit) {
      await updateMeal(entry);
    } else {
      await addMeal(entry);
    }

    router.back();
  };

  const onDelete = async () => {
    if (!isEdit) return;

    await deletePersistedImageAsync(photoUri);
    await deleteMeal(String(id));
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.heading}>
              {title}
            </Text>
            <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
              {loading ? 'Chargement…' : isEdit && !existing ? 'Repas introuvable' : 'Photo + note'}
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

            <Text variant="titleSmall" style={[styles.heading, { marginTop: 6 }]}>
              Type
            </Text>
            <View style={styles.typeRow}>
              {MEAL_TYPES.map((t) => (
                <Button key={t} mode={t === type ? 'contained' : 'outlined'} onPress={() => setType(t)}>
                  {t}
                </Button>
              ))}
            </View>

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.heading}>
              Photo
            </Text>
            <View style={[styles.photoBox, { borderColor: theme.colors.outline }]}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={styles.photoEmpty}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    —
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.photoActions}>
              <Button mode="contained" onPress={() => void pickPhoto()}>
                Choisir
              </Button>
              <Button disabled={!photoUri} onPress={() => void removePhoto()}>
                Retirer
              </Button>
            </View>

            <Divider style={styles.divider} />

            <TextInput
              mode="outlined"
              label="Notes"
              placeholder="Ex: faim ++, resto, bonne énergie..."
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
            />
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
              <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.onSurfaceVariant }]}>
                Supprime ce repas.
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

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={4000}
        action={{
          label: 'Réglages',
          onPress: () => {
            void Linking.openSettings();
          },
        }}>
        {snackText}
      </Snackbar>
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
  heading: {
    fontWeight: '800',
  },
  subheading: {
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
  input: {
    marginBottom: 10,
  },
  divider: {
    backgroundColor: '#333333',
    marginVertical: 10,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  photoBox: {
    height: 240,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#1E1E1E',
    marginTop: 10,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  actions: {
    justifyContent: 'space-between',
  },
});

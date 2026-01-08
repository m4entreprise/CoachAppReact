import { useTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { deletePersistedImageAsync, persistImageAsync } from '@/lib/imageStorage';
import { loadPersonalInfo, savePersonalInfo, type PersonalInfo } from '@/lib/profileStorage';

const toNumberOrUndefined = (raw: string) => {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function ProfilePersonalModal() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [heightText, setHeightText] = useState('');
  const [goal, setGoal] = useState('');
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>(undefined);

  const prettyTitle = useMemo(() => 'Informations personnelles', []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const info = await loadPersonalInfo();
      setFirstName(info.firstName ?? '');
      setLastName(info.lastName ?? '');
      setHeightText(info.heightCm !== undefined ? String(info.heightCm) : '');
      setGoal(info.goal ?? '');
      setProfilePhotoUri(info.profilePhotoUri);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
    if (!permission.granted) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });

    if (res.canceled) return;
    const uri = res.assets?.[0]?.uri;
    if (!uri) return;

    const persisted = await persistImageAsync(uri, 'profile');
    const prev = profilePhotoUri;
    setProfilePhotoUri(persisted);
    if (prev && prev !== persisted) await deletePersistedImageAsync(prev);
  };

  const removeProfilePhoto = async () => {
    const prev = profilePhotoUri;
    setProfilePhotoUri(undefined);
    await deletePersistedImageAsync(prev);
  };

  const submit = async () => {
    const next: PersonalInfo = {
      firstName: firstName.trim() ? firstName.trim() : undefined,
      lastName: lastName.trim() ? lastName.trim() : undefined,
      heightCm: toNumberOrUndefined(heightText),
      goal: goal.trim() ? goal.trim() : undefined,
      profilePhotoUri,
    };

    await savePersonalInfo(next);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.heading}>
              {prettyTitle}
            </Text>
            <Text variant="bodyMedium" style={[styles.subheading, { color: theme.colors.text }]}>
              {loading ? 'Chargement…' : 'Profil stable (non daté)'}
            </Text>
          </View>
          <Button mode="text" onPress={() => router.back()}>
            Fermer
          </Button>
        </View>

        <Card mode="contained" style={[styles.card, styles.flatCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.heading}>
              Photo de profil
            </Text>
            <View style={styles.photoRow}>
              <View style={[styles.avatar, { borderColor: theme.colors.border }]}>
                {profilePhotoUri ? (
                  <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarEmpty}>
                    <Text variant="bodySmall" style={{ color: theme.colors.text }}>
                      —
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.photoActions}>
                <Button mode="contained" onPress={() => void pickProfilePhoto()}>
                  Choisir
                </Button>
                <Button disabled={!profilePhotoUri} onPress={() => void removeProfilePhoto()}>
                  Retirer
                </Button>
              </View>
            </View>

            <Divider style={styles.divider} />

            <TextInput
              mode="outlined"
              label="Prénom"
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Nom"
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
            />

            <Divider style={styles.divider} />

            <TextInput
              mode="outlined"
              label="Taille (cm)"
              value={heightText}
              onChangeText={setHeightText}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Objectif"
              value={goal}
              onChangeText={setGoal}
              multiline
              numberOfLines={3}
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
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  photoActions: {
    flex: 1,
    gap: 10,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    borderWidth: 1,
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
  },
  actions: {
    justifyContent: 'space-between',
  },
});

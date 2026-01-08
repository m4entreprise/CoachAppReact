import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Dialog,
    IconButton,
    Portal,
    RadioButton,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';

import {
    addSupplementProtocolItem,
    deleteSupplementProtocolItem,
    ensureSupplementProtocolInitialized,
    loadSupplementProtocol,
    updateSupplementProtocolItem,
    type SupplementProtocolItem,
    type SupplementTiming,
} from '@/lib/supplementStorage';

const TIMING_OPTIONS: { key: SupplementTiming; label: string }[] = [
  { key: 'Matin', label: 'Matin' },
  { key: 'Pre-Workout', label: 'Pre-Workout' },
  { key: 'Soir', label: 'Soir' },
];

function buildId(): string {
  return `supp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function SupplementsProtocolModal() {
  const router = useRouter();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SupplementProtocolItem[]>([]);

  const [editVisible, setEditVisible] = useState(false);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('add');
  const [current, setCurrent] = useState<SupplementProtocolItem | null>(null);

  const [nom, setNom] = useState('');
  const [dosage, setDosage] = useState('');
  const [timing, setTiming] = useState<SupplementTiming>('Matin');
  const [frequency, setFrequency] = useState('Quotidien');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await ensureSupplementProtocolInitialized();
      const all = await loadSupplementProtocol();
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

  const byTiming = useMemo(() => {
    const grouped: Record<SupplementTiming, SupplementProtocolItem[]> = {
      Matin: [],
      'Pre-Workout': [],
      Soir: [],
    };

    for (const s of items) grouped[s.timing].push(s);

    return grouped;
  }, [items]);

  const openAdd = () => {
    setEditMode('add');
    setCurrent(null);
    setNom('');
    setDosage('');
    setTiming('Matin');
    setFrequency('Quotidien');
    setDescription('');
    setEditVisible(true);
  };

  const openEdit = (item: SupplementProtocolItem) => {
    setEditMode('edit');
    setCurrent(item);
    setNom(item.nom);
    setDosage(item.dosage);
    setTiming(item.timing);
    setFrequency(item.frequency ?? '');
    setDescription(item.description ?? '');
    setEditVisible(true);
  };

  const closeEdit = () => {
    setEditVisible(false);
  };

  const save = async () => {
    const normalized: SupplementProtocolItem = {
      id: editMode === 'add' ? buildId() : (current?.id ?? buildId()),
      nom: nom.trim(),
      dosage: dosage.trim(),
      timing,
      frequency: frequency.trim().length > 0 ? frequency.trim() : undefined,
      description: description.trim().length > 0 ? description.trim() : undefined,
    };

    if (normalized.nom.length === 0 || normalized.dosage.length === 0) {
      return;
    }

    if (editMode === 'add') {
      await addSupplementProtocolItem(normalized);
    } else {
      await updateSupplementProtocolItem(normalized);
    }

    await load();
    closeEdit();
  };

  const remove = async () => {
    if (!current) return;
    await deleteSupplementProtocolItem(current.id);
    await load();
    closeEdit();
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <IconButton icon="close" onPress={() => router.back()} />
          <View style={styles.headerMain}>
            <Text variant="titleLarge" style={styles.heading}>
              Protocole suppléments
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {loading ? 'Chargement…' : `${items.length} complément(s)`}
            </Text>
          </View>
          <Button mode="contained" onPress={openAdd}>
            Ajouter
          </Button>
        </View>

        {items.length === 0 ? (
          <Card mode="contained" style={[styles.card, styles.flatCard]}>
            <Card.Content>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Ajoute ton premier complément.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.stack}>
            {(['Matin', 'Pre-Workout', 'Soir'] as const).map((k) => {
              const group = byTiming[k];
              if (group.length === 0) return null;

              return (
                <Card key={k} mode="contained" style={[styles.card, styles.flatCard]}>
                  <Card.Title title={k} />
                  <Card.Content style={styles.list}>
                    {group.map((s) => (
                      <Card key={s.id} mode="elevated" style={styles.itemCard}>
                        <Card.Title
                          title={s.nom}
                          subtitle={s.frequency ? `• ${s.frequency}` : undefined}
                          right={() => <IconButton icon="pencil" onPress={() => openEdit(s)} />}
                        />
                        <Card.Content>
                          <Text variant="titleMedium">{s.dosage}</Text>
                          {s.description ? (
                            <Text
                              variant="bodySmall"
                              style={{ color: theme.colors.onSurfaceVariant, marginTop: 6 }}>
                              {s.description}
                            </Text>
                          ) : null}
                        </Card.Content>
                      </Card>
                    ))}
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={editVisible}
          onDismiss={closeEdit}
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}>
          <Dialog.Title style={styles.dialogTitle}>
            {editMode === 'add' ? 'Ajouter un complément' : 'Modifier le complément'}
          </Dialog.Title>
          <Dialog.Content>
            <View style={styles.form}>
              <TextInput mode="outlined" label="Nom" value={nom} onChangeText={setNom} />
              <TextInput mode="outlined" label="Dosage" value={dosage} onChangeText={setDosage} />
              <TextInput mode="outlined" label="Fréquence" value={frequency} onChangeText={setFrequency} />
              <TextInput
                mode="outlined"
                label="Description (optionnel)"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={styles.radioBlock}>
                <Text variant="labelLarge">Timing</Text>
                <RadioButton.Group value={timing} onValueChange={(v) => setTiming(v as SupplementTiming)}>
                  {TIMING_OPTIONS.map((t) => (
                    <RadioButton.Item key={t.key} label={t.label} value={t.key} />
                  ))}
                </RadioButton.Group>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            {editMode === 'edit' ? (
              <Button textColor={theme.colors.error} onPress={() => void remove()}>
                Supprimer
              </Button>
            ) : null}
            <Button onPress={closeEdit}>Annuler</Button>
            <Button mode="contained" onPress={() => void save()}>
              Enregistrer
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
  headerMain: {
    flex: 1,
  },
  heading: {
    fontWeight: '800',
  },
  stack: {
    gap: 12,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  flatCard: {
    borderWidth: 1,
    borderColor: '#333333',
  },
  list: {
    gap: 10,
  },
  itemCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dialog: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  dialogTitle: {
    fontWeight: '800',
  },
  form: {
    gap: 10,
  },
  radioBlock: {
    marginTop: 6,
  },
});

<script setup>
import Modal from '@/Components/Modal.vue';
import { computed, ref, watch } from 'vue';
import CoachLayout from '@/Layouts/CoachLayout.vue';
import { Head, Link, router, useForm } from '@inertiajs/vue3';
import { useAutoAnimate } from '@formkit/auto-animate/vue';
import draggable from 'vuedraggable';
import { ArrowLeft, GripVertical, Plus, Save, Trash2 } from 'lucide-vue-next';
import { toast } from '@/toast';

const props = defineProps({
    dietTemplate: {
        type: Object,
        required: true,
    },
    slots: {
        type: Array,
        default: () => [],
    },
    totals: {
        type: Object,
        default: () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 }),
    },
    micros: {
        type: Object,
        default: () => ({ meta: [], totals: {} }),
    },
    mealOptions: {
        type: Array,
        default: () => [],
    },
});

function formatNumber(v) {
    if (v === null || v === undefined || v === '') {
        return '—';
    }
    const n = Number(v);
    if (Number.isNaN(n)) {
        return String(v);
    }
    return n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

const dietForm = useForm({
    name: props.dietTemplate?.name ?? '',
    notes: props.dietTemplate?.notes ?? '',
});

watch(
    () => props.dietTemplate,
    (d) => {
        dietForm.name = d?.name ?? '';
        dietForm.notes = d?.notes ?? '';
    },
);

function submitDiet() {
    dietForm.put(route('coach.nutrition.diet-templates.update', props.dietTemplate.id), {
        preserveScroll: true,
        onSuccess: () => toast.success('Modèle enregistré.'),
        onError: () => toast.error("Impossible d'enregistrer."),
    });
}

const slotDrafts = ref({});
function initSlotDrafts(list) {
    const next = {};
    for (const s of list) {
        next[String(s.id)] = {
            label: s.label ?? '',
            meal_template_id: s.meal_template_id ?? null,
            multiplier: s.multiplier ?? 1,
        };
    }
    slotDrafts.value = next;
}

const slotsLocal = ref([...(props.slots ?? [])]);
watch(
    () => props.slots,
    (v) => {
        slotsLocal.value = [...(v ?? [])];
        initSlotDrafts(v ?? []);
    },
    { immediate: true },
);

const dirtySlotIds = computed(() => {
    const dirty = new Set();
    for (const s of slotsLocal.value ?? []) {
        const key = String(s.id);
        const d = slotDrafts.value[key];
        if (!d) {
            continue;
        }
        const sameLabel = String(d.label ?? '') === String(s.label ?? '');
        const sameMeal = (d.meal_template_id ?? null) === (s.meal_template_id ?? null);
        const sameMult = Number(d.multiplier ?? 1) === Number(s.multiplier ?? 1);
        if (!sameLabel || !sameMeal || !sameMult) {
            dirty.add(key);
        }
    }
    return dirty;
});

function saveSlot(slotId) {
    const draft = slotDrafts.value[String(slotId)];
    if (!draft) {
        return;
    }

    router.put(
        route('coach.nutrition.diet-slots.update', slotId),
        {
            label: draft.label,
            meal_template_id: draft.meal_template_id || null,
            multiplier: draft.multiplier,
        },
        {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => toast.success('Slot enregistré.'),
            onError: () => toast.error("Impossible d'enregistrer le slot."),
        },
    );
}

function deleteSlot(slotId) {
    if (!confirm('Supprimer ce slot ?')) {
        return;
    }

    router.delete(route('coach.nutrition.diet-slots.destroy', slotId), {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toast.success('Slot supprimé.'),
        onError: () => toast.error('Impossible de supprimer.'),
    });
}

const isReorderSaving = ref(false);
const [slotsParent] = useAutoAnimate();

function persistOrder() {
    if (isReorderSaving.value) {
        return;
    }

    const ids = (slotsLocal.value ?? []).map((s) => s.id);
    if (ids.length === 0) {
        return;
    }

    isReorderSaving.value = true;
    router.put(
        route('coach.nutrition.diet-slots.reorder', props.dietTemplate.id),
        { ids },
        {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => toast.success('Ordre enregistré.'),
            onError: () => toast.error("Impossible d'enregistrer l'ordre."),
            onFinish: () => {
                isReorderSaving.value = false;
            },
        },
    );
}

const addSlotForm = useForm({
    label: 'Matin',
    meal_template_id: null,
    multiplier: '1',
});

function submitAddSlot() {
    addSlotForm.post(route('coach.nutrition.diet-slots.store', props.dietTemplate.id), {
        preserveScroll: true,
        onSuccess: () => {
            addSlotForm.reset();
            addSlotForm.clearErrors();
            addSlotForm.label = 'Matin';
            addSlotForm.multiplier = '1';
            toast.success('Slot ajouté.');
        },
        onError: () => toast.error("Impossible d'ajouter le slot."),
    });
}

function setQuickLabel(label) {
    addSlotForm.label = label;
}

const isMealCreateOpen = ref(false);
const mealForm = useForm({
    name: '',
    notes: '',
    parent_meal_id: null,
});

function openMealCreateModal() {
    mealForm.reset();
    mealForm.clearErrors();
    mealForm.parent_meal_id = null;
    isMealCreateOpen.value = true;
}

function closeMealCreateModal() {
    isMealCreateOpen.value = false;
    mealForm.clearErrors();
}

function submitMealCreate() {
    mealForm.post(route('coach.nutrition.meal-templates.store'), {
        preserveScroll: true,
        onSuccess: () => {
            closeMealCreateModal();
            toast.success('Repas créé.');
        },
        onError: () => toast.error("Impossible de créer le repas."),
    });
}

const microRows = computed(() => {
    const meta = props.micros?.meta ?? [];
    const totals = props.micros?.totals ?? {};
    return meta.map((m) => {
        return {
            code: String(m.const_code),
            name_fr: m.name_fr,
            infoods_code: m.infoods_code,
            total: totals[String(m.const_code)] ?? 0,
        };
    });
});
</script>

<template>
    <Head title="Modifier modèle de diète" />

    <CoachLayout>
        <template #header>
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 class="text-xl font-semibold leading-tight text-gray-800">Modifier modèle de diète</h2>
                    <p class="mt-1 text-sm text-gray-500">Journée type: slots + repas favoris + macros/micros.</p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <Link
                        :href="route('coach.library', { section: 'diet-templates' })"
                        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <ArrowLeft class="mr-2 inline-block h-4 w-4" />
                        Retour
                    </Link>

                    <button
                        type="button"
                        class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        @click="openMealCreateModal"
                    >
                        <Plus class="mr-2 h-4 w-4" />
                        Nouveau repas
                    </button>

                    <button
                        type="button"
                        class="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                        :disabled="dietForm.processing"
                        :class="dietForm.processing ? 'opacity-50 cursor-not-allowed' : ''"
                        @click="submitDiet"
                    >
                        <Save class="mr-2 h-4 w-4" />
                        Enregistrer
                    </button>
                </div>
            </div>
        </template>

        <div class="py-8">
            <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div class="lg:col-span-2 space-y-6">
                        <div class="rounded-lg border border-gray-200 bg-white p-5">
                            <div class="text-sm font-semibold text-gray-900">Informations</div>

                            <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label class="block text-xs font-semibold text-gray-600">Nom</label>
                                    <input v-model="dietForm.name" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                                    <div v-if="dietForm.errors.name" class="mt-1 text-sm text-red-600">{{ dietForm.errors.name }}</div>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold text-gray-600">Notes</label>
                                    <input v-model="dietForm.notes" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                                    <div v-if="dietForm.errors.notes" class="mt-1 text-sm text-red-600">{{ dietForm.errors.notes }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="rounded-lg border border-gray-200 bg-white p-5">
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div class="text-sm font-semibold text-gray-900">Slots</div>
                                    <div class="mt-1 text-sm text-gray-600">Glisse-dépose pour réordonner. Associe un repas favori + multiplicateur.</div>
                                </div>

                                <div class="flex items-center gap-3 text-sm">
                                    <div v-if="isReorderSaving" class="text-gray-600">Enregistrement…</div>
                                </div>
                            </div>

                            <div class="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                                <div class="flex flex-wrap items-center gap-2">
                                    <button type="button" class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" @click="setQuickLabel('Matin')">Matin</button>
                                    <button type="button" class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" @click="setQuickLabel('Midi')">Midi</button>
                                    <button type="button" class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" @click="setQuickLabel('Soir')">Soir</button>
                                    <button type="button" class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" @click="setQuickLabel('Snack')">Snack</button>
                                </div>

                                <form class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4" @submit.prevent="submitAddSlot">
                                    <div>
                                        <label class="block text-xs font-semibold text-gray-600">Label</label>
                                        <input v-model="addSlotForm.label" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                                        <div v-if="addSlotForm.errors.label" class="mt-1 text-sm text-red-600">{{ addSlotForm.errors.label }}</div>
                                    </div>

                                    <div>
                                        <label class="block text-xs font-semibold text-gray-600">Repas</label>
                                        <select v-model="addSlotForm.meal_template_id" class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                                            <option :value="null">—</option>
                                            <option v-for="m in mealOptions" :key="m.id" :value="m.id">{{ m.display_name }}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label class="block text-xs font-semibold text-gray-600">Multiplicateur</label>
                                        <input v-model="addSlotForm.multiplier" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                                        <div v-if="addSlotForm.errors.multiplier" class="mt-1 text-sm text-red-600">{{ addSlotForm.errors.multiplier }}</div>
                                    </div>

                                    <div class="flex items-end">
                                        <button
                                            type="submit"
                                            class="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                            :disabled="addSlotForm.processing"
                                            :class="addSlotForm.processing ? 'opacity-50 cursor-not-allowed' : ''"
                                        >
                                            <Plus class="mr-2 h-4 w-4" />
                                            Ajouter
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div v-if="(slotsLocal ?? []).length === 0" class="mt-4 text-sm text-gray-600">Aucun slot.</div>

                            <div v-else class="mt-4" ref="slotsParent">
                                <draggable
                                    v-model="slotsLocal"
                                    item-key="id"
                                    handle=".drag-handle"
                                    class="space-y-2"
                                    @end="persistOrder"
                                >
                                    <template #item="{ element }">
                                        <div class="rounded-md border border-gray-200 bg-white p-3">
                                            <div class="flex flex-wrap items-start justify-between gap-3">
                                                <div class="flex min-w-0 items-start gap-2">
                                                    <button type="button" class="drag-handle mt-1 cursor-grab text-gray-400 hover:text-gray-600" aria-label="Réordonner">
                                                        <GripVertical class="h-4 w-4" />
                                                    </button>

                                                    <div class="min-w-0">
                                                        <div class="flex flex-wrap items-center gap-2">
                                                            <input
                                                                v-model="slotDrafts[String(element.id)].label"
                                                                type="text"
                                                                class="w-44 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                                            />

                                                            <select
                                                                v-model="slotDrafts[String(element.id)].meal_template_id"
                                                                class="min-w-[240px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                                                            >
                                                                <option :value="null">— Sélectionner un repas —</option>
                                                                <option v-for="m in mealOptions" :key="m.id" :value="m.id">{{ m.display_name }}</option>
                                                            </select>

                                                            <input
                                                                v-model="slotDrafts[String(element.id)].multiplier"
                                                                type="number"
                                                                step="0.001"
                                                                class="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                                            />

                                                            <Link
                                                                v-if="slotDrafts[String(element.id)].meal_template_id"
                                                                :href="route('coach.nutrition.meal-templates.edit', slotDrafts[String(element.id)].meal_template_id)"
                                                                class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                            >
                                                                Edit repas
                                                            </Link>
                                                        </div>

                                                        <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                            <div class="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
                                                                <div class="text-[11px] font-semibold text-gray-500">kcal</div>
                                                                <div class="text-sm font-semibold text-gray-900">{{ formatNumber(element.totals?.kcal) }}</div>
                                                            </div>
                                                            <div class="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
                                                                <div class="text-[11px] font-semibold text-gray-500">Prot</div>
                                                                <div class="text-sm font-semibold text-gray-900">{{ formatNumber(element.totals?.protein) }}</div>
                                                            </div>
                                                            <div class="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
                                                                <div class="text-[11px] font-semibold text-gray-500">Gluc</div>
                                                                <div class="text-sm font-semibold text-gray-900">{{ formatNumber(element.totals?.carbs) }}</div>
                                                            </div>
                                                            <div class="rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
                                                                <div class="text-[11px] font-semibold text-gray-500">Lip</div>
                                                                <div class="text-sm font-semibold text-gray-900">{{ formatNumber(element.totals?.fat) }}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        class="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                                        :disabled="!dirtySlotIds.has(String(element.id))"
                                                        :class="!dirtySlotIds.has(String(element.id)) ? 'opacity-50 cursor-not-allowed' : ''"
                                                        @click="saveSlot(element.id)"
                                                    >
                                                        <Save class="mr-2 h-4 w-4" />
                                                        Enregistrer
                                                    </button>

                                                    <button
                                                        type="button"
                                                        class="inline-flex items-center rounded-md px-2 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                                                        @click="deleteSlot(element.id)"
                                                    >
                                                        <Trash2 class="mr-2 h-4 w-4" />
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </draggable>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="rounded-lg border border-gray-200 bg-white p-5">
                            <div class="text-sm font-semibold text-gray-900">Totaux journée</div>
                            <div class="mt-4 grid grid-cols-2 gap-3">
                                <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                    <div class="text-xs font-semibold text-gray-500">kcal</div>
                                    <div class="mt-1 text-sm font-semibold text-gray-900">{{ formatNumber(totals?.kcal) }}</div>
                                </div>
                                <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                    <div class="text-xs font-semibold text-gray-500">Protéines</div>
                                    <div class="mt-1 text-sm font-semibold text-gray-900">{{ formatNumber(totals?.protein) }}</div>
                                </div>
                                <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                    <div class="text-xs font-semibold text-gray-500">Glucides</div>
                                    <div class="mt-1 text-sm font-semibold text-gray-900">{{ formatNumber(totals?.carbs) }}</div>
                                </div>
                                <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                    <div class="text-xs font-semibold text-gray-500">Lipides</div>
                                    <div class="mt-1 text-sm font-semibold text-gray-900">{{ formatNumber(totals?.fat) }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="rounded-lg border border-gray-200 bg-white p-5">
                            <div class="text-sm font-semibold text-gray-900">Micros (totaux)</div>

                            <div v-if="microRows.length === 0" class="mt-3 text-sm text-gray-600">Aucun micro configuré.</div>

                            <div v-else class="mt-3 overflow-hidden rounded-md border border-gray-200">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Micro</th>
                                            <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 bg-white">
                                        <tr v-for="r in microRows" :key="r.code">
                                            <td class="px-3 py-2 text-xs text-gray-900">
                                                <div class="font-semibold">{{ r.name_fr }}</div>
                                                <div class="mt-0.5 text-[11px] text-gray-500">{{ r.infoods_code || '' }}</div>
                                            </td>
                                            <td class="whitespace-nowrap px-3 py-2 text-right text-xs text-gray-700">{{ formatNumber(r.total) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Modal :show="isMealCreateOpen" maxWidth="lg" @close="closeMealCreateModal">
            <div class="p-6">
                <div class="text-lg font-semibold text-gray-900">Nouveau repas</div>
                <div class="mt-1 text-sm text-gray-600">Crée un repas favori directement depuis ce modèle.</div>

                <form class="mt-6 space-y-4" @submit.prevent="submitMealCreate">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Nom</label>
                        <input v-model="mealForm.name" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        <div v-if="mealForm.errors.name" class="mt-1 text-sm text-red-600">{{ mealForm.errors.name }}</div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea v-model="mealForm.notes" rows="3" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        <div v-if="mealForm.errors.notes" class="mt-1 text-sm text-red-600">{{ mealForm.errors.notes }}</div>
                    </div>

                    <div class="flex items-center justify-end gap-2">
                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="closeMealCreateModal">
                            Annuler
                        </button>
                        <button type="submit" class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800" :disabled="mealForm.processing" :class="mealForm.processing ? 'opacity-50 cursor-not-allowed' : ''">
                            Créer
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    </CoachLayout>
</template>

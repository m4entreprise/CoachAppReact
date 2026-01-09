<script setup>
import axios from 'axios';
import Modal from '@/Components/Modal.vue';
import { computed, ref, watch } from 'vue';
import CoachLayout from '@/Layouts/CoachLayout.vue';
import { Head, Link, router, useForm } from '@inertiajs/vue3';
import { useAutoAnimate } from '@formkit/auto-animate/vue';
import draggable from 'vuedraggable';
import { Apple, ArrowLeft, Beef, Candy, Copy, Flame, GripVertical, Hamburger, Languages, Pencil, Plus, Save, Sandwich, Send, Trash2, Wheat } from 'lucide-vue-next';
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

const selectedLang = ref('fr');
const isDietEditOpen = ref(false);

function openDietEditModal() {
    dietForm.clearErrors();
    isDietEditOpen.value = true;
}

function closeDietEditModal() {
    isDietEditOpen.value = false;
    dietForm.clearErrors();
}

const slotsLocal = ref([]);
const importMealIdBySlot = ref({});

watch(
    () => props.slots,
    (v) => {
        const nextSlots = (v ?? []).map((s) => {
            return {
                ...s,
                items: [...(s.items ?? [])],
            };
        });

        slotsLocal.value = nextSlots;

        const nextImport = { ...importMealIdBySlot.value };
        for (const s of nextSlots) {
            const k = String(s.id);
            if (!(k in nextImport)) {
                nextImport[k] = null;
            }
        }
        importMealIdBySlot.value = nextImport;
    },
    { immediate: true },
);

const isSlotReorderSaving = ref(false);
const [slotsParent] = useAutoAnimate();

function persistSlotOrder() {
    if (isSlotReorderSaving.value) {
        return;
    }

    const ids = (slotsLocal.value ?? []).map((s) => s.id);
    if (ids.length === 0) {
        return;
    }

    isSlotReorderSaving.value = true;
    router.put(
        route('coach.nutrition.diet-slots.reorder', props.dietTemplate.id),
        { ids },
        {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => toast.success('Ordre des repas enregistré.'),
            onError: () => toast.error("Impossible d'enregistrer l'ordre."),
            onFinish: () => {
                isSlotReorderSaving.value = false;
            },
        },
    );
}

const addSlotForm = useForm({
    label: 'Matin',
});

function setQuickLabel(label) {
    addSlotForm.label = label;
}

function submitAddSlot() {
    addSlotForm.post(route('coach.nutrition.diet-slots.store', props.dietTemplate.id), {
        preserveScroll: true,
        onSuccess: () => {
            addSlotForm.reset();
            addSlotForm.clearErrors();
            addSlotForm.label = 'Matin';
            toast.success('Repas ajouté.');
        },
        onError: () => toast.error("Impossible d'ajouter le repas."),
    });
}

function saveSlot(slotId) {
    const slot = (slotsLocal.value ?? []).find((s) => s.id === slotId);
    if (!slot) {
        return;
    }

    router.put(route('coach.nutrition.diet-slots.update', slotId), { label: slot.label }, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toast.success('Repas enregistré.'),
        onError: () => toast.error("Impossible d'enregistrer."),
    });
}

function deleteSlot(slotId) {
    if (!confirm('Supprimer ce repas ?')) {
        return;
    }

    router.delete(route('coach.nutrition.diet-slots.destroy', slotId), {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toast.success('Repas supprimé.'),
        onError: () => toast.error('Impossible de supprimer.'),
    });
}

const reorderSavingSlotId = ref(null);

function persistItemOrder(slotId) {
    const slot = (slotsLocal.value ?? []).find((s) => s.id === slotId);
    if (!slot) {
        return;
    }

    const ids = (slot.items ?? []).map((i) => i.id);
    if (ids.length === 0) {
        return;
    }

    reorderSavingSlotId.value = slotId;
    router.put(route('coach.nutrition.diet-slot-items.reorder', slotId), { ids }, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toast.success('Ordre des aliments enregistré.'),
        onError: () => toast.error("Impossible d'enregistrer l'ordre."),
        onFinish: () => {
            if (reorderSavingSlotId.value === slotId) {
                reorderSavingSlotId.value = null;
            }
        },
    });
}

function updateSlotItem(itemId, quantityG) {
    router.put(route('coach.nutrition.diet-slot-items.update', itemId), { quantity_g: quantityG }, {
        preserveScroll: true,
        preserveState: true,
        onError: () => toast.error('Quantité invalide.'),
    });
}

function deleteSlotItem(itemId) {
    router.delete(route('coach.nutrition.diet-slot-items.destroy', itemId), {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toast.success('Aliment retiré.'),
        onError: () => toast.error("Impossible de retirer l'aliment."),
    });
}

function importMealIntoSlot(slotId) {
    const mealTemplateId = importMealIdBySlot.value[String(slotId)] ?? null;
    if (!mealTemplateId) {
        toast.error('Sélectionne un repas à importer.');
        return;
    }

    const slot = (slotsLocal.value ?? []).find((s) => s.id === slotId);
    const hasItems = (slot?.items ?? []).length > 0;
    if (hasItems && !confirm('Importer ce repas va remplacer les aliments existants. Continuer ?')) {
        return;
    }

    router.post(route('coach.nutrition.diet-slot-items.import-meal', slotId), { meal_template_id: mealTemplateId }, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toast.success('Repas importé.'),
        onError: () => toast.error("Impossible d'importer le repas."),
    });
}

const isAddItemOpen = ref(false);
const addItemSlotId = ref(null);
const addItemForm = useForm({
    source_type: 'catalog',
    alim_code: null,
    custom_food_id: null,
    quantity_g: '100',
});
const addItemQuery = ref('');
const addItemResults = ref({ catalog: [], custom: [] });
const addItemLoading = ref(false);
const addItemSearchTimer = ref(null);

function openAddItemModal(slotId) {
    addItemSlotId.value = slotId;
    addItemForm.reset();
    addItemForm.clearErrors();
    addItemForm.source_type = 'catalog';
    addItemForm.alim_code = null;
    addItemForm.custom_food_id = null;
    addItemForm.quantity_g = '100';
    addItemQuery.value = '';
    addItemResults.value = { catalog: [], custom: [] };
    isAddItemOpen.value = true;
}

function closeAddItemModal() {
    isAddItemOpen.value = false;
    addItemSlotId.value = null;
    addItemForm.clearErrors();
}

async function runFoodSearch() {
    const q = addItemQuery.value.trim();
    if (q.length < 2) {
        addItemResults.value = { catalog: [], custom: [] };
        return;
    }

    try {
        addItemLoading.value = true;
        const res = await axios.get(route('coach.nutrition.food-search'), { params: { q } });
        addItemResults.value = res.data ?? { catalog: [], custom: [] };
    } finally {
        addItemLoading.value = false;
    }
}

watch(
    () => addItemQuery.value,
    () => {
        if (addItemSearchTimer.value) {
            clearTimeout(addItemSearchTimer.value);
        }
        addItemSearchTimer.value = setTimeout(() => {
            runFoodSearch();
        }, 250);
    },
);

function selectCatalogFood(row) {
    addItemForm.source_type = 'catalog';
    addItemForm.alim_code = row.alim_code;
    addItemForm.custom_food_id = null;
    addItemQuery.value = row.name_fr;
    addItemResults.value = { catalog: [], custom: [] };
}

function selectCustomFood(row) {
    addItemForm.source_type = 'custom';
    addItemForm.custom_food_id = row.id;
    addItemForm.alim_code = null;
    addItemQuery.value = row.name;
    addItemResults.value = { catalog: [], custom: [] };
}

function submitAddItem() {
    if (!addItemSlotId.value) {
        return;
    }

    addItemForm.post(route('coach.nutrition.diet-slot-items.store', addItemSlotId.value), {
        preserveScroll: true,
        onSuccess: () => {
            closeAddItemModal();
            toast.success('Aliment ajouté.');
        },
        onError: () => toast.error("Impossible d'ajouter l'aliment."),
    });
}

const canSubmitAddItem = computed(() => {
    if (addItemForm.processing) {
        return false;
    }
    if (addItemForm.source_type === 'catalog') {
        return !!addItemForm.alim_code;
    }
    if (addItemForm.source_type === 'custom') {
        return !!addItemForm.custom_food_id;
    }
    return false;
});

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

const fiberTotal = computed(() => {
    const row = (microRows.value ?? []).find((r) => String(r.name_fr ?? '').toLowerCase().includes('fibr'));
    return row?.total ?? 0;
});

const sugarTotal = computed(() => {
    const row = (microRows.value ?? []).find((r) => {
        const n = String(r.name_fr ?? '').toLowerCase();
        return n.includes('sucre') || n.includes('sucres');
    });
    return row?.total ?? 0;
});
</script>

<template>
    <Head :title="dietForm.name || 'Modifier modèle de diète'" />

    <CoachLayout>
        <template #header>
            <div class="flex items-center justify-between gap-4">
                <div class="flex min-w-0 items-center gap-3">
                    <Link
                        :href="route('coach.library', { section: 'diet-templates' })"
                        class="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                        aria-label="Retour"
                    >
                        <ArrowLeft class="h-5 w-5" />
                    </Link>

                    <div class="min-w-0">
                        <div class="truncate text-2xl font-light leading-tight text-gray-900">{{ dietForm.name || 'Modèle de diète' }}</div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <div class="relative">
                        <Languages class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <select v-model="selectedLang" class="h-10 rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50">
                            <option value="fr">Français</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        class="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                        aria-label="Éditer"
                        @click="openDietEditModal"
                    >
                        <Pencil class="h-5 w-5" />
                    </button>
                </div>
            </div>
        </template>

        <div class="py-8">
            <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div class="space-y-6">
                    <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div class="grid grid-cols-2 gap-4 text-center sm:grid-cols-3 lg:grid-cols-6">
                            <div class="flex flex-col items-center">
                                <div class="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                    <Flame class="h-5 w-5" />
                                </div>
                                <div class="mt-2 text-2xl font-semibold text-gray-900">{{ formatNumber(totals?.kcal) }}</div>
                                <div class="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Calories</div>
                            </div>

                            <div class="flex flex-col items-center">
                                <div class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Beef class="h-5 w-5" />
                                </div>
                                <div class="mt-2 text-2xl font-semibold text-gray-900">{{ formatNumber(totals?.protein) }}</div>
                                <div class="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Protéines</div>
                                <div class="mt-2 h-1.5 w-16 rounded-full border border-emerald-500" />
                            </div>

                            <div class="flex flex-col items-center">
                                <div class="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600">
                                    <Sandwich class="h-5 w-5" />
                                </div>
                                <div class="mt-2 text-2xl font-semibold text-gray-900">{{ formatNumber(totals?.carbs) }}</div>
                                <div class="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Gluc</div>
                                <div class="mt-2 h-1.5 w-16 rounded-full border border-orange-500" />
                            </div>

                            <div class="flex flex-col items-center">
                                <div class="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600">
                                    <Hamburger class="h-5 w-5" />
                                </div>
                                <div class="mt-2 text-2xl font-semibold text-gray-900">{{ formatNumber(totals?.fat) }}</div>
                                <div class="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Gras</div>
                                <div class="mt-2 h-1.5 w-16 rounded-full border border-red-500" />
                            </div>

                            <div class="flex flex-col items-center">
                                <div class="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-gray-600">
                                    <Wheat class="h-5 w-5" />
                                </div>
                                <div class="mt-2 text-2xl font-semibold text-gray-900">{{ formatNumber(fiberTotal) }}</div>
                                <div class="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Fibre</div>
                            </div>

                            <div class="flex flex-col items-center">
                                <div class="grid h-10 w-10 place-items-center rounded-xl bg-gray-100 text-gray-600">
                                    <Candy class="h-5 w-5" />
                                </div>
                                <div class="mt-2 text-2xl font-semibold text-gray-900">{{ formatNumber(sugarTotal) }}</div>
                                <div class="mt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Sucre</div>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <button type="button" class="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50" @click="openMealCreateModal">
                            <Plus class="mr-2 h-4 w-4" />
                            Nouveau repas favori
                        </button>

                        <div class="text-sm text-gray-500">Glisse-dépose pour organiser repas et aliments.</div>
                    </div>

                    <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div class="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div class="text-sm font-semibold text-gray-900">Repas / jour</div>
                                    <div class="mt-1 text-sm text-gray-600">Chaque repas contient sa liste d'aliments. Tu peux importer un repas favori ou ajouter des aliments directement.</div>
                                </div>

                                <div class="flex items-center gap-3 text-sm">
                                    <div class="text-gray-600">{{ (slotsLocal ?? []).length }} repas</div>
                                    <div v-if="isSlotReorderSaving" class="text-gray-600">Enregistrement…</div>
                                </div>
                            </div>

                            <div class="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                                <div class="flex flex-wrap items-center gap-2">
                                    <button type="button" class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" @click="setQuickLabel('Matin')">Matin</button>
                                    <button type="button" class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" @click="setQuickLabel('Midi')">Midi</button>
                                    <button type="button" class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" @click="setQuickLabel('Soir')">Soir</button>
                                    <button type="button" class="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50" @click="setQuickLabel('Snack')">Snack</button>
                                </div>

                                <form class="mt-3 flex flex-wrap items-end gap-2" @submit.prevent="submitAddSlot">
                                    <div class="w-full sm:w-72">
                                        <label class="block text-xs font-semibold text-gray-600">Nom du repas</label>
                                        <input v-model="addSlotForm.label" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                                        <div v-if="addSlotForm.errors.label" class="mt-1 text-sm text-red-600">{{ addSlotForm.errors.label }}</div>
                                    </div>

                                    <button
                                        type="submit"
                                        class="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                        :disabled="addSlotForm.processing"
                                        :class="addSlotForm.processing ? 'opacity-50 cursor-not-allowed' : ''"
                                    >
                                        <Plus class="mr-2 h-4 w-4" />
                                        Ajouter un repas
                                    </button>
                                </form>
                            </div>

                            <div v-if="(slotsLocal ?? []).length === 0" class="mt-4 text-sm text-gray-600">Aucun repas.</div>

                            <div v-else class="mt-4 space-y-4" ref="slotsParent">
                                <draggable v-model="slotsLocal" item-key="id" handle=".slot-drag-handle" class="space-y-4" @end="persistSlotOrder">
                                    <template #item="{ element: slot }">
                                        <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                            <div class="flex flex-wrap items-center justify-between gap-3 bg-gray-100 px-4 py-3">
                                                <div class="flex min-w-0 items-center gap-2">
                                                    <button type="button" class="slot-drag-handle cursor-grab text-gray-400 hover:text-gray-600" aria-label="Réordonner">
                                                        <GripVertical class="h-4 w-4" />
                                                    </button>

                                                    <input v-model="slot.label" type="text" class="w-44 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm" />

                                                    <button type="button" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="saveSlot(slot.id)">
                                                        <Save class="mr-2 h-4 w-4" />
                                                        Enregistrer
                                                    </button>

                                                    <div v-if="reorderSavingSlotId === slot.id" class="text-sm text-gray-600">Enregistrement…</div>
                                                </div>

                                                <div class="flex flex-wrap items-center gap-2">
                                                    <select v-model="importMealIdBySlot[String(slot.id)]" class="w-full sm:w-64 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm">
                                                        <option :value="null">Importer un repas favori…</option>
                                                        <option v-for="m in mealOptions" :key="m.id" :value="m.id">{{ m.display_name }}</option>
                                                    </select>

                                                    <button type="button" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="importMealIntoSlot(slot.id)">
                                                        <Copy class="mr-2 h-4 w-4" />
                                                        Importer
                                                    </button>

                                                    <button type="button" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="openAddItemModal(slot.id)">
                                                        <Plus class="mr-2 h-4 w-4" />
                                                        Ajouter aliment
                                                    </button>

                                                    <button type="button" class="inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-50" @click="deleteSlot(slot.id)">
                                                        <Trash2 class="mr-2 h-4 w-4" />
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>

                                            <div class="p-4">
                                                <div v-if="(slot.items ?? []).length === 0" class="mt-4 text-sm text-gray-600">Aucun aliment.</div>

                                                <div v-else class="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                                                    <table class="min-w-full divide-y divide-gray-200">
                                                        <thead class="bg-gray-50">
                                                            <tr>
                                                                <th class="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">Name</th>
                                                                <th class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Quantity</th>
                                                                <th class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Cal</th>
                                                                <th class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Prot</th>
                                                                <th class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Carb</th>
                                                                <th class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Fat</th>
                                                                <th class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Fiber</th>
                                                                <th class="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">Sugar</th>
                                                                <th class="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                                                            </tr>
                                                        </thead>

                                                        <draggable v-model="slot.items" item-key="id" tag="tbody" handle=".item-drag-handle" class="divide-y divide-gray-100 bg-white" @end="persistItemOrder(slot.id)">
                                                            <template #item="{ element: it, index }">
                                                                <tr :class="index % 2 === 1 ? 'bg-gray-50' : 'bg-white'">
                                                                    <td class="px-3 py-2 text-sm font-medium text-gray-900">
                                                                        <div class="flex items-start gap-2">
                                                                            <button type="button" class="item-drag-handle mt-0.5 cursor-grab text-gray-400 hover:text-gray-600" aria-label="Réordonner">
                                                                                <GripVertical class="h-4 w-4" />
                                                                            </button>
                                                                            <div class="min-w-0">
                                                                                <div class="truncate">{{ it.name }}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td class="px-3 py-2 text-center">
                                                                        <input v-model="it.quantity_g" type="number" step="0.001" class="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm text-right" @change="updateSlotItem(it.id, it.quantity_g)" />
                                                                    </td>
                                                                    <td class="px-3 py-2 text-center text-sm text-gray-700">{{ formatNumber(it.kcal) }}</td>
                                                                    <td class="px-3 py-2 text-center text-sm font-semibold text-emerald-700">{{ formatNumber(it.protein) }}</td>
                                                                    <td class="px-3 py-2 text-center text-sm font-semibold text-orange-700">{{ formatNumber(it.carbs) }}</td>
                                                                    <td class="px-3 py-2 text-center text-sm font-semibold text-red-700">{{ formatNumber(it.fat) }}</td>
                                                                    <td class="px-3 py-2 text-center text-sm text-gray-700">{{ formatNumber(it.fiber ?? 0) }}</td>
                                                                    <td class="px-3 py-2 text-center text-sm text-gray-700">{{ formatNumber(it.sugar ?? 0) }}</td>
                                                                    <td class="px-3 py-2 text-right">
                                                                        <button type="button" class="inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-50" @click="deleteSlotItem(it.id)">
                                                                            <Trash2 class="mr-2 h-4 w-4" />
                                                                            Retirer
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            </template>
                                                        </draggable>

                                                        <tfoot class="bg-gray-50">
                                                            <tr>
                                                                <td class="px-3 py-2 text-sm font-semibold text-gray-900">Total</td>
                                                                <td class="px-3 py-2 text-center text-sm text-gray-700">—</td>
                                                                <td class="px-3 py-2 text-center text-sm text-gray-900">{{ formatNumber(slot.totals?.kcal) }}</td>
                                                                <td class="px-3 py-2 text-center text-sm font-semibold text-emerald-700">{{ formatNumber(slot.totals?.protein) }}</td>
                                                                <td class="px-3 py-2 text-center text-sm font-semibold text-orange-700">{{ formatNumber(slot.totals?.carbs) }}</td>
                                                                <td class="px-3 py-2 text-center text-sm font-semibold text-red-700">{{ formatNumber(slot.totals?.fat) }}</td>
                                                                <td class="px-3 py-2 text-center text-sm text-gray-700">{{ formatNumber(slot.totals?.fiber ?? 0) }}</td>
                                                                <td class="px-3 py-2 text-center text-sm text-gray-700">{{ formatNumber(slot.totals?.sugar ?? 0) }}</td>
                                                                <td class="px-3 py-2" />
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </draggable>

                                <div class="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <tbody class="bg-gray-50">
                                            <tr>
                                                <td class="px-3 py-2 text-sm font-semibold text-gray-900">Grand Total</td>
                                                <td class="px-3 py-2 text-center text-sm text-gray-700">—</td>
                                                <td class="px-3 py-2 text-center text-sm text-gray-900">{{ formatNumber(totals?.kcal) }}</td>
                                                <td class="px-3 py-2 text-center text-sm font-semibold text-emerald-700">{{ formatNumber(totals?.protein) }}</td>
                                                <td class="px-3 py-2 text-center text-sm font-semibold text-orange-700">{{ formatNumber(totals?.carbs) }}</td>
                                                <td class="px-3 py-2 text-center text-sm font-semibold text-red-700">{{ formatNumber(totals?.fat) }}</td>
                                                <td class="px-3 py-2 text-center text-sm text-gray-700">{{ formatNumber(fiberTotal) }}</td>
                                                <td class="px-3 py-2 text-center text-sm text-gray-700">{{ formatNumber(sugarTotal) }}</td>
                                                <td class="px-3 py-2" />
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div class="mt-6 flex justify-center">
                                    <button type="button" class="inline-flex w-full max-w-md items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600" :disabled="dietForm.processing" :class="dietForm.processing ? 'opacity-50 cursor-not-allowed' : ''" @click="submitDiet">
                                        <Apple class="mr-2 h-5 w-5" />
                                        Enregistrez vos aliments
                                    </button>
                                </div>
                            </div>
                        </div>
                </div>

                <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div class="text-sm font-semibold text-gray-900">Micros (totaux)</div>
                    </div>

                    <div v-if="microRows.length === 0" class="mt-3 text-sm text-gray-600">Aucun micro configuré.</div>

                    <div v-else class="mt-3 overflow-hidden rounded-xl border border-gray-200">
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

                <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div class="flex items-center gap-3">
                        <div class="grid h-10 w-10 place-items-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">TF</div>
                        <input type="text" class="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm" placeholder="Écrire un commentaire" />
                        <button type="button" class="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white shadow-sm opacity-60" disabled>
                            <Send class="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <Modal :show="isDietEditOpen" maxWidth="lg" @close="closeDietEditModal">
            <div class="p-6">
                <div class="text-lg font-semibold text-gray-900">Éditer le modèle</div>
                <div class="mt-1 text-sm text-gray-600">Nom + notes (sauvegarde via le bouton orange).</div>

                <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div class="mt-6 flex items-center justify-end gap-2">
                    <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="closeDietEditModal">
                        Fermer
                    </button>
                </div>
            </div>
        </Modal>

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

        <Modal :show="isAddItemOpen" maxWidth="lg" @close="closeAddItemModal">
            <div class="p-6">
                <div class="text-lg font-semibold text-gray-900">Ajouter un aliment</div>
                <div class="mt-1 text-sm text-gray-600">Recherche (catalogue + custom), puis sélectionne et ajoute une quantité.</div>

                <form class="mt-6 space-y-4" @submit.prevent="submitAddItem">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600">Rechercher</label>
                        <input v-model="addItemQuery" type="search" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Ex: riz, poulet…" />
                        <div v-if="addItemLoading" class="mt-2 text-sm text-gray-600">Chargement…</div>
                    </div>

                    <div v-if="addItemForm.errors.alim_code || addItemForm.errors.custom_food_id" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {{ addItemForm.errors.alim_code || addItemForm.errors.custom_food_id }}
                    </div>

                    <div v-if="(addItemResults.catalog ?? []).length > 0" class="overflow-hidden rounded-md border border-gray-200">
                        <div class="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Catalogue</div>
                        <div class="divide-y divide-gray-100 bg-white">
                            <button
                                v-for="row in addItemResults.catalog"
                                :key="row.alim_code"
                                type="button"
                                class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
                                @click="selectCatalogFood(row)"
                            >
                                <div class="min-w-0">
                                    <div class="truncate text-sm font-semibold text-gray-900">{{ row.name_fr }}</div>
                                    <div class="mt-0.5 text-xs text-gray-500">{{ formatNumber(row.kcal_100g) }} kcal/100g</div>
                                </div>
                                <div class="text-xs text-gray-500">{{ row.alim_code }}</div>
                            </button>
                        </div>
                    </div>

                    <div v-if="(addItemResults.custom ?? []).length > 0" class="overflow-hidden rounded-md border border-gray-200">
                        <div class="bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Custom</div>
                        <div class="divide-y divide-gray-100 bg-white">
                            <button
                                v-for="row in addItemResults.custom"
                                :key="row.id"
                                type="button"
                                class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
                                @click="selectCustomFood(row)"
                            >
                                <div class="min-w-0">
                                    <div class="truncate text-sm font-semibold text-gray-900">{{ row.name }}</div>
                                    <div class="mt-0.5 text-xs text-gray-500">{{ formatNumber(row.kcal_100g) }} kcal/100g</div>
                                </div>
                                <div class="text-xs text-gray-500">#{{ row.id }}</div>
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label class="block text-xs font-semibold text-gray-600">Quantité (g)</label>
                            <input v-model="addItemForm.quantity_g" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                            <div v-if="addItemForm.errors.quantity_g" class="mt-1 text-sm text-red-600">{{ addItemForm.errors.quantity_g }}</div>
                        </div>

                        <div class="flex items-end justify-end gap-2">
                            <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="closeAddItemModal">
                                Annuler
                            </button>
                            <button type="submit" class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800" :disabled="!canSubmitAddItem" :class="!canSubmitAddItem ? 'opacity-50 cursor-not-allowed' : ''">
                                Ajouter
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    </CoachLayout>
</template>

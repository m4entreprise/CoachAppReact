<script setup>
import axios from 'axios';
import Modal from '@/Components/Modal.vue';
import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue';
import CoachLayout from '@/Layouts/CoachLayout.vue';
import { Head, Link, router, useForm, usePage } from '@inertiajs/vue3';

const props = defineProps({
    foods: {
        type: Object,
        default: null,
    },
    categoryOptions: {
        type: Object,
        default: null,
    },
    customFoods: {
        type: Array,
        default: () => [],
    },
    mealTemplates: {
        type: Array,
        default: () => [],
    },
    filters: {
        type: Object,
        default: () => ({}),
    },
});

const page = usePage();

const groups = [
    {
        title: 'Nutrition',
        items: [
            { id: 'meals-favorites', label: 'Repas favoris' },
            { id: 'diet-templates', label: 'Modèles de diètes' },
            { id: 'foods-mine', label: 'Mes aliments' },
        ],
    },
    {
        title: 'Entraînement',
        items: [
            { id: 'program-templates', label: 'Modèles de programmes' },
            { id: 'workout-templates', label: "Modèles d'entraînements" },
            { id: 'exercises-favorites', label: 'Exercises favoris' },
            { id: 'exercises-mine', label: 'Mes exercices' },
            { id: 'cardio-templates', label: 'Modèles de cardio' },
        ],
    },
    {
        title: 'Supplementation',
        items: [
            { id: 'supplement-templates', label: 'Modèles de supplements' },
            { id: 'supplements-mine', label: 'Mes suppléments' },
        ],
    },
    {
        title: 'Protocoles',
        items: [{ id: 'protocol-templates', label: 'Modèles de protocole' }],
    },
    {
        title: 'Tchat',
        items: [{ id: 'canned-messages', label: 'Messages préenregistrés' }],
    },
];

const allItems = computed(() => groups.flatMap((g) => g.items));

const selectedId = computed(() => {
    const fromProps = props.filters?.section;
    if (fromProps) {
        return fromProps;
    }
    const url = page.url ?? '';
    const query = url.includes('?') ? url.split('?')[1] : '';
    const params = new URLSearchParams(query);
    return params.get('section') || '';
});

const isMealModalOpen = ref(false);
const mealEditingId = ref(null);
const mealParentId = ref(null);
const mealForm = useForm({
    name: '',
    notes: '',
    parent_meal_id: null,
});

function openMealCreateModal(parentId = null) {
    mealEditingId.value = null;
    mealParentId.value = parentId;
    mealForm.reset();
    mealForm.clearErrors();
    mealForm.parent_meal_id = parentId;
    isMealModalOpen.value = true;
}

function openMealEditModal(meal) {
    mealEditingId.value = meal.id;
    mealParentId.value = null;
    mealForm.clearErrors();
    mealForm.name = meal.name ?? '';
    mealForm.notes = meal.notes ?? '';
    mealForm.parent_meal_id = null;
    isMealModalOpen.value = true;
}

function closeMealModal() {
    isMealModalOpen.value = false;
    mealEditingId.value = null;
    mealParentId.value = null;
    mealForm.clearErrors();
}

function submitMeal() {
    if (mealEditingId.value) {
        mealForm.put(route('coach.nutrition.meal-templates.update', mealEditingId.value), {
            preserveScroll: true,
            onSuccess: () => closeMealModal(),
        });
        return;
    }

    mealForm.parent_meal_id = mealParentId.value;
    mealForm.post(route('coach.nutrition.meal-templates.store'), {
        preserveScroll: true,
        onSuccess: () => closeMealModal(),
    });
}

function deleteMeal(mealId) {
    if (!confirm('Supprimer ce repas ?')) {
        return;
    }
    router.delete(route('coach.nutrition.meal-templates.destroy', mealId), {
        preserveScroll: true,
        preserveState: true,
    });
}

function duplicateSubstitute(mealId) {
    router.post(route('coach.nutrition.meal-templates.duplicate-substitute', mealId), {}, {
        preserveScroll: true,
        preserveState: true,
    });
}

const isAddItemOpen = ref(false);
const addItemMealId = ref(null);
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

function openAddItemModal(mealId) {
    addItemMealId.value = mealId;
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
    addItemMealId.value = null;
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
    if (!addItemMealId.value) {
        return;
    }
    addItemForm.post(route('coach.nutrition.meal-items.store', addItemMealId.value), {
        preserveScroll: true,
        onSuccess: () => closeAddItemModal(),
    });
}

function updateMealItem(itemId, quantityG) {
    router.put(route('coach.nutrition.meal-items.update', itemId), { quantity_g: quantityG }, {
        preserveScroll: true,
        preserveState: true,
    });
}

function deleteMealItem(itemId) {
    router.delete(route('coach.nutrition.meal-items.destroy', itemId), {
        preserveScroll: true,
        preserveState: true,
    });
}

const selectedItem = computed(() => {
    const target = selectedId.value;
    return allItems.value.find((i) => i.id === target) ?? allItems.value[0];
});

watchEffect(() => {
    if (!selectedId.value && allItems.value.length > 0) {
        router.get(
            route('coach.library'),
            { section: allItems.value[0].id },
            { replace: true, preserveScroll: true, preserveState: true },
        );
    }
});

function selectSection(id) {
    // When switching sections, clear search/pagination.
    router.get(route('coach.library'), { section: id }, { replace: true, preserveScroll: true, preserveState: true });
}

function sectionClass(active) {
    return active
        ? 'flex w-full items-center justify-between rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white'
        : 'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900';
}

const isFoodsMine = computed(() => selectedItem.value?.id === 'foods-mine');
const isMealsFavorites = computed(() => selectedItem.value?.id === 'meals-favorites');

const search = ref(props.filters?.q ?? '');
const grp = ref(props.filters?.grp ?? '');
const ssgrp = ref(props.filters?.ssgrp ?? '');
const ssssgrp = ref(props.filters?.ssssgrp ?? '');

watch(
    () => props.filters?.q,
    (q) => {
        search.value = q ?? '';
    },
    { immediate: true },
);

watch(
    () => props.filters?.grp,
    (v) => {
        grp.value = v ?? '';
    },
    { immediate: true },
);

watch(
    () => props.filters?.ssgrp,
    (v) => {
        ssgrp.value = v ?? '';
    },
    { immediate: true },
);

watch(
    () => props.filters?.ssssgrp,
    (v) => {
        ssssgrp.value = v ?? '';
    },
    { immediate: true },
);

const hoverFoodCode = ref(null);
const hoverLoadingCode = ref(null);
const hoverError = ref(null);
const hoverOpenTimer = ref(null);
const hoverCloseTimer = ref(null);
const foodDetailsCache = ref({});

const hoverData = computed(() => {
    const code = hoverFoodCode.value;
    if (!code) {
        return null;
    }
    return foodDetailsCache.value[code] ?? null;
});

function submitSearch() {
    router.get(
        route('coach.library'),
        {
            section: 'foods-mine',
            q: search.value || '',
            grp: grp.value || '',
            ssgrp: ssgrp.value || '',
            ssssgrp: ssssgrp.value || '',
        },
        { replace: true, preserveScroll: true, preserveState: true },
    );
}

function applyFilters() {
    // Reset pagination when changing filters
    router.get(
        route('coach.library'),
        {
            section: 'foods-mine',
            q: search.value || '',
            grp: grp.value || '',
            ssgrp: ssgrp.value || '',
            ssssgrp: ssssgrp.value || '',
        },
        { replace: true, preserveScroll: true, preserveState: true },
    );
}

function onGroupChange(value) {
    grp.value = value || '';
    ssgrp.value = '';
    ssssgrp.value = '';
    applyFilters();
}

function onSubgroupChange(value) {
    ssgrp.value = value || '';
    ssssgrp.value = '';
    applyFilters();
}

function onSubsubgroupChange(value) {
    ssssgrp.value = value || '';
    applyFilters();
}

function resetFilters() {
    search.value = '';
    grp.value = '';
    ssgrp.value = '';
    ssssgrp.value = '';
    router.get(
        route('coach.library'),
        { section: 'foods-mine' },
        { replace: true, preserveScroll: true, preserveState: true },
    );
}

function cancelHoverClose() {
    if (hoverCloseTimer.value) {
        clearTimeout(hoverCloseTimer.value);
        hoverCloseTimer.value = null;
    }
}

function cancelHoverOpen() {
    if (hoverOpenTimer.value) {
        clearTimeout(hoverOpenTimer.value);
        hoverOpenTimer.value = null;
    }
}

function onFoodNameEnter(code) {
    cancelHoverClose();
    cancelHoverOpen();

    hoverOpenTimer.value = setTimeout(() => {
        onRowEnter(code);
    }, 1100);
}

function onFoodNameLeave() {
    cancelHoverOpen();
    scheduleHoverClose();
}

function scheduleHoverClose() {
    cancelHoverClose();
    hoverCloseTimer.value = setTimeout(() => {
        hoverFoodCode.value = null;
        hoverError.value = null;
    }, 200);
}

async function onRowEnter(code) {
    cancelHoverClose();
    hoverFoodCode.value = code;
    hoverError.value = null;

    if (foodDetailsCache.value[code]) {
        return;
    }

    try {
        hoverLoadingCode.value = code;
        const res = await axios.get(route('coach.nutrition.food', code));
        foodDetailsCache.value = {
            ...foodDetailsCache.value,
            [code]: res.data,
        };
    } catch (e) {
        hoverError.value = 'Impossible de charger le détail';
    } finally {
        if (hoverLoadingCode.value === code) {
            hoverLoadingCode.value = null;
        }
    }
}

function closeHoverPanel() {
    hoverFoodCode.value = null;
    hoverError.value = null;
}

onBeforeUnmount(() => {
    cancelHoverOpen();
    cancelHoverClose();
});

const isCreateOpen = ref(false);
const editingCustomFoodId = ref(null);
const createForm = useForm({
    name: '',
    protein_100g: '',
    carbs_100g: '',
    fat_100g: '',
    micros: {
        '10120': '', // Mg (mg/100g)
        '10260': '', // Fe (mg/100g)
        '10300': '', // Zn (mg/100g)
        '52100': '', // Vit D (µg/100g)
        '56100': '', // B1 (mg/100g)
        '56200': '', // B2 (mg/100g)
        '56310': '', // B3 (mg/100g)
        '56400': '', // B5 (mg/100g)
        '56500': '', // B6 (mg/100g)
        '56700': '', // B9 (µg/100g)
        '56600': '', // B12 (µg/100g)
    },
});

const computedKcal = computed(() => {
    const p = Number(createForm.protein_100g || 0);
    const c = Number(createForm.carbs_100g || 0);
    const f = Number(createForm.fat_100g || 0);

    if (Number.isNaN(p) && Number.isNaN(c) && Number.isNaN(f)) {
        return null;
    }
    const kcal = (Number.isNaN(p) ? 0 : p) * 4 + (Number.isNaN(c) ? 0 : c) * 4 + (Number.isNaN(f) ? 0 : f) * 9;
    return kcal;
});

function openCreateModal() {
    editingCustomFoodId.value = null;
    createForm.reset();
    createForm.clearErrors();
    createForm.micros = {
        '10120': '',
        '10260': '',
        '10300': '',
        '52100': '',
        '56100': '',
        '56200': '',
        '56310': '',
        '56400': '',
        '56500': '',
        '56700': '',
        '56600': '',
    };
    isCreateOpen.value = true;
}

function closeCreateModal() {
    isCreateOpen.value = false;
    editingCustomFoodId.value = null;
    createForm.clearErrors();
}

function submitCreate() {
    const url = editingCustomFoodId.value
        ? route('coach.nutrition.custom-foods.update', editingCustomFoodId.value)
        : route('coach.nutrition.custom-foods.store');

    const method = editingCustomFoodId.value ? 'put' : 'post';

    createForm[method](url, {
        preserveScroll: true,
        onSuccess: () => {
            isCreateOpen.value = false;
            editingCustomFoodId.value = null;
            createForm.reset();
        },
    });
}

async function onEditCustomFood(customFoodId) {
    editingCustomFoodId.value = customFoodId;
    createForm.clearErrors();
    isCreateOpen.value = true;

    try {
        const res = await axios.get(route('coach.nutrition.custom-foods.show', customFoodId));
        const food = res.data?.food;
        const micros = res.data?.micros ?? {};

        createForm.name = food?.name ?? '';
        createForm.protein_100g = food?.protein_100g ?? '';
        createForm.carbs_100g = food?.carbs_100g ?? '';
        createForm.fat_100g = food?.fat_100g ?? '';

        createForm.micros = {
            '10120': micros['10120'] ?? '',
            '10260': micros['10260'] ?? '',
            '10300': micros['10300'] ?? '',
            '52100': micros['52100'] ?? '',
            '56100': micros['56100'] ?? '',
            '56200': micros['56200'] ?? '',
            '56310': micros['56310'] ?? '',
            '56400': micros['56400'] ?? '',
            '56500': micros['56500'] ?? '',
            '56700': micros['56700'] ?? '',
            '56600': micros['56600'] ?? '',
        };
    } catch (e) {
        isCreateOpen.value = false;
        editingCustomFoodId.value = null;
    }
}

function onDeleteCustomFood(customFoodId) {
    if (!confirm('Supprimer cet aliment ?')) {
        return;
    }
    router.delete(route('coach.nutrition.custom-foods.destroy', customFoodId), {
        preserveScroll: true,
        preserveState: true,
    });
}

function formatNumber(v) {
    if (v === null || v === undefined || v === '') {
        return '—';
    }
    const n = Number(v);
    if (Number.isNaN(n)) {
        return String(v);
    }
    return n.toFixed(n >= 10 ? 0 : 1);
}
</script>

<template>
    <Head title="Library" />

    <CoachLayout>
        <template #subnav>
            <div class="p-3">
                <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">Library</div>

                <div class="mt-3 space-y-5">
                    <div v-for="g in groups" :key="g.title">
                        <div class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                            {{ g.title }}
                        </div>
                        <div class="mt-2 space-y-1">
                            <button
                                v-for="item in g.items"
                                :key="item.id"
                                type="button"
                                :class="sectionClass(item.id === selectedItem?.id)"
                                @click="selectSection(item.id)"
                            >
                                <span class="truncate">{{ item.label }}</span>
                            </button>
                        </div>
                    </div>

                    <div
                        v-if="isFoodsMine && hoverFoodCode"
                        class="fixed bottom-6 right-6 top-24 z-50 w-[420px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
                        @mouseenter="cancelHoverClose"
                        @mouseleave="scheduleHoverClose"
                    >
                        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                            <div class="min-w-0">
                                <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">Détails aliment</div>
                                <div class="truncate text-sm font-semibold text-gray-900">
                                    {{ hoverData?.food?.name_fr ?? `#${hoverFoodCode}` }}
                                </div>
                            </div>
                            <button
                                type="button"
                                class="rounded-md px-2 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                                @click="closeHoverPanel"
                            >
                                Fermer
                            </button>
                        </div>

                        <div class="h-full overflow-y-auto p-4">
                            <div v-if="hoverError" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {{ hoverError }}
                            </div>

                            <div v-else-if="hoverLoadingCode === hoverFoodCode" class="text-sm text-gray-600">
                                Chargement...
                            </div>

                            <div v-else-if="hoverData" class="space-y-4">
                                <div class="rounded-lg border border-gray-200 p-3">
                                    <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">Meta</div>
                                    <div class="mt-2 space-y-1 text-sm text-gray-700">
                                        <div><span class="font-semibold">Code:</span> {{ hoverData.food.alim_code }}</div>
                                        <div v-if="hoverData.group">
                                            <span class="font-semibold">Catégories:</span>
                                            {{ hoverData.group.alim_grp_name_fr }}
                                            / {{ hoverData.group.alim_ssgrp_name_fr }}
                                            / {{ hoverData.group.alim_ssssgrp_name_fr }}
                                        </div>
                                        <div v-if="hoverData.food.name_en"><span class="font-semibold">EN:</span> {{ hoverData.food.name_en }}</div>
                                        <div v-if="hoverData.food.name_sci"><span class="font-semibold">Sci:</span> {{ hoverData.food.name_sci }}</div>
                                    </div>
                                </div>

                                <div class="rounded-lg border border-gray-200 p-3">
                                    <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">Constituants</div>

                                    <div class="mt-3 overflow-hidden rounded-md border border-gray-200">
                                        <div class="max-h-[520px] overflow-auto">
                                            <table class="min-w-full divide-y divide-gray-200">
                                                <thead class="bg-gray-50">
                                                    <tr>
                                                        <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nom</th>
                                                        <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Valeur</th>
                                                        <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Min</th>
                                                        <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Max</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-gray-100 bg-white">
                                                    <tr v-for="c in hoverData.compositions" :key="c.const_code" class="align-top">
                                                        <td class="px-3 py-2 text-xs text-gray-900">
                                                            <div class="font-semibold">{{ c.const_name_fr }}</div>
                                                            <div class="mt-0.5 text-[11px] text-gray-500">
                                                                {{ c.infoods_code || '' }}
                                                                <span v-if="c.code_confiance">· conf {{ c.code_confiance }}</span>
                                                            </div>
                                                            <div v-if="c.ref_citation" class="mt-1 text-[11px] text-gray-500">
                                                                {{ c.ref_citation }}
                                                            </div>
                                                        </td>
                                                        <td class="whitespace-nowrap px-3 py-2 text-right text-xs text-gray-700">{{ formatNumber(c.teneur) }}</td>
                                                        <td class="whitespace-nowrap px-3 py-2 text-right text-xs text-gray-700">{{ formatNumber(c.min) }}</td>
                                                        <td class="whitespace-nowrap px-3 py-2 text-right text-xs text-gray-700">{{ formatNumber(c.max) }}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template #header>
            <div>
                <h2 class="text-xl font-semibold leading-tight text-gray-900">Library</h2>
                <p class="mt-1 text-sm text-gray-500">Bibliothèque d'exercices / ressources (placeholder)</p>
            </div>
        </template>

        <div class="py-8">
            <div class="mx-auto max-w-none px-4 sm:px-6 lg:px-8">
                <div class="rounded-lg bg-white p-6 shadow-sm">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">Vue</div>
                            <div class="mt-1 text-lg font-semibold text-gray-900">
                                {{ selectedItem?.label }}
                            </div>
                            <div class="mt-1 text-sm text-gray-600">
                                Ici on affichera la vue dédiée (templates, CRUD, recherche, etc.).
                            </div>
                        </div>

                        <button
                            type="button"
                            class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                            :disabled="!(isFoodsMine || isMealsFavorites)"
                            :class="!(isFoodsMine || isMealsFavorites) ? 'opacity-50 cursor-not-allowed' : ''"
                            @click="isFoodsMine ? openCreateModal() : openMealCreateModal(null)"
                        >
                            Nouveau
                        </button>
                    </div>

                    <div v-if="isFoodsMine" class="mt-6">
                        <div v-if="customFoods.length > 0" class="mb-6 overflow-hidden rounded-lg border border-gray-200">
                            <div class="border-b border-gray-200 bg-gray-50 px-4 py-3">
                                <div class="text-sm font-semibold text-gray-900">Mes aliments (custom)</div>
                                <div class="mt-1 text-sm text-gray-600">Aliments créés par toi (privés)</div>
                            </div>

                            <div class="overflow-x-auto bg-white">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-white">
                                        <tr>
                                            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nom</th>
                                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">kcal/100g</th>
                                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Prot</th>
                                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Gluc</th>
                                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Lip</th>
                                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 bg-white">
                                        <tr v-for="c in customFoods" :key="c.id" class="hover:bg-gray-50">
                                            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{{ c.name }}</td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(c.kcal_100g) }}</td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(c.protein_100g) }}</td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(c.carbs_100g) }}</td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(c.fat_100g) }}</td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm">
                                                <button
                                                    type="button"
                                                    class="rounded-md px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                                                    @click="onEditCustomFood(c.id)"
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    type="button"
                                                    class="ml-1 rounded-md px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-50"
                                                    @click="onDeleteCustomFood(c.id)"
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <form class="flex flex-wrap items-end gap-2" @submit.prevent="submitSearch">
                            <input
                                v-model="search"
                                type="search"
                                placeholder="Rechercher un aliment..."
                                class="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:ring-gray-900"
                            />

                            <div class="w-56">
                                <label class="block text-xs font-semibold text-gray-600">Groupe</label>
                                <select
                                    v-model="grp"
                                    class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                    @change="onGroupChange($event.target.value)"
                                >
                                    <option value="">Tous</option>
                                    <option
                                        v-for="g in (categoryOptions?.groups ?? [])"
                                        :key="g.alim_grp_code"
                                        :value="String(g.alim_grp_code).trim()"
                                    >
                                        {{ String(g.alim_grp_code).trim() }} - {{ g.alim_grp_name_fr }}
                                    </option>
                                </select>
                            </div>

                            <div class="w-56">
                                <label class="block text-xs font-semibold text-gray-600">Sous-groupe</label>
                                <select
                                    v-model="ssgrp"
                                    class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                    :disabled="!grp"
                                    @change="onSubgroupChange($event.target.value)"
                                >
                                    <option value="">Tous</option>
                                    <option
                                        v-for="sg in (categoryOptions?.subgroups ?? [])"
                                        :key="sg.alim_ssgrp_code"
                                        :value="String(sg.alim_ssgrp_code).trim()"
                                    >
                                        {{ String(sg.alim_ssgrp_code).trim() }} - {{ sg.alim_ssgrp_name_fr }}
                                    </option>
                                </select>
                            </div>

                            <div class="w-56">
                                <label class="block text-xs font-semibold text-gray-600">Sous-sous-groupe</label>
                                <select
                                    v-model="ssssgrp"
                                    class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                    :disabled="!grp || !ssgrp"
                                    @change="onSubsubgroupChange($event.target.value)"
                                >
                                    <option value="">Tous</option>
                                    <option
                                        v-for="ssg in (categoryOptions?.subsubgroups ?? [])"
                                        :key="ssg.alim_ssssgrp_code"
                                        :value="String(ssg.alim_ssssgrp_code).trim()"
                                    >
                                        {{ String(ssg.alim_ssssgrp_code).trim() }} - {{ ssg.alim_ssssgrp_name_fr }}
                                    </option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                            >
                                Rechercher
                            </button>

                            <button
                                type="button"
                                class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                @click="resetFilters"
                            >
                                Reset
                            </button>
                        </form>

                        <div class="mt-4 overflow-hidden rounded-lg border border-gray-200">
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Aliment
                                            </th>
                                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                kcal/100g
                                            </th>
                                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Prot
                                            </th>
                                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Gluc
                                            </th>
                                            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                                                Lip
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody class="divide-y divide-gray-100 bg-white">
                                        <tr
                                            v-for="row in (foods?.data ?? [])"
                                            :key="row.alim_code"
                                            class="hover:bg-gray-50"
                                        >
                                            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                                <span
                                                    class="cursor-help"
                                                    @mouseenter="onFoodNameEnter(row.alim_code)"
                                                    @mouseleave="onFoodNameLeave"
                                                >
                                                    {{ row.name_fr }}
                                                </span>
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                                {{ formatNumber(row.kcal_100g) }}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                                {{ formatNumber(row.protein_100g) }}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                                {{ formatNumber(row.carbs_100g) }}
                                            </td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                                                {{ formatNumber(row.fat_100g) }}
                                            </td>
                                        </tr>

                                        <tr v-if="(foods?.data ?? []).length === 0">
                                            <td colspan="5" class="px-4 py-8 text-center text-sm text-gray-500">
                                                Aucun résultat
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div v-if="foods?.links" class="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-3">
                                <div class="text-sm text-gray-600">
                                    {{ foods?.meta?.from ?? 0 }}-{{ foods?.meta?.to ?? 0 }} / {{ foods?.meta?.total ?? 0 }}
                                </div>

                                <div class="flex flex-wrap items-center gap-1">
                                    <Link
                                        v-for="l in foods.links"
                                        :key="l.label"
                                        :href="l.url || ''"
                                        preserve-scroll
                                        preserve-state
                                        class="rounded-md px-3 py-2 text-sm"
                                        :class="l.active ? 'bg-gray-900 text-white' : (l.url ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-400 cursor-not-allowed')"
                                        :aria-disabled="!l.url"
                                        :tabindex="l.url ? 0 : -1"
                                    >
                                        <span v-html="l.label" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="isMealsFavorites" class="mt-6">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <div class="text-sm font-semibold text-gray-900">Repas favoris</div>
                                <div class="mt-1 text-sm text-gray-600">Crée des repas templates et leurs substituts.</div>
                            </div>
                            <button
                                type="button"
                                class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                @click="openMealCreateModal(null)"
                            >
                                Nouveau repas
                            </button>
                        </div>

                        <div v-if="(mealTemplates ?? []).length === 0" class="mt-6 rounded-lg border border-dashed border-gray-300 p-6">
                            <div class="text-sm font-medium text-gray-900">Aucun repas</div>
                            <div class="mt-1 text-sm text-gray-600">Clique sur “Nouveau repas” pour créer ton premier template.</div>
                        </div>

                        <div v-else class="mt-6 space-y-4">
                            <div v-for="m in mealTemplates" :key="m.id" class="rounded-lg border border-gray-200 bg-white">
                                <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 p-4">
                                    <div class="min-w-0">
                                        <div class="text-sm font-semibold text-gray-900">{{ m.name }}</div>
                                        <div v-if="m.notes" class="mt-1 text-sm text-gray-600">{{ m.notes }}</div>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-2">
                                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="openAddItemModal(m.id)">
                                            Ajouter aliment
                                        </button>
                                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="openMealEditModal(m)">
                                            Modifier
                                        </button>
                                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="openMealCreateModal(m.id)">
                                            Ajouter substitut
                                        </button>
                                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="duplicateSubstitute(m.id)">
                                            Dupliquer en substitut
                                        </button>
                                        <button type="button" class="rounded-md px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" @click="deleteMeal(m.id)">
                                            Supprimer
                                        </button>
                                    </div>
                                </div>

                                <div class="p-4">
                                    <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">Items</div>

                                    <div v-if="(m.items ?? []).length === 0" class="mt-3 text-sm text-gray-600">Aucun aliment.</div>

                                    <div v-else class="mt-3 overflow-hidden rounded-md border border-gray-200">
                                        <table class="min-w-full divide-y divide-gray-200">
                                            <thead class="bg-gray-50">
                                                <tr>
                                                    <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Aliment</th>
                                                    <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Quantité (g)</th>
                                                    <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-gray-100 bg-white">
                                                <tr v-for="it in m.items" :key="it.id">
                                                    <td class="px-3 py-2 text-sm font-medium text-gray-900">{{ it.name }}</td>
                                                    <td class="px-3 py-2 text-right">
                                                        <input
                                                            :default-value="it.quantity_g"
                                                            type="number"
                                                            step="0.001"
                                                            class="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                                            @change="updateMealItem(it.id, $event.target.value)"
                                                        />
                                                    </td>
                                                    <td class="px-3 py-2 text-right">
                                                        <button type="button" class="rounded-md px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-50" @click="deleteMealItem(it.id)">
                                                            Retirer
                                                        </button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div v-if="(m.substitutes ?? []).length > 0" class="mt-6">
                                        <div class="text-xs font-semibold uppercase tracking-wider text-gray-500">Substituts</div>

                                        <div class="mt-3 space-y-3">
                                            <div v-for="s in m.substitutes" :key="s.id" class="rounded-lg border border-gray-200 bg-gray-50">
                                                <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 p-3">
                                                    <div class="min-w-0">
                                                        <div class="text-sm font-semibold text-gray-900">{{ s.name }}</div>
                                                        <div v-if="s.notes" class="mt-1 text-sm text-gray-600">{{ s.notes }}</div>
                                                    </div>
                                                    <div class="flex flex-wrap items-center gap-2">
                                                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="openAddItemModal(s.id)">
                                                            Ajouter aliment
                                                        </button>
                                                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="openMealEditModal(s)">
                                                            Modifier
                                                        </button>
                                                        <button type="button" class="rounded-md px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50" @click="deleteMeal(s.id)">
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                </div>

                                                <div class="p-3">
                                                    <div v-if="(s.items ?? []).length === 0" class="text-sm text-gray-600">Aucun aliment.</div>
                                                    <div v-else class="overflow-hidden rounded-md border border-gray-200 bg-white">
                                                        <table class="min-w-full divide-y divide-gray-200">
                                                            <thead class="bg-gray-50">
                                                                <tr>
                                                                    <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Aliment</th>
                                                                    <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Quantité (g)</th>
                                                                    <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody class="divide-y divide-gray-100 bg-white">
                                                                <tr v-for="it in s.items" :key="it.id">
                                                                    <td class="px-3 py-2 text-sm font-medium text-gray-900">{{ it.name }}</td>
                                                                    <td class="px-3 py-2 text-right">
                                                                        <input
                                                                            :default-value="it.quantity_g"
                                                                            type="number"
                                                                            step="0.001"
                                                                            class="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                                                            @change="updateMealItem(it.id, $event.target.value)"
                                                                        />
                                                                    </td>
                                                                    <td class="px-3 py-2 text-right">
                                                                        <button type="button" class="rounded-md px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-50" @click="deleteMealItem(it.id)">
                                                                            Retirer
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="mt-6 rounded-lg border border-dashed border-gray-300 p-6">
                        <div class="text-sm font-medium text-gray-900">Placeholder (table-ready)</div>
                        <div class="mt-1 text-sm text-gray-600">
                            Section id: <span class="font-mono text-xs">{{ selectedItem?.id }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <Modal :show="isCreateOpen" maxWidth="lg" @close="closeCreateModal">
            <div class="p-6">
                <div class="text-lg font-semibold text-gray-900">
                    {{ editingCustomFoodId ? 'Modifier un aliment (custom)' : 'Nouvel aliment (custom)' }}
                </div>
                <div class="mt-1 text-sm text-gray-600">
                    Cet aliment sera visible uniquement par toi.
                </div>

                <form class="mt-6 space-y-4" @submit.prevent="submitCreate">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Nom</label>
                        <input
                            v-model="createForm.name"
                            type="text"
                            class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            autofocus
                        />
                        <div v-if="createForm.errors.name" class="mt-1 text-sm text-red-600">{{ createForm.errors.name }}</div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Protéines / 100g</label>
                            <input v-model="createForm.protein_100g" type="number" step="0.01" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Glucides / 100g</label>
                            <input v-model="createForm.carbs_100g" type="number" step="0.01" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Lipides / 100g</label>
                            <input v-model="createForm.fat_100g" type="number" step="0.01" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                    </div>

                    <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <span class="font-semibold">kcal / 100g (calculées):</span>
                        {{ computedKcal === null ? '—' : formatNumber(computedKcal) }}
                        <span class="ml-2 text-xs text-gray-500">(Prot*4 + Gluc*4 + Lip*9)</span>
                    </div>

                    <div class="pt-2">
                        <div class="text-sm font-semibold text-gray-900">Micronutriments</div>
                        <div class="mt-1 text-sm text-gray-600">Unités identiques à la base importée (mg/100g ou µg/100g).</div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Magnésium (mg/100g)</label>
                            <input v-model="createForm.micros['10120']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Fer (mg/100g)</label>
                            <input v-model="createForm.micros['10260']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Zinc (mg/100g)</label>
                            <input v-model="createForm.micros['10300']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Vitamine D (µg/100g)</label>
                            <input v-model="createForm.micros['52100']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Vitamine B1 (mg/100g)</label>
                            <input v-model="createForm.micros['56100']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Vitamine B2 (mg/100g)</label>
                            <input v-model="createForm.micros['56200']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Vitamine B3 (mg/100g)</label>
                            <input v-model="createForm.micros['56310']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Vitamine B5 (mg/100g)</label>
                            <input v-model="createForm.micros['56400']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Vitamine B6 (mg/100g)</label>
                            <input v-model="createForm.micros['56500']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Vitamine B9 (µg/100g)</label>
                            <input v-model="createForm.micros['56700']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Vitamine B12 (µg/100g)</label>
                            <input v-model="createForm.micros['56600']" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-2 pt-2">
                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="closeCreateModal">
                            Annuler
                        </button>
                        <button type="submit" class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800" :disabled="createForm.processing">
                            {{ editingCustomFoodId ? 'Enregistrer' : 'Créer' }}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>

        <Modal :show="isMealModalOpen" maxWidth="lg" @close="closeMealModal">
            <div class="p-6">
                <div class="text-lg font-semibold text-gray-900">{{ mealEditingId ? 'Modifier un repas' : (mealParentId ? 'Nouveau substitut' : 'Nouveau repas') }}</div>
                <div class="mt-1 text-sm text-gray-600">Un substitut est un repas alternatif lié au repas principal.</div>

                <form class="mt-6 space-y-4" @submit.prevent="submitMeal">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Nom</label>
                        <input v-model="mealForm.name" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        <div v-if="mealForm.errors.name" class="mt-1 text-sm text-red-600">{{ mealForm.errors.name }}</div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Notes (optionnel)</label>
                        <textarea v-model="mealForm.notes" rows="3" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                    </div>

                    <div class="flex items-center justify-end gap-2 pt-2">
                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="closeMealModal">Annuler</button>
                        <button type="submit" class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800" :disabled="mealForm.processing">
                            {{ mealEditingId ? 'Enregistrer' : 'Créer' }}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>

        <Modal :show="isAddItemOpen" maxWidth="lg" @close="closeAddItemModal">
            <div class="p-6">
                <div class="text-lg font-semibold text-gray-900">Ajouter un aliment</div>
                <div class="mt-1 text-sm text-gray-600">Recherche dans le catalogue et tes aliments custom.</div>

                <form class="mt-6 space-y-4" @submit.prevent="submitAddItem">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Rechercher</label>
                        <input v-model="addItemQuery" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Ex: poulet, riz..." />

                        <div v-if="addItemLoading" class="mt-2 text-sm text-gray-600">Chargement...</div>

                        <div v-if="(addItemResults.catalog.length + addItemResults.custom.length) > 0" class="mt-2 overflow-hidden rounded-md border border-gray-200">
                            <div class="max-h-64 overflow-auto">
                                <div v-if="addItemResults.custom.length > 0" class="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Custom</div>
                                <button
                                    v-for="r in addItemResults.custom"
                                    :key="'c-'+r.id"
                                    type="button"
                                    class="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    @click="selectCustomFood(r)"
                                >
                                    <span class="font-medium text-gray-900">{{ r.name }}</span>
                                    <span class="text-xs text-gray-500">{{ formatNumber(r.kcal_100g) }} kcal</span>
                                </button>

                                <div v-if="addItemResults.catalog.length > 0" class="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Catalogue</div>
                                <button
                                    v-for="r in addItemResults.catalog"
                                    :key="'f-'+r.alim_code"
                                    type="button"
                                    class="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    @click="selectCatalogFood(r)"
                                >
                                    <span class="font-medium text-gray-900">{{ r.name_fr }}</span>
                                    <span class="text-xs text-gray-500">{{ formatNumber(r.kcal_100g) }} kcal</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Quantité (g)</label>
                            <input v-model="addItemForm.quantity_g" type="number" step="0.001" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                            <div v-if="addItemForm.errors.quantity_g" class="mt-1 text-sm text-red-600">{{ addItemForm.errors.quantity_g }}</div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Type</label>
                            <div class="mt-2 text-sm text-gray-700">{{ addItemForm.source_type }}</div>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-2 pt-2">
                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="closeAddItemModal">Annuler</button>
                        <button type="submit" class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800" :disabled="addItemForm.processing">
                            Ajouter
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    </CoachLayout>
</template>

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
const createForm = useForm({
    name: '',
    kcal_100g: '',
    protein_100g: '',
    carbs_100g: '',
    fat_100g: '',
});

function openCreateModal() {
    isCreateOpen.value = true;
}

function closeCreateModal() {
    isCreateOpen.value = false;
    createForm.clearErrors();
}

function submitCreate() {
    createForm.post(route('coach.nutrition.custom-foods.store'), {
        preserveScroll: true,
        onSuccess: () => {
            isCreateOpen.value = false;
            createForm.reset();
        },
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
                            :disabled="!isFoodsMine"
                            :class="!isFoodsMine ? 'opacity-50 cursor-not-allowed' : ''"
                            @click="openCreateModal"
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
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-100 bg-white">
                                        <tr v-for="c in customFoods" :key="c.id" class="hover:bg-gray-50">
                                            <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{{ c.name }}</td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(c.kcal_100g) }}</td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(c.protein_100g) }}</td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(c.carbs_100g) }}</td>
                                            <td class="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(c.fat_100g) }}</td>
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
                <div class="text-lg font-semibold text-gray-900">Nouvel aliment (custom)</div>
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
                            <label class="block text-sm font-medium text-gray-700">kcal / 100g</label>
                            <input v-model="createForm.kcal_100g" type="number" step="0.01" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                        </div>
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

                    <div class="flex items-center justify-end gap-2 pt-2">
                        <button type="button" class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" @click="closeCreateModal">
                            Annuler
                        </button>
                        <button type="submit" class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800" :disabled="createForm.processing">
                            Créer
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    </CoachLayout>
</template>

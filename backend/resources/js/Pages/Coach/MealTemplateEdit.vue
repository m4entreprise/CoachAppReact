<script setup>
import axios from 'axios';
import Modal from '@/Components/Modal.vue';
import { computed, ref, watch } from 'vue';
import CoachLayout from '@/Layouts/CoachLayout.vue';
import { Head, Link, router, useForm } from '@inertiajs/vue3';

const props = defineProps({
    meal: {
        type: Object,
        required: true,
    },
    items: {
        type: Array,
        default: () => [],
    },
    totals: {
        type: Object,
        default: () => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 }),
    },
});

const mealForm = useForm({
    name: props.meal?.name ?? '',
    notes: props.meal?.notes ?? '',
});

watch(
    () => props.meal,
    (m) => {
        mealForm.name = m?.name ?? '';
        mealForm.notes = m?.notes ?? '';
    },
);

function submitMeal() {
    mealForm.put(route('coach.nutrition.meal-templates.update', props.meal.id), {
        preserveScroll: true,
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

const isAddItemOpen = ref(false);
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

function openAddItemModal() {
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
    addItemForm.post(route('coach.nutrition.meal-items.store', props.meal.id), {
        preserveScroll: true,
        onSuccess: () => closeAddItemModal(),
    });
}

const breadcrumbTitle = computed(() => {
    if (props.meal?.parent_meal_id) {
        return 'Modifier substitut';
    }
    return 'Modifier repas';
});
</script>

<template>
    <Head :title="breadcrumbTitle" />

    <CoachLayout>
        <template #header>
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 class="text-xl font-semibold leading-tight text-gray-800">{{ breadcrumbTitle }}</h2>
                    <p class="mt-1 text-sm text-gray-500">Édition complète du repas (items, quantités, macros).</p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                    <Link
                        :href="route('coach.library', { section: 'meals-favorites' })"
                        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Retour
                    </Link>

                    <button
                        type="button"
                        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        @click="openAddItemModal"
                    >
                        Ajouter aliment
                    </button>
                </div>
            </div>
        </template>

        <div class="py-8">
            <div class="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                <div class="rounded-lg bg-white p-6 shadow-sm">
                    <form class="space-y-4" @submit.prevent="submitMeal">
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Nom</label>
                                <input v-model="mealForm.name" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                                <div v-if="mealForm.errors.name" class="mt-1 text-sm text-red-600">{{ mealForm.errors.name }}</div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700">Notes (optionnel)</label>
                                <input v-model="mealForm.notes" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                                <div v-if="mealForm.errors.notes" class="mt-1 text-sm text-red-600">{{ mealForm.errors.notes }}</div>
                            </div>
                        </div>

                        <div class="flex items-center justify-end gap-2">
                            <button type="submit" class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800" :disabled="mealForm.processing">
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>

                <div class="rounded-lg bg-white p-6 shadow-sm">
                    <div class="text-sm font-semibold text-gray-900">Calories & macros</div>
                    <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

                <div class="rounded-lg bg-white shadow-sm">
                    <div class="border-b border-gray-200 p-4">
                        <div class="text-sm font-semibold text-gray-900">Items</div>
                        <div class="mt-1 text-sm text-gray-500">Modifie la quantité pour mettre à jour automatiquement.</div>
                    </div>

                    <div v-if="(items ?? []).length === 0" class="p-6 text-sm text-gray-600">Aucun aliment.</div>

                    <div v-else class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Aliment</th>
                                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Quantité (g)</th>
                                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">kcal</th>
                                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">P</th>
                                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">G</th>
                                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">L</th>
                                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 bg-white">
                                <tr v-for="it in items" :key="it.id" class="hover:bg-gray-50">
                                    <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ it.name }}</td>
                                    <td class="px-4 py-3 text-right">
                                        <input
                                            :default-value="it.quantity_g"
                                            type="number"
                                            step="0.001"
                                            class="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                            @change="updateMealItem(it.id, $event.target.value)"
                                        />
                                    </td>
                                    <td class="px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(it.kcal) }}</td>
                                    <td class="px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(it.protein) }}</td>
                                    <td class="px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(it.carbs) }}</td>
                                    <td class="px-4 py-3 text-right text-sm text-gray-700">{{ formatNumber(it.fat) }}</td>
                                    <td class="px-4 py-3 text-right">
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

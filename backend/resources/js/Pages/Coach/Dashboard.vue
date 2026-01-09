<script setup>
import { ref } from 'vue';
import CoachLayout from '@/Layouts/CoachLayout.vue';
import { Head } from '@inertiajs/vue3';
import { useAutoAnimate } from '@formkit/auto-animate/vue';
import draggable from 'vuedraggable';

defineProps({
    stats: {
        type: Object,
        default: () => ({}),
    },
});

const widgets = ref([
    { id: 'w1', title: 'Suivi check-ins', description: 'Voir les derniers check-ins reçus.' },
    { id: 'w2', title: 'Plan de la semaine', description: 'Organiser les tâches coach.' },
    { id: 'w3', title: 'Documents', description: 'Envoyer des docs aux clients.' },
]);

const [widgetsParent] = useAutoAnimate();
</script>

<template>
    <Head title="Coach" />

    <CoachLayout>
        <template #header>
            <div>
                <h2 class="text-xl font-semibold leading-tight text-gray-800">Coach Dashboard</h2>
                <p class="mt-1 text-sm text-gray-500">Vue d'ensemble (MVP)</p>
            </div>
        </template>

        <div class="py-8">
            <div class="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div class="rounded-lg bg-white p-6 shadow-sm">
                        <div class="text-sm font-medium text-gray-500">Élèves</div>
                        <div class="mt-2 text-3xl font-extrabold text-gray-900">
                            {{ stats.totalStudents ?? 0 }}
                        </div>
                        <div class="mt-2 text-sm text-gray-500">Total enregistrés</div>
                    </div>

                    <div class="rounded-lg bg-white p-6 shadow-sm">
                        <div class="text-sm font-medium text-gray-500">Dernière inscription</div>
                        <div class="mt-2 text-lg font-semibold text-gray-900">
                            {{ stats.latestStudentName ?? '—' }}
                        </div>
                        <div class="mt-1 text-sm text-gray-500">
                            {{ stats.latestStudentEmail ?? '' }}
                        </div>
                    </div>

                    <div class="rounded-lg bg-white p-6 shadow-sm">
                        <div class="text-sm font-medium text-gray-500">Prochaines étapes</div>
                        <div class="mt-2 text-sm text-gray-700">
                            <div class="font-medium">1) Gestion élèves</div>
                            <div class="text-gray-500">2) Programmes & assignation</div>
                            <div class="text-gray-500">3) Sync mobile</div>
                        </div>
                    </div>
                </div>

                <div class="rounded-lg bg-white p-6 shadow-sm">
                    <div class="text-base font-semibold text-gray-900">Résumé</div>
                    <div class="mt-2 text-sm text-gray-600">
                        Cet espace est le frontend coach web (Inertia/Vue). Il sert de base pour gérer tes élèves,
                        puis les programmes, la nutrition, les check-ins, etc.
                    </div>
                </div>

                <div class="rounded-lg bg-white p-6 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-base font-semibold text-gray-900">Widgets (prototype)</div>
                            <div class="mt-1 text-sm text-gray-500">
                                Drag & drop + animations (préparation UI)
                            </div>
                        </div>
                        <button
                            type="button"
                            class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                            @click="widgets.push({ id: `w${Date.now()}`, title: 'Nouveau widget', description: 'À configurer.' })"
                        >
                            Ajouter
                        </button>
                    </div>

                    <div ref="widgetsParent" class="mt-4">
                        <draggable v-model="widgets" item-key="id" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <template #item="{ element }">
                                <div class="cursor-move rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <div class="text-sm font-semibold text-gray-900">
                                        {{ element.title }}
                                    </div>
                                    <div class="mt-1 text-sm text-gray-600">
                                        {{ element.description }}
                                    </div>
                                </div>
                            </template>
                        </draggable>
                    </div>
                </div>
            </div>
        </div>
    </CoachLayout>
</template>

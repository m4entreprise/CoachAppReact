<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';

defineProps({
    students: {
        type: Array,
        default: () => [],
    },
});
</script>

<template>
    <Head title="Élèves" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="text-xl font-semibold leading-tight text-gray-800">
                Élèves
            </h2>
        </template>

        <div class="py-12">
            <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div class="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div class="p-6 text-gray-900">
                        <div v-if="students.length === 0">Aucun élève</div>
                        <div v-else class="space-y-2">
                            <div
                                v-for="s in students"
                                :key="s.id"
                                class="flex items-center justify-between rounded border border-gray-200 p-3"
                            >
                                <div>
                                    <div class="font-medium">{{ s.name }}</div>
                                    <div class="text-sm text-gray-500">{{ s.email }}</div>
                                </div>
                                <div class="text-xs rounded bg-gray-100 px-2 py-1">
                                    {{ s.role }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>

<script setup>
import CoachLayout from '@/Layouts/CoachLayout.vue';
import { Head } from '@inertiajs/vue3';

defineProps({
    students: {
        type: Array,
        default: () => [],
    },
});
</script>

<template>
    <Head title="Clients" />

    <CoachLayout>
        <template #header>
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h2 class="text-xl font-semibold leading-tight text-gray-900">Clients</h2>
                    <p class="mt-1 text-sm text-gray-500">Base CRM (MVP)</p>
                </div>

                <button
                    type="button"
                    class="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    disabled
                >
                    Inviter
                </button>
            </div>
        </template>

        <div class="py-8">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div class="p-6">
                        <div
                            v-if="students.length === 0"
                            class="rounded-md border border-dashed border-gray-300 p-8 text-center"
                        >
                            <div class="text-sm font-medium text-gray-900">Aucun client</div>
                            <div class="mt-1 text-sm text-gray-500">
                                Le seed crée <span class="font-medium">student@example.com</span>.
                            </div>
                        </div>

                        <div v-else class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th
                                            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                        >
                                            Nom
                                        </th>
                                        <th
                                            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                        >
                                            Email
                                        </th>
                                        <th
                                            class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                                        >
                                            Statut
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 bg-white">
                                    <tr
                                        v-for="s in students"
                                        :key="s.id"
                                        class="hover:bg-gray-50"
                                    >
                                        <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                            {{ s.name }}
                                        </td>
                                        <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                            {{ s.email }}
                                        </td>
                                        <td class="whitespace-nowrap px-4 py-3 text-right">
                                            <span
                                                class="inline-flex rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
                                            >
                                                Actif
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </CoachLayout>
</template>

<script setup>
import CoachLayout from '@/Layouts/CoachLayout.vue';
import { Head } from '@inertiajs/vue3';
</script>

<template>
    <Head title="Documents" />

    <CoachLayout>
        <template #header>
            <div>
                <h2 class="text-xl font-semibold leading-tight text-gray-900">Documents</h2>
                <p class="mt-1 text-sm text-gray-500">Fichiers, PDFs, ressources (placeholder)</p>
            </div>
        </template>

        <div class="py-8">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="rounded-lg bg-white p-6 shadow-sm">
                    <div class="text-sm font-medium text-gray-900">Coming soon</div>
                    <div class="mt-1 text-sm text-gray-600">
                        On branchera ici l'upload + partage de documents par client/programme.
                    </div>
                </div>
            </div>
        </div>
    </CoachLayout>
</template>

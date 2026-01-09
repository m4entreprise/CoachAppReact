<script setup>
import CoachLayout from '@/Layouts/CoachLayout.vue';
import { Head } from '@inertiajs/vue3';
</script>

<template>
    <Head title="Community" />

    <CoachLayout>
        <template #header>
            <div>
                <h2 class="text-xl font-semibold leading-tight text-gray-900">Community</h2>
                <p class="mt-1 text-sm text-gray-500">Groupes, annonces, posts (placeholder)</p>
            </div>
        </template>

        <div class="py-8">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="rounded-lg bg-white p-6 shadow-sm">
                    <div class="text-sm font-medium text-gray-900">Coming soon</div>
                    <div class="mt-1 text-sm text-gray-600">
                        À terme: fil d'actualité coach, annonces, communauté par programme.
                    </div>
                </div>
            </div>
        </div>
    </CoachLayout>
</template>

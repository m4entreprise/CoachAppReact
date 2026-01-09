<script setup>
import CoachLayout from '@/Layouts/CoachLayout.vue';
import { Head } from '@inertiajs/vue3';
</script>

<template>
    <Head title="Mon site web" />

    <CoachLayout>
        <template #header>
            <div>
                <h2 class="text-xl font-semibold leading-tight text-gray-900">Mon site web</h2>
                <p class="mt-1 text-sm text-gray-500">Landing / page publique coach (placeholder)</p>
            </div>
        </template>

        <div class="py-8">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="rounded-lg bg-white p-6 shadow-sm">
                    <div class="text-sm font-medium text-gray-900">Coming soon</div>
                    <div class="mt-1 text-sm text-gray-600">
                        Ici: preview + config de ta page publique (domain, sections, CTA).
                    </div>
                </div>
            </div>
        </div>
    </CoachLayout>
</template>

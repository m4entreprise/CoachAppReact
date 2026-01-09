<script setup>
import { computed } from 'vue';
import { useToastStore, toast } from '@/toast';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-vue-next';

const store = useToastStore();

const toasts = computed(() => store.toasts ?? []);

function iconFor(t) {
    if (t.type === 'success') return CheckCircle2;
    if (t.type === 'error') return CircleAlert;
    return Info;
}

function ringFor(t) {
    if (t.type === 'success') return 'ring-emerald-200 bg-emerald-50 text-emerald-950';
    if (t.type === 'error') return 'ring-red-200 bg-red-50 text-red-950';
    return 'ring-gray-200 bg-white text-gray-900';
}

function close(id) {
    toast.remove(id);
}
</script>

<template>
    <div class="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-2 p-4 sm:p-6">
        <div
            v-for="t in toasts"
            :key="t.id"
            class="pointer-events-auto w-full max-w-sm rounded-lg p-3 shadow-lg ring-1"
            :class="ringFor(t)"
        >
            <div class="flex items-start gap-3">
                <component :is="iconFor(t)" class="mt-0.5 h-5 w-5 flex-none" />

                <div class="min-w-0 flex-1">
                    <div v-if="t.title" class="text-sm font-semibold">{{ t.title }}</div>
                    <div class="text-sm">{{ t.message }}</div>
                </div>

                <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-black/5"
                    aria-label="Fermer"
                    @click="close(t.id)"
                >
                    <X class="h-4 w-4" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue';
import Dropdown from '@/Components/Dropdown.vue';
import DropdownLink from '@/Components/DropdownLink.vue';
import ToastHost from '@/Components/ToastHost.vue';
import { Link, usePage } from '@inertiajs/vue3';
import {
    Bell,
    Calendar,
    FileText,
    LayoutDashboard,
    MessageSquareText,
    MessagesSquare,
    NotebookPen,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    StickyNote,
    Users,
    ClipboardCheck,
} from 'lucide-vue-next';

const page = usePage();

const user = computed(() => page.props.auth?.user);

const avatarUrl = computed(() => user.value?.avatar_url ?? user.value?.profile_photo_url ?? null);

const isCollapsed = ref(false);

watchEffect(() => {
    try {
        const raw = localStorage.getItem('coach.sidebar.collapsed');
        if (raw === '1') {
            isCollapsed.value = true;
        }
    } catch {
        // no-op
    }
});

function toggleSidebar() {
    isCollapsed.value = !isCollapsed.value;
    try {
        localStorage.setItem('coach.sidebar.collapsed', isCollapsed.value ? '1' : '0');
    } catch {
        // no-op
    }
}

const initials = computed(() => {
    const name = user.value?.name ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase() || 'U';
});

const nav = computed(() => [
    {
        name: 'Dashboard',
        href: route('coach.dashboard'),
        active: route().current('coach.dashboard'),
        icon: LayoutDashboard,
    },
    { name: 'Clients', href: route('coach.clients'), active: route().current('coach.clients'), icon: Users },
    {
        name: 'Check-ins',
        href: route('coach.checkins'),
        active: route().current('coach.checkins'),
        icon: ClipboardCheck,
    },
    {
        name: 'Community',
        href: route('coach.community'),
        active: route().current('coach.community'),
        icon: MessageSquareText,
    },
    { name: 'Plans', href: route('coach.plans'), active: route().current('coach.plans'), icon: NotebookPen },
    {
        name: 'Calendar',
        href: route('coach.calendar'),
        active: route().current('coach.calendar'),
        icon: Calendar,
    },
    {
        name: 'Documents',
        href: route('coach.documents'),
        active: route().current('coach.documents'),
        icon: FileText,
    },
    { name: 'Notes', href: route('coach.notes'), active: route().current('coach.notes'), icon: StickyNote },
]);

function navItemClass(active) {
    const base = active
        ? 'rounded-lg bg-gray-900 text-white'
        : 'text-gray-300 hover:bg-white/10 hover:text-white';

    return [
        'flex items-center',
        isCollapsed.value ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
        'text-sm',
        active ? 'font-semibold' : 'font-medium',
        base,
    ].join(' ');
}

function topItemClass(active) {
    return active
        ? 'rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white'
        : 'rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900';
}
</script>

<template>
    <div class="min-h-screen bg-gray-950 text-white">
        <ToastHost />
        <div class="flex min-h-screen">
            <aside
                class="flex flex-col border-r border-white/10 bg-gray-950 transition-[width] duration-200"
                :class="isCollapsed ? 'w-16' : 'w-56'"
            >
                <div class="flex h-16 items-center justify-between px-3">
                    <Link
                        :href="route('coach.dashboard')"
                        class="text-base font-extrabold tracking-tight"
                        :title="isCollapsed ? 'Coach Console' : null"
                    >
                        <span v-if="!isCollapsed">Coach Console</span>
                        <span v-else>CC</span>
                    </Link>

                    <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-gray-200 hover:bg-white/15"
                        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                        @click="toggleSidebar"
                    >
                        <component :is="isCollapsed ? PanelLeftOpen : PanelLeftClose" class="h-4 w-4" />
                    </button>
                </div>

                <div class="flex-1 px-3">
                    <div class="space-y-1">
                        <Link
                            v-for="item in nav"
                            :key="item.name"
                            :href="item.href"
                            :class="navItemClass(item.active)"
                            :title="isCollapsed ? item.name : null"
                        >
                            <component :is="item.icon" class="h-4 w-4" />
                            <span v-if="!isCollapsed">{{ item.name }}</span>
                        </Link>
                    </div>
                </div>

                <div class="px-3 pb-3">
                    <Link
                        :href="route('profile.edit')"
                        class="flex items-center rounded-lg text-sm font-semibold text-gray-200 hover:bg-white/10 hover:text-white"
                        :class="isCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'"
                        title="Paramètres"
                    >
                        <Settings class="h-4 w-4" />
                        <span v-if="!isCollapsed">Paramètres</span>
                    </Link>
                </div>
            </aside>

            <aside
                v-if="$slots.subnav"
                class="w-56 border-r border-gray-200 bg-white"
            >
                <div class="h-full overflow-y-auto">
                    <slot name="subnav" />
                </div>
            </aside>

            <div class="flex min-w-0 flex-1 flex-col bg-gray-100 text-gray-900">
                <header class="border-b border-gray-200 bg-white">
                    <div class="flex h-16 items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                        <div class="flex min-w-0 items-center gap-2">
                            <Link
                                :href="route('coach.dashboard')"
                                :class="topItemClass(route().current('coach.dashboard'))"
                            >
                                Dashboard
                            </Link>
                            <Link
                                :href="route('coach.library')"
                                :class="topItemClass(route().current('coach.library'))"
                            >
                                Library
                            </Link>
                            <Link
                                :href="route('coach.forms')"
                                :class="topItemClass(route().current('coach.forms'))"
                            >
                                Forms
                            </Link>
                            <Link
                                :href="route('coach.finances')"
                                :class="topItemClass(route().current('coach.finances'))"
                            >
                                Finances
                            </Link>
                        </div>

                        <div class="flex items-center gap-2">
                            <Link
                                :href="route('coach.notifications')"
                                class="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                :aria-label="'Notifications'"
                            >
                                <Bell class="h-5 w-5" />
                            </Link>

                            <Link
                                :href="route('coach.conversations')"
                                class="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                :aria-label="'Conversations'"
                            >
                                <MessagesSquare class="h-5 w-5" />
                            </Link>

                            <Dropdown v-if="user" align="right" width="48">
                                <template #trigger>
                                    <button
                                        type="button"
                                        class="inline-flex items-center gap-3 rounded-md px-1 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        <span class="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-900">
                                            <img
                                                v-if="avatarUrl"
                                                :src="avatarUrl"
                                                alt="Profile"
                                                class="h-9 w-9 object-cover"
                                            />
                                            <span v-else class="text-xs font-extrabold text-white">{{ initials }}</span>
                                        </span>
                                    </button>
                                </template>

                                <template #content>
                                    <DropdownLink :href="route('coach.website')">Mon site web</DropdownLink>
                                    <DropdownLink :href="route('profile.edit')">Paramètre du compte</DropdownLink>
                                    <DropdownLink :href="route('coach.branding')">Custom branding</DropdownLink>
                                    <DropdownLink :href="route('logout')" method="post" as="button">
                                        Déconnexion
                                    </DropdownLink>
                                </template>
                            </Dropdown>
                        </div>
                    </div>

                    <div v-if="$slots.header" class="border-t border-gray-100">
                        <div class="px-4 py-4 sm:px-6 lg:px-8">
                            <slot name="header" />
                        </div>
                    </div>
                </header>

                <main class="min-w-0 flex-1">
                    <slot />
                </main>
            </div>
        </div>
    </div>
</template>

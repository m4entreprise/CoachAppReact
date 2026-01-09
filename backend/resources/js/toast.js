import { reactive } from 'vue';

const state = reactive({
    toasts: [],
});

let nextId = 1;

function pushToast({ type = 'info', title = '', message = '', timeout = 3000 }) {
    const id = nextId++;
    const toast = { id, type, title, message };
    state.toasts.push(toast);

    if (timeout && timeout > 0) {
        setTimeout(() => {
            removeToast(id);
        }, timeout);
    }

    return id;
}

function removeToast(id) {
    const idx = state.toasts.findIndex((t) => t.id === id);
    if (idx >= 0) {
        state.toasts.splice(idx, 1);
    }
}

export function useToastStore() {
    return state;
}

export const toast = {
    success(message, opts = {}) {
        return pushToast({ type: 'success', message, ...opts });
    },
    error(message, opts = {}) {
        return pushToast({ type: 'error', message, ...opts });
    },
    info(message, opts = {}) {
        return pushToast({ type: 'info', message, ...opts });
    },
    remove(id) {
        removeToast(id);
    },
};

import { writable } from 'svelte/store';

import type { Toast, ToastSettings } from './types';

const toastDefaults: ToastSettings = {
    message: 'Missing Toast Message'
};

// Note for security; differentiates the queued toasts
function randomUUID(): string {
    const random = Math.random();
    return Number(random).toString(32);
}

// If toast should auto-hide, wait X time, then close by ID
function handleAutoHide(toast: Toast) {
    return setTimeout(() => {
        toastStore.close(toast.id);
    }, 5000);
}

function toastService() {
    const { subscribe, set, update } = writable<Toast[]>([]);
    return {
        subscribe,
        /** Add new toast to the queue. */
        trigger: (toast: ToastSettings) => {
            const id: string = randomUUID();
            update((tStore) => {
                // Merge with defaults
                const tMerged: Toast = { ...toastDefaults, ...toast, id };
                // Handle auto-hide, if needed
                tMerged.timeoutId = handleAutoHide(tMerged);
                // Push into store
                tStore.push(tMerged);
                // Return
                return tStore;
            });
            return id;
        },
        /** Remove toast in queue*/
        close: (id: string) =>
            update((tStore) => {
                if (tStore.length > 0) {
                    const index = tStore.findIndex((t) => t.id === id);
                    const selectedToast = tStore[index];
                    if (selectedToast) {
                        // Clear timeout
                        if (selectedToast.timeoutId) clearTimeout(selectedToast.timeoutId);
                        // Remove
                        tStore.splice(index, 1);
                    }
                }
                return tStore;
            }),
        /** remain visible on hover */
        freeze: (index: number) =>
            update((tStore) => {
                if (tStore.length > 0) clearTimeout(tStore[index].timeoutId);
                return tStore;
            }),
        /** cancel remain visible on leave */
        unfreeze: (index: number) =>
            update((tStore) => {
                if (tStore.length > 0) tStore[index].timeoutId = handleAutoHide(tStore[index]);
                return tStore;
            }),
        /** Remove all toasts from queue */
        clear: () => set([])
    };
}

export const toastStore = toastService();
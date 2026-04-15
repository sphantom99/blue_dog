export interface ToastMessage {
    id: number;
    type: "success" | "error";
    title: string;
    detail?: string;
}

let nextId = 0;
const listeners = new Set<(msg: ToastMessage) => void>();

export function showToast(type: "success" | "error", title: string, detail?: string) {
    const msg: ToastMessage = { id: nextId++, type, title, detail };
    for (const fn of listeners) fn(msg);
}

export function subscribe(handler: (msg: ToastMessage) => void) {
    listeners.add(handler);
    return () => {
        listeners.delete(handler);
    };
}

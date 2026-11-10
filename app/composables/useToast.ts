import type { IconName } from '~/components/RIcon.vue'

export type ToastKind = 'ok' | 'error' | 'info'
export interface Toast { id: number, message: string, kind: ToastKind, icons?: IconName[] }

let nextId = 1

/** Korte melding onderin beeld (vervangt alert()). */
export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => [])

  /** Met `icons` toont de melding alleen beeld; de tekst blijft voor schermlezers. */
  function show(message: string, kind: ToastKind = 'info', durationMs = 3500, icons?: IconName[]) {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message, kind, icons }]
    if (import.meta.client) {
      setTimeout(() => dismiss(id), durationMs)
    }
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, show, dismiss }
}

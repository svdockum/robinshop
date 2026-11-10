import type { IconName } from '~/components/RIcon.vue'

export interface ConfirmOptions {
  title: string
  body?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  /**
   * Beeldvariant voor leden: met `confirmIcons` toont de dialoog iconen in plaats van tekst.
   * Titel en uitleg staan dan achter de ⓘ; de labels blijven voor schermlezers.
   */
  icons?: IconName[]
  confirmIcons?: IconName[]
  cancelIcons?: IconName[]
  /** Het product waar de vraag over gaat. */
  thumb?: { name: string, imageUrl: string | null }
}

interface DialogState extends ConfirmOptions { open: boolean }

let resolver: ((value: boolean) => void) | null = null

/** Eigen bevestigingsdialoog in Robin-stijl die een Promise teruggeeft (vervangt confirm()). */
export function useConfirm() {
  const state = useState<DialogState>('confirm-dialog', () => ({ open: false, title: '' }))

  function ask(options: ConfirmOptions): Promise<boolean> {
    resolver?.(false)
    state.value = { ...options, open: true }
    return new Promise((resolve) => {
      resolver = resolve
    })
  }

  function settle(value: boolean) {
    state.value = { ...state.value, open: false }
    resolver?.(value)
    resolver = null
  }

  return { state, ask, settle }
}

export interface Balance {
  year_budget: number
  month_allowance: number
  month_budget: number
  accrued: number
  advance_this_month: number
  advance_last_month: boolean
  next_month_allowance: number
  spent_year: number
  spent_month: number
  available: number
  can_advance: boolean
}

export interface VisitItem {
  scan_id: string
  product_id: string
  code: string
  name: string
  portion: string
  points: number
  image_url: string | null
  created_at: string
}

export interface Overview {
  is_admin: boolean
  household: { id: string, name: string } | null
  members?: { name: string | null, age: number }[]
  balance?: Balance
  visit?: { id: string, started_at: string, items: VisitItem[], points: number } | null
  categories?: { id: string, name: string, color: string, spent_month: number }[]
}

/** Gedeelde stand van het huishouden: saldo, bezoek, mandje. Eén RPC, overal hergebruikt. */
export function useOverview() {
  const supabase = useSupabaseClient()
  const overview = useState<Overview | null>('overview', () => null)
  const pending = useState<boolean>('overview-pending', () => false)

  async function refresh(): Promise<Overview | null> {
    pending.value = true
    try {
      const { data, error } = await supabase.rpc('my_overview')
      if (error) throw error
      overview.value = data as unknown as Overview
      return overview.value
    }
    finally {
      pending.value = false
    }
  }

  /** Werk alleen het saldo bij met een balance uit een RPC-antwoord (scheelt een aanroep). */
  function setBalance(balance: Balance | undefined) {
    if (balance && overview.value) {
      overview.value = { ...overview.value, balance }
    }
  }

  return { overview, pending, refresh, setBalance }
}

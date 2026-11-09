import type { Balance } from '~/composables/useOverview'

export interface AdminProduct {
  id: string
  code: string
  name: string
  category_id: string | null
  storage: 'vers' | 'koel' | 'vries' | 'houdbaar'
  points: number
  portion: string
  max_per_visit: number | null
  image_url: string | null
  active: boolean
}

export interface AdminCategory {
  id: string
  name: string
  color: string
  sort: number
}

export interface AdminScanPoint {
  id: string
  slug: string
  name: string
  kind: 'entrance' | 'checkout'
  interval_seconds: number
  display_key: string
}

export interface AdminHouseholdRow {
  id: string
  name: string
  email: string | null
  start_month: string
  budget_override: number | null
  has_account: boolean
  card_code: string
  members: number
  balance: Balance
}

export interface AdminHouseholdDetail {
  id: string
  name: string
  email: string | null
  start_month: string
  budget_override: number | null
  notes: string | null
  card_code: string
  auth_user_id: string | null
  members: { id: string, name: string | null, age: number }[]
  balance: Balance | null
}

export interface AdminVisit {
  id: string
  started_at: string
  ended_at: string | null
  status: 'open' | 'closed' | 'expired'
  household: { id: string, name: string } | null
  scans: { id: string, points: number, quantity: number, created_at: string, removed_at: string | null, product: { name: string, code: string } | null }[]
}

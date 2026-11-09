
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"advances": {
                  Row: {
                    "amount": number,"created_at": string,"household_id": string,"month": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"household_id": string,"month": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"household_id"?: string,"month"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "advances_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "color": string,"created_at": string,"id": string,"name": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"id"?: string,"name": string,"sort"?: number
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"id"?: string,"name"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"display_events": {
                  Row: {
                    "created_at": string,"detail": string | null,"id": number,"kind": string,"scan_point_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"detail"?: string | null,"id"?: never,"kind": string,"scan_point_id": string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"detail"?: string | null,"id"?: never,"kind"?: string,"scan_point_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "display_events_scan_point_id_fkey"
      columns: ["scan_point_id"]
isOneToOne: false
      referencedRelation: "scan_points"
      referencedColumns: ["id"]
    }
                  ]
                },"household_members": {
                  Row: {
                    "age": number,"created_at": string,"household_id": string,"id": string,"name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "age": number,"created_at"?: string,"household_id": string,"id"?: string,"name"?: string | null
                  }
                  Update: {
                    "age"?: number,"created_at"?: string,"household_id"?: string,"id"?: string,"name"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "household_members_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                },"households": {
                  Row: {
                    "auth_user_id": string | null,"budget_override": number | null,"card_code": string,"created_at": string,"email": string | null,"id": string,"name": string,"notes": string | null,"start_month": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auth_user_id"?: string | null,"budget_override"?: number | null,"card_code"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"name": string,"notes"?: string | null,"start_month"?: string
                  }
                  Update: {
                    "auth_user_id"?: string | null,"budget_override"?: number | null,"card_code"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"name"?: string,"notes"?: string | null,"start_month"?: string
                  }
                  Relationships: [
                    
                  ]
                },"products": {
                  Row: {
                    "active": boolean,"category_id": string | null,"code": string,"created_at": string,"id": string,"image_url": string | null,"max_per_visit": number | null,"name": string,"points": number,"portion": string,"storage": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"category_id"?: string | null,"code": string,"created_at"?: string,"id"?: string,"image_url"?: string | null,"max_per_visit"?: number | null,"name": string,"points": number,"portion"?: string,"storage"?: string
                  }
                  Update: {
                    "active"?: boolean,"category_id"?: string | null,"code"?: string,"created_at"?: string,"id"?: string,"image_url"?: string | null,"max_per_visit"?: number | null,"name"?: string,"points"?: number,"portion"?: string,"storage"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"scan_points": {
                  Row: {
                    "created_at": string,"display_key": string,"id": string,"interval_seconds": number,"kind": string,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_key"?: string,"id"?: string,"interval_seconds"?: number,"kind": string,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"display_key"?: string,"id"?: string,"interval_seconds"?: number,"kind"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"scans": {
                  Row: {
                    "created_at": string,"household_id": string,"id": string,"points": number,"product_id": string,"quantity": number,"removed_at": string | null,"user_id": string | null,"visit_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"household_id": string,"id"?: string,"points": number,"product_id": string,"quantity"?: number,"removed_at"?: string | null,"user_id"?: string | null,"visit_id": string
                  }
                  Update: {
                    "created_at"?: string,"household_id"?: string,"id"?: string,"points"?: number,"product_id"?: string,"quantity"?: number,"removed_at"?: string | null,"user_id"?: string | null,"visit_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "scans_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "scans_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "scans_visit_id_fkey"
      columns: ["visit_id"]
isOneToOne: false
      referencedRelation: "visits"
      referencedColumns: ["id"]
    }
                  ]
                },"visits": {
                  Row: {
                    "checkout_id": string | null,"ended_at": string | null,"entrance_id": string | null,"household_id": string,"id": string,"started_at": string,"status": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "checkout_id"?: string | null,"ended_at"?: string | null,"entrance_id"?: string | null,"household_id": string,"id"?: string,"started_at"?: string,"status"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "checkout_id"?: string | null,"ended_at"?: string | null,"entrance_id"?: string | null,"household_id"?: string,"id"?: string,"started_at"?: string,"status"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "visits_checkout_id_fkey"
      columns: ["checkout_id"]
isOneToOne: false
      referencedRelation: "scan_points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visits_entrance_id_fkey"
      columns: ["entrance_id"]
isOneToOne: false
      referencedRelation: "scan_points"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "visits_household_id_fkey"
      columns: ["household_id"]
isOneToOne: false
      referencedRelation: "households"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "admin_households":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"finish_visit":
{ Args: { "p_household": string,"p_scan_point": string }; Returns: Json
                           },
"household_balance":
{ Args: { "at"?: string,"h": string }; Returns: Json
                           },
"household_year_budget":
{ Args: { "h": string }; Returns: number
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_admin_or_server":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"month_allowance":
{ Args: { "budget": number,"m": number }; Returns: number
                           },
"my_household_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"my_overview":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"points_for_age":
{ Args: { "age": number }; Returns: number
                           },
"random_code":
{ Args: { "len": number }; Returns: string
                           },
"register_scan":
{ Args: { "p_code": string,"p_use_advance"?: boolean }; Returns: Json
                           },
"remove_scan":
{ Args: { "p_scan_id": string }; Returns: Json
                           },
"revoke_household_sessions":
{ Args: { "p_household": string }; Returns: number
                           },
"start_visit":
{ Args: { "p_household": string,"p_scan_point": string,"p_user"?: string }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

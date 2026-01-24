export type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    updated_at: string | null
}

export type Panel = {
    id: string
    user_id: string
    name: string
    created_at: string
}

export type LeadStatus = 'cold' | 'interested' | 'scheduled' | 'closed' | 'lost'

export type Lead = {
    id: string
    panel_id: string
    original_data: Record<string, any>
    selected_columns: string[]
    status: LeadStatus
    scheduled_date: string | null
    lost_reason: string | null
    created_at: string
}

create table if not exists lead_notes (
    id uuid default gen_random_uuid() primary key,
    lead_id uuid references leads(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table lead_notes enable row level security;

-- Policies (Same as leads usually, simplified for now to be public/authenticated logic matches project style)
create policy "Enable all access for authenticated users" on lead_notes
    for all using (auth.role() = 'authenticated');

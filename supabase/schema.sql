-- Run this whole file in Supabase Dashboard > SQL Editor.

create table if not exists catalog_items (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in
    ('stock_collection','stock_item','door_profile','paint','stain','countertop','flooring','gallery')),
  parent_id uuid references catalog_items(id) on delete cascade, -- stock_item -> stock_collection
  name text not null default '',
  description text,
  image_url text,
  category text,   -- stock_item: Base / Wall / Tall / Vanity ...
  sku text,        -- stock_item
  size text,       -- stock_item, e.g. 30"W x 34.5"H x 24"D
  style text,      -- stock_collection: Flat Panel / Shaker / Double Shaker / Slim Shaker / Raised Panel
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists catalog_items_section_idx on catalog_items (section, sort_order);
create index if not exists catalog_items_parent_idx on catalog_items (parent_id);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('schedule','contact')),
  name text not null,
  email text not null,
  phone text,
  subject text,
  service_type text,
  preferred_datetime text,
  message text,
  status text not null default 'new' check (status in ('new','handled')),
  created_at timestamptz not null default now()
);

alter table catalog_items enable row level security;
alter table site_settings enable row level security;
alter table submissions enable row level security;

-- Public can read published content and settings
create policy "public read items" on catalog_items for select using (published = true or auth.role() = 'authenticated');
create policy "public read settings" on site_settings for select using (true);
-- Public can only INSERT submissions (with basic length limits)
create policy "public submit" on submissions for insert
  with check (length(name) between 1 and 200 and length(email) between 3 and 200 and coalesce(length(message),0) < 5000);
-- Logged-in admin(s) can do everything. Create admin users yourself in Auth > Users
-- and turn OFF public sign-ups (Auth > Providers > Email > "Allow new users to sign up").
create policy "admin items" on catalog_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin settings" on site_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin submissions" on submissions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Image storage
insert into storage.buckets (id, name, public) values ('media','media', true) on conflict do nothing;
create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "admin write media" on storage.objects for all
  using (bucket_id = 'media' and auth.role() = 'authenticated')
  with check (bucket_id = 'media' and auth.role() = 'authenticated');

-- If catalog_items already exists, run this instead of re-creating it:
-- alter table catalog_items add column if not exists category text, add column if not exists sku text, add column if not exists size text, add column if not exists style text;

-- Round-2 client notes ("Notes on site 2.docx"). Run once in Supabase Dashboard > SQL Editor.
-- Adds the Backsplash and Textured Melamine sections, per-item specs, photo galleries,
-- and the "show in Home page scroll bar" flag.

alter table catalog_items drop constraint if exists catalog_items_section_check;
alter table catalog_items add constraint catalog_items_section_check check (section in
  ('stock_collection','stock_item','door_profile','paint','stain','melamine','countertop','flooring','backsplash','gallery'));

alter table catalog_items
  add column if not exists specs jsonb not null default '[]'::jsonb,   -- [["Size","127 x 64 (Jumbo)"], ...]
  add column if not exists images jsonb not null default '[]'::jsonb,  -- extra photo URLs (scroll gallery)
  add column if not exists featured boolean not null default false;    -- show in the Home page scroll bar

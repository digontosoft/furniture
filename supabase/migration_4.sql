-- Stock items: link each door style's copy of an item to the Default Items entry it came from,
-- so editing / deleting / reordering a Default item can update every door style.
-- Run once in Supabase Dashboard > SQL Editor.

alter table catalog_items
  add column if not exists source_id uuid references catalog_items(id) on delete set null;
create index if not exists catalog_items_source_idx on catalog_items (source_id);

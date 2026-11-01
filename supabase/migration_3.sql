-- Round-3 client notes ("Notes on site 3.docx"). Run once in Supabase Dashboard > SQL Editor.
-- Custom Cabinetry main tabs can now be added from the admin panel (Polymer High-Gloss,
-- Polymer Velour Touch, Master Oak, …). Each tab stores its items under its own section key
-- (e.g. custom_master_oak), so the fixed list of allowed sections becomes a name-format check.

alter table catalog_items drop constraint if exists catalog_items_section_check;
alter table catalog_items add constraint catalog_items_section_check check (section ~ '^[a-z][a-z0-9_]*$');



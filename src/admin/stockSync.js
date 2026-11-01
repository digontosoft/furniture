// Stock items: every door style holds its own copy of each item, linked (source_id) to the
// Default Items entry it came from. The Default list drives all door styles: editing,
// deleting, adding or reordering a Default item is applied to every door style's copy.
import { supabase } from '../lib/supabase'
import { selectAll } from './db'

/** A copy of a stock item for a door style, linked to its Default item. */
export const copyOf = (it, parent_id) => ({
  section: 'stock_item', parent_id, source_id: it.parent_id ? it.source_id ?? null : it.id,
  name: it.name, description: it.description || '', image_url: it.image_url || '',
  category: it.category || '', sku: it.sku || '', size: it.size || '', sort_order: it.sort_order ?? 0,
  published: it.published ?? true, specs: it.specs || [], images: it.images || [],
})

export async function insertMany(rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('catalog_items').insert(rows.slice(i, i + 500))
    if (error) throw error
  }
}

// run `fn` on the ids 100 at a time (a long id list would not fit in one request URL)
export async function inChunks(ids, fn) {
  for (let i = 0; i < ids.length; i += 100) {
    const { error } = await fn(ids.slice(i, i + 100))
    if (error) throw error
  }
}

/** Adds copies of `items` to each door style, skipping door styles that already have that item. */
export async function addToStyles(items, styleIds) {
  const linked = await selectAll((q) => q.eq('section', 'stock_item').not('source_id', 'is', null), 'parent_id,source_id')
  const have = new Set(linked.map((l) => `${l.parent_id}:${l.source_id}`))
  const rows = styleIds.flatMap((pid) => items.map((it) => copyOf(it, pid)).filter((c) => !c.source_id || !have.has(`${pid}:${c.source_id}`)))
  await insertMany(rows)
  return rows.length
}

const SYNCED = ['name', 'description', 'image_url', 'category', 'sku', 'size', 'published']

/**
 * After a Default item is edited: apply each changed field to every door style's copy that still
 * has the old value. A door style where that field was changed by hand keeps its own version.
 * Returns how many door styles were updated.
 */
export async function pushEdit(id, before, after) {
  const touched = new Set()
  for (const f of SYNCED) {
    const old = before[f]
    if ((old ?? '') === (after[f] ?? '')) continue
    const match = typeof old === 'boolean' ? [(q) => q.eq(f, old)]
      : (old ?? '') === '' ? [(q) => q.is(f, null), (q) => q.eq(f, '')]
      : [(q) => q.eq(f, old)]
    for (const m of match) {
      const { data, error } = await m(supabase.from('catalog_items').update({ [f]: after[f] }).eq('source_id', id)).select('id')
      if (error) throw error
      data.forEach((r) => touched.add(r.id))
    }
  }
  return touched.size
}

/** Deletes Default items together with every door style's copy of them. */
export async function deleteWithCopies(ids) {
  await inChunks(ids, (chunk) => supabase.from('catalog_items').delete().in('source_id', chunk))
  await inChunks(ids, (chunk) => supabase.from('catalog_items').delete().in('id', chunk))
}

/** After the Default list is reordered: give every door style the same order. */
export async function pushOrder(pairs) {
  for (let i = 0; i < pairs.length; i += 8) {
    const res = await Promise.all(pairs.slice(i, i + 8).map(([id, n]) => supabase.from('catalog_items').update({ sort_order: n }).eq('source_id', id)))
    const bad = res.find((r) => r.error)
    if (bad) throw bad.error
  }
}

import { supabase } from '../lib/supabase'

/**
 * Every row of a query. Supabase returns at most 1000 rows per request, and with each door
 * style holding its own copy of the stock items there are many thousands, so page through
 * them (ordered by id so pages never overlap).
 *   selectAll((q) => q.eq('section', 'stock_item'), 'id,parent_id')
 */
export async function selectAll(filter, columns = '*') {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await filter(supabase.from('catalog_items').select(columns)).order('id').range(from, from + 999)
    if (error) throw error
    rows.push(...data)
    if (data.length < 1000) return rows
  }
}

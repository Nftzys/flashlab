// pages/api/get-album.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid album slug' })
  }

  const { data, error } = await supabase
    .from('albums')
    .select('title, thumbnail, id')
    .eq('slug', id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Album not found' })
  }

  return res.status(200).json(data)
}

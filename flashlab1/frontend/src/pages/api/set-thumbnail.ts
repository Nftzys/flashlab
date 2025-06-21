import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { albumSlug, filename, path } = req.body

  if (!albumSlug || !filename || !path) {
    return res.status(400).json({ error: 'Missing parameters' })
  }

  // Find album by slug
  const { data: album, error: fetchError } = await supabase
    .from('albums')
    .select('id')
    .eq('slug', albumSlug)
    .single()

  if (fetchError || !album) {
    return res.status(404).json({ error: 'Album not found by slug' })
  }

  // Update thumbnail info in Supabase
  const { error: updateError } = await supabase
    .from('albums')
    .update({ thumbnail_filename: filename, thumbnail_path: path })
    .eq('id', album.id)

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update thumbnail' })
  }

  return res.status(200).json({ message: 'Thumbnail updated successfully' })
}

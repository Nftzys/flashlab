import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { IncomingForm, File, Files, Fields } from 'formidable'
import FormData from 'form-data'
import fetch from 'node-fetch'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface CustomNextApiRequest extends NextApiRequest {
  body: never // required by formidable
}

export default async function handler(req: CustomNextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed')
  }

  const form = new IncomingForm({
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024,
  })

  form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
    if (err) {
      console.error('❌ Form parse error:', err)
      return res.status(500).json({ error: 'Form parse error', details: err.message })
    }

    const uploaded = Array.isArray(files.file) ? files.file[0] : (files.file as File | undefined)
    const albumId = Array.isArray(fields.album_id) ? fields.album_id[0] : fields.album_id

    if (!uploaded?.filepath || !albumId) {
      return res.status(400).json({ error: 'Missing file or album ID' })
    }

    try {
      const albumDir = path.join(process.cwd(), 'public', 'uploads', albumId)
      await fsPromises.mkdir(albumDir, { recursive: true })

      const ext = path.extname(uploaded.originalFilename || '.jpg') || '.jpg'
      const filename = `${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`
      const destPath = path.join(albumDir, filename)

      await fsPromises.rename(uploaded.filepath, destPath)

      // Send file to FastAPI for encoding
      const formData = new FormData()
      formData.append('file', fs.createReadStream(destPath), filename)

      const fastApiUrl = `http://localhost:8000/add_to_db/?album_id=${albumId}`
      const faceRes = await fetch(fastApiUrl, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      })

      if (!faceRes.ok) {
        const errorText = await faceRes.text()
        console.error('❌ FastAPI error:', errorText)
        return res.status(500).json({ error: 'Face server failed', details: errorText })
      }

      return res.status(200).json({ url: `/photos/${albumId}/${filename}` })
    } catch (e) {
      const error = e as Error
      console.error('❌ Upload handler error:', error.message)
      return res.status(500).json({ error: 'Server error', details: error.message })
    }
  })
}
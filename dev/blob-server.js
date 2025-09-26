import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { BLOB } from '../lib/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'blob');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = `${Date.now()}-${Math.round(Math.random()*1e6)}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g,'')}`;
    cb(null, id);
  }
});

const upload = multer({ storage });
const app = express();

// health
app.get('/_health', (req, res) => res.json({ ok: true }));

// upload endpoint: multipart/form-data field 'file'
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const id = req.file.filename;
  const url = `${req.protocol}://${req.get('host')}/blob/${encodeURIComponent(id)}`;
  return res.json({ id, url, filename: req.file.originalname });
});

// serve by id
app.get('/blob/:id', (req, res) => {
  const id = req.params.id;
  const filePath = path.join(UPLOAD_DIR, id);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  return res.sendFile(filePath);
});

// delete by id
app.delete('/blob/:id', (req, res) => {
  const id = req.params.id;
  const filePath = path.join(UPLOAD_DIR, id);
  try {
    if (!fs.existsSync(filePath)) return res.status(404).json({ ok: false, error: 'Not found' });
    fs.unlinkSync(filePath);
    return res.status(204).send();
  } catch (e) {
    console.error('Blob delete error', e);
    return res.status(500).json({ ok: false, error: 'Delete failed' });
  }
});

const port = BLOB?.port || (process.env.BLOB_PORT ? Number(process.env.BLOB_PORT) : 4001);
app.listen(port, () => console.log(`Blob dev server listening on http://localhost:${port}`));

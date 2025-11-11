import express from 'express';
import { nanoid } from 'nanoid';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const TRACKS = {};

app.post('/create', (req, res) => {
  const token = nanoid(8);
  TRACKS[token] = { createdAt: Date.now(), locations: [], revoked:false };
  res.json({ url: `/track/${token}`, token });
});

app.post('/report/:token', (req, res) => {
  const t = req.params.token;
  const track = TRACKS[t];
  if (!track || track.revoked) return res.status(404).json({ error: 'not found' });
  const { latitude, longitude, accuracy } = req.body;
  track.locations.push({ lat: latitude, lng: longitude, acc: accuracy, ts: Date.now() });
  if (track.locations.length > 1000) track.locations.shift();
  res.json({ ok: true });
});

app.get('/api/latest/:token', (req, res) => {
  const t = req.params.token;
  const track = TRACKS[t];
  if (!track || track.revoked) return res.status(404).json({ error: 'not found' });
  res.json(track.locations.at(-1) || null);
});

app.get('/api/all/:token', (req, res) => {
  const t = req.params.token;
  const track = TRACKS[t];
  if (!track || track.revoked) return res.status(404).json({ error: 'not found' });
  res.json({ locations: track.locations });
});

app.get('/track/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'track.html'));
});

app.get('/view/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

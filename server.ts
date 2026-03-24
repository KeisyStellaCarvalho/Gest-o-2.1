import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const dbPath = process.env.VERCEL 
  ? path.join('/tmp', 'data.json') 
  : path.join(__dirname, 'data.json');

// Initial DB structure
const initialDb = {
  companies: [],
  specialties: [],
  professionals: [],
  shifts: []
};

// Ensure DB exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
}

const readDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
const writeDb = (data: any) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// --- API Routes ---

// Companies
app.get('/api/companies', (req, res) => {
  res.json(readDb().companies);
});
app.post('/api/companies', (req, res) => {
  const db = readDb();
  const newCompany = { id: Date.now().toString(), ...req.body };
  db.companies.push(newCompany);
  writeDb(db);
  res.json(newCompany);
});

// Specialties
app.get('/api/specialties', (req, res) => {
  res.json(readDb().specialties);
});
app.post('/api/specialties', (req, res) => {
  const db = readDb();
  const newSpecialty = { id: Date.now().toString(), ...req.body };
  db.specialties.push(newSpecialty);
  writeDb(db);
  res.json(newSpecialty);
});

// Professionals
app.get('/api/professionals', (req, res) => {
  res.json(readDb().professionals);
});
app.post('/api/professionals', (req, res) => {
  const db = readDb();
  const newProfessional = { id: Date.now().toString(), ...req.body };
  db.professionals.push(newProfessional);
  writeDb(db);
  res.json(newProfessional);
});

// Shifts
app.get('/api/shifts', (req, res) => {
  res.json(readDb().shifts);
});
app.post('/api/shifts', (req, res) => {
  const db = readDb();
  const newShift = { id: Date.now().toString(), ...req.body };
  db.shifts.push(newShift);
  writeDb(db);
  res.json(newShift);
});
app.post('/api/shifts/bulk', (req, res) => {
  const db = readDb();
  const newShifts = req.body.map((s: any, i: number) => ({ id: (Date.now() + i).toString(), ...s }));
  db.shifts.push(...newShifts);
  writeDb(db);
  res.json(newShifts);
});
app.put('/api/shifts/:id', (req, res) => {
  const db = readDb();
  const index = db.shifts.findIndex((s: any) => s.id === req.params.id);
  if (index !== -1) {
    db.shifts[index] = { ...db.shifts[index], ...req.body };
    writeDb(db);
    res.json(db.shifts[index]);
  } else {
    res.status(404).json({ error: 'Shift not found' });
  }
});
app.delete('/api/shifts/:id', (req, res) => {
  const db = readDb();
  const index = db.shifts.findIndex((s: any) => s.id === req.params.id);
  if (index !== -1) {
    const deleted = db.shifts.splice(index, 1);
    writeDb(db);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: 'Shift not found' });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  async function startServer() {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  startServer();
} else {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  // Only listen if not running on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

export default app;

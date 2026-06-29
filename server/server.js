require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in server/.env');
  process.exit(1);
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', databaseState: mongoose.connection.readyState }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/playbooks', require('./routes/playbooks'));
app.use('/api/runs', require('./routes/runs'));

const { buildApiError } = require('./utils/helpers');
app.use((error, req, res, _next) => {
  const e = buildApiError(error);
  res.status(e.statusCode).json({ message: e.message });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`Velocis NBA server running on port ${PORT}`)))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });

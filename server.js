import express from 'express';
import dotenv from 'dotenv';
import questionsHandler from './api/questions.js';
import evaluateHandler from './api/evaluate.js';
import vaultHandler from './api/vault.js';

dotenv.config();

const app = express();
app.use(express.json());

// Forward requests to standard Vercel handlers
// Mocking the behavior of Vercel for local development
app.all('/api/questions', (req, res) => questionsHandler(req, res));
app.all('/api/evaluate', (req, res) => evaluateHandler(req, res));
app.all('/api/vault', (req, res) => vaultHandler(req, res));

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local API server running on http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

process.on('exit', (code) => {
    console.log(`Process exited with code: ${code}`);
});

import express from 'express';
import dotenv from 'dotenv';
import questionsHandler from './api/questions.js';
import evaluateHandler from './api/evaluate.js';
import sessionsHandler from './api/sessions.js';
import authHandler from './api/auth.js';
import statsHandler from './api/stats.js';
import subjectsHandler from './api/subjects.js';
import progressHandler from './api/progress.js';

// Admin Routes
import adminLoginHandler from './api/admin/login.js';
import adminVaultHandler from './api/admin/question-vault.js';
import adminAnalyticsHandler from './api/admin/user-analytics.js';
import adminCoverageHandler from './api/admin/topic-coverage.js';
import adminSubjectsHandler from './api/admin/subjects.js';

dotenv.config();

const app = express();
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Admin Routes Mounting
app.post('/api/admin/login', adminLoginHandler);
app.all('/api/admin/questions', adminVaultHandler);
app.all('/api/admin/question-vault', adminVaultHandler);
app.get('/api/admin/user-analytics', adminAnalyticsHandler);
app.all('/api/admin/topic-coverage', adminCoverageHandler);
app.all('/api/admin/subjects', adminSubjectsHandler);

// Forward requests to standard Vercel handlers
app.all('/api/questions', (req, res) => questionsHandler(req, res));
app.all('/api/evaluate', (req, res) => evaluateHandler(req, res));
app.all('/api/sessions', (req, res) => sessionsHandler(req, res));
app.all('/api/auth', (req, res) => authHandler(req, res));
app.all('/api/stats', (req, res) => statsHandler(req, res));
app.all('/api/subjects', (req, res) => subjectsHandler(req, res));
app.all('/api/progress', (req, res) => progressHandler(req, res));

// Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local API server running on http://localhost:${PORT}`);
});

// Explicitly keep the process alive for debugging
setInterval(() => {
    // Keep alive
}, 60000);

import express from 'express';
import dotenv from 'dotenv';
import questionsHandler from './_handlers/questions.js';
import evaluateHandler from './_handlers/evaluate.js';
import sessionsHandler from './_handlers/sessions.js';
import authHandler from './_handlers/auth.js';
import statsHandler from './_handlers/stats.js';
import subjectsHandler from './_handlers/subjects.js';
import progressHandler from './_handlers/progress.js';

// Admin Routes
import adminLoginHandler from './_handlers/admin/login.js';
import adminVaultHandler from './_handlers/admin/question-vault.js';
import adminAnalyticsHandler from './_handlers/admin/user-analytics.js';
import adminCoverageHandler from './_handlers/admin/topic-coverage.js';
import adminSubjectsHandler from './_handlers/admin/subjects.js';

dotenv.config();

const app = express();
app.use(express.json());

// Admin Routes Mounting
app.post('/api/admin/login', adminLoginHandler);
app.all('/api/admin/questions', adminVaultHandler);
app.all('/api/admin/question-vault', adminVaultHandler);
app.get('/api/admin/user-analytics', adminAnalyticsHandler);
app.all('/api/admin/topic-coverage', adminCoverageHandler);
app.all('/api/admin/subjects', adminSubjectsHandler);

// Public Routes
app.all('/api/questions', questionsHandler);
app.all('/api/evaluate', evaluateHandler);
app.all('/api/sessions', sessionsHandler);
app.all('/api/auth', authHandler);
app.all('/api/stats', statsHandler);
app.all('/api/subjects', subjectsHandler);
app.all('/api/progress', progressHandler);

// Health Check
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

export default app;

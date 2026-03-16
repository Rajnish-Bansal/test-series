import ErrorVault from './models/ErrorVault.js';
import Session from './models/Session.js';
import connectToDatabase from './lib/db.js';
import { verifyToken } from './lib/authMiddleware.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await connectToDatabase();

    const decoded = verifyToken(req);
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const { sessionData, incorrectQuestions } = req.body;

        const session = await Session.create({
            ...sessionData,
            userId: decoded.id,
            timestamp: new Date()
        });

        if (incorrectQuestions && incorrectQuestions.length > 0) {
            const errorDocs = incorrectQuestions.map(q => ({
                ...q,
                sessionId: session._id,
                userId: decoded.id
            }));
            await ErrorVault.insertMany(errorDocs);
        }

        return res.status(201).json({ success: true, sessionId: session._id });
    } catch (error) {
        console.error('Error in evaluate endpoint:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

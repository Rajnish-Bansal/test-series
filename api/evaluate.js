import connectToDatabase from './lib/db.js';
import Session from './models/Session.js';
import ErrorVault from './models/ErrorVault.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await connectToDatabase();

    try {
        const { sessionData, incorrectQuestions } = req.body;

        const session = await Session.create(sessionData);

        if (incorrectQuestions && incorrectQuestions.length > 0) {
            const errorDocs = incorrectQuestions.map(q => ({
                ...q,
                sessionId: session._id
            }));
            await ErrorVault.insertMany(errorDocs);
        }

        return res.status(201).json({ success: true, sessionId: session._id });
    } catch (error) {
        console.error('Error in evaluate endpoint:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

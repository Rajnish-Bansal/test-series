import Session from '../models/Session.js';
import ErrorVault from '../models/ErrorVault.js';
import connectToDatabase from '../lib/db.js';
import { verifyToken } from '../lib/authMiddleware.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await connectToDatabase();

    const decoded = verifyToken(req);
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const { id } = req.query;

        if (id) {
            // Fetch a specific session with all its answers, but only if it belongs to the user
            const session = await Session.findOne({ _id: id, userId: decoded.id });
            if (!session) {
                return res.status(404).json({ success: false, error: "Session not found" });
            }
            return res.status(200).json({ success: true, session });
        } else {
            // Fetch sessions, optionally filtering by topic
            const { topic } = req.query;
            const query = topic ? { topic: topic, userId: decoded.id } : { userId: decoded.id };

            // Fetch all sessions but EXCLUDE the heavy `answers` array for the list view
            const sessions = await Session.find(query)
                .select('-answers')
                .sort({ timestamp: -1 });

            return res.status(200).json({ success: true, sessions });
        }
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return res.status(500).json({ success: false, error: "Failed to load sessions data." });
    }
}

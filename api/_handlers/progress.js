import connectToDatabase from '../lib/db.js';
import Progress from '../models/Progress.js';
import { verifyToken } from '../lib/authMiddleware.js';

export default async function handler(req, res) {
    await connectToDatabase();

    const decoded = verifyToken(req);
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { method } = req;
    const { topic, subject } = req.query;
    const activeTopic = topic || subject;

    switch (method) {
        case 'GET':
            try {
                if (!activeTopic) {
                    return res.status(400).json({ success: false, error: 'Topic is required' });
                }
                const progress = await Progress.findOne({ userId: decoded.id, topic: activeTopic });
                return res.status(200).json({ success: true, progress });
            } catch (error) {
                console.error('Error fetching progress:', error);
                return res.status(500).json({ success: false, error: 'Server error' });
            }

        case 'POST':
            try {
                const { topic: bodyTopic, subject: bodySubject, answers, currentIndex } = req.body;
                const activeBodyTopic = bodyTopic || bodySubject;
                if (!activeBodyTopic) {
                    return res.status(400).json({ success: false, error: 'Topic is required' });
                }

                const progress = await Progress.findOneAndUpdate(
                    { userId: decoded.id, topic: activeBodyTopic },
                    { answers, currentIndex, timestamp: new Date() },
                    { upsert: true, new: true }
                );

                return res.status(200).json({ success: true, progress });
            } catch (error) {
                console.error('Error saving progress:', error);
                return res.status(500).json({ success: false, error: 'Server error' });
            }

        case 'DELETE':
            try {
                if (!activeTopic) {
                    return res.status(400).json({ success: false, error: 'Topic is required' });
                }
                await Progress.deleteOne({ userId: decoded.id, topic: activeTopic });
                return res.status(200).json({ success: true, message: 'Progress cleared' });
            } catch (error) {
                console.error('Error deleting progress:', error);
                return res.status(500).json({ success: false, error: 'Server error' });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

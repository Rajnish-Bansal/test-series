import connectToDatabase from '../lib/db.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        await connectToDatabase();
        
        // Fetch all users (non-admin)
        const users = await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).lean();
        
        // For each user, fetch their session stats
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const sessions = await Session.find({ userId: user._id }).lean();
            
            const totalTests = sessions.length;
            const totalAttempted = sessions.reduce((sum, s) => sum + (s.responses ? s.responses.length : 0), 0);
            
            let overallAccuracy = 0;
            if (totalTests > 0) {
                const totalCorrect = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
                const totalQs = sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
                overallAccuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 0;
            }

            return {
                ...user,
                stats: {
                    totalTests,
                    totalAttempted,
                    overallAccuracy
                }
            };
        }));

        res.status(200).json({ success: true, data: usersWithStats });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user analytics' });
    }
}

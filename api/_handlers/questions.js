import connectToDatabase from '../lib/db.js';
import Question from '../models/Question.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        await connectToDatabase();
        
        const { subject, topic: queryTopic, subtopic, summary, microTag: legacySubtopic } = req.query || {};
        
        // Normalize parameters for the 3-level hierarchy
        const activeSubject = subject || (queryTopic && !req.query.subject ? queryTopic : null);
        const activeTopic = subject ? queryTopic : null;
        const activeSubtopic = subtopic || legacySubtopic;

        console.log(`[DB DEBUG] GET /api/questions - subject: "${activeSubject}", topic: "${queryTopic}", subtopic: "${activeSubtopic}"`);

        // Build Query
        let query = {};
        
        if (activeSubject && activeSubject !== 'All') {
            query.subject = { $regex: new RegExp(`^${activeSubject.trim()}$`, 'i') };
        }

        if (activeTopic) {
            query.topic = { $regex: new RegExp(`^${activeTopic.trim()}$`, 'i') };
        }

        if (activeSubtopic) {
            const tags = activeSubtopic.split(',').map(t => t.trim());
            query.$or = [
                { subtopic: { $in: tags.map(t => new RegExp(`^${t}$`, 'i')) } },
                { microTag: { $in: tags.map(t => new RegExp(`^${t}$`, 'i')) } }
            ];
        }

        // PERFORMANCE OPTIMIZATION: Metadata only
        if (summary === 'true') {
            const metadata = await Question.find(query, 'subject topic subtopic microTag').lean();
            return res.status(200).json(metadata);
        }

        // FETCH, SHUFFLE AND LIMIT:
        // Use aggregation for random sampling (better for scale)
        let limit = 100;
        if (activeSubtopic || activeTopic) limit = 10;
        else if (activeSubject) limit = 20;

        const questions = await Question.aggregate([
            { $match: query },
            { $sample: { size: limit } }
        ]);

        res.status(200).json(questions);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

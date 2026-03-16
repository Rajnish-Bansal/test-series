import connectToDatabase from './lib/db.js';
import Subject from './models/Subject.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        await connectToDatabase();
        const data = await Subject.find({}).sort({ name: 1 }).lean();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

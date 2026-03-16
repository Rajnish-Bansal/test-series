import connectToDatabase from '../../lib/db.js';
import Subject from '../../models/Subject.js';

export default async function handler(req, res) {
    await connectToDatabase();

    if (req.method === 'GET') {
        try {
            const subjects = await Subject.find({}).sort({ name: 1 }).lean();
            res.status(200).json({ success: true, data: subjects });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to fetch topic coverage' });
        }
    } else if (req.method === 'PUT' || req.method === 'POST') {
        try {
            const structure = req.body; // Expects the full array of subjects
            
            if (!Array.isArray(structure)) {
                return res.status(400).json({ success: false, error: 'Invalid data format. Expected array of subjects.' });
            }

            // In our current admin flow, the TopicCoverageTable sends the ENTIRE subject list back
            // so we overwrite the collection.
            await Subject.deleteMany({});
            const saved = await Subject.insertMany(structure);

            res.status(200).json({ success: true, message: 'Coverage updated successfully', data: saved });
        } catch (error) {
            console.error('Error updating coverage:', error);
            res.status(500).json({ success: false, error: 'Failed to update topic coverage' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

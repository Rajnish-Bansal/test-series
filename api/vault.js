import connectToDatabase from './lib/db.js';
import ErrorVault from './models/ErrorVault.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    await connectToDatabase();

    try {
        const errors = await ErrorVault.find().sort({ createdAt: -1 });
        return res.status(200).json(errors);
    } catch (error) {
        console.error('Error fetching vault:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

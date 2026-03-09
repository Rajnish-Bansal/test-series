import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    if (req.method === 'GET') {
        const dataPath = path.join(process.cwd(), 'data', 'questions.json');
        const fileContents = fs.readFileSync(dataPath, 'utf8');
        let questions = JSON.parse(fileContents);

        // Support filtering by topic (e.g., ?topic=Polity)
        const { topic } = req.query || {};
        if (topic && topic !== 'All') {
            questions = questions.filter(q => q.topic.toLowerCase() === topic.toLowerCase());
        }

        res.status(200).json(questions);
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

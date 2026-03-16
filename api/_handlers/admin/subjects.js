import connectToDatabase from '../../lib/db.js';
import Subject from '../../models/Subject.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        await connectToDatabase();
        const { action, subjectName, moduleName, topicName, weight, priority } = req.body;
        
        const subject = await Subject.findOne({ name: subjectName });
        if (!subject) {
            return res.status(404).json({ success: false, error: 'Subject not found' });
        }
        
        if (action === 'add-module') {
            if (!moduleName) return res.status(400).json({ success: false, error: 'Module name required' });
            
            if (subject.modules.some(m => m.name === moduleName)) {
                return res.status(400).json({ success: false, error: 'Module already exists' });
            }
            
            subject.modules.push({ name: moduleName, topics: [] });
        } else if (action === 'add-topic') {
            if (!moduleName || !topicName) {
                return res.status(400).json({ success: false, error: 'Module and Topic names required' });
            }
            
            const module = subject.modules.find(m => m.name === moduleName);
            if (!module) {
                return res.status(404).json({ success: false, error: 'Module not found' });
            }
            
            if (module.topics.some(t => t.name === topicName)) {
                return res.status(400).json({ success: false, error: 'Topic already exists' });
            }
            
            module.topics.push({
                name: topicName,
                weight: weight || 1,
                priority: priority || 'Low Yield'
            });
        } else {
            return res.status(400).json({ success: false, error: 'Invalid action' });
        }
        
        await subject.save();
        const allSubjects = await Subject.find({}).sort({ name: 1 }).lean();
        return res.json({ success: true, data: allSubjects });
    } catch (error) {
        console.error('Error updating structure:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

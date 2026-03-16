import connectToDatabase from '../lib/db.js';
import Question from '../models/Question.js';

export default async function handler(req, res) {
    await connectToDatabase();
    
    if (req.method === 'GET') {
        try {
            const questions = await Question.find({}).sort({ createdAt: -1 }).lean();
            res.status(200).json({ success: true, count: questions.length, data: questions });
        } catch (error) {
            console.error('Error reading questions:', error);
            res.status(500).json({ success: false, error: 'Failed to read questions' });
        }
    } else if (req.method === 'POST') {
        try {
            const body = req.body;
            const itemsToProcess = Array.isArray(body) ? body : [body];
            
            // Basic validation
            for (const item of itemsToProcess) {
                if (!item.text || !item.options || !item.correctAnswer || !item.topic) {
                    return res.status(400).json({ success: false, error: 'Missing required fields' });
                }
            }

            // Assign DB-friendly IDs if not present, and handle timestamps
            const processedItems = itemsToProcess.map((item, idx) => {
                if (!item.id) {
                    item.id = `q_${Date.now()}_${idx}`;
                }
                return item;
            });

            const savedQuestions = await Question.insertMany(processedItems);
            
            res.status(201).json({ 
                success: true, 
                message: `${savedQuestions.length} questions added successfully`, 
                data: Array.isArray(body) ? savedQuestions : savedQuestions[0] 
            });
        } catch (error) {
            console.error('Error saving question:', error);
            res.status(500).json({ success: false, error: 'Failed to save question' });
        }
    } else if (req.method === 'PATCH' || req.method === 'PUT') {
        try {
            const { id, updates } = req.body;
            // Support both direct object or updates wrapper
            const dataToUpdate = updates || req.body;
            const queryId = id || dataToUpdate.id;

            if (!queryId) return res.status(400).json({ success: false, error: 'Missing question ID' });

            const updated = await Question.findOneAndUpdate(
                { id: queryId },
                { $set: dataToUpdate },
                { new: true }
            );

            if (!updated) return res.status(404).json({ success: false, error: 'Question not found' });

            res.status(200).json({ success: true, message: 'Question updated successfully', data: updated });
        } catch (error) {
            console.error('Error updating question:', error);
            res.status(500).json({ success: false, error: 'Failed to update question' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { id } = req.body;
            if (!id) return res.status(400).json({ success: false, error: 'Missing id' });

            const result = await Question.deleteOne({ id });
            if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'Question not found' });

            res.status(200).json({ success: true, message: 'Question deleted successfully' });
        } catch (error) {
            console.error('Error deleting question:', error);
            res.status(500).json({ success: false, error: 'Failed to delete question' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

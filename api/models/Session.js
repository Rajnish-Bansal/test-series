import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
    totalQuestions: { type: Number, required: true },
    attempted: { type: Number, required: true },
    correct: { type: Number, required: true },
    incorrect: { type: Number, required: true },
    score: { type: Number },
    topicAccuracy: {
        type: Map,
        of: {
            total: Number,
            correct: Number,
            percentage: Number
        }
    },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.Session || mongoose.model('Session', examSessionSchema);

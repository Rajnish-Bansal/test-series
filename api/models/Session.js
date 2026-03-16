import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
    isSectional: { type: Boolean, default: false },
    subject: { type: String, default: 'Full-length' },
    subtopic: { type: String },
    topic: { type: String },
    answers: [{
        questionId: String,
        userAnswer: String,
        correctAnswer: String,
        roundMarked: Number,
        isCorrect: Boolean,
        subject: String,
        topic: String,
        subtopic: String,
        text: String
    }],
    timeTaken: { type: Number }, // Time taken in seconds
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.Session || mongoose.model('Session', examSessionSchema);

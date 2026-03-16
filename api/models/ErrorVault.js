import mongoose from 'mongoose';

const errorVaultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    subject: { type: String },
    topic: { type: String },
    subtopic: { type: String },
    userAnswer: { type: String },
    correctAnswer: { type: String },
    roundMarked: { type: Number, enum: [1, 2, 3] }, // 1: Sure, 2: 50-50, 3: Guess
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ErrorVault || mongoose.model('ErrorVault', errorVaultSchema);

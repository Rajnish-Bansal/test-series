import mongoose from 'mongoose';

const errorVaultSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    topic: { type: String },
    microTag: { type: String },
    userAnswer: { type: String },
    correctAnswer: { type: String },
    roundMarked: { type: Number, enum: [1, 2, 3] }, // 1: Sure, 2: 50-50, 3: Guess
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ErrorVault || mongoose.model('ErrorVault', errorVaultSchema);

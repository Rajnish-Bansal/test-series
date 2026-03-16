import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    subtopic: { type: String },
    microTag: { type: String }, // Keep for legacy compatibility
    explanation: { type: String },
    difficulty: { type: String, default: 'Medium' },
    year: { type: Number },
}, { timestamps: true });

// Indexing for faster filtering in exams
QuestionSchema.index({ subject: 1, topic: 1, subtopic: 1 });
QuestionSchema.index({ text: 'text' }); // For search

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);

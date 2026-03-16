import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    currentIndex: { type: Number, default: 0 },
    answers: { type: Map, of: Object, default: {} },
    timestamp: { type: Date, default: Date.now }
});

// Compound index for quick lookup
progressSchema.index({ userId: 1, topic: 1 }, { unique: true });

export default mongoose.models.Progress || mongoose.model('Progress', progressSchema);

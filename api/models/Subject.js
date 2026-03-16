import mongoose from 'mongoose';

const TopicSchema = new mongoose.Schema({
    name: { type: String, required: true },
    weight: { type: Number, default: 1 },
    priority: { type: String, default: 'Low Yield' }
}, { _id: false });

const ModuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    topics: [TopicSchema]
}, { _id: false });

const SubjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    modules: [ModuleSchema]
}, { timestamps: true });

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

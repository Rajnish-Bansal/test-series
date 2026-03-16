import { useState, useEffect } from 'react';
import { PlusCircle, Save, X, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function QuestionUploader({ onUploadSuccess }) {
    const [subjects, setSubjects] = useState([]);
    const [isAdding, setIsAdding] = useState(true); // Default to single add view
    const [isBulkAdding, setIsBulkAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    const [newQuestion, setNewQuestion] = useState({
        text: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        subject: 'Polity',
        topic: 'General',
        subtopic: '',
        explanation: ''
    });

    const [bulkJson, setBulkJson] = useState('');
    const [skippedCount, setSkippedCount] = useState(0);
    const [importCount, setImportCount] = useState(0);

    const normalizeText = (text) => {
        if (!text) return '';
        return text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/admin/topic-coverage');
            const data = await res.json();
            if (data.success) setSubjects(data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...newQuestion.options];
        newOptions[index] = value;
        setNewQuestion({ ...newQuestion, options: newOptions });
    };

    const transformBulkData = (data) => {
        try {
            let cleanData = data.trim();
            if (cleanData.startsWith('```')) {
                cleanData = cleanData.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/m, '');
            }
            cleanData = cleanData.replace(/,\s*([\}\]])/g, '$1');
            const raw = JSON.parse(cleanData);
            const items = Array.isArray(raw) ? raw : [raw];
            
            return items.map(item => {
                let fullText = '';
                if (item.statements && Array.isArray(item.statements)) {
                    fullText = item.statements.join('\n') + '\n\n' + (item.question || '');
                } else {
                    fullText = item.question || item.text || '';
                }

                let opts = ['', '', '', ''];
                if (Array.isArray(item.options)) {
                    opts = item.options.length >= 4 ? item.options : [...item.options, '', '', ''].slice(0, 4);
                } else if (item.options && typeof item.options === 'object') {
                    opts = [
                        item.options.a || item.options[0] || '',
                        item.options.b || item.options[1] || '',
                        item.options.c || item.options[2] || '',
                        item.options.d || item.options[3] || ''
                    ];
                }

                const correctChar = (item.answer || '').toLowerCase();
                let correctText = item.correctAnswer || '';
                if (!correctText && item.options) {
                    correctText = item.options[correctChar] || '';
                }

                let inferredSubject = item.subject || 'Polity';
                let inferredTopic = item.topic || 'General';
                let inferredSubtopic = item.subtopic || item.microTag || '';

                if (item.mapping) {
                    if (item.mapping.subject_name) inferredSubject = item.mapping.subject_name;
                    if (item.mapping.subject) inferredSubject = item.mapping.subject;
                    if (item.mapping.topic_name) inferredTopic = item.mapping.topic_name;
                    if (item.mapping.topic) inferredTopic = item.mapping.topic;
                    if (item.mapping.subtopic) inferredSubtopic = item.mapping.subtopic;
                    if (item.mapping.microTag) inferredSubtopic = item.mapping.microTag;
                }
                
                if (inferredSubject === 'Polity' && inferredSubtopic) {
                    const SUBTOPIC_TO_MODULE = {
                        "Election Commission": "Election Commission & Reforms",
                        "UPSC": "Public Service Commissions",
                        "SPSC": "Public Service Commissions",
                        "Finance Commission": "Finance Commission & CAG",
                        "Comptroller and Auditor General": "Finance Commission & CAG",
                        "CAG": "Finance Commission & CAG",
                        "National Commission for SCs": "Statutory Commissions (Social)",
                        "National Commission for STs": "Statutory Commissions (Social)",
                        "National Commission for BCs": "Statutory Commissions (Social)",
                        "Special Officer for Linguistic Minorities": "Statutory Commissions (Social)",
                        "Attorney General of India": "AGI & Advocate General",
                        "Advocate General": "AGI & Advocate General",
                        "NITI Aayog": "NITI Aayog & Lokpal",
                        "NHRC": "NITI Aayog & Lokpal",
                        "SHRC": "NITI Aayog & Lokpal",
                        "CIC": "NITI Aayog & Lokpal",
                        "SIC": "NITI Aayog & Lokpal",
                        "CVC": "NITI Aayog & Lokpal",
                        "CBI": "Investigation & Security Agencies",
                        "Lokpal": "NITI Aayog & Lokpal",
                        "Lokayuktas": "NITI Aayog & Lokpal",
                        "NIA": "Investigation & Security Agencies",
                        "NDMA": "Investigation & Security Agencies",
                        "CAT": "Tribunals & Consumer Protection",
                        "SAT": "Tribunals & Consumer Protection",
                        "Tribunals": "Tribunals & Consumer Protection",
                        "Official Language": "Official Language & Misc.",
                        "Services under the Union and States": "Official Language & Misc.",
                        "Public Services": "Official Language & Misc.",
                        "Electoral System": "Election Commission & Reforms",
                        "Representation of the People Acts": "Election Commission & Reforms",
                        "Political Parties": "Political Parties & Dynamics",
                        "Electoral Reforms": "Election Commission & Reforms",
                        "Regional Parties": "Political Parties & Dynamics",
                        "Pressure Groups": "Political Parties & Dynamics",
                        "Coalition Government": "Political Parties & Dynamics",
                        "Major Amendments": "Amendment & Basic Structure",
                        "Historical Acts": "Evolution of the Constitution",
                        "Historical Background": "Evolution of the Constitution",
                        "Co-operative Societies": "DPSP & Fundamental Duties",
                        "Panchayati Raj": "Panchayats & Municipalities",
                        "Municipalities": "Panchayats & Municipalities",
                        "Scheduled Castes": "Scheduled & Tribal Areas",
                        "Scheduled Tribes": "Scheduled & Tribal Areas",
                        "Backward Classes": "Official Language & Misc.",
                        "Comparison with other Constitutions": "Global Comparison & Doctrines",
                        "National Symbols": "Preamble, Territory & Citizenship",
                        "Basic Structure": "Amendment & Basic Structure",
                        "Judicial Review": "The Judiciary",
                        "Judicial Activism": "The Judiciary"
                    };
                    const mappedTopic = SUBTOPIC_TO_MODULE[inferredSubtopic];
                    if (mappedTopic) inferredTopic = mappedTopic;
                }
                if (inferredSubtopic === 'PIL') inferredSubtopic = 'Public Interest Litigation (PIL)';

                if (inferredSubject === 'Polity' && (inferredSubtopic === 'Public Interest Litigation (PIL)' || inferredSubtopic === 'PIL')) {
                    inferredTopic = "The Judiciary";
                }

                return {
                    text: fullText.trim(),
                    options: opts,
                    correctAnswer: (correctText || opts[0]).trim(),
                    subject: inferredSubject.trim(),
                    topic: inferredTopic.trim(),
                    subtopic: inferredSubtopic.trim(),
                    explanation: (item.explanation || '').trim()
                };
            });
        } catch (e) {
            console.error('Parse error:', e);
            throw new Error(`Invalid JSON format: ${e.message}`);
        }
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestion.text || newQuestion.options.some(o => !o) || !newQuestion.correctAnswer) {
            setError('Please fill all fields.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newQuestion)
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setNewQuestion({
                    text: '',
                    options: ['', '', '', ''],
                    correctAnswer: '',
                    subject: 'Polity',
                    topic: 'General',
                    subtopic: '',
                    explanation: ''
                });
                if (onUploadSuccess) onUploadSuccess();
            } else {
                setError(data.error || 'Failed to save');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const handleBulkSave = async () => {
        try {
            if (!bulkJson.trim()) return;
            const transformed = transformBulkData(bulkJson);
            setSaving(true);
            setError(null);
            
            // We need current questions for duplicate check
            const qRes = await fetch('/api/admin/question-vault');
            const qData = await qRes.json();
            const existingQuestions = qData.data || [];
            const existingFingerprints = new Set(existingQuestions.map(q => normalizeText(q.text)));
            
            const newQuestionsToAdd = [];
            for (const q of transformed) {
                if (existingFingerprints.has(normalizeText(q.text))) continue;
                newQuestionsToAdd.push(q);
                existingFingerprints.add(normalizeText(q.text));
            }

            setSkippedCount(transformed.length - newQuestionsToAdd.length);
            if (newQuestionsToAdd.length > 0) {
                const res = await fetch('/api/admin/question-vault', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newQuestionsToAdd)
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);
                setImportCount(newQuestionsToAdd.length);
                setSuccess(true);
                setBulkJson('');
                if (onUploadSuccess) onUploadSuccess();
            } else {
                setError("No new questions found (all duplicates).");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800">Upload Content</h2>
                        <p className="text-slate-500 font-medium">Add new questions to the platform vault.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                        <button 
                            onClick={() => { setIsBulkAdding(false); setIsAdding(true); }}
                            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${!isBulkAdding ? 'bg-white text-upsc-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Single Question
                        </button>
                        <button 
                            onClick={() => { setIsBulkAdding(true); setIsAdding(false); }}
                            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${isBulkAdding ? 'bg-white text-upsc-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Bulk JSON Import
                        </button>
                    </div>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-in slide-in-from-top-2"><AlertCircle className="w-5 h-5" /> {error}</div>}

                {!isBulkAdding ? (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                        <form onSubmit={handleSaveQuestion} className="space-y-8">
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Question Statement</label>
                                <textarea 
                                    required
                                    value={newQuestion.text}
                                    onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-upsc-blue focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-y min-h-[120px] font-medium"
                                    placeholder="Enter the complete question..."
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                {newQuestion.options.map((option, index) => (
                                    <div key={index} className="relative group">
                                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Option {String.fromCharCode(65 + index)}</label>
                                        <input 
                                            required
                                            type="text"
                                            value={option}
                                            onChange={e => handleOptionChange(index, e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-upsc-blue outline-none transition-all font-medium text-sm"
                                            placeholder={`Option text...`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-2">
                                    <label className="block text-xs font-black uppercase text-emerald-600 mb-2 tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Correct Answer
                                    </label>
                                    <select 
                                        required
                                        value={newQuestion.correctAnswer}
                                        onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                                        className="w-full p-4 bg-emerald-50/30 border border-emerald-100 text-emerald-900 rounded-2xl focus:border-emerald-500 outline-none font-bold text-sm shadow-sm"
                                    >
                                        <option value="" disabled>Select correct option...</option>
                                        {newQuestion.options.map((opt, i) => (
                                            opt ? <option key={i} value={opt}>Option {String.fromCharCode(65 + i)}: {opt.substring(0, 30)}...</option> : null
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Subject</label>
                                    <select 
                                        value={newQuestion.subject}
                                        onChange={e => setNewQuestion({...newQuestion, subject: e.target.value})}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-upsc-blue outline-none font-bold text-sm"
                                    >
                                        {subjects.length > 0 ? subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>) : <option value="Polity">Polity</option>}
                                    </select>
                                </div>
                                
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Topic (Module)</label>
                                    <input 
                                        type="text"
                                        required
                                        value={newQuestion.topic}
                                        onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-upsc-blue outline-none font-bold text-sm"
                                        placeholder="Specific Module"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-slate-50">
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex items-center gap-3 px-10 py-4 bg-upsc-blue hover:bg-upsc-blue-dark text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                                    {saving ? 'Processing...' : 'Add to Vault'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                        <div className="mb-6 p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-upsc-blue shrink-0 shadow-sm">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-black text-upsc-blue uppercase text-xs tracking-widest mb-1">JSON Bulk Import</h4>
                                <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
                                    Paste a JSON array of questions. The system will automatically map modules based on subtopics for Polity and skip any exact duplicate questions already in the vault.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <textarea 
                                value={bulkJson}
                                onChange={e => setBulkJson(e.target.value)}
                                className="w-full p-6 bg-slate-900 text-emerald-400 font-mono text-sm border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-y min-h-[400px]"
                                placeholder='[ { "question": "...", "options": {...}, "answer": "...", ... } ]'
                            />

                            <div className="flex justify-end pt-6 border-t border-slate-50">
                                <button 
                                    onClick={handleBulkSave}
                                    disabled={saving || !bulkJson}
                                    className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-70"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                                    {saving ? 'Importing Data...' : 'Confirm Bulk Upload'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Success Modal */}
            {success && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl shadow-slate-900/20 border border-slate-100 animate-in zoom-in-95 duration-200 text-center">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Upload Successful!</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed px-4">
                            {isBulkAdding 
                                ? `Great! We've successfully imported ${importCount} questions into the vault. ${skippedCount > 0 ? `(${skippedCount} duplicates were skipped).` : ''}`
                                : 'The question has been added successfully and is now live in the question vault.'
                            }
                        </p>
                        <button 
                            onClick={() => setSuccess(false)}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            Continue Uploading
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

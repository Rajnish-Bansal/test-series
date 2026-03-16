import { Search, Filter, Save, X, Edit2, Loader2, AlertCircle, Map, BookOpen, FileText, ChevronDown, ChevronRight, PlusCircle, Trash2 } from 'lucide-react';
import TopicCoverageTable from './TopicCoverageTable';
import { useState, useEffect, useMemo, Fragment } from 'react';

export default function QuestionManager() {
    // State management
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewLevel, setViewLevel] = useState(0); // 0: Subjects, 1: Topics, 2: Questions
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    
    // UI & Edit States
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [allStructure, setAllStructure] = useState([]);
    const [showSyllabus, setShowSyllabus] = useState(false);
    const [expandedTopics, setExpandedTopics] = useState(new Set());
    const [newTopicName, setNewTopicName] = useState('');
    const [newSubtopicName, setNewSubtopicName] = useState({}); // { [moduleName]: string }
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [qRes, sRes, structRes] = await Promise.all([
                fetch('/api/admin/question-vault'),
                fetch('/api/admin/topic-coverage'),
                fetch('/api/subjects')
            ]);
            const qData = await qRes.json();
            const sData = await sRes.json();
            const structData = await structRes.json();
            
            if (qData.success) {
                setQuestions(qData.data.reverse());
            }
            if (sData.success) {
                setSubjects(sData.data);
            }
            if (structData.success) {
                setAllStructure(structData.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuestion = async (id) => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/question-vault', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    updates: {
                        topic: editValues.topic,
                        subtopic: editValues.subtopic,
                        microTag: editValues.subtopic
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                setQuestions(questions.map(q => q.id === id ? data.data : q));
                setEditingId(null);
            } else {
                setError(data.error || 'Failed to update');
            }
        } catch (err) {
            setError('Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuestion = (id) => {
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        const id = deleteModal.id;
        if (!id) return;
        
        setDeleteModal({ show: false, id: null });
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/question-vault', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.success) {
                setQuestions(questions.filter(q => q.id !== id));
            } else {
                setError(data.error || 'Failed to delete');
            }
        } catch (err) {
            setError('Delete failed');
        } finally {
            setSaving(false);
        }
    };

    const startEditing = (q) => {
        setEditingId(q.id);
        setEditValues({
            topic: q.topic,
            subtopic: q.subtopic || q.microTag
        });
    };

    // Derived analytics
    const subjectCounts = questions.reduce((acc, q) => {
        const subj = q.subject || q.topic;
        acc[subj] = (acc[subj] || 0) + 1;
        return acc;
    }, {});

    const subjectSummary = Object.entries(subjectCounts).map(([name, count]) => ({ name, count }));

    const stats = useMemo(() => {
        const targetSubjects = selectedSubject 
            ? allStructure.filter(s => s.name === selectedSubject)
            : allStructure;
        
        const filteredQs = selectedSubject 
            ? questions.filter(q => (q.subject || q.topic) === selectedSubject)
            : questions;

        const totalTopics = targetSubjects.reduce((sum, s) => sum + s.modules.flatMap(m => m.topics).length, 0);
        
        const missingTopics = targetSubjects.reduce((sum, s) => {
            const topics = s.modules.flatMap(m => m.topics);
            const missing = topics.filter(t => {
                const tName = typeof t === 'string' ? t : t.name;
                return !questions.some(q => (q.subject || q.topic) === s.name && (q.subtopic || q.microTag) === tName);
            }).length;
            return sum + missing;
        }, 0);

        return {
            totalQs: filteredQs.length,
            totalTopics,
            missingTopics
        };
    }, [selectedSubject, allStructure, questions]);

    const topicsForSubject = useMemo(() => {
        if (!selectedSubject || !allStructure.length) return [];
        const subjectData = allStructure.find(s => s.name === selectedSubject);
        if (!subjectData) return [];

        return subjectData.modules.map((mod, modIdx) => {
            const moduleQuestions = questions.filter(q => 
                (q.subject || q.topic) === selectedSubject && q.topic === mod.name
            );
            
            return {
                sl: modIdx + 1,
                name: mod.name,
                count: moduleQuestions.length,
                subtopics: mod.topics.map((sub, subIdx) => {
                    const subName = typeof sub === 'string' ? sub : sub.name;
                    return {
                        sl: `${modIdx + 1}.${subIdx + 1}`,
                        name: subName,
                        count: moduleQuestions.filter(q => (q.subtopic || q.microTag) === subName).length
                    };
                })
            };
        });
    }, [selectedSubject, allStructure, questions]);

    const handleAddModule = async () => {
        if (!newTopicName.trim()) return;
        try {
            const res = await fetch('/api/admin/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add-module',
                    subjectName: selectedSubject,
                    moduleName: newTopicName.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                setAllStructure(data.data);
                setNewTopicName('');
            } else {
                setError(data.error);
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddTopic = async (modName) => {
        const subName = newSubtopicName[modName];
        if (!subName?.trim()) return;
        try {
            const res = await fetch('/api/admin/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add-topic',
                    subjectName: selectedSubject,
                    moduleName: modName,
                    topicName: subName.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                setAllStructure(data.data);
                setNewSubtopicName({ ...newSubtopicName, [modName]: '' });
            } else {
                setError(data.error);
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleTopic = (topicName) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(topicName)) {
            newExpanded.delete(topicName);
        } else {
            newExpanded.add(topicName);
        }
        setExpandedTopics(newExpanded);
    };

    const finalFilteredQuestions = questions.filter(q => {
        const matchesSubject = !selectedSubject || (q.subject || q.topic) === selectedSubject;
        const matchesTopic = !selectedTopic || (q.subtopic || q.microTag) === selectedTopic;
        const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                ((q.subtopic || q.microTag) && (q.subtopic || q.microTag).toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSubject && matchesTopic && matchesSearch;
    });

    const resetNavigation = () => {
        setViewLevel(0);
        setSelectedSubject(null);
        setSelectedTopic(null);
    };

    const selectSubject = (sub) => {
        setSelectedSubject(sub);
        setViewLevel(1);
    };

    const selectTopic = (top) => {
        setSelectedTopic(top);
        setViewLevel(2);
    };

    return (
        <div className="p-6 md:p-8 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Questions & Topics</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <button onClick={resetNavigation} className={`text-xs font-bold ${viewLevel === 0 ? 'text-slate-400 cursor-default' : 'text-upsc-blue hover:underline'}`}>All Subjects</button>
                        {viewLevel >= 1 && (
                            <>
                                <span className="text-slate-300">/</span>
                                <button onClick={() => { setViewLevel(1); setSelectedTopic(null); }} className={`text-xs font-bold ${viewLevel === 1 ? 'text-slate-400 cursor-default' : 'text-upsc-blue hover:underline'}`}>{selectedSubject}</button>
                            </>
                        )}
                        {viewLevel === 2 && (
                            <>
                                <span className="text-slate-300">/</span>
                                <span className="text-xs font-bold text-slate-400">{selectedTopic}</span>
                            </>
                        )}
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowSyllabus(!showSyllabus)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap ${showSyllabus ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-upsc-blue hover:text-upsc-blue'}`}
                    >
                        <Map className="w-5 h-5" /> {showSyllabus ? 'Back to Questions' : 'Manage Syllabus'}
                    </button>
                </div>
            </div>

            {/* Coverage Summary Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-upsc-blue">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">{stats.totalQs}</div>
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{selectedSubject ? `${selectedSubject} Questions` : 'Total Questions'}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">{stats.totalTopics}</div>
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{selectedSubject ? `${selectedSubject} Topics` : 'Syllabus Topics'}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-slate-800">{stats.missingTopics}</div>
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Missing Content</div>
                    </div>
                </div>
            </div>

            {showSyllabus ? (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-300">
                    <TopicCoverageTable />
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search by text or subtopic..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-upsc-blue/20 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto min-h-0">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-6 h-6 animate-spin text-upsc-blue" />
                            </div>
                        ) : (
                            <>
                                {viewLevel === 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {subjectSummary.map((sub, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => selectSubject(sub.name)}
                                                className="group text-left p-6 bg-white border border-slate-200 rounded-2xl hover:border-upsc-blue hover:shadow-xl hover:shadow-blue-500/10 transition-all animate-in zoom-in-95 duration-200"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xl font-black text-slate-800 group-hover:text-upsc-blue transition-colors">{sub.name}</h3>
                                                    <span className="text-xs font-black text-upsc-blue bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{sub.count} Qs</span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium">Click to explore topics and questions in {sub.name}.</p>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {viewLevel === 1 && (
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                                                    <th className="p-4 w-16 text-center">Sl no</th>
                                                    <th className="p-4">Topics & Subtopics</th>
                                                    <th className="p-4 w-32 text-center">Questions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {topicsForSubject.map((mod, idx) => {
                                                    const isExpanded = expandedTopics.has(mod.name);
                                                    return (
                                                        <Fragment key={idx}>
                                                            <tr 
                                                                className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                                onClick={() => toggleTopic(mod.name)}
                                                            >
                                                                <td className="p-4 text-center text-xs font-bold text-slate-400">{mod.sl}</td>
                                                                <td className="p-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-1 rounded transition-colors ${isExpanded ? 'bg-upsc-blue/10 text-upsc-blue' : 'text-slate-400'}`}>
                                                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                                        </div>
                                                                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-upsc-blue transition-colors">{mod.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <span className="text-xs font-black text-upsc-blue bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">{mod.count}</span>
                                                                </td>
                                                            </tr>
                                                            {isExpanded && (
                                                                <>
                                                                    {mod.subtopics.map((sub, sIdx) => (
                                                                        <tr 
                                                                            key={`${idx}-${sIdx}`}
                                                                            className="border-b border-blue-50/50 bg-blue-50/10 hover:bg-blue-50/30 transition-colors cursor-pointer group/sub"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                selectTopic(sub.name);
                                                                            }}
                                                                        >
                                                                            <td className="p-3 text-center text-[10px] font-bold text-slate-300 italic">{sub.sl}</td>
                                                                            <td className="p-3 pl-14">
                                                                                <span className="text-sm font-bold text-slate-500 group-hover/sub:text-upsc-blue transition-colors">{sub.name}</span>
                                                                            </td>
                                                                            <td className="p-3 text-center">
                                                                                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">{sub.count}</span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    {/* Add Subtopic Row */}
                                                                    <tr className="bg-blue-50/5 border-b border-blue-50/50">
                                                                        <td className="p-3"></td>
                                                                        <td className="p-3 pl-14">
                                                                            <div className="flex items-center gap-2">
                                                                                <input 
                                                                                    type="text"
                                                                                    placeholder="New subtopic name..."
                                                                                    value={newSubtopicName[mod.name] || ''}
                                                                                    onChange={(e) => setNewSubtopicName({...newSubtopicName, [mod.name]: e.target.value})}
                                                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-upsc-blue/20 outline-none"
                                                                                />
                                                                                <button 
                                                                                    onClick={(e) => { e.stopPropagation(); handleAddTopic(mod.name); }}
                                                                                    className="p-1.5 bg-upsc-blue text-white rounded-lg hover:bg-upsc-blue-dark transition-all disabled:opacity-50"
                                                                                    disabled={!newSubtopicName[mod.name]?.trim()}
                                                                                >
                                                                                    <PlusCircle className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                        <td></td>
                                                                    </tr>
                                                                </>
                                                            )}
                                                        </Fragment>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-slate-50/50">
                                                    <td className="p-4"></td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                                                <PlusCircle className="w-5 h-5" />
                                                            </div>
                                                            <input 
                                                                type="text"
                                                                placeholder="Add a new main topic..."
                                                                value={newTopicName}
                                                                onChange={(e) => setNewTopicName(e.target.value)}
                                                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none"
                                                            />
                                                            <button 
                                                                onClick={handleAddModule}
                                                                disabled={!newTopicName.trim()}
                                                                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                                                            >
                                                                Add Topic
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-4"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}

                                {viewLevel === 2 && (
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[700px]">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                                                        <th className="p-4 whitespace-nowrap w-20">ID</th>
                                                        <th className="p-4">Question Text</th>
                                                        <th className="p-4 whitespace-nowrap w-40">Topic / Tag</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {finalFilteredQuestions.length === 0 ? (
                                                        <tr><td colSpan="3" className="p-12 text-center text-slate-400 italic font-medium">No questions found matching your criteria.</td></tr>
                                                    ) : (
                                                        finalFilteredQuestions.map((q, idx) => {
                                                            const isEditing = editingId === q.id;
                                                            const currentSubject = allStructure.find(s => s.name === (q.subject || 'Polity'));
                                                            const modules = currentSubject ? currentSubject.modules : [];
                                                            const selectedModule = modules.find(m => m.name === editValues.topic);
                                                            const subtopics = selectedModule ? selectedModule.topics : [];

                                                            return (
                                                                <tr key={idx} className={`border-b border-slate-100 transition-colors ${isEditing ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                                                                    <td className="p-4 align-top text-xs font-mono text-slate-400">#{q.id.replace('q', '')}</td>
                                                                    <td className="p-4 align-top">
                                                                        <p className="text-sm font-bold text-slate-800 line-clamp-3 leading-relaxed mb-3">{q.text}</p>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {q.options.map((opt, i) => (
                                                                                <span key={i} className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                                                                    {String.fromCharCode(97 + i)}) {opt}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 align-top">
                                                                        {isEditing ? (
                                                                            <div className="flex flex-col gap-2 min-w-[180px]">
                                                                                <select 
                                                                                    value={editValues.topic}
                                                                                    onChange={e => setEditValues({...editValues, topic: e.target.value, subtopic: ''})}
                                                                                    className="text-[10px] p-1.5 border rounded border-blue-200 bg-white"
                                                                                >
                                                                                    <option value="">Select Topic...</option>
                                                                                    {modules.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                                                                                </select>
                                                                                <select 
                                                                                    value={editValues.subtopic}
                                                                                    onChange={e => setEditValues({...editValues, subtopic: e.target.value})}
                                                                                    className="text-[10px] p-1.5 border rounded border-blue-200 bg-white"
                                                                                >
                                                                                    <option value="">Select Subtopic...</option>
                                                                                    {subtopics.map((st, si) => {
                                                        const stName = typeof st === 'string' ? st : (st.name || 'General');
                                                        return <option key={si} value={stName}>{stName}</option>;
                                                    })}
                                                                                </select>
                                                                                <div className="flex gap-2 mt-1">
                                                                                    <button 
                                                                                        onClick={() => handleUpdateQuestion(q.id)}
                                                                                        disabled={saving}
                                                                                        className="flex-1 bg-upsc-blue text-white text-[10px] font-bold py-1 rounded hover:bg-upsc-blue-dark disabled:opacity-50"
                                                                                    >
                                                                                        {saving ? '...' : 'Save'}
                                                                                    </button>
                                                                                    <button 
                                                                                        onClick={() => setEditingId(null)}
                                                                                        className="flex-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold py-1 rounded hover:bg-slate-50"
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col gap-1.5 items-start relative group/cell">
                                                                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200/50">{q.topic}</span>
                                                                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-50 text-upsc-blue border border-blue-100">{q.subtopic || q.microTag}</span>
                                                                                <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover/cell:opacity-100 transition-all">
                                                                                    <button 
                                                                                        onClick={() => startEditing(q)}
                                                                                        className="p-1 bg-white border border-slate-200 rounded shadow-sm hover:text-upsc-blue hover:border-upsc-blue transition-all"
                                                                                        title="Edit Question"
                                                                                    >
                                                                                        <Edit2 className="w-3 h-3" />
                                                                                    </button>
                                                                                    <button 
                                                                                        onClick={() => handleDeleteQuestion(q.id)}
                                                                                        disabled={saving}
                                                                                        className="p-1 bg-white border border-slate-200 rounded shadow-sm hover:text-red-500 hover:border-red-500 transition-all disabled:opacity-50"
                                                                                        title="Delete Question"
                                                                                    >
                                                                                        <Trash2 className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* Custom Confirmation Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-slate-900/20 border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 text-center mb-2">Delete Question?</h3>
                        <p className="text-slate-500 text-sm font-medium text-center mb-8 leading-relaxed">
                            This action cannot be undone. This question will be permanently removed from the database.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={confirmDelete}
                                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                            >
                                Confirm Delete
                            </button>
                            <button 
                                onClick={() => setDeleteModal({ show: false, id: null })}
                                className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

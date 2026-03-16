import { BookOpen, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Circle, Trash2, Plus, Loader2, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TopicCoverageTable() {
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [expandedModules, setExpandedModules] = useState({}); // { 'Polity::The Union Executive': true }
    const [newTopicInputs, setNewTopicInputs] = useState({}); // { 'Polity::Part I': 'New Topic Name' }
    const [newModuleInputs, setNewModuleInputs] = useState({}); // { 'Polity': 'New Module Name' }
    const [newSubjectName, setNewSubjectName] = useState('');
    const [editingItem, setEditingItem] = useState(null); // { type: 'subject'|'module'|'subtopic_row', subjectName, moduleName, oldName, value, weight }
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        Promise.all([
            fetch('/api/admin/question-vault').then(res => res.json()),
            fetch('/api/admin/topic-coverage').then(res => res.json())
        ])
        .then(([qData, sData]) => {
            if (qData.success) setQuestions(qData.data);
            if (sData.success) setSubjects(sData.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    const saveSubjects = async (updatedSubjects) => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/topic-coverage', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSubjects)
            });
            const data = await res.json();
            if (data.success) {
                setSubjects(updatedSubjects);
            } else {
                alert('Server Error: ' + (data.error || 'Unknown error occurred while saving.'));
            }
        } catch (err) {
            console.error(err);
            alert('Connection error');
        } finally {
            setSaving(false);
        }
    };

    const migrateQuestions = async (type, oldName, newName, subjectContext) => {
        const updatedQuestions = questions.map(q => {
            const currentSubj = q.subject || q.topic;
            const currentTopic = q.topic;
            const currentSubtopic = q.subtopic || q.microTag;

            if (type === 'subject' && currentSubj === oldName) {
                return { ...q, subject: newName };
            }
            if (type === 'topic' && currentSubj === subjectContext && currentSubtopic === oldName) {
                return { ...q, subtopic: newName };
            }
            return q;
        });

        const res = await fetch('/api/admin/question-vault', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedQuestions)
        });
        const data = await res.json();
        if (data.success) {
            setQuestions(updatedQuestions);
        } else {
            console.error('Question migration failed:', data.error);
        }
    };

    const handleAddSubject = () => {
        if (!newSubjectName.trim()) return;
        if (subjects.find(s => s.name.toLowerCase() === newSubjectName.toLowerCase())) {
            alert('Subject already exists');
            return;
        }
        const updatedSubjects = [...subjects, { name: newSubjectName.trim(), modules: [] }];
        saveSubjects(updatedSubjects);
        setNewSubjectName('');
    };

    const handleAddModule = (subjectName) => {
        const moduleName = newModuleInputs[subjectName]?.trim();
        if (!moduleName) return;

        const updatedSubjects = subjects.map(s => {
            if (s.name !== subjectName) return s;
            return {
                ...s,
                modules: [...s.modules, { name: moduleName, topics: [] }]
            };
        });

        setNewModuleInputs(prev => ({ ...prev, [subjectName]: '' }));
        saveSubjects(updatedSubjects);
    };

    const handleAddTopic = (subjectName, moduleName) => {
        const inputKey = `${subjectName}::${moduleName}`;
        const topicName = newTopicInputs[inputKey]?.trim();
        if (!topicName) return;

        const updatedSubjects = subjects.map(s => {
            if (s.name !== subjectName) return s;
            return {
                ...s,
                modules: s.modules.map(m => {
                    if (m.name !== moduleName) return m;
                    const exists = m.topics.some(t => (typeof t === 'string' ? t : t.name) === topicName);
                    if (exists) return m;
                    return { ...m, topics: [...m.topics, { name: topicName, weight: 1.0, priority: 'Low Yield' }] };
                })
            };
        });

        setNewTopicInputs(prev => ({ ...prev, [inputKey]: '' }));
        saveSubjects(updatedSubjects);
    };

    const handleRename = async () => {
        if (!editingItem || !editingItem.value.trim()) {
            setEditingItem(null);
            return;
        }

        const { type, subjectName, moduleName, oldName, value } = editingItem;
        const newName = value.trim();
        if (newName === oldName) {
            setEditingItem(null);
            return;
        }

        const updatedSubjects = subjects.map(s => {
            if (type === 'subject') {
                if (s.name === oldName) return { ...s, name: newName };
                return s;
            }
            if (s.name !== subjectName) return s;
            return {
                ...s,
                modules: s.modules.map(m => {
                    if (type === 'module') {
                        if (m.name === oldName) return { ...m, name: newName };
                        return m;
                    }
                    if (m.name !== moduleName) return m;
                    return {
                        ...m,
                        topics: m.topics.map(t => {
                            const tName = typeof t === 'string' ? t : t.name;
                            if (tName === oldName) {
                                return typeof t === 'string' ? { name: newName, weight: 1.0, priority: 'Low Yield' } : { ...t, name: newName };
                            }
                            return t;
                        })
                    };
                })
            };
        });
        
        await saveSubjects(updatedSubjects);
        if (type === 'subject') {
            await migrateQuestions('subject', oldName, newName);
        } else if (type === 'topic') {
            await migrateQuestions('topic', oldName, newName, subjectName);
        }
        setEditingItem(null);
    };

    const handleSaveSubtopicRow = async (subjectName, moduleName) => {
        if (!editingItem || !editingItem.value.trim()) {
            setEditingItem(null);
            return;
        }

        const { oldName, value, weight: newWeight } = editingItem;
        const newName = value.trim();
        const weight = parseFloat(newWeight);

        let priority = 'Low Yield';
        if (weight >= 3) priority = 'High Yield';
        else if (weight >= 2) priority = 'Medium Yield';

        const updatedSubjects = subjects.map(s => {
            if (s.name !== subjectName) return s;
            return {
                ...s,
                modules: s.modules.map(m => {
                    if (m.name !== moduleName) return m;
                    return {
                        ...m,
                        topics: m.topics.map(t => {
                            const tName = typeof t === 'string' ? t : t.name;
                            if (tName === oldName) {
                                return { name: newName, weight, priority };
                            }
                            return t;
                        })
                    };
                })
            };
        });

        await saveSubjects(updatedSubjects);
        if (newName !== oldName) {
            await migrateQuestions('topic', oldName, newName, subjectName);
        }
        setEditingItem(null);
    };

    const handleDeleteSubject = (name) => {
        if (!window.confirm(`Delete entire subject "${name}"? All nested modules and topics will be removed from the map.`)) return;
        const updatedSubjects = subjects.filter(s => s.name !== name);
        saveSubjects(updatedSubjects);
    };

    const handleDeleteModule = (subjectName, moduleName) => {
        if (!window.confirm(`Delete module "${moduleName}" and all its topics?`)) return;
        const updatedSubjects = subjects.map(s => {
            if (s.name !== subjectName) return s;
            return {
                ...s,
                modules: s.modules.filter(m => m.name !== moduleName)
            };
        });
        saveSubjects(updatedSubjects);
    };

    const handleDeleteTopic = (subjectName, moduleName, topicName) => {
        if (!window.confirm(`Delete topic "${topicName}"?`)) return;

        const updatedSubjects = subjects.map(s => {
            if (s.name !== subjectName) return s;
            return {
                ...s,
                modules: s.modules.map(m => {
                    if (m.name !== moduleName) return m;
                    return { ...m, topics: m.topics.filter(t => t.name !== topicName) };
                })
            };
        });

        saveSubjects(updatedSubjects);
    };

    // Build a quick lookup: { 'Polity::Supreme Court': 7, ... }
    // Note: We use the Subtopic for the inner count because that's what the table displays at the 3rd level.
    const countMap = {};
    questions.forEach(q => {
        const subj = q.subject || q.topic;
        const subtopic = q.subtopic || q.microTag || 'General';
        const key = `${subj}::${subtopic}`;
        countMap[key] = (countMap[key] || 0) + 1;
    });

    const normalizeSubtopic = (val) => typeof val === 'string' ? val : val?.name || '';

    const subjectTotal = (subjectName) =>
        questions.filter(q => (q.subject || q.topic) === subjectName).length;

    const toggleSubject = (name) => {
        setExpandedSubjects(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const toggleModule = (subName, modName) => {
        const key = `${subName}::${modName}`;
        setExpandedModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-upsc-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const totalQuestions = questions.length;
    
    // Total topics across all subjects
    const allNestedTopics = subjects.flatMap(s => s.modules.flatMap(m => m.topics));
    const totalTopics = allNestedTopics.length;
    
    const coveredTopicsCount = subjects.reduce((count, s) => {
        const subjectTopics = s.modules.flatMap(m => m.topics);
        const coveredInSubject = subjectTopics.filter(t => (countMap[`${s.name}::${normalizeSubtopic(t)}`] || 0) > 0).length;
        return count + coveredInSubject;
    }, 0);

    return (
        <div className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-upsc-blue" /> Content Coverage Map
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 text-sm">
                        Track and manage Subjects → Modules → Topics.
                    </p>
                </div>
                <div className="flex gap-4 shrink-0">
                    <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-2xl font-black text-slate-800 tabular-nums">{totalQuestions}</div>
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Questions Live</div>
                    </div>
                    <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                        <div className="text-2xl font-black text-emerald-700 tabular-nums">
                            {coveredTopicsCount}<span className="text-sm font-bold text-emerald-400">/{totalTopics}</span>
                        </div>
                        <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Subtopics Ready</div>
                    </div>
                </div>
            </div>

            {/* Quick Add Subject */}
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center gap-4 group hover:border-upsc-blue/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-upsc-blue/10 group-hover:text-upsc-blue transition-colors">
                    <Plus className="w-5 h-5" />
                </div>
                <input 
                    type="text" 
                    placeholder="Create new Subject (e.g. Geography)..."
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                    className="flex-1 bg-transparent border-none outline-none font-bold text-slate-600 placeholder:text-slate-300"
                />
                {newSubjectName && (
                    <button 
                        onClick={handleAddSubject}
                        className="px-4 py-2 bg-upsc-blue text-white rounded-xl text-xs font-black uppercase shadow-sm"
                    >
                        Create Subject
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4">
                {subjects.map((subject, sIdx) => {
                    const totalQsInSubject = subjectTotal(subject.name);
                    const isSubjectExpanded = !!expandedSubjects[subject.name];
                    const subjectTopicsList = subject.modules.flatMap(m => m.topics);
                    
                    const coveredInSubject = subjectTopicsList.filter(t => (countMap[`${subject.name}::${normalizeSubtopic(t)}`] || 0) > 0).length;
                    const coveragePct = subjectTopicsList.length > 0 
                        ? Math.round((coveredInSubject / subjectTopicsList.length) * 100) 
                        : 0;

                    const isEditingSubject = editingItem?.type === 'subject' && editingItem.oldName === subject.name;

                    return (
                        <div key={subject.name} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
                            {/* Subject Header */}
                            <div className={`w-full flex items-center justify-between p-5 ${isSubjectExpanded ? 'bg-slate-50/50 border-b border-slate-100' : ''}`}>
                                <div className="flex items-center gap-4 flex-1">
                                    <span className="text-xs font-mono text-slate-300 w-4">{(sIdx + 1).toString().padStart(2, '0')}</span>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm bg-upsc-blue`}>
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="text-left flex-1 max-w-md">
                                        {isEditingSubject ? (
                                            <input 
                                                autoFocus
                                                value={editingItem.value}
                                                onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                                                onKeyDown={e => e.key === 'Enter' && handleRename()}
                                                onBlur={() => handleRename()}
                                                className="w-full text-lg font-black text-slate-800 bg-white border-b-2 border-upsc-blue outline-none"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 group">
                                                <h3 className="text-lg font-black text-slate-800">{subject.name}</h3>
                                                <button 
                                                    onClick={() => setEditingItem({ type: 'subject', oldName: subject.name, value: subject.name })}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-upsc-blue transition-all"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {coveredInSubject}/{subjectTopicsList.length} Topics Covered
                                            </span>
                                            <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${coveragePct === 100 ? 'bg-emerald-500' : 'bg-upsc-blue'}`}
                                                    style={{ width: `${coveragePct}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-black text-slate-800">{totalQsInSubject} Questions</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{coveragePct}% Coverage</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleDeleteSubject(subject.name)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => toggleSubject(subject.name)}
                                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                                        >
                                            {isSubjectExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Topics Hierarchy */}
                            {isSubjectExpanded && (
                                <div className="bg-slate-50/20 divide-y divide-slate-100">
                                    {subject.modules.map((mod, modIdx) => {
                                        const isModuleExpanded = !!expandedModules[`${subject.name}::${mod.name}`];
                                        const isEditingModule = editingItem?.type === 'module' && editingItem.subjectName === subject.name && editingItem.oldName === mod.name;
                                        const modQuestionCount = mod.topics.reduce((sum, t) => sum + (countMap[`${subject.name}::${normalizeSubtopic(t)}`] || 0), 0);

                                        return (
                                            <div key={modIdx} className="p-0">
                                                <div className="w-full px-5 py-3 bg-slate-50/50 flex items-center justify-between border-b border-slate-100 group">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <span className="text-[10px] font-mono text-slate-300 w-4">{(modIdx + 1).toString().padStart(2, '0')}</span>
                                                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                                                            {isEditingModule ? (
                                                                <input 
                                                                    autoFocus
                                                                    value={editingItem.value}
                                                                    onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                                                                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                                                                    onBlur={() => handleRename()}
                                                                    className="w-full text-[11px] font-black text-slate-600 bg-white border-b border-upsc-blue outline-none uppercase"
                                                                />
                                                            ) : (
                                                                <>
                                                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                        <div className="w-1 h-3 bg-blue-300 rounded-full" />
                                                                        {mod.name}
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => setEditingItem({ type: 'module', subjectName: subject.name, oldName: mod.name, value: mod.name })}
                                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-upsc-blue transition-all"
                                                                    >
                                                                        <Edit2 className="w-3 h-3" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right flex flex-col items-end mr-2">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                                                {modQuestionCount} <span className="opacity-60">Questions</span>
                                                            </span>
                                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">
                                                                {mod.topics.length} Topics
                                                            </span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDeleteModule(subject.name, mod.name)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleModule(subject.name, mod.name)}
                                                            className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-all"
                                                        >
                                                            {isModuleExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {isModuleExpanded && (
                                                    <div className="divide-y divide-slate-50 bg-white animate-in slide-in-from-top-2 duration-200">
                                                        {mod.topics.map((topicObj, topicIdx) => {
                                                            const topic = normalizeSubtopic(topicObj);
                                                            const weight = topicObj?.weight || 1.0;
                                                            const priority = topicObj?.priority || 'Low Yield';
                                                            const count = countMap[`${subject.name}::${topic}`] || 0;
                                                            
                                                            const isEditingRow = editingItem?.type === 'subtopic_row' && editingItem.subjectName === subject.name && editingItem.moduleName === mod.name && editingItem.oldName === topic;

                                                            return (
                                                                <div key={topic} className="flex items-center justify-between px-5 py-3 border-b border-slate-50/50 hover:bg-slate-50/50 transition-colors group">
                                                                    <div className="flex items-center gap-4 flex-1">
                                                                        <span className="text-[10px] font-mono text-slate-300 w-4">{(topicIdx + 1).toString().padStart(2, '0')}</span>
                                                                        
                                                                        {isEditingRow ? (
                                                                            <div className="flex flex-col gap-2 flex-1 max-w-md">
                                                                                <input 
                                                                                    autoFocus
                                                                                    value={editingItem.value}
                                                                                    onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                                                                                    className="w-full text-sm font-bold text-slate-700 bg-white border-b border-upsc-blue outline-none"
                                                                                    placeholder="Subtopic Name"
                                                                                />
                                                                                <div className="flex items-center gap-3">
                                                                                    <select 
                                                                                        value={editingItem.weight}
                                                                                        onChange={e => setEditingItem({ ...editingItem, weight: e.target.value })}
                                                                                        className="text-[10px] font-black bg-blue-50 border border-upsc-blue rounded outline-none px-1 py-1"
                                                                                    >
                                                                                        <option value="3.0">High Yield</option>
                                                                                        <option value="2.0">Medium Yield</option>
                                                                                        <option value="1.0">Low Yield</option>
                                                                                    </select>
                                                                                    <div className="flex gap-1">
                                                                                        <button 
                                                                                            onClick={() => handleSaveSubtopicRow(subject.name, mod.name)}
                                                                                            disabled={saving}
                                                                                            className="px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                                                        >
                                                                                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={() => setEditingItem(null)}
                                                                                            disabled={saving}
                                                                                            className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-300 disabled:opacity-50"
                                                                                        >
                                                                                            Cancel
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col flex-1 max-w-sm">
                                                                                <div className="flex items-center gap-2 group/text">
                                                                                    <span className="text-sm font-bold text-slate-700">{topic}</span>
                                                                                    <button 
                                                                                        onClick={() => setEditingItem({ 
                                                                                            type: 'subtopic_row', 
                                                                                            subjectName: subject.name, 
                                                                                            moduleName: mod.name, 
                                                                                            oldName: topic, 
                                                                                            value: topic,
                                                                                            weight: weight
                                                                                        })}
                                                                                        className="px-2 py-0.5 text-[10px] font-black uppercase text-upsc-blue bg-blue-50 hover:bg-upsc-blue hover:text-white border border-blue-100 rounded transition-all"
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                    <div className={`text-[9px] font-black border px-1.5 py-0.5 rounded flex items-center gap-1
                                                                                            ${weight >= 3 ? 'bg-red-50 text-red-600 border-red-100' : 
                                                                                              weight >= 2 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                                                              'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                                                        {weight}x Yield
                                                                                    </div>
                                                                                    {count === 0 && (
                                                                                        <span className="text-[9px] font-black text-red-400 uppercase tracking-tighter flex items-center gap-1">
                                                                                            <AlertCircle className="w-2.5 h-2.5" /> High Priority: Missing Content
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-6">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`text-sm font-black tabular-nums ${count === 0 ? 'text-red-400' : 'text-slate-800'}`}>
                                                                                {count} <span className="text-[10px] text-slate-400 font-bold uppercase ml-0.5">Qs</span>
                                                                            </span>
                                                                            {count > 0 ? (
                                                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                                            ) : (
                                                                                <Circle className="w-4 h-4 text-slate-200" />
                                                                            )}
                                                                        </div>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); handleDeleteTopic(subject.name, mod.name, topic); }}
                                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        
                                                        {/* Add Topic In-place */}
                                                        <div className="px-5 py-2 bg-slate-50/30 flex items-center gap-3">
                                                            <Plus className="w-3.5 h-3.5 text-slate-300" />
                                                            <input 
                                                                type="text"
                                                                placeholder={`Add topic to ${mod.name}...`}
                                                                value={newTopicInputs[`${subject.name}::${mod.name}`] || ''}
                                                                onChange={e => setNewTopicInputs(prev => ({ ...prev, [`${subject.name}::${mod.name}`]: e.target.value }))}
                                                                onKeyDown={e => e.key === 'Enter' && handleAddTopic(subject.name, mod.name)}
                                                                className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-slate-600 placeholder:text-slate-300"
                                                            />
                                                            {newTopicInputs[`${subject.name}::${mod.name}`] && (
                                                                <button 
                                                                    onClick={() => handleAddTopic(subject.name, mod.name)}
                                                                    disabled={saving}
                                                                    className="text-[9px] font-black uppercase bg-upsc-blue text-white px-2.5 py-1 rounded-lg shadow-sm"
                                                                >
                                                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Add Module Button */}
                                    <div className="px-5 py-3 bg-slate-50/20 flex items-center gap-4">
                                        <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-slate-300 border border-slate-100">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder={`New Module for ${subject.name}...`}
                                            value={newModuleInputs[subject.name] || ''}
                                            onChange={e => setNewModuleInputs(prev => ({ ...prev, [subject.name]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && handleAddModule(subject.name)}
                                            className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-500 placeholder:text-slate-300 uppercase tracking-widest"
                                        />
                                        {newModuleInputs[subject.name] && (
                                            <button 
                                                onClick={() => handleAddModule(subject.name)}
                                                className="text-[9px] font-black uppercase bg-slate-800 text-white px-3 py-1 rounded shadow-sm"
                                            >
                                                Add Module
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

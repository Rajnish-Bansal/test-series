import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, ArrowRight, Lock } from 'lucide-react';

export default function TestsList() {
    const navigate = useNavigate();
    const [rawQuestions, setRawQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/questions?summary=true')
            .then(res => res.json())
            .then(allQ => {
                setRawQuestions(allQ);
                setLoading(false);
            })
            .catch(err => {
                console.error("Could not fetch system questions", err);
                setLoading(false);
            });
    }, []);

    // PERFORMANCE OPTIMIZATION: Memoize the test collection generation
    const tests = useMemo(() => {
        if (!rawQuestions || !rawQuestions.length) return [];
        
        const rows = [];

        // 1. Full Length Tests & Past Year Papers (Locked for MVP)
        rows.push({
            id: 'flt-1',
            name: 'Full Length Test 1',
            type: 'Full Length',
            subject: 'All Subjects',
            isLocked: true,
            action: () => {}
        });

        rows.push({
            id: 'flt-2',
            name: 'Full Length Test 2',
            type: 'Full Length',
            subject: 'All Subjects',
            isLocked: true,
            action: () => {}
        });

        rows.push({
            id: 'pyq-2023',
            name: 'UPSC CSE Prelims 2023 (GS Paper I)',
            type: 'Past Paper',
            subject: 'All Subjects',
            isLocked: true,
            action: () => {}
        });

        rows.push({
            id: 'pyq-2022',
            name: 'UPSC CSE Prelims 2022 (GS Paper I)',
            type: 'Past Paper',
            subject: 'All Subjects',
            isLocked: true,
            action: () => {}
        });

        // Extract all unique subjects and their microTags
        const subjectTags = {};
        rawQuestions.forEach(q => {
            const subj = q.subject || q.topic;
            const tag = q.subtopic || q.microTag;
            if (!subjectTags[subj]) {
                subjectTags[subj] = new Set();
            }
            if (tag) {
                subjectTags[subj].add(tag);
            }
        });

        // 2 & 3. Subject-Wise & Topic-Wise Tests
        Object.entries(subjectTags).forEach(([subj, tagsSet]) => {
            const isSubjectLocked = subj !== 'Polity';
            // Add Subject-Wise Test
            rows.push({
                id: `subj-${subj}`,
                name: `${subj} Sectional Mock`,
                type: 'Subject-Wise',
                subject: subj,
                isLocked: isSubjectLocked,
                action: () => navigate(`/exam?subject=${encodeURIComponent(subj)}`)
            });

            // Add all micro-topic tests for this subject
            Array.from(tagsSet).sort().forEach((tag, idx) => {
                rows.push({
                    id: `topic-${subj}-${tag}`,
                    name: `${subj} Test ${idx + 1}`,
                    type: 'Topic-Wise',
                    subject: subj,
                    isLocked: isSubjectLocked,
                    action: () => navigate(`/exam?subject=${encodeURIComponent(subj)}&subtopic=${encodeURIComponent(tag)}`)
                });
            });
        });

        return rows;
    }, [rawQuestions, navigate]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-upsc-blue"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <div className="mb-8">
                    <List className="w-8 h-8 text-upsc-blue" />
                <p className="text-slate-500 mt-2 text-lg">Browse and start any test from the complete catalog.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wider w-[5%] text-center">S.No</th>
                                <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wider w-[45%]">Test Name</th>
                                <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wider w-1/5">Type</th>
                                <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wider w-1/5">Subject</th>
                                <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wider text-right w-[10%]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tests.map((test, index) => (
                                <tr key={test.id} className={`transition-colors group ${test.isLocked ? 'opacity-50' : 'hover:bg-slate-50'}`}>
                                    <td className="p-4 font-semibold text-slate-500 text-center">
                                        {index + 1}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`font-bold transition-colors ${test.isLocked ? 'text-slate-400' : 'text-slate-800 group-hover:text-upsc-blue'}`}>
                                                {test.name}
                                            </span>
                                            {test.isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${test.type === 'Full Length' ? 'bg-blue-100 text-blue-700' :
                                                test.type === 'Past Paper' ? 'bg-amber-100 text-amber-700' :
                                                    test.type === 'Subject-Wise' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-slate-100 text-slate-600'
                                            } ${test.isLocked ? 'grayscale' : ''}`}>
                                            {test.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-slate-500">
                                        {test.subject}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={test.action}
                                            disabled={test.isLocked}
                                            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${test.isLocked 
                                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                                                : 'bg-white border border-slate-200 text-upsc-blue hover:bg-upsc-blue hover:text-white hover:border-upsc-blue'
                                            }`}
                                        >
                                            {test.isLocked ? 'Locked' : 'Start'}
                                            {!test.isLocked && <ArrowRight className="w-4 h-4" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

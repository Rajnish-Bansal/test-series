import { useState, useEffect, useMemo } from 'react';
// HMR Trigger: SubjectDetails page optimized and stabilized
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, ChevronLeft, Target, AlertTriangle, CheckCircle, BarChart2, BookOpen, Clock, Layers, History as HistoryIcon, ArrowRight, Play, Search, ChevronUp, ChevronDown, Lock } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ProgressCalculation } from '../utils/ProgressCalculation';

import { useAuth } from '../context/AuthContext';
import SubjectMasteryDashboard from '../components/dashboard/SubjectMasteryDashboard';
import MasteryProgressBar from '../components/dashboard/MasteryProgressBar';
import { Info } from 'lucide-react';


export default function SubjectDetails() {
    const { topic: subject } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [cumulativeStats, setCumulativeStats] = useState(null);
    const [systemStats, setSystemStats] = useState({ total: 0, bySubtopic: {} });
    const [history, setHistory] = useState([]);
    const [viewMode, setViewMode] = useState('modules'); // Default to Grouped/Nested view
    const [sortBy, setSortBy] = useState('default'); // 'default', 'impact', 'accuracy'
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        // Wait for auth to finish loading before deciding what to do
        if (authLoading) return;

        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch cumulative stats from backend (ONLY IF AUTHENTICATED)
        const fetchStats = isAuthenticated ? fetch(`/api/stats?subject=${encodeURIComponent(subject)}`, { headers })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCumulativeStats(data.cumulativeStats);
                }
            })
            .catch(err => console.error("Could not fetch stats", err))
            : Promise.resolve();

        // 2. Fetch questions for this subject to get system subtopic totals
        const fetchSystemStats = fetch(`/api/questions?subject=${encodeURIComponent(subject)}&summary=true`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const stats = { total: data.length, bySubtopic: {} };
                    data.forEach(q => {
                        const tag = q?.subtopic || 'General';
                        stats.bySubtopic[tag] = (stats.bySubtopic[tag] || 0) + 1;
                    });
                    setSystemStats(stats);
                }
            })
            .catch(err => console.error("Could not fetch system stats", err));

        // 3. Fetch history just for this subject (ONLY IF AUTHENTICATED)
        const fetchHistory = isAuthenticated ? fetch(`/api/sessions?subject=${encodeURIComponent(subject)}`, {
            headers
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setHistory(data.sessions);
                }
            })
            .catch(err => console.error("Could not fetch history", err))
            : Promise.resolve();
        
        // 4. Fetch subject structure
        const fetchSubjects = fetch(`/api/subjects`)
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.data)) {
                    setSubjects(data.data);
                }
            })
            .catch(err => console.error("Could not fetch subjects", err));

        Promise.all([fetchStats, fetchSystemStats, fetchHistory, fetchSubjects])
            .finally(() => setLoading(false));
    }, [subject, isAuthenticated, authLoading]);

    const subjectStats = cumulativeStats?.[subject];
    const subtopicsCumulative = subjectStats?.subtopics || {};

    // PERFORMANCE OPTIMIZATION: Memoize module grouping and master subtopic list
    const { modules, finalSubtopicsList, weightIndex } = useMemo(() => {
        const mods = {};
        const wIndex = ProgressCalculation.buildWeightIndex(subjects);
        let finalTags = [];

        const currentSubject = subjects.find(s => s.name === subject);

        if (currentSubject) {
            currentSubject.modules.forEach(module => {
                // Keep the Laxmikanth module naming or use standard formatting
                const cleanName = module.name.replace(/^[IVX]+\.\s+/, "");
                const topicNames = module.topics.map(t => typeof t === 'string' ? t : t.name);
                mods[cleanName] = topicNames;
            });

            const mappedTags = new Set(currentSubject.modules.flatMap(m => m.topics.map(t => typeof t === 'string' ? t : t.name)));
            const unmapped = Object.keys(systemStats.bySubtopic).filter(t => !mappedTags.has(t) && t !== 'General');

            if (unmapped.length > 0) {
                mods["Other Concepts"] = unmapped;
            }
            finalTags = [...currentSubject.modules.flatMap(m => m.topics.map(t => typeof t === 'string' ? t : t.name)), ...unmapped];
        } else {
            // Fallback for subjects not in structure (dynamically group by 5s)
            const rawTags = Object.keys(systemStats.bySubtopic).sort();
            finalTags = rawTags;
            rawTags.forEach((tag, idx) => {
                const moduleIndex = Math.floor(idx / 5) + 1;
                const moduleName = `Module ${moduleIndex}: Core Concepts`;
                if (!mods[moduleName]) mods[moduleName] = [];
                mods[moduleName].push(tag);
            });
        }
        return { modules: mods, finalSubtopicsList: finalTags, weightIndex: wIndex };
    }, [subject, systemStats.bySubtopic, subjects]);

    // PERFORMANCE OPTIMIZATION: Memoize filtered and sorted list
    const sortedAndFilteredTags = useMemo(() => {
        const filtered = searchTerm.trim() 
            ? finalSubtopicsList.filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            : finalSubtopicsList;

        const list = [...filtered];
        if (sortBy === 'impact') {
            return list.sort((a, b) => {
                const weightA = ProgressCalculation.getWeight(subject, a, weightIndex).weight;
                const weightB = ProgressCalculation.getWeight(subject, b, weightIndex).weight;
                return weightB - weightA;
            });
        }
        
        if (sortBy === 'accuracy' || sortBy === 'accuracy-bidirectional') {
            const getAcc = (tag) => {
                const cleanTag = tag.replace(/^Ch \d+(-\d+)?: /, "");
                const tagTotal = systemStats.bySubtopic[cleanTag] || 0;
                const scoreData = subtopicsCumulative[cleanTag];
                const correct = Array.isArray(scoreData?.correctIds) ? scoreData.correctIds.length : (scoreData?.correct || 0);
                return tagTotal > 0 ? (correct / tagTotal) : 0;
            };

            return list.sort((a, b) => {
                const accA = getAcc(a);
                const accB = getAcc(b);
                if (sortBy === 'accuracy') return accB - accA;
                return sortDirection === 'desc' ? accB - accA : accA - accB;
            });
        }
        return list;
    }, [finalSubtopicsList, searchTerm, sortBy, sortDirection, subject, systemStats.bySubtopic, subtopicsCumulative, weightIndex]);

    // PERFORMANCE OPTIMIZATION: Memoize performance summaries
    const { topicPercentage, isCapped, highYieldAccuracy, strong, weak } = useMemo(() => {
        const prog = ProgressCalculation.calculateWeightedProgress(
            subject,
            subtopicsCumulative,
            systemStats.bySubtopic,
            weightIndex
        );
        const summ = ProgressCalculation.getPerformanceSummary(
            subject,
            subtopicsCumulative,
            systemStats.bySubtopic,
            weightIndex
        );
        return { 
            topicPercentage: prog.percentage, 
            isCapped: prog.isCapped, 
            highYieldAccuracy: prog.highYieldAccuracy,
            strong: summ.strong,
            weak: summ.weak
        };
    }, [subject, subtopicsCumulative, systemStats.bySubtopic, weightIndex]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-upsc-blue"></div>
            </div>
        );
    }

    const renderSubtopicRow = (tag, index) => {
        const cleanTag = tag.replace(/^Ch \d+(-\d+)?: /, "");
        const tagTotal = systemStats.bySubtopic[cleanTag] || 0;
        const scoreData = subtopicsCumulative[cleanTag];
        const correct = Array.isArray(scoreData?.correctIds) ? scoreData.correctIds.length : (scoreData?.correct || 0);
        const percentage = tagTotal > 0 ? Math.round((correct / tagTotal) * 100) : 0;
        const { weight } = ProgressCalculation.getWeight(subject, tag, weightIndex);

        return (
            <div key={tag} className="flex flex-col sm:flex-row sm:items-center p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-300 transition-colors gap-4">
                <div className="sm:w-[45%] md:w-[40%] min-w-0 pl-2 flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-300 tabular-nums min-w-[1.5rem]">
                            {(index + 1).toString().padStart(2, '0')}.
                        </span>
                        <h4 className="font-semibold text-slate-700 text-sm truncate">{tag}</h4>
                        {weight === 3.0 && (
                            <span className="flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[9px] font-bold border border-orange-200 animate-pulse">
                                🔥 High Impact
                            </span>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-1 w-full sm:px-4 px-2 py-1 sm:mr-8 mr-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy</span>
                            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded text-center min-w-[40px] ${percentage >= 70 ? 'bg-green-100 text-green-700' :
                                percentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                    tagTotal > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {percentage}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-2 rounded-full transition-all duration-1000 ${percentage >= 70 ? 'bg-green-500' :
                                    percentage >= 40 ? 'bg-yellow-400' :
                                        scoreData ? 'bg-red-500' : 'bg-slate-300'
                                    }`}
                                style={{ width: `${scoreData ? percentage : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex-shrink-0 flex justify-end items-center sm:w-auto w-full">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const cleanTag = tag.replace(/^Ch \d+(-\d+)?: /, "");
                                navigate(`/exam?subject=${encodeURIComponent(subject)}&subtopic=${encodeURIComponent(cleanTag)}`);
                            }}
                            className="px-3 py-1.5 bg-upsc-blue-light/10 text-upsc-blue hover:bg-upsc-blue hover:text-white rounded-lg transition-all text-[10px] font-bold border border-upsc-blue/20 hover:border-upsc-blue shadow-sm whitespace-nowrap"
                        >
                            Start Test
                        </button>
                    </div>
                </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-12">

            {/* Header section with back navigation */}
            <div className="flex items-center gap-3 mb-2 min-w-0">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors shrink-0"
                >
                    <ChevronLeft className="w-6 h-6 text-slate-500" />
                </button>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 truncate">{subject} Analysis</h1>
            </div>

            {/* Consolidated Premium Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                    <div className="flex-1">
                        <MasteryProgressBar 
                            percentage={topicPercentage} 
                            label={`${subject} Mastery Score`}
                            subLabel={subject === 'Polity' ? "Weighted average based on importance weightage" : "Overall subject readiness percentage"}
                        />
                    </div>
                    
                    <div className="lg:w-72 flex flex-col justify-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <button
                            onClick={() => navigate(`/exam?subject=${encodeURIComponent(subject)}`)}
                            className="w-full bg-upsc-blue hover:bg-upsc-blue-dark text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            <Play className="w-5 h-5 fill-white" /> Start Sectional Test
                        </button>
                        <p className="text-[10px] text-slate-400 text-center font-medium italic">
                            Covers all topics in {subject}
                        </p>
                        
                        {isCapped && (
                            <div className="px-3 py-2 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] leading-tight text-amber-700 font-bold">
                                    SCORE CAPPED: High Yield topics (3x) need {subject === 'Polity' ? '>70%' : 'higher'} accuracy to cross 75%.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Methodology Tip - Consolidated */}
                <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <Info className="w-5 h-5 text-upsc-blue shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600 leading-relaxed font-medium">
                        <span className="font-bold text-upsc-blue">How it works:</span> Your progress is {subject === 'Polity' ? 'weighted by UPSC importance (🔥 High Yield topics affect your score 3x more).' : 'calculated based on overall performance.'} Mastering the Core pillars is essential for a high readiness score.
                    </div>
                </div>

                {/* Strength & Weakness Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strong Topics */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy className="w-16 h-16 text-green-600" />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Core Strengths
                        </h3>
                        {isAuthenticated && strong.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {strong.map(item => (
                                    <div key={item.tag} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold border border-green-100 flex items-center gap-2">
                                        {item.tag}
                                        <span className="bg-green-200/50 px-1.5 rounded text-[10px]">{Math.round(item.accuracy)}%</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-4 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                                <p className="text-xs text-slate-400 font-medium italic">
                                    {isAuthenticated 
                                        ? "Consistent practice will reveal your strengths here." 
                                        : "Login to track your core strengths and progress."}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Weak Topics */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle className="w-16 h-16 text-amber-600" />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Target className="w-4 h-4 text-amber-500" />
                            Focus Areas
                        </h3>
                        {isAuthenticated && weak.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {weak.map(item => {
                                    const isCritical = item.weight === 3.0;
                                    return (
                                        <div 
                                            key={item.tag} 
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all ${
                                                isCritical 
                                                ? 'bg-red-50 text-red-700 border-red-300 shadow-sm' 
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}
                                        >
                                            {isCritical && <span className="">🔥</span>}
                                            {item.tag}
                                            <span className={`px-1.5 rounded text-[10px] ${
                                                isCritical ? 'bg-red-100' : 'bg-amber-200/50'
                                            }`}>
                                                {Math.round(item.accuracy)}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-4 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                                <p className="text-xs text-slate-400 font-medium italic">
                                    {isAuthenticated 
                                        ? "Target your weak spots to boost your overall fitness." 
                                        : "Login to identify focus areas and improve your score."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Content Area - Conditional Dashboard */}
            {subject === 'Polity' ? (
                <div id="analysis-section" className="w-full">
                    <SubjectMasteryDashboard cumulativeStats={cumulativeStats} />
                </div>
            ) : (
                <div id="analysis-section" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-upsc-blue" />
                            <h2 className="text-lg font-bold text-slate-800">Topic-wise Analysis</h2>
                        </div>

                        {/* Sorting & View Mode Toggle & Search */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search Box */}
                            <div className="relative w-full sm:w-64 order-last sm:order-first">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search topics..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-upsc-blue focus:ring-2 focus:ring-upsc-blue/10 transition-all shadow-sm placeholder:text-slate-400"
                                />
                            </div>
                            
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg shadow-inner">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight ml-1 mr-1">Sort:</span>
                                <button
                                    onClick={() => setSortBy(sortBy === 'impact' ? 'default' : 'impact')}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${sortBy === 'impact'
                                        ? 'bg-white text-upsc-blue shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    🔥 Impact
                                </button>
                                <button
                                    onClick={() => {
                                        if (sortBy === 'accuracy-bidirectional') {
                                            if (sortDirection === 'desc') {
                                                setSortDirection('asc');
                                            } else {
                                                setSortBy('default');
                                                setSortDirection('desc');
                                            }
                                        } else {
                                            setSortBy('accuracy-bidirectional');
                                            setSortDirection('desc');
                                        }
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${sortBy === 'accuracy-bidirectional'
                                        ? 'bg-white text-upsc-blue shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Accuracy %
                                    {sortBy === 'accuracy-bidirectional' && (
                                        sortDirection === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg shadow-inner">
                                <button
                                    onClick={() => setViewMode('modules')}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-2 ${viewMode === 'modules'
                                        ? 'bg-white text-upsc-blue shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <Layers className="w-3.5 h-3.5" /> Grouped
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-2 ${viewMode === 'list'
                                        ? 'bg-white text-upsc-blue shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <BarChart2 className="w-3.5 h-3.5" /> List
                                </button>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'modules' ? (
                        <Accordion type="multiple" defaultValue={Object.keys(modules)} className="w-full">
                            {Object.entries(modules).map(([moduleName, tags]) => {
                                const { percentage: modulePercentage } = ProgressCalculation.calculateWeightedProgress(
                                    subject,
                                    subtopicsCumulative,
                                    Object.fromEntries(tags.map(t => [t, systemStats.bySubtopic[t]])),
                                    weightIndex
                                );

                                let moduleCorrect = 0;
                                let moduleTotal = 0;
                                tags.forEach(t => {
                                    const cleanTag = t.replace(/^Ch \d+(-\d+)?: /, "");
                                    const tagStats = subtopicsCumulative[cleanTag];
                                    moduleCorrect += Array.isArray(tagStats?.correctIds) ? tagStats.correctIds.length : (tagStats?.correct || 0);
                                    moduleTotal += systemStats.bySubtopic[cleanTag] || 0;
                                });

                                return (
                                    <AccordionItem key={moduleName} value={moduleName} className="border-b-0">
                                        <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 flex justify-between group">
                                            <div className="flex items-center gap-3 w-full pr-4 text-left">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 text-base">{moduleName}</span>
                                                    </div>

                                                    <div className="flex items-center gap-3 sm:w-1/3 justify-end mt-1 sm:mt-0">
                                                        <div className="w-full max-w-[100px] bg-slate-200 rounded-full h-1.5 hidden sm:block">
                                                            <div
                                                                className={`h-1.5 rounded-full ${modulePercentage >= 70 ? 'bg-green-500' :
                                                                    modulePercentage >= 40 ? 'bg-yellow-400' : 'bg-red-500'
                                                                    }`}
                                                                style={{ width: `${modulePercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${modulePercentage >= 70 ? 'bg-green-100 text-green-700' :
                                                            modulePercentage >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                                moduleTotal > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                            {modulePercentage}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>

                                        <AccordionContent className="bg-slate-50/30 px-6 py-4 border-b border-slate-100">
                                            <div className="flex flex-col gap-3">
                                                {tags
                                                    .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .sort((a, b) => {
                                                        if (sortBy === 'impact') {
                                                            const weightA = ProgressCalculation.getWeight(subject, a, weightIndex).weight;
                                                            const weightB = ProgressCalculation.getWeight(subject, b, weightIndex).weight;
                                                            return weightB - weightA;
                                                        }
                                                        if (sortBy === 'accuracy-bidirectional') {
                                                            const getAcc = (tag) => {
                                                                const cleanTag = tag.replace(/^Ch \d+(-\d+)?: /, "");
                                                                const tagTotal = systemStats.bySubtopic[cleanTag] || 0;
                                                                const scoreData = subtopicsCumulative[cleanTag];
                                                                const correct = Array.isArray(scoreData?.correctIds) ? scoreData.correctIds.length : (scoreData?.correct || 0);
                                                                return tagTotal > 0 ? (correct / tagTotal) : 0;
                                                            };
                                                            const accA = getAcc(a);
                                                            const accB = getAcc(b);
                                                            return sortDirection === 'desc' ? accB - accA : accA - accB;
                                                        }
                                                        return 0;
                                                    })
                                                    .map((tag, idx) => renderSubtopicRow(tag, idx))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    ) : (
                        <div className="p-4 flex flex-col gap-3">
                            {sortedAndFilteredTags.map((tag, idx) => renderSubtopicRow(tag, idx))}
                        </div>
                    )}
                </div>
            )}


        </div>
    );
}

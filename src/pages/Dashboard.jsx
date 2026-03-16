import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, AlertTriangle, BarChart2, ArrowRight, Activity, Lock, Play, ChevronDown, Info } from 'lucide-react';
import { ProgressCalculation } from '../utils/ProgressCalculation';
import { useAuth } from '../context/AuthContext';
import MasteryProgressBar from '../components/dashboard/MasteryProgressBar';

export default function Dashboard() {
    const [session, setSession] = useState(null);
    const [cumulativeStats, setCumulativeStats] = useState(null);
    const [systemStats, setSystemStats] = useState({ total: 0, bySubject: {} });
    const [selectedSubject, setSelectedSubject] = useState('');
    const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
    const [showComingSoonModal, setShowComingSoonModal] = useState(false);
    const [pendingSubject, setPendingSubject] = useState('');
    const [loading, setLoading] = useState(true);
    const [subjectsData, setSubjectsData] = useState([]);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const subjects = ['Polity', 'Economy', 'History', 'Geography', 'Environment', 'Science', 'Current Affairs'];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSubjectDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        // Wait for auth to finish loading before deciding what to do
        if (authLoading) return;

        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Use Promise.all to ensure setLoading(false) ALWAYS fires
        Promise.all([
            // 1. Fetch Latest Session
            fetch('/api/sessions?limit=1', { headers })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.sessions && data.sessions.length > 0) {
                        setSession(data.sessions[0]);
                    }
                })
                .catch(err => console.error("Could not fetch latest session", err)),

            // 2. Fetch Cumulative Stats
            fetch('/api/stats', { headers })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setCumulativeStats(data.cumulativeStats);
                    }
                })
                .catch(err => console.error("Could not fetch stats", err)),

            // 3. Fetch question universe metadata
            fetch('/api/questions?summary=true')
                .then(res => res.json())
                .then(metadata => {
                    if (!Array.isArray(metadata)) return; // Guard against bad response
                    const stats = { total: metadata.length, bySubject: {}, bySubtopicBySubject: {} };
                    metadata.forEach(q => {
                        const subj = q.subject || q.topic; // Support legacy
                        stats.bySubject[subj] = (stats.bySubject[subj] || 0) + 1;
                        if (!stats.bySubtopicBySubject[subj]) stats.bySubtopicBySubject[subj] = {};
                        const tag = q.subtopic || q.microTag || 'General';
                        stats.bySubtopicBySubject[subj][tag] = (stats.bySubtopicBySubject[subj][tag] || 0) + 1;
                    });
                    setSystemStats(stats);
                })
                .catch(err => console.error("Could not fetch system metadata", err)),
            
            // 4. Fetch subject structure
            fetch('/api/subjects')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setSubjectsData(data.data);
                    }
                })
                .catch(err => console.error("Could not fetch subjects structure", err)),
        ]).finally(() => setLoading(false));

    }, [isAuthenticated, authLoading]);


    // PERFORMANCE OPTIMIZATION: Memoize the overall Prelims Fitness calculation
    const overallFitness = useMemo(() => {
        if (!isAuthenticated || !cumulativeStats || !systemStats.total || !subjectsData.length) return null;

        const weightIndex = ProgressCalculation.buildWeightIndex(subjectsData);
        let weightedPoints = 0;
        let totalWeightedPoints = 0;
        let highYieldTotal = 0;
        let highYieldCorrect = 0;

        subjects.forEach(subj => {
            const subjectStats = cumulativeStats?.[subj] || {};
            const subtopicsCumulative = subjectStats.subtopics || {};
            const systemSubtopics = systemStats.bySubtopicBySubject?.[subj] || {};

            Object.entries(systemSubtopics).forEach(([tag, count]) => {
                const { weight } = ProgressCalculation.getWeight(subj, tag, weightIndex);
                const tagStats = subtopicsCumulative[tag] || {};
                const correct = Array.isArray(tagStats.correctIds) ? tagStats.correctIds.length : (tagStats.correct || 0);

                weightedPoints += correct * weight;
                totalWeightedPoints += count * weight;

                if (subj === 'Polity' && weight === 3.0) {
                    highYieldTotal += count;
                    highYieldCorrect += correct;
                }
            });
        });

        const rawPercentage = totalWeightedPoints > 0 ? Math.round((weightedPoints / totalWeightedPoints) * 100) : 0;
        const hyAccuracy = highYieldTotal > 0 ? Math.round((highYieldCorrect / highYieldTotal) * 100) : 0;

        let percentage = rawPercentage;
        let isCapped = false;
        if (rawPercentage > 75 && hyAccuracy < 70) {
            percentage = 75;
            isCapped = true;
        }

        return { percentage, isCapped, hyAccuracy };
    }, [isAuthenticated, cumulativeStats, systemStats, subjectsData]);

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800">
                    {isAuthenticated ? `Welcome back, ${(user.username || user.name || 'Aspirant').split(' ')[0]}!` : 'Dashboard'}
                </h1>
                <p className="text-slate-500 mt-1">
                    {isAuthenticated ? 'Track your analytics and continue your journey.' : 'Login to track your performance analytics.'}
                </p>
            </div>

            {/* Premium Prelims Fitness Bar - Relocated to Top */}
            {isAuthenticated && cumulativeStats && overallFitness && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex flex-col lg:flex-row gap-6 items-stretch">
                        <div className="flex-1">
                            <MasteryProgressBar 
                                percentage={overallFitness.percentage} 
                                label="Overall Prelims Fitness"
                                subLabel="Weighted readiness across all practice subjects"
                            />
                        </div>
                        
                        <div className="lg:w-64 flex flex-col justify-center gap-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Focus Status</h4>
                            {overallFitness.isCapped ? (
                                <div className="px-3 py-2 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[10px] leading-tight text-amber-700 font-bold">
                                        SCORE CAPPED: High Yield topics (3x) need &gt;70% accuracy to cross 75%.
                                    </p>
                                </div>
                            ) : (
                                <div className="px-3 py-2 bg-green-50 rounded-xl border border-green-100 flex items-center justify-center gap-2">
                                    <Activity className="w-4 h-4 text-green-600" />
                                    <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Optimal Performance</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Methodology Tip */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <Info className="w-5 h-5 text-upsc-blue shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-600 leading-relaxed font-medium">
                            <span className="font-bold text-upsc-blue">Unified Metrics:</span> Your fitness is calculated by weighting subjects by their UPSC frequency. High Yield pillars like <span className="text-upsc-blue font-bold italic">Polity</span> affect your score significantly more.
                        </div>
                    </div>
                </div>
            )}

            {/* 1. START TEST OPTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                    className="p-4 sm:p-5 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 shadow-sm cursor-not-allowed flex flex-col justify-center relative group opacity-60"
                >
                    <div className="flex justify-between items-center pr-2">
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <Lock className="w-5 h-5 text-slate-400" />
                                <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs">Full Mock Test</span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-slate-400 leading-tight">UPSC Prelims GS 1</h3>
                        </div>
                    </div>
                </div>

                <div className={`p-4 sm:p-5 rounded-2xl bg-white border-2 border-upsc-blue shadow-lg flex flex-col justify-center relative group transition-all ${!showSubjectDropdown ? 'hover:-translate-y-1' : ''}`}>
                    <div className="flex justify-between items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-upsc-blue" />
                                <span className="font-bold text-upsc-blue uppercase tracking-widest text-[10px] sm:text-xs truncate">Subject Focus Test</span>
                            </div>
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                                    className="flex items-center gap-2 text-lg sm:text-xl font-black text-slate-800 hover:text-upsc-blue transition-colors text-left"
                                >
                                    {selectedSubject || 'Choose Subject'}
                                    <ChevronDown className={`w-5 h-5 transition-transform ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showSubjectDropdown && (
                                    <div 
                                        className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-100 shadow-2xl rounded-2xl py-2 z-20 animate-in fade-in zoom-in-95 duration-200"
                                    >
                                        {subjects.map((sub) => {
                                            const isLocked = sub !== 'Polity';
                                            return (
                                                <button
                                                    key={sub}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (sub !== 'Polity') {
                                                            setPendingSubject(sub);
                                                            setShowComingSoonModal(true);
                                                            setShowSubjectDropdown(false);
                                                        } else {
                                                            setSelectedSubject(sub);
                                                            setShowSubjectDropdown(false);
                                                        }
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition-all ${sub !== 'Polity' ? 'text-slate-400 hover:bg-slate-50' : 'text-slate-700 hover:bg-blue-50 hover:text-upsc-blue'}`}
                                                >
                                                    {sub}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => selectedSubject && navigate(`/exam?subject=${encodeURIComponent(selectedSubject)}`)}
                            disabled={!selectedSubject}
                            className={`flex items-center justify-center p-3 rounded-xl transition-all shrink-0 ${
                                selectedSubject 
                                    ? 'bg-upsc-blue text-white shadow-md hover:scale-105 active:scale-95' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                            aria-label="Start Test"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. SUBJECT-WISE QUICK START (Available to all) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 w-full relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <BarChart2 className="text-upsc-blue w-6 h-6" /> 
                            {isAuthenticated ? 'Subject-Wise Analytics' : 'Choose a Subject to Begin'}
                        </h2>
                        {!isAuthenticated && <p className="text-slate-500 text-sm font-medium mt-1">Select a subject to start a focused practice session.</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subjects.map(subj => {
                        const isLocked = subj !== 'Polity'; // Demo content limitation
                        const activeStatsSource = cumulativeStats || session?.topicAccuracy;
                        const subjectStats = activeStatsSource?.[subj];
                        const subtopicsStats = subjectStats?.subtopics || (subj === session?.subject ? session?.subtopics : {});
                        const systemSubtopicStats = systemStats.bySubtopicBySubject?.[subj] || {};

                        const weightIndex = ProgressCalculation.buildWeightIndex(subjectsData);
                        const { percentage, isCapped } = ProgressCalculation.calculateWeightedProgress(
                            subj,
                            subtopicsStats,
                            systemSubtopicStats,
                            weightIndex
                        );

                        return (
                            <div
                                key={subj}
                                onClick={() => !isLocked && navigate(`/subject/${encodeURIComponent(subj)}`)}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all group relative overflow-hidden h-24 shadow-sm ${isLocked ? 'grayscale opacity-60 cursor-not-allowed border-slate-200 bg-white' : 'cursor-pointer border-upsc-blue/40 bg-blue-50/20 hover:border-upsc-blue hover:shadow-md hover:-translate-y-0.5'}`}
                            >
                                {isLocked && (
                                    <div className="absolute top-2 right-2 z-20">
                                        <span className="bg-slate-800 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Coming Soon</span>
                                    </div>
                                )}
                                {!isLocked && (
                                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                        
                                    </div>
                                )}
                                <div className="w-1/3 sm:w-1/4 flex flex-col justify-center z-10 transition-transform group-hover:translate-x-1">
                                    <span className={`font-bold transition-colors text-base sm:text-lg leading-tight ${isLocked ? 'text-slate-400' : 'text-slate-800 group-hover:text-upsc-blue'}`}>
                                        {subj}
                                    </span>
                                    <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1 group-hover:opacity-0 transition-opacity whitespace-nowrap">
                                        {isLocked ? '' : subjectStats ? 'Tap for Details' : 'View Insights'}
                                    </div>
                                </div>

                                <div className="flex-1 px-4 sm:px-6 z-10 group-hover:opacity-10 sm:group-hover:opacity-100 transition-opacity">
                                    {isAuthenticated ? (
                                        <>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fitness</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-1000 ${percentage >= 70 ? (isCapped ? 'bg-amber-400' : 'bg-green-500') :
                                                        percentage >= 40 ? 'bg-yellow-400' :
                                                            subjectStats ? 'bg-red-500' : 'bg-slate-300'
                                                        }`}
                                                    style={{ width: `${subjectStats ? percentage : 0}%` }}
                                                ></div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center p-2 rounded-lg bg-blue-500/10 border border-blue-100 text-[10px] text-upsc-blue font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            Start Session to Explore
                                        </div>
                                    )}
                                </div>

                                <div className="w-20 sm:w-24 text-right z-10 relative h-full flex items-center justify-end">
                                    <div className="absolute right-0 transition-all duration-300 transform group-hover:translate-x-10 group-hover:opacity-0">
                                        {isAuthenticated && subjectStats ? (
                                            <span className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md ${percentage >= 70 ? 'bg-green-100 text-green-700' :
                                                percentage >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {percentage}%
                                            </span>
                                        ) : !isLocked ? (
                                            <Play className="w-5 h-5 text-upsc-blue-light opacity-30" />
                                        ) : null}
                                    </div>

                                    {!isLocked && (
                                        <div className="absolute right-0 transition-all duration-300 transform translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 flex items-center gap-1.5 text-upsc-blue font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
                                            View Insights <ArrowRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. PERFORMANCE SUMMARY GATED SECTION */}
            {!isAuthenticated ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                        <Lock className="w-8 h-8 text-slate-300" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Advanced Stats are Locked</h2>
                    <p className="text-slate-500 mt-2 mb-6 text-center max-w-sm">Register to unlock weighted readiness tracking, your personalized Prelims Fitness score, and full test history.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-upsc-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-upsc-blue-dark transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                        Login & View Analytics <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <>
                </>
            )}
            {/* Coming Soon Modal */}
            {showComingSoonModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="bg-upsc-blue p-8 text-center text-white relative">
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setShowComingSoonModal(false)} className="text-white/50 hover:text-white"><Activity className="w-5 h-5 rotate-45" /></button>
                            </div>
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">{pendingSubject}</h3>
                            <p className="text-blue-100 font-bold text-sm uppercase tracking-widest mt-1">Updating Soon</p>
                        </div>
                        
                        <div className="p-8 text-center">
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                Our educators are currently verifying the latest question bank for <span className="text-slate-800 font-bold">{pendingSubject}</span>. We'll notify you as soon as it's live!
                            </p>
                            
                            <button
                                onClick={() => setShowComingSoonModal(false)}
                                className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                            >
                                Got it, Check Polity instead
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

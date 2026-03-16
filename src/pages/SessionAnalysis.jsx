import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, ArrowRight, AlertTriangle, UserPlus, Lock, Smartphone, Loader2, Eye, EyeOff, X, Clock, Target, Trophy, HelpCircle, Filter, Zap, TrendingDown, Play, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QuestionText from '../components/QuestionText';

export default function SessionAnalysis() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, login } = useAuth();
    
    // Filters & View State
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'incorrect', 'guess'
    
    // Gated Content States
    const [isLogin, setIsLogin] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showOverlay, setShowOverlay] = useState(true);

    const isGated = !isAuthenticated && sessionId?.startsWith('temp_');

    useEffect(() => {
        const loadSession = async () => {
            // Priority 1: Instant load from React Router state (handoff from Exam.jsx)
            if (state?.session) {
                setSession(state.session);
                setLoading(false);
                return;
            }

            // Priority 2: Guest fallback from sessionStorage/LocalStorage (if refresh happened)
            if (sessionId?.startsWith('temp_')) {
                try {
                    const latest = JSON.parse(sessionStorage.getItem('latestGuestSession') || localStorage.getItem('latestSession') || 'null');
                    if (latest && latest._id === sessionId) {
                        setSession(latest);
                        setLoading(false);
                        return;
                    } 
                    
                    const localSessions = JSON.parse(localStorage.getItem('localSessions') || '[]');
                    const found = localSessions.find(s => s._id === sessionId);
                    if (found) {
                        setSession(found);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Local/Session storage parse error", e);
                }
                setLoading(false);
                return;
            }

            // Priority 3: Authenticated load from MongoDB
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`/api/sessions?id=${sessionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.session) {
                    setSession(data.session);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("API fetch failed", err);
            }
            setLoading(false);
        };

        loadSession();
    }, [sessionId, state]);

    const filteredAnswers = useMemo(() => {
        if (!session?.answers) return [];
        if (activeFilter === 'incorrect') return session.answers.filter(a => !a.isCorrect && a.userAnswer !== null);
        if (activeFilter === 'guess') return session.answers.filter(a => a.roundMarked > 1);
        return session.answers;
    }, [session, activeFilter]);

    // Analytics Calculation
    const analytics = useMemo(() => {
        if (!session?.answers) return null;
        
        const sureQuestions = session.answers.filter(a => a.roundMarked === 1);
        const guessQuestions = session.answers.filter(a => a.roundMarked > 1);
        
        const sureCorrect = sureQuestions.filter(a => a.isCorrect).length;
        const guessCorrect = guessQuestions.filter(a => a.isCorrect).length;
        const guessIncorrect = guessQuestions.filter(a => !a.isCorrect && a.userAnswer !== null).length;
        
        // Guess ROI calculation (Simplified UPSC logic: +2 - 0.66)
        const guessROI = (guessCorrect * 2) - (guessIncorrect * 0.66);
        
        // Subtopic-wise S/W
        const subtopics = {};
        session.answers.forEach(a => {
            if (!a.subtopic) return;
            if (!subtopics[a.subtopic]) subtopics[a.subtopic] = { correct: 0, total: 0 };
            subtopics[a.subtopic].total++;
            if (a.isCorrect) subtopics[a.subtopic].correct++;
        });
        
        const strength = Object.entries(subtopics)
            .filter(([_, stats]) => (stats.correct / stats.total) >= 0.7)
            .map(([subtopic, stats]) => ({ tag: subtopic, accuracy: (stats.correct / stats.total) * 100 }));
            
        const weakness = Object.entries(subtopics)
            .filter(([_, stats]) => (stats.correct / stats.total) < 0.7)
            .map(([subtopic, stats]) => ({ tag: subtopic, accuracy: (stats.correct / stats.total) * 100 }));

        return {
            strategicAccuracy: sureQuestions.length > 0 ? (sureCorrect / sureQuestions.length) * 100 : 0,
            guessROI,
            strength,
            weakness,
            timeTaken: session.timeTaken || 0,
            scoreFitness: (session.totalQuestions > 0) ? (session.score / (session.totalQuestions * 2)) * 100 : 0
        };
    }, [session]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs}s`;
        return `${mins}m ${secs}s`;
    };

    const handleOverlayAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        setAuthLoading(true);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: isLogin ? 'login' : 'signup',
                    username,
                    password,
                })
            });

            const data = await res.json();
            if (data.success) {
                const userObj = { ...data.user, name: data.user.name || data.user.username || 'Aspirant' };
                login(userObj, data.token);
            } else {
                setAuthError(data.error || 'Authentication failed');
            }
        } catch (err) {
            setAuthError('Connection failed. Please try again.');
        } finally {
            setAuthLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-upsc-blue" /></div>;

    if (!session || !session.answers) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
                <AlertTriangle className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-2xl font-black text-slate-800">Session not found</h2>
                <p className="text-slate-500 mt-2 mb-6 max-w-sm">We couldn't retrieve the data for this test session. It might have been cleared or doesn't exist.</p>
                <button onClick={() => navigate('/dashboard')} className="bg-upsc-blue text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-upsc-blue-dark transition-all active:scale-95">Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="relative pb-20">
            <div className={`max-w-6xl mx-auto flex flex-col gap-8 transition-all duration-700 ${isGated ? 'blur-xl opacity-40 pointer-events-none select-none overflow-hidden max-h-[80vh]' : ''}`}>
                
                {/* Minimalist Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/history')} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Post-Test Analysis</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-upsc-blue-dark/60 bg-upsc-blue/10 px-2 py-0.5 rounded border border-upsc-blue/20">{session.subject || session.topic}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="hidden sm:flex items-center gap-2 text-xs font-black text-slate-400 hover:text-upsc-blue transition-all uppercase tracking-widest">End Review <X className="w-4 h-4" /></button>
                </div>

                {/* Performance Rings - Row of 4 */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                    {[
                        { label: 'Score Fitness', value: Math.round(analytics?.scoreFitness || 0), icon: <Award className="w-4 h-4" />, color: 'blue', desc: 'Net score mastery' },
                        { label: 'Base Accuracy', value: Math.round(analytics?.strategicAccuracy || 0), icon: <Target className="w-4 h-4" />, color: 'emerald', desc: 'Accuracy on "Sure" qns' },
                        { label: 'Guessing ROI', value: analytics?.guessROI > 0 ? `+${analytics.guessROI.toFixed(1)}` : analytics?.guessROI.toFixed(1), icon: <HelpCircle className="w-4 h-4" />, color: analytics?.guessROI >= 0 ? 'amber' : 'red', desc: 'Net marks from guesses', isValueOnly: true },
                        { label: 'Time Efficiency', value: formatTime(analytics?.timeTaken || 0), icon: <Clock className="w-4 h-4" />, color: 'slate', desc: 'Total time invested', isValueOnly: true }
                    ].map((ring, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-upsc-blue/20 transition-all">
                            <div className={`p-2 bg-${ring.color}-50 text-${ring.color}-600 rounded-xl mb-4 group-hover:scale-110 transition-transform`}>{ring.icon}</div>
                            <div className="relative mb-3 flex items-center justify-center h-20 w-20">
                                <svg className="h-20 w-20 transform -rotate-90">
                                    <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                    {!ring.isValueOnly && (
                                        <circle 
                                            cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                            strokeDasharray={213.6}
                                            strokeDashoffset={213.6 - (213.6 * ring.value) / 100}
                                            strokeLinecap="round"
                                            className={`transition-all duration-1000 delay-300 text-${ring.color === 'emerald' ? 'green-500' : ring.color === 'blue' ? 'upsc-blue' : ring.color + '-500'}`} 
                                        />
                                    )}
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-lg font-black text-slate-800 leading-none">{ring.isValueOnly ? ring.value : `${ring.value}%`}</span>
                                </div>
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{ring.label}</h3>
                            <p className="text-[9px] text-slate-400 font-bold leading-tight">{ring.desc}</p>
                        </div>
                    ))}
                </div>



                {/* Detailed Review Section */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-upsc-blue/10 text-upsc-blue rounded-xl"><Filter className="w-5 h-5" /></div>
                            <h2 className="text-xl font-black text-slate-800">Review Questions</h2>
                        </div>
                        <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 rounded-2xl shadow-inner w-full sm:w-auto">
                            {[
                                { id: 'all', label: 'All', count: session.answers.length },
                                { id: 'incorrect', label: 'Mistakes', count: session.incorrect, color: 'text-red-600' },
                                { id: 'guess', label: 'Guesses', count: session.answers.filter(a => a.roundMarked > 1).length, color: 'text-amber-600' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === filter.id ? 'bg-white shadow-md text-upsc-blue scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {filter.label} <span className={`ml-1 opacity-60 ${filter.color || ''}`}>{filter.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 flex flex-col gap-6">
                        {filteredAnswers.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center">
                                <CheckCircle className="w-12 h-12 text-slate-200 mb-3" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No matches found for this filter</p>
                            </div>
                        ) : filteredAnswers.map((answer, index) => (
                            <div key={index} className={`p-6 rounded-[2rem] border transition-all ${answer.userAnswer === null ? 'border-slate-100 bg-slate-50' : answer.isCorrect ? 'border-green-100 bg-green-50/20' : 'border-red-100 bg-red-50/30'}`}>
                                <div className="flex gap-4 mb-6">
                                    <span className="text-2xl font-black text-slate-400 tabular-nums">{(index + 1).toString().padStart(2, '0')}</span>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            {answer.roundMarked > 1 && <span className="text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1"><HelpCircle className="w-2.5 h-2.5" /> High Risk Choice</span>}
                                            <span className="text-[8px] font-black uppercase tracking-widest bg-slate-200/50 text-slate-500 px-1.5 py-0.5 rounded-full">{answer.subtopic || answer.microTag || 'General Concept'}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                        <QuestionText text={answer.text} />
                                    </p>
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4 mb-6 px-1">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100/60 shadow-sm relative group overflow-hidden">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            {answer.isCorrect ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />} Your Response
                                        </p>
                                        <p className={`text-sm font-black ${answer.userAnswer === null ? 'italic text-slate-400' : answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{answer.userAnswer || 'Skipped Question'}</p>
                                    </div>
                                    {(answer.userAnswer === null || !answer.isCorrect) && (
                                        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-sm">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Correct Key</p>
                                            <p className="text-sm font-black text-emerald-700">{answer.correctAnswer}</p>
                                        </div>
                                    )}
                                </div>

                                {answer.explanation && (
                                    <div className="p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-100/50">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> Explanation</h4>
                                        <p className="text-xs text-slate-600 leading-relaxed font-bold italic">{answer.explanation}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gated Overlay Implementation - GLASS TEASER */}
            {isGated && showOverlay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white/80 backdrop-blur-xl w-full max-w-sm rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/40 overflow-hidden relative p-10 mt-12 mb-4">
                        <button onClick={() => setShowOverlay(false)} className="absolute top-6 right-6 p-1.5 rounded-full hover:bg-slate-100 text-slate-300 transition-all"><X className="w-5 h-5" /></button>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-upsc-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8 text-upsc-blue" /></div>
                            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-2">Analysis Locked</h2>
                            <p className="text-slate-500 text-xs font-bold leading-relaxed px-4">Join the community to unlock detailed performance data and review your mistakes.</p>
                        </div>

                        {authError && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black border border-red-100 flex items-center gap-2"><AlertTriangle className="w-3 h-3 shrink-0" /> {authError}</div>}

                        <form onSubmit={handleOverlayAuth} className="space-y-4">
                            <div className="relative">
                                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-upsc-blue outline-none transition-all font-black text-slate-800 placeholder:text-slate-500 text-xs" placeholder="Username" autoComplete="username" />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-upsc-blue outline-none transition-all font-black text-slate-800 placeholder:text-slate-500 text-xs" placeholder="Password" autoComplete={isLogin ? 'current-password' : 'new-password'} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                            </div>
                            <button type="submit" disabled={authLoading} className="w-full bg-upsc-blue text-white py-4 rounded-2xl font-black shadow-lg hover:shadow-xl hover:bg-upsc-blue-dark transition-all active:scale-95 disabled:opacity-50 text-xs tracking-widest uppercase flex items-center justify-center gap-2">
                                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isLogin ? 'Login & View Analytics' : 'Sign Up & View Analytics'} <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {isLogin ? "New user?" : "Already joined?"} <button onClick={() => setIsLogin(!isLogin)} className="text-upsc-blue hover:underline">{isLogin ? 'Create Profile' : 'Sign In'}</button>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

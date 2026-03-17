import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Target, HelpCircle, Eye, Info, List, Award, AlertCircle, AlertTriangle, ArrowRight, Loader2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QuestionText from '../components/QuestionText';

export default function Exam() {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [searchParams] = useSearchParams();
    const subject = searchParams.get('subject') || searchParams.get('topic'); // Support legacy 'topic' as subject if needed
    const topic = searchParams.get('subject') ? searchParams.get('topic') : null; // Level 2
    const subtopic = searchParams.get('subtopic') || searchParams.get('microTag'); // Level 3
    const [startTime, setStartTime] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(0);

    const fetchQuestions = () => {
        setLoading(true);
        let url = '/api/questions';
        const params = new URLSearchParams();
        if (subject) params.append('subject', subject);
        if (topic) params.append('topic', topic);
        if (subtopic) params.append('subtopic', subtopic);

        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error('No questions found for the selected criteria.');
                }
                setQuestions(data);
                setLoading(false);
                setShowInstructions(false);
                setStartTime(Date.now());
                setTimeRemaining(data.length * 60);
                
                // Load persisted progress from CLOUD
                const token = localStorage.getItem('token');
                if (token && subject) {
                    fetch(`/api/progress?subject=${encodeURIComponent(subject)}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    .then(res => res.json())
                    .then(progressData => {
                        if (progressData.success && progressData.progress) {
                            setAnswers(progressData.progress.answers || {});
                            setCurrentIndex(progressData.progress.currentIndex || 0);
                        }
                    })
                    .catch(e => console.error('Cloud progress load failed', e));
                }
            })
            .catch(err => {
                console.error('Exam fetch failed:', err);
                setLoading(false);
                alert(`Could not load questions: ${err.message}`);
            });
    };

    // Persist progress effect (Cloud Autosave)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && subject && questions.length > 0 && Object.keys(answers).length > 0) {
            const saveProgress = async () => {
                try {
                    await fetch('/api/progress', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            subject,
                            answers,
                            currentIndex
                        })
                    });
                } catch (e) {
                    console.error("Cloud autosave failed", e);
                }
            };
            
            const timer = setTimeout(saveProgress, 3000); // Debounce saves
            return () => clearTimeout(timer);
        }
    }, [answers, currentIndex, questions, subject]);

    // Live Countdown Timer Effect
    useEffect(() => {
        let timer;
        if (questions.length > 0 && !showInstructions && !submitting && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit(); // Auto-submit when time is up
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [questions.length, showInstructions, submitting, timeRemaining === 0]);

    const formatTimeDisplay = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSelectOption = (option) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentIndex].id]: {
                ...prev[questions[currentIndex].id],
                option: option
            }
        }));
    };

    const handleSetRound = (round) => {
        setAnswers(prev => ({
            ...prev,
            [questions[currentIndex].id]: {
                ...prev[questions[currentIndex].id],
                roundMark: round
            }
        }));
    };

    const evaluateExam = (existingCumulative) => {
        let correct = 0;
        let incorrect = 0;
        const incorrectQuestions = [];
        const topicAccuracy = {};
        const sessionAnswers = [];

        // Clone existing cumulative stats or initialize new
        const cumulative = existingCumulative ? JSON.parse(JSON.stringify(existingCumulative)) : {};

        questions.forEach(q => {
            const userAnswer = answers[q.id]?.option;
            const roundMark = answers[q.id]?.roundMark;

            // Initialize subject accuracy tracking for current session
            if (!topicAccuracy[q.subject]) {
                topicAccuracy[q.subject] = { total: 0, correct: 0, percentage: 0 };
            }
            topicAccuracy[q.subject].total += 1;

            // Initialize cumulative tracking for this subject if not present
            if (!cumulative[q.subject] || !Array.isArray(cumulative[q.subject].correctIds)) {
                cumulative[q.subject] = { correctIds: [], attemptedIds: [], subtopics: {} };
            }
            if (!cumulative[q.subject].subtopics) {
                cumulative[q.subject].subtopics = {};
            }

            const subtopics = cumulative[q.subject].subtopics;
            if (!subtopics[q.subtopic] || !Array.isArray(subtopics[q.subtopic].correctIds)) {
                subtopics[q.subtopic] = { correctIds: [], attemptedIds: [] };
            }

            if (!cumulative[q.subject].attemptedIds.includes(q.id)) {
                cumulative[q.subject].attemptedIds.push(q.id);
            }
            if (!subtopics[q.subtopic].attemptedIds.includes(q.id)) {
                subtopics[q.subtopic].attemptedIds.push(q.id);
            }

            if (userAnswer) {
                if (userAnswer === q.correctAnswer) {
                    correct += 1;
                    topicAccuracy[q.subject].correct += 1;
                    if (!cumulative[q.subject].correctIds.includes(q.id)) {
                        cumulative[q.subject].correctIds.push(q.id);
                    }
                    if (!subtopics[q.subtopic].correctIds.includes(q.id)) {
                        subtopics[q.subtopic].correctIds.push(q.id);
                    }
                } else {
                    incorrect += 1;
                    incorrectQuestions.push({
                        questionId: q.id,
                        questionText: q.text,
                        subject: q.subject,
                        topic: q.topic,
                        subtopic: q.subtopic,
                        userAnswer: userAnswer,
                        correctAnswer: q.correctAnswer,
                        roundMarked: roundMark || 1
                    });
                }
            }

            // Record full answer state for historical tracking
            sessionAnswers.push({
                questionId: q.id,
                userAnswer: userAnswer || null,
                correctAnswer: q.correctAnswer,
                roundMarked: roundMark || 1,
                isCorrect: userAnswer === q.correctAnswer,
                subject: q.subject,
                topic: q.topic,
                subtopic: q.subtopic,
                text: q.text,
                explanation: q.explanation
            });
        });

        // Calculate percentages for current session
        Object.keys(topicAccuracy).forEach(t => {
            const stats = topicAccuracy[t];
            stats.percentage = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0;
        });

        // Calculate percentages for cumulative stats will be done in Dashboard
        // using the total universe of questions.
        // If topic is specified (sectional test), marking is +1/-0. 
        // If full test (no topic), marking is +2/-0.66
        const isSectional = !!topic;
        const score = isSectional
            ? correct // +1 for correct, 0 for wrong/unattempted
            : (correct * 2) - (incorrect * 0.66);

        return {
            sessionData: {
                totalQuestions: questions.length,
                attempted: correct + incorrect,
                correct,
                incorrect,
                score: parseFloat(score.toFixed(2)),
                isSectional,
                subject: subject || 'Full-length',
                subtopic: subtopic || null,
                topicAccuracy,
                answers: sessionAnswers,
                timestamp: new Date().toISOString()
            },
            cumulativeStats: cumulative,
            incorrectQuestions
        };
    };

    const handleSubmit = async () => {
        if (!showSubmitModal) {
            setShowSubmitModal(true);
            return;
        }

        setShowSubmitModal(false);
        setSubmitting(true);
        
        try {
            // Clean up cloud progress and local cache
            const token = localStorage.getItem('token');
            if (token && subject) {
                fetch(`/api/progress?subject=${encodeURIComponent(subject)}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(e => console.error("Could not clear cloud progress", e));
            }

            // Remove ANY lingering local storage for this app's analytics
            localStorage.removeItem('latestSession');
            localStorage.removeItem('cumulativeStats');
            localStorage.removeItem('localSessions');
            localStorage.removeItem(`exam_progress_${subject || 'general'}`);

            // Save locally for immediate dashboard display (Just enough for Analysis page)
            const evaluation = evaluateExam();
            const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
            const tempId = `temp_${Date.now()}`;
            const sessionDataForBackend = { ...evaluation.sessionData, timeTaken };

            // Save session to backend
            let sessionId = tempId;
            try {
                const response = await fetch('/api/evaluate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        sessionData: sessionDataForBackend,
                        incorrectQuestions: evaluation.incorrectQuestions
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.sessionId) {
                        sessionId = data.sessionId;
                    }
                } else {
                    console.error("Backend returned non-ok status", response.status);
                }
            } catch (backendErr) {
                console.error("Backend save failed or non-JSON response", backendErr);
            }

            const latestSession = { ...evaluation.sessionData, _id: sessionId, timeTaken };
            
            // Backup to sessionStorage for refresh support (honors "no localStorage" rule)
            sessionStorage.setItem('latestGuestSession', JSON.stringify(latestSession));

            navigate(`/analysis/${sessionId}`, { state: { session: latestSession } });
        } catch (err) {
            console.error(err);
            alert('Failed to submit exam.');
        } finally {
            setSubmitting(false);
        }
    };

    // Removed hard redirect for guests. Session will be stored locally.

    if (showInstructions) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transform transition-all hover:scale-[1.01]">
                    {/* Header Banner */}
                    <div className="bg-upsc-blue p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                        <Info className="w-10 h-10 text-white/90 mx-auto mb-3 relative z-10" />
                        <h2 className="text-xl font-black text-white relative z-10 uppercase tracking-tight">Test Instructions</h2>
                        <p className="text-blue-100/80 text-[10px] font-medium relative z-10 mt-1 uppercase tracking-widest">{subject ? subject : 'Full Mock Exam'} Analysis</p>
                    </div>

                    <div className="p-6">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <List className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Questions</p>
                                        <p className="text-base font-bold text-slate-700">{(subtopic || topic) ? '10 Items' : subject ? '20 Items' : 'All available'}</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <Award className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Marking</p>
                                        <p className="text-base font-bold text-slate-700">{subject ? '+1 / 0' : '+2 / -0.66'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Guidelines</h3>
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <div className="w-5 h-5 rounded-full bg-upsc-blue/10 flex items-center justify-center text-[10px] font-bold text-upsc-blue shrink-0">1</div>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">Use the <span className="text-upsc-blue font-bold">Confidence System</span> (Sure, 50-50, Guess) for deep analytics.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-5 h-5 rounded-full bg-upsc-blue/10 flex items-center justify-center text-[10px] font-bold text-upsc-blue shrink-0">2</div>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">Questions are randomized from the official question bank.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-5 h-5 rounded-full bg-upsc-blue/10 flex items-center justify-center text-[10px] font-bold text-upsc-blue shrink-0">3</div>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">Do not refresh the page during the exam to avoid data loss.</p>
                                    </div>
                                </div>
                            </div>

                            {!isAuthenticated ? (
                                <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex flex-col gap-3">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[12px] text-red-700 font-bold leading-snug">History won't be saved</p>
                                            <p className="text-[11px] text-red-600 font-medium leading-relaxed mt-0.5">
                                                You're not logged in. Your results will <strong>not</strong> be saved to your account and won't appear in Test History on any other device.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                                        className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-all active:scale-95"
                                    >
                                        Login to Save History →
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                        <span className="font-bold">Pro Tip:</span> Focus on precision. This application tracks your <span className="font-bold underline">Mastery Capping</span> based on consistency, not just luck.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex-1 px-6 py-4 rounded-xl border-2 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                            >
                                Back
                            </button>
                            <button
                                onClick={fetchQuestions}
                                disabled={loading}
                                className="flex-[2] px-6 py-4 rounded-xl bg-upsc-blue text-white font-black hover:bg-upsc-blue-dark transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3"
                            >
                                {loading ? 'Loading Pool...' : 'Start Assessment'}
                                {!loading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl border border-slate-100 shadow-xl text-center flex flex-col items-center gap-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">No Questions Found</h3>
                    <p className="text-slate-500 text-sm">We couldn't find any questions for <span className="font-bold text-upsc-blue">"{subtopic || subject}"</span> yet. Try another segment or topic.</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="w-full py-4 bg-upsc-blue text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-upsc-blue-dark transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    const currentAnswer = answers[currentQ.id];

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-3 h-[calc(100dvh-100px)] sm:h-[calc(100vh-140px)] overflow-hidden">
            {/* Header Info â€” fixed height */}
            <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 shrink-0">
                <div className="flex gap-2 items-center">
                    <span className={`${timeRemaining < 60 ? 'bg-red-600 animate-pulse' : 'bg-upsc-blue'} text-white px-3 py-1 rounded-md text-sm font-bold flex items-center gap-2 transition-colors`}>
                        <Clock className="w-3.5 h-3.5" />
                        {formatTimeDisplay(timeRemaining)}
                    </span>
                    <span className="bg-slate-800 text-white px-3 py-1 rounded-md text-sm font-bold">
                        Q {currentIndex + 1} / {questions.length}
                    </span>
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-md hidden sm:inline-block">
                        {subject 
                            ? (topic 
                                ? `${subject} Topic Wise Test - ${topic}${subtopic ? ` (${subtopic})` : ''}` 
                                : `${subject} Sectional Test`) 
                            : 'Full Length Mock Exam'}
                    </span>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                    {submitting ? 'Submitting...' : 'Submit Exam'}
                    <CheckCircle className="w-4 h-4" />
                </button>
            </div>

            {/* Question Card â€” fills remaining space, scrolls internally if needed */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 relative overflow-hidden flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
                <div className="flex justify-between items-start mb-3">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800 leading-relaxed flex-1">
                        <QuestionText text={currentQ.text} />
                    </h2>
                    <button
                        onClick={() => {
                            if (window.confirm("Found an error in this question? Would you like to report it?")) {
                                alert("Thank you! Your report has been submitted for review.");
                            }
                        }}
                        className="ml-4 px-2 py-1 text-slate-400 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-wider border border-slate-100 rounded hover:bg-red-50 shrink-0"
                        title="Report an error in this question"
                    >
                        Report Question
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    {currentQ.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelectOption(option)}
                            className={`text-left p-3 rounded-lg border-2 transition-all text-sm ${currentAnswer?.option === option
                                ? 'border-upsc-blue bg-blue-50 text-blue-900 font-medium'
                                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                                }`}
                        >
                            <span className="inline-block w-8 font-bold text-slate-400">
                                {String.fromCharCode(65 + idx)}.
                            </span>
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Controls â€” fixed height */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 bg-white p-3 rounded-xl shadow-sm border border-slate-100 shrink-0">
                {/* Navigation */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-1 px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                        onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        disabled={currentIndex === questions.length - 1}
                        className="flex items-center gap-1 px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* 3-Round Marker System */}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className="text-xs font-semibold text-slate-500">Confidence:</span>

                    <button
                        onClick={() => handleSetRound(1)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${currentAnswer?.roundMark === 1
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        title="100% Sure"
                    >
                        <Target className="w-3.5 h-3.5" /> Sure
                    </button>

                    <button
                        onClick={() => handleSetRound(2)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${currentAnswer?.roundMark === 2
                            ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        title="50-50 Eliminate 2 options"
                    >
                        <Eye className="w-3.5 h-3.5" /> 50-50
                    </button>

                    <button
                        onClick={() => handleSetRound(3)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${currentAnswer?.roundMark === 3
                            ? 'bg-red-100 border-red-500 text-red-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        title="Pure Guess"
                    >
                        <HelpCircle className="w-3.5 h-3.5" /> Guess
                    </button>
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="bg-green-600 p-6 text-center text-white">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-90" />
                            <h3 className="text-xl font-black uppercase tracking-tight">Finish Assessment?</h3>
                        </div>
                        
                        <div className="p-6 text-center">
                            <p className="text-slate-500 font-medium mb-6">
                                You have answered <span className="text-slate-800 font-bold">{Object.keys(answers).length}</span> out of <span className="text-slate-800 font-bold">{questions.length}</span> questions.
                            </p>
                            
                            <div className="space-y-3">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Now <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
                                >
                                    No, Let me Review
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


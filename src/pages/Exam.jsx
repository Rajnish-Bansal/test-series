import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, Target, HelpCircle, Eye } from 'lucide-react';

export default function Exam() {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const topic = searchParams.get('topic');

    useEffect(() => {
        const url = topic ? `/api/questions?topic=${encodeURIComponent(topic)}` : '/api/questions';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                setQuestions(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

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

        // Clone existing cumulative stats or initialize new
        const cumulative = existingCumulative ? JSON.parse(JSON.stringify(existingCumulative)) : {};

        questions.forEach(q => {
            const userAnswer = answers[q.id]?.option;
            const roundMark = answers[q.id]?.roundMark;

            // Initialize topic accuracy tracking for current session
            if (!topicAccuracy[q.topic]) {
                topicAccuracy[q.topic] = { total: 0, correct: 0, percentage: 0 };
            }
            topicAccuracy[q.topic].total += 1;

            // Initialize cumulative tracking for this topic if not present or if using old format
            if (!cumulative[q.topic] || !Array.isArray(cumulative[q.topic].correctIds)) {
                cumulative[q.topic] = { correctIds: [], attemptedIds: [], microTags: {} };
            }
            if (!cumulative[q.topic].microTags) {
                cumulative[q.topic].microTags = {};
            }

            const microTags = cumulative[q.topic].microTags;
            if (!microTags[q.microTag] || !Array.isArray(microTags[q.microTag].correctIds)) {
                microTags[q.microTag] = { correctIds: [], attemptedIds: [] };
            }

            if (!cumulative[q.topic].attemptedIds.includes(q.id)) {
                cumulative[q.topic].attemptedIds.push(q.id);
            }
            if (!microTags[q.microTag].attemptedIds.includes(q.id)) {
                microTags[q.microTag].attemptedIds.push(q.id);
            }

            if (userAnswer) {
                if (userAnswer === q.correctAnswer) {
                    correct += 1;
                    topicAccuracy[q.topic].correct += 1;
                    if (!cumulative[q.topic].correctIds.includes(q.id)) {
                        cumulative[q.topic].correctIds.push(q.id);
                    }
                    if (!microTags[q.microTag].correctIds.includes(q.id)) {
                        microTags[q.microTag].correctIds.push(q.id);
                    }
                } else {
                    incorrect += 1;
                    incorrectQuestions.push({
                        questionId: q.id,
                        questionText: q.text,
                        topic: q.topic,
                        microTag: q.microTag,
                        userAnswer: userAnswer,
                        correctAnswer: q.correctAnswer,
                        roundMarked: roundMark || 1
                    });
                }
            }
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
                topicAccuracy
            },
            cumulativeStats: cumulative,
            incorrectQuestions
        };
    };

    const handleSubmit = async () => {
        if (!window.confirm("Are you sure you want to submit the exam?")) return;

        setSubmitting(true);

        // Get existing cumulative stats to merge
        const existingCumulative = JSON.parse(localStorage.getItem('cumulativeStats') || 'null');
        const evaluation = evaluateExam(existingCumulative);

        try {
            // Save locally for immediate dashboard display
            localStorage.setItem('latestSession', JSON.stringify(evaluation.sessionData));
            localStorage.setItem('cumulativeStats', JSON.stringify(evaluation.cumulativeStats));

            // Save session to backend
            await fetch('/api/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionData: evaluation.sessionData,
                    incorrectQuestions: evaluation.incorrectQuestions
                })
            });

            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Failed to submit exam. Showing local results.');
            navigate('/dashboard');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-upsc-blue"></div>
            </div>
        );
    }

    if (questions.length === 0) {
        return <div className="text-center mt-10 text-xl font-medium">No questions found. Server might be down.</div>;
    }

    const currentQ = questions[currentIndex];
    const currentAnswer = answers[currentQ.id];

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            {/* Header Info */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex gap-4 items-center">
                    <span className="bg-upsc-blue text-white px-3 py-1 rounded-md text-sm font-bold">
                        Q {currentIndex + 1} / {questions.length}
                    </span>
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-md">
                        {currentQ.topic} • {currentQ.microTag}
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

            {/* Question Card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-100 min-h-[300px]">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-6 whitespace-pre-wrap leading-relaxed">
                    {currentQ.text}
                </h2>

                <div className="flex flex-col gap-3">
                    {currentQ.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSelectOption(option)}
                            className={`text-left p-4 rounded-lg border-2 transition-all ${currentAnswer?.option === option
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

            {/* Bottom Controls / Strategy Panel */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">

                {/* Navigation */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-1 px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                        onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                        disabled={currentIndex === questions.length - 1}
                        className="flex items-center gap-1 px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* 3-Round Marker System */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500 mr-2">Confidence Level:</span>

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
        </div>
    );
}

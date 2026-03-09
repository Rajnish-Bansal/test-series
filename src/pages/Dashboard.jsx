import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, AlertTriangle, CheckCircle, BarChart2, BookOpen } from 'lucide-react';

export default function Dashboard() {
    const [session, setSession] = useState(null);
    const [cumulativeStats, setCumulativeStats] = useState(null);
    const [systemStats, setSystemStats] = useState({ total: 0, byTopic: {} });
    const [viewMode, setViewMode] = useState('cumulative'); // 'latest' or 'cumulative'
    const navigate = useNavigate();
    const subjects = ['Polity', 'Economy', 'History', 'Geography', 'Environment', 'Science', 'Current Affairs'];

    useEffect(() => {
        const sessionData = localStorage.getItem('latestSession');
        if (sessionData) {
            setSession(JSON.parse(sessionData));
        }

        const cumulativeData = localStorage.getItem('cumulativeStats');
        if (cumulativeData) {
            setCumulativeStats(JSON.parse(cumulativeData));
        } else if (sessionData) {
            // Fallback for existing users before update
            const s = JSON.parse(sessionData);
            setCumulativeStats(s.topicAccuracy || {});
            setViewMode('latest');
        }

        // Fetch total universe of questions to calculate true preparedness
        fetch('/api/questions')
            .then(res => res.json())
            .then(allQ => {
                const stats = { total: allQ.length, byTopic: {} };
                allQ.forEach(q => {
                    stats.byTopic[q.topic] = (stats.byTopic[q.topic] || 0) + 1;
                });
                setSystemStats(stats);
            })
            .catch(err => console.error("Could not fetch system questions", err));
    }, []);

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800">Welcome to your Dashboard</h1>
                <p className="text-slate-500 mt-1">Select an exam subject below or review your latest performance metrics.</p>
            </div>

            {/* Exam Selection Center */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-upsc-blue to-upsc-blue-light"></div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="text-upsc-blue w-6 h-6" /> Start New Exam
                    </h2>

                    {session && cumulativeStats && (
                        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button
                                onClick={() => setViewMode('cumulative')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'cumulative'
                                    ? 'bg-white shadow-sm text-upsc-blue'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                All Time Accuracy
                            </button>
                            <button
                                onClick={() => setViewMode('latest')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'latest'
                                    ? 'bg-white shadow-sm text-upsc-blue'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Latest Session
                            </button>
                        </div>
                    )}
                </div>

                {session && (
                    <div className="mb-6 p-5 bg-white border-2 border-slate-200 rounded-xl shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-800 text-lg">
                                {viewMode === 'cumulative' ? 'Overall Preparedness (All Time)' : 'Overall Preparedness (Latest Session)'}
                            </span>
                            {(() => {
                                let totalC = 0;
                                let totalT = 0;

                                if (viewMode === 'cumulative' && cumulativeStats) {
                                    totalT = systemStats.total;
                                    Object.values(cumulativeStats).forEach(s => {
                                        totalC += Array.isArray(s.correctIds) ? s.correctIds.length : (s.correct || 0);
                                    });
                                } else if (session) {
                                    totalC = session.correct;
                                    totalT = session.totalQuestions;
                                }

                                const overallPercentage = totalT > 0 ? Math.round((totalC / totalT) * 100) : 0;

                                return (
                                    <span className={`text-sm font-bold px-3 py-1 rounded-md ${overallPercentage >= 70 ? 'bg-green-100 text-green-700' :
                                        overallPercentage >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {overallPercentage}%
                                    </span>
                                );
                            })()}
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                            {(() => {
                                let totalC = 0;
                                let totalT = 0;

                                if (viewMode === 'cumulative' && cumulativeStats) {
                                    totalT = systemStats.total;
                                    Object.values(cumulativeStats).forEach(s => {
                                        totalC += Array.isArray(s.correctIds) ? s.correctIds.length : (s.correct || 0);
                                    });
                                } else if (session) {
                                    totalC = session.correct;
                                    totalT = session.totalQuestions;
                                }

                                const overallPercentage = totalT > 0 ? Math.round((totalC / totalT) * 100) : 0;

                                return (
                                    <div
                                        className={`h-3 rounded-full transition-all duration-1000 ${overallPercentage >= 70 ? 'bg-green-500' :
                                            overallPercentage >= 40 ? 'bg-yellow-400' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${overallPercentage}%` }}
                                    ></div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    <div
                        onClick={() => navigate('/exam')}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-upsc-blue bg-upsc-blue text-white cursor-pointer hover:bg-upsc-blue-light transition-colors shadow-sm"
                    >
                        <span className="font-bold text-lg">Full Length Test</span>
                        <span className="text-sm text-blue-100 opacity-90 hidden sm:block">Comprehensive 20 Qs</span>
                    </div>

                    {subjects.map(subj => {
                        const activeStatsSource = viewMode === 'cumulative' ? cumulativeStats : session?.topicAccuracy;
                        const topicStats = activeStatsSource?.[subj];

                        // Calculate percentage dynamically based on view mode
                        let percentage = 0;
                        let correctDisplay = 0;
                        let totalDisplay = 0;

                        if (topicStats) {
                            if (viewMode === 'cumulative') {
                                correctDisplay = Array.isArray(topicStats.correctIds) ? topicStats.correctIds.length : (topicStats.correct || 0);
                                totalDisplay = systemStats?.byTopic?.[subj] || 1; // Fallback to avoid div by 0
                            } else {
                                correctDisplay = topicStats.correct;
                                totalDisplay = topicStats.total;
                            }
                            percentage = totalDisplay > 0 ? Math.round((correctDisplay / totalDisplay) * 100) : 0;
                        }

                        return (
                            <div
                                key={subj}
                                onClick={() => navigate(`/subject/${encodeURIComponent(subj)}`)}
                                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-upsc-blue hover:shadow-md transition-all group relative overflow-hidden"
                            >
                                <div className="w-1/3 sm:w-1/4 flex flex-col justify-center">
                                    <span className="font-bold text-slate-800 group-hover:text-upsc-blue transition-colors text-base sm:text-lg leading-tight">
                                        {subj}
                                    </span>
                                    <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                                        {topicStats ? '' : 'Not Attempted'}
                                    </div>
                                </div>

                                <div className="flex-1 px-4 sm:px-8">
                                    <div className="w-full bg-slate-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2 sm:h-2.5 rounded-full transition-all duration-1000 ${percentage >= 70 ? 'bg-green-500' :
                                                percentage >= 40 ? 'bg-yellow-400' :
                                                    topicStats ? 'bg-red-500' : 'bg-slate-300'
                                                }`}
                                            style={{ width: `${topicStats ? percentage : 0}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="w-16 sm:w-20 text-right">
                                    {topicStats ? (
                                        <span className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md ${percentage >= 70 ? 'bg-green-100 text-green-700' :
                                            percentage >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {percentage}%
                                        </span>
                                    ) : (
                                        <span className="text-xs sm:text-sm font-medium text-slate-400">
                                            0%
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Conditional Stats View */}
            {!session ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm mt-4">
                    <BarChart2 className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-600 mb-2">No Session Data Found</h2>
                    <p className="text-slate-500">Take an exam above to view your performance metrics.</p>
                </div>
            ) : (
                <>
                    <div className="mt-4">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Latest Performance</h2>
                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <p className="text-sm font-medium text-slate-500 mb-1">Total Score</p>
                                <p className={`text-3xl font-black ${session.score > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                                    {session.score.toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Max Possible: {session.isSectional ? session.totalQuestions : session.totalQuestions * 2}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <p className="text-sm font-medium text-slate-500 mb-1">Attempted</p>
                                <p className="text-3xl font-black text-slate-800">{session.attempted} <span className="text-lg text-slate-400 font-medium">/ {session.totalQuestions}</span></p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-500 mt-2 mr-2" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Correct</p>
                                <p className="text-3xl font-black text-green-600">{session.correct}</p>
                                <p className="text-xs text-green-600 font-medium mt-2">
                                    +{session.isSectional ? session.correct : session.correct * 2} Marks
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-500 mt-2 mr-2" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Incorrect</p>
                                <p className="text-3xl font-black text-red-500">{session.incorrect}</p>
                                <p className="text-xs text-red-500 font-medium mt-2">
                                    {session.isSectional ? '-0 Marks' : `-${(session.incorrect * 0.66).toFixed(2)} Marks`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Topic Accuracy Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mt-4">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
                            <Target className="w-5 h-5 text-upsc-blue" />
                            <h2 className="text-lg font-bold text-slate-800">Topic-wise Accuracy</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Subject / Pillar</th>
                                        <th className="px-6 py-3">Total Qs</th>
                                        <th className="px-6 py-3">Correct</th>
                                        <th className="px-6 py-3">Accuracy</th>
                                        <th className="px-6 py-3">Performance Bar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(session.topicAccuracy).map(([topic, stats], idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800">{topic}</td>
                                            <td className="px-6 py-4 text-slate-600">{stats.total}</td>
                                            <td className="px-6 py-4 text-green-600 font-medium">{stats.correct}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${stats.percentage >= 70 ? 'bg-green-100 text-green-800' :
                                                    stats.percentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {stats.percentage}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 w-64">
                                                <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${stats.percentage >= 70 ? 'bg-green-500' :
                                                            stats.percentage >= 40 ? 'bg-yellow-400' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${stats.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, ArrowRight, Target, Clock, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function History() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const processSessions = (sessions) => {
            const chronologicalSessions = [...sessions].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            const counts = { sectional: 0, topics: {} };
            const namedSessions = chronologicalSessions.map(s => {
                let displayName = '';
                if (s.isSectional) {
                    counts.sectional++;
                    displayName = `Sectional test ${counts.sectional}`;
                } else {
                    const topicKey = s.topic || 'General';
                    counts.topics[topicKey] = (counts.topics[topicKey] || 0) + 1;
                    displayName = `${topicKey} ${counts.topics[topicKey]}`;
                }
                return { ...s, displayName };
            });
            return namedSessions.reverse();
        };

        if (!isAuthenticated) { setLoading(false); return; }

        const token = localStorage.getItem('token');
        fetch('/api/sessions', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => { if (data.success) setSessions(processSessions(data.sessions)); setLoading(false); })
            .catch(() => setLoading(false));
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center px-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm mb-4"><Lock className="w-8 h-8 text-slate-300" /></div>
                <h2 className="text-xl font-bold text-slate-800">Authentication Required</h2>
                <p className="text-slate-500 mt-2 mb-6">Please login to view your test history.</p>
                <button onClick={() => navigate('/login')} className="bg-upsc-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-upsc-blue-dark transition-all shadow-lg active:scale-95">Login Now</button>
            </div>
        );
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-upsc-blue"></div></div>;
    }

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
                <HistoryIcon className="w-7 h-7 sm:w-8 sm:h-8 text-upsc-blue" />
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Test History</h1>
            </div>

            {sessions.length === 0 ? (
                <div className="bg-white p-10 sm:p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 mb-2">No past sessions found</h2>
                    <p className="text-slate-500 mb-6">Take a test to start building your historical performance record.</p>
                    <button onClick={() => navigate('/dashboard')} className="bg-upsc-blue hover:bg-upsc-blue-dark text-white px-6 py-2 rounded-xl font-bold transition-colors inline-flex items-center gap-2">
                        Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <>
                    {/* MOBILE: Card layout */}
                    <div className="flex flex-col gap-3 md:hidden">
                        {sessions.map((session) => {
                            const examDate = new Date(session.timestamp);
                            const accuracy = session.attempted > 0 ? Math.round((session.correct / session.attempted) * 100) : 0;
                            return (
                                <div key={session._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{session.displayName}</p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                {examDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <button onClick={() => navigate(`/analysis/${session._id}`)} className="text-xs font-bold text-upsc-blue border border-upsc-blue/30 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1">
                                            Review <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-slate-50 rounded-xl p-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Score</p>
                                            <p className="text-base font-black text-slate-800">{session.score}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</p>
                                            <p className={`text-base font-black ${accuracy >= 70 ? 'text-green-600' : accuracy >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>{accuracy}%</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Time</p>
                                            <p className="text-sm font-black text-slate-600">{session.timeTaken ? `${Math.floor(session.timeTaken / 60)}m` : '--'}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* DESKTOP: Table layout */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 tracking-wide text-xs uppercase font-bold">
                                        <th className="px-6 py-4 rounded-tl-xl">Attempt Date</th>
                                        <th className="px-6 py-4">Topic / Exam Type</th>
                                        <th className="px-6 py-4 text-center">Score</th>
                                        <th className="px-6 py-4 text-center">Accuracy</th>
                                        <th className="px-6 py-4 text-center">Time</th>
                                        <th className="px-6 py-4 rounded-tr-xl text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sessions.map((session) => {
                                        const examDate = new Date(session.timestamp);
                                        const accuracy = session.attempted > 0 ? Math.round((session.correct / session.attempted) * 100) : 0;
                                        return (
                                            <tr key={session._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-bold text-slate-700">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        {examDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><span className="font-bold text-slate-700">{session.displayName}</span></td>
                                                <td className="px-6 py-4 text-center"><span className="font-bold text-slate-800 text-lg">{session.score}</span></td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`font-bold ${accuracy >= 70 ? 'text-green-600' : accuracy >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>{accuracy}%</span>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-500 text-sm">
                                                    {session.timeTaken ? `${Math.floor(session.timeTaken / 60)}m ${session.timeTaken % 60}s` : '--'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => navigate(`/analysis/${session._id}`)} className="inline-flex items-center gap-1.5 bg-white border-2 border-slate-200 hover:border-upsc-blue hover:text-upsc-blue text-slate-600 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm group-hover:bg-blue-50">
                                                        Analysis <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

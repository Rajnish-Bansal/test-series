import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Play, Target } from 'lucide-react';

export default function SubjectDetails() {
    const { topic } = useParams();
    const navigate = useNavigate();
    const [cumulativeStats, setCumulativeStats] = useState(null);
    const [systemStats, setSystemStats] = useState({ total: 0, byMicroTag: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch cumulative stats
        const cumulativeData = localStorage.getItem('cumulativeStats');
        if (cumulativeData) {
            setCumulativeStats(JSON.parse(cumulativeData));
        }

        // Fetch questions for this topic to get system microTag totals
        fetch(`/api/questions?topic=${encodeURIComponent(topic)}`)
            .then(res => res.json())
            .then(data => {
                const stats = { total: data.length, byMicroTag: {} };
                data.forEach(q => {
                    const tag = q.microTag || 'General';
                    stats.byMicroTag[tag] = (stats.byMicroTag[tag] || 0) + 1;
                });
                setSystemStats(stats);
                setLoading(false);
            })
            .catch(err => {
                console.error("Could not fetch questions", err);
                setLoading(false);
            });
    }, [topic]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-upsc-blue"></div>
            </div>
        );
    }

    const topicStats = cumulativeStats?.[topic];
    const microTagsCumulative = topicStats?.microTags || {};
    const microTagsList = Object.keys(systemStats.byMicroTag).sort();

    // Calculate Master Topic Progress
    const totalCorrectTopic = Array.isArray(topicStats?.correctIds) ? topicStats.correctIds.length : (topicStats?.correct || 0);
    const topicPercentage = systemStats.total > 0 ? Math.round((totalCorrectTopic / systemStats.total) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

            {/* Header section with back navigation */}
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6 text-slate-500" />
                </button>
                <h1 className="text-3xl font-extrabold text-slate-800">{topic} Breakdown</h1>
            </div>

            {/* Overall Header Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 w-full relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="absolute top-0 left-0 w-2 h-full bg-upsc-blue"></div>

                <div className="flex-1 w-full pl-2">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Subject Mastery</p>
                    <div className="flex items-end gap-3 mb-2">
                        <span className="text-4xl font-black text-slate-800">{topicPercentage}%</span>
                        <span className="text-slate-500 font-medium mb-1">
                            ({totalCorrectTopic} / {systemStats.total} Questions)
                        </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-1000 ${topicPercentage >= 70 ? 'bg-green-500' :
                                    topicPercentage >= 40 ? 'bg-yellow-400' : 'bg-red-500'
                                }`}
                            style={{ width: `${topicPercentage}%` }}
                        ></div>
                    </div>
                </div>

                <div className="w-full md:w-auto flex flex-col gap-3">
                    <button
                        onClick={() => navigate(`/exam?topic=${encodeURIComponent(topic)}`)}
                        className="bg-upsc-blue hover:bg-upsc-blue-dark text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Play className="w-5 h-5 fill-white" /> Start Sectional Test
                    </button>
                </div>
            </div>

            {/* Micro-Tags List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <Target className="w-5 h-5 text-upsc-blue" />
                    <h2 className="text-lg font-bold text-slate-800">Micro-Topic Analysis</h2>
                </div>

                <div className="flex flex-col p-4 sm:p-6 gap-4">
                    {microTagsList.map(tag => {
                        const tagTotal = systemStats.byMicroTag[tag];
                        const tagStats = microTagsCumulative[tag];
                        const tagCorrect = Array.isArray(tagStats?.correctIds) ? tagStats.correctIds.length : (tagStats?.correct || 0);
                        const tagPercentage = tagTotal > 0 ? Math.round((tagCorrect / tagTotal) * 100) : 0;

                        return (
                            <div key={tag} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors gap-4">

                                <div className="sm:w-1/3">
                                    <h3 className="font-bold text-slate-800 text-base">{tag}</h3>
                                </div>

                                <div className="flex-1 flex items-center gap-4">
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-1000 ${tagPercentage >= 70 ? 'bg-green-500' :
                                                    tagPercentage >= 40 ? 'bg-yellow-400' :
                                                        tagStats ? 'bg-red-500' : 'bg-slate-300'
                                                }`}
                                            style={{ width: `${tagStats ? tagPercentage : 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="w-24 text-right flex flex-col">
                                        {tagStats ? (
                                            <>
                                                <span className={`text-sm font-bold ${tagPercentage >= 70 ? 'text-green-600' :
                                                        tagPercentage >= 40 ? 'text-yellow-600' : 'text-red-500'
                                                    }`}>
                                                    {tagPercentage}%
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-sm font-medium text-slate-400">0%</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

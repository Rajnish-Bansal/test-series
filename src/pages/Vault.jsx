import { useState, useEffect } from 'react';
import { AlertCircle, Target, Brain, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuestionText from '../components/QuestionText';

export default function Vault() {
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        fetch('/api/vault', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setErrors(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load error vault', err);
                setLoading(false);
            });
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="max-w-4xl mx-auto py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm mb-4">
                    <Lock className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Vault is Locked</h2>
                <p className="text-slate-500 mt-2 mb-6">Login to see the questions you previously missed.</p>
                <button
                    onClick={() => navigate('/login')}
                    className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg active:scale-95"
                >
                    Login to Access
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    const getRoundLabel = (roundMark) => {
        switch (roundMark) {
            case 1: return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold w-fit">Sure (100%)</span>;
            case 2: return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-bold w-fit">50-50</span>;
            case 3: return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold w-fit">Guess</span>;
            default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold w-fit">Unknown</span>;
        }
    };

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
                        The Error Vault
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Revise the questions you answered incorrectly.</p>
                </div>
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 font-bold flex items-center gap-3 sm:flex-col sm:items-center self-start">
                    <span className="text-xs uppercase tracking-wider text-red-400">Stored Errors</span>
                    <span className="text-2xl sm:text-2xl">{errors.length}</span>
                </div>
            </div>

            {errors.length === 0 ? (
                <div className="bg-white border hover:border-blue-300 transition-colors p-10 rounded-xl text-center shadow-sm">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-700">Vault is Empty</h3>
                    <p className="text-slate-500">You haven't made any mistakes yet, or haven't taken an exam.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {errors.map((errItem) => (
                        <div key={errItem._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex justify-between items-center text-sm font-medium">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-600 uppercase tracking-wider text-xs">
                                        {errItem.subject || errItem.topic} • {errItem.subtopic || errItem.microTag}
                                    </span>
                                </div>
                                {getRoundLabel(errItem.roundMarked)}
                            </div>

                            <div className="p-6">
                                <h3 className="text-slate-800 font-semibold mb-6 leading-relaxed">
                                    <QuestionText text={errItem.questionText} />
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-red-100 bg-red-50/30 rounded-lg p-4">
                                        <p className="text-xs uppercase text-red-400 font-bold mb-1">Your Answer</p>
                                        <p className="text-red-700 font-medium">{errItem.userAnswer || "Skipped"}</p>
                                    </div>

                                    <div className="border border-green-100 bg-green-50/30 rounded-lg p-4">
                                        <p className="text-xs uppercase text-green-500 font-bold mb-1 flex items-center gap-1">
                                            Correct Answer <CheckCircle className="w-3 h-3" />
                                        </p>
                                        <p className="text-green-800 font-medium">{errItem.correctAnswer}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User as UserIcon, Lock, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const redirectPath = queryParams.get('redirect') || '/dashboard';
    const reason = queryParams.get('reason');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

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

                // 🔄 Claim any pending guest session (taken while not logged in)
                const pendingSession = sessionStorage.getItem('latestGuestSession');
                if (pendingSession) {
                    try {
                        const sessionData = JSON.parse(pendingSession);
                        // Only claim real sessions (not temp shell objects)
                        if (sessionData && sessionData.totalQuestions > 0) {
                            const claimRes = await fetch('/api/evaluate', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${data.token}`
                                },
                                body: JSON.stringify({
                                    sessionData: {
                                        totalQuestions: sessionData.totalQuestions,
                                        attempted: sessionData.attempted,
                                        correct: sessionData.correct,
                                        incorrect: sessionData.incorrect,
                                        score: sessionData.score,
                                        isSectional: sessionData.isSectional,
                                        subject: sessionData.subject,
                                        subtopic: sessionData.subtopic,
                                        topicAccuracy: sessionData.topicAccuracy,
                                        answers: sessionData.answers,
                                        timeTaken: sessionData.timeTaken,
                                        timestamp: sessionData.timestamp
                                    },
                                    incorrectQuestions: []
                                })
                            });
                            if (claimRes.ok) {
                                sessionStorage.removeItem('latestGuestSession');
                            }
                        }
                    } catch (claimErr) {
                        console.error('Could not claim guest session:', claimErr);
                    }
                }

                navigate(redirectPath);
            } else {
                setError(data.error || 'Authentication failed');
            }
        } catch (err) {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-2 px-4">
            <div className={`text-center transition-all ${isLogin ? 'mb-4' : 'mb-2'}`}>
                <div className={`inline-flex items-center justify-center bg-upsc-blue rounded-2xl shadow-lg transition-all ${isLogin ? 'p-2 mb-2' : 'p-1.5 mb-1'}`}>
                    <BookOpen className={`${isLogin ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
                </div>
                <h1 className={`font-black text-slate-800 tracking-tight transition-all ${isLogin ? 'text-2xl' : 'text-xl'}`}>
                    {isLogin ? 'Welcome Back' : 'Create Your Account'}
                </h1>
                {isLogin && (
                    <p className="text-slate-500 mt-1 text-sm">
                        Enter your credentials to continue your journey.
                    </p>
                )}
            </div>

            <div className={`bg-white rounded-3xl shadow-xl border border-slate-100 transition-all ${isLogin ? 'p-6' : 'p-5'}`}>
                {reason === 'unlock' && (
                    <div className="mb-3 p-2.5 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-700">
                        <div className="h-8 w-8 bg-green-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-green-700 uppercase tracking-tight leading-none">Step 2: Unlock Results</p>
                            <p className="text-[9px] text-green-600 font-medium leading-tight">Login to view your score and Error Vault.</p>
                        </div>
                    </div>
                )}

                <form className={`transition-all ${isLogin ? 'space-y-4' : 'space-y-3'}`} onSubmit={handleAuth}>
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 px-1 uppercase tracking-wider">Username</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-upsc-blue focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-400 text-sm"
                                placeholder="your_username"
                                autoComplete="username"
                            />
                        </div>
                        {!isLogin && (
                            <p className="text-[10px] text-slate-400 mt-1 px-1">Lowercase letters, numbers and underscores only.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 px-1 uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-upsc-blue focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-400 text-sm"
                                placeholder="••••••••"
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-upsc-blue hover:bg-upsc-blue-dark text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                        ) : (
                            <>{isLogin ? 'Login Now' : 'Create Account'} <ArrowRight className="w-5 h-5" /></>
                        )}
                    </button>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                    <p className="text-slate-500 font-medium text-sm">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-upsc-blue font-bold hover:underline"
                        >
                            {isLogin ? 'Sign up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-bold">
                Advanced Performance Tracking Engine
            </p>
        </div>
    );
}

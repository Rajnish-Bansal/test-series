import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Loader2, ArrowRight } from 'lucide-react';

export default function AdminAuth() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    // If already logged in as admin, redirect
    useEffect(() => {
        const adminToken = localStorage.getItem('admin_token');
        if (adminToken) {
            navigate('/admin');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                // Save admin token specifically
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
                navigate('/admin');
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setError('Failed to connect to authentication server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-upsc-blue to-upsc-blue-light" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                
                <div className="relative">
                    <div className="w-16 h-16 bg-slate-50 text-upsc-blue rounded-2xl flex items-center justify-center mb-8 border border-slate-100 shadow-sm mx-auto">
                        <Shield className="w-8 h-8" />
                    </div>

                    <div className="text-center mb-10">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Admin Portal</h1>
                        <p className="text-slate-500 mt-2 font-medium">Secure access to platform management</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 text-center animate-in fade-in duration-300">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider pl-1">Username</label>
                            <div className="relative">
                                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-upsc-blue/20 focus:border-upsc-blue outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                    placeholder="Enter admin username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider pl-1">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-upsc-blue/20 focus:border-upsc-blue outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-upsc-blue text-white py-4 rounded-xl font-bold hover:bg-upsc-blue-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 mt-4 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Secure Login <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            {/* Developer Note visible only for testing, can be removed in production */}
            <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-xl text-xs font-mono shadow-xl max-w-xs opacity-50 hover:opacity-100 transition-opacity">
                <strong>Test Credentials:</strong><br/>
                User: admin<br/>
                Pass: password123
            </div>
        </div>
    );
}

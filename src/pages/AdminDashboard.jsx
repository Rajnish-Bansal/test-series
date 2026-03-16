import { useState, useEffect } from 'react';
import { Users, FileText, Activity, HomeIcon, Map, PlusCircle, ArrowRight, LogOut } from 'lucide-react';
import QuestionManager from '../components/admin/QuestionManager';
import QuestionUploader from '../components/admin/QuestionUploader';
import UserManager from '../components/admin/UserManager';
import TopicCoverageTable from '../components/admin/TopicCoverageTable';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('questions');
    const [adminUser, setAdminUser] = useState(null);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            // In a real app, verify token with backend
            // For now, we'll assume it's valid if it exists
            setAdminUser({ username: 'admin', role: 'admin' });
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                setAdminUser(data.user);
                localStorage.setItem('admin_token', data.token);
            } else {
                setLoginError(data.error || 'Invalid credentials');
            }
        } catch (err) {
            setLoginError('Server error. Please try again.');
        } finally {
            setLoginLoading(setLoginLoading => false);
        }
    };

    const handleLogout = () => {
        setAdminUser(null);
        localStorage.removeItem('admin_token');
        navigate('/');
    };

    if (!adminUser) {
        return (
            <div className="fixed inset-0 z-[100] bg-white sm:bg-slate-50 flex items-center justify-center p-6 overflow-hidden">
                <div className="max-w-sm w-full">
                    <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="mb-10 text-center">
                            <Activity className="w-10 h-10 text-upsc-blue mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Admin Login</h2>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Access Restricted</p>
                        </div>

                        {loginError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl text-center">
                                {loginError}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <input 
                                    type="text" 
                                    required 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-upsc-blue focus:bg-white outline-none transition-all font-medium text-sm"
                                    placeholder="Username"
                                />
                            </div>
                            <div>
                                <input 
                                    type="password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-upsc-blue focus:bg-white outline-none transition-all font-medium text-sm"
                                    placeholder="Password"
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={loginLoading}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                            >
                                {loginLoading ? 'Loading...' : 'Sign In'}
                                {!loginLoading && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </form>

                        <button 
                            onClick={() => navigate('/')}
                            className="w-full mt-6 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                            <HomeIcon className="w-3.5 h-3.5" /> Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Admin Header */}
            <div className="bg-upsc-blue-dark text-white pt-10 pb-20 px-4 md:px-8">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-400" /> Administrative Panel
                        </h1>
                        <p className="text-blue-200">Manage learning content, users, and platform analytics.</p>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 px-4 py-2 rounded-xl transition-all font-bold text-sm border border-red-500/20"
                    >
                        <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout Panel</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 -mt-10">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                    
                    {/* Sidebar / Tabs */}
                    <div className="w-full md:w-64 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 p-6 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                        <button 
                            onClick={() => setActiveTab('questions')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'questions' ? 'bg-upsc-blue text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <FileText className={`w-5 h-5 ${activeTab === 'questions' ? 'text-blue-200' : 'text-slate-400'}`} /> 
                            <span>Questions & Topics</span>
                        </button>

                        <button 
                            onClick={() => setActiveTab('upload')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'upload' ? 'bg-upsc-blue text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <PlusCircle className={`w-5 h-5 ${activeTab === 'upload' ? 'text-blue-200' : 'text-slate-400'}`} /> 
                            <span>Upload Questions</span>
                        </button>
                        
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap md:whitespace-normal ${activeTab === 'users' ? 'bg-upsc-blue text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <Users className={`w-5 h-5 ${activeTab === 'users' ? 'text-blue-200' : 'text-slate-400'}`} /> 
                            <span>User Analytics</span>
                        </button>
                    </div>
                    
                    {/* Tab Panels */}
                    <div className="flex-1 overflow-x-auto relative">
                        {activeTab === 'questions' && <QuestionManager />}
                        {activeTab === 'upload' && <QuestionUploader />}
                        {activeTab === 'users' && <UserManager />}
                    </div>
                </div>
            </div>
        </div>
    );
}


import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Activity, AlertCircle, List, History as HistoryIcon, LogOut, Shield, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSoonModal, setShowSoonModal] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();

    // Close mobile menu on route change
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard', icon: Activity },
        { name: 'All Tests', path: '/tests', icon: List, comingSoon: true },
        { name: 'Test History', path: '/history', icon: HistoryIcon },
        { name: 'Error Vault', path: '/vault', icon: AlertCircle },
    ];

    const linkClass = (isActive) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive
            ? 'bg-upsc-blue text-white shadow-sm'
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`;

    return (
        <>
            <nav className="bg-upsc-blue-dark text-white shadow-md relative z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <BookOpen className="h-6 w-6 text-blue-300" />
                            <span className="font-bold text-lg tracking-wide">UPSC Engine</span>
                        </Link>

                        {/* Desktop nav links */}
                        <div className="hidden md:flex items-center gap-1">
                            {isAuthenticated && navLinks.map((link) => {
                                const isActive = location.pathname === link.path;
                                const Icon = link.icon;
                                if (link.comingSoon) {
                                    return (
                                        <button
                                            key={link.path}
                                            onClick={() => setShowSoonModal(true)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white group"
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="hidden lg:inline">{link.name}</span>
                                            <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full uppercase tracking-tighter border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all">Soon</span>
                                        </button>
                                    );
                                }
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-upsc-blue-light text-white' : 'text-gray-300 hover:bg-upsc-blue hover:text-white'}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden lg:inline">{link.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Desktop: user / login */}
                        <div className="hidden md:flex pl-4 border-l border-blue-800 items-center gap-4">
                            {isAuthenticated ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-white">{user.username || user.name || 'Aspirant'}</span>
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="p-2 rounded-lg bg-blue-900/40 text-blue-300 hover:bg-blue-800 hover:text-white transition-all border border-blue-800"
                                        title="Logout"
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="flex items-center gap-2 bg-white text-upsc-blue px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm">
                                    <User className="h-4 w-4" /> Login
                                </Link>
                            )}
                        </div>

                        {/* Mobile: hamburger */}
                        <button
                            className="md:hidden p-2 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-all"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-72 z-[60] bg-upsc-blue-dark shadow-2xl transition-transform duration-300 ease-in-out md:hidden flex flex-col ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-5 border-b border-blue-800">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-300" />
                        <span className="font-bold text-white">UPSC Engine</span>
                    </div>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* User info in drawer */}
                {isAuthenticated && (
                    <div className="px-5 py-4 border-b border-blue-800 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-upsc-blue flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{user.username || user.name || 'Aspirant'}</p>
                            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Logged In</p>
                        </div>
                    </div>
                )}

                {/* Drawer Links */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                    {isAuthenticated ? (
                        navLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            const Icon = link.icon;
                            if (link.comingSoon) {
                                return (
                                    <button
                                        key={link.path}
                                        onClick={() => { setMobileOpen(false); setShowSoonModal(true); }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/10 hover:text-white transition-all w-full text-left"
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        {link.name}
                                        <span className="ml-auto text-[8px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full uppercase tracking-tighter border border-blue-500/30">Soon</span>
                                    </button>
                                );
                            }
                            return (
                                <Link key={link.path} to={link.path} className={linkClass(isActive)}>
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {link.name}
                                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-70" />}
                                </Link>
                            );
                        })
                    ) : (
                        <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-white text-upsc-blue">
                            <User className="h-4 w-4" /> Login / Sign Up
                        </Link>
                    )}
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-blue-800">
                    {isAuthenticated ? (
                        <button
                            onClick={() => { setMobileOpen(false); setShowLogoutModal(true); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-all text-sm font-bold border border-red-500/20"
                        >
                            <LogOut className="h-4 w-4" /> Log Out
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <LogOut className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Ready to Leave?</h3>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                Are you sure you want to log out? You can always come back and resume your preparation.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => { logout(); setShowLogoutModal(false); }}
                                    className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg active:scale-95"
                                >
                                    Yes, Log Out
                                </button>
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Stay Logged In
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coming Soon Modal */}
            {showSoonModal && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ListIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Curating Tests</h3>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                                Our educators are currently verifying and adding the latest UPSC test series. This feature will be live in Phase 2!
                            </p>
                            <button
                                onClick={() => setShowSoonModal(false)}
                                className="w-full bg-upsc-blue text-white py-4 rounded-xl font-bold hover:bg-upsc-blue-dark transition-all shadow-lg active:scale-95"
                            >
                                Got it, Thanks!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

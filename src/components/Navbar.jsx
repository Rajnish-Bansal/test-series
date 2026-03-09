import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Activity, AlertCircle, Home } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();

    const navLinks = [
        { name: 'Home', path: '/', icon: Home },
        { name: 'Exam', path: '/exam', icon: BookOpen },
        { name: 'Dashboard', path: '/dashboard', icon: Activity },
        { name: 'Error Vault', path: '/vault', icon: AlertCircle },
    ];

    return (
        <nav className="bg-upsc-blue-dark text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-blue-300" />
                        <span className="font-bold text-lg tracking-wide">UPSC Engine</span>
                    </div>
                    <div className="flex space-x-4">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.path;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                            ? 'bg-upsc-blue-light text-white'
                                            : 'text-gray-300 hover:bg-upsc-blue hover:text-white'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{link.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}

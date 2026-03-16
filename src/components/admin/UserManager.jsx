import { useState, useEffect } from 'react';
import { Search, Loader2, User, Trophy, Activity, CalendarDays, Percent } from 'lucide-react';

export default function UserManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await fetch('/api/admin/user-analytics');
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
            } else {
                setError(data.error || 'Failed to load users');
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Connection failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.mobile?.includes(searchTerm)
    );

    return (
        <div className="p-6 md:p-8 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">User Analytics</h2>
                    <p className="text-slate-500 font-medium mt-1">Monitor the progress of {users.length} registered candidates.</p>
                </div>
                
                <div className="relative w-full sm:w-72">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search by name or mobile..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-upsc-blue/20 transition-all text-sm"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {error && (
                    <div className="m-4 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> {error}
                    </div>
                )}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-upsc-blue" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <User className="w-12 h-12 text-slate-200 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 mb-1">No candidates found</h3>
                        <p className="text-sm text-slate-500">Could not find any users matching your search criteria.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 p-1">
                            {filteredUsers.map((user, idx) => (
                                <div key={user._id || idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black shrink-0 border border-slate-200">
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{user.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono truncate">{user.mobile}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            <p className="text-[8px] uppercase font-black text-slate-400 mb-1 tracking-widest">Tests</p>
                                            <p className="text-xs font-black text-slate-700">{user.stats.totalTests} Mocks</p>
                                        </div>
                                        <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                                            <p className="text-[8px] uppercase font-black text-emerald-600 mb-1 tracking-widest">Accuracy</p>
                                            <p className="text-xs font-black text-emerald-700">{user.stats.overallAccuracy}%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-3">
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="w-3 h-3" />
                                            Joined {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-slate-300">#{ (idx + 1).toString().padStart(2, '0') }</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase font-black tracking-widest text-slate-500">
                                        <th className="p-4 pl-6 whitespace-nowrap w-16">Sl No.</th>
                                        <th className="p-4 whitespace-nowrap">Candidate Info</th>
                                        <th className="p-4 whitespace-nowrap">Registration Date</th>
                                        <th className="p-4 whitespace-nowrap text-center">Tests Taken</th>
                                        <th className="p-4 whitespace-nowrap text-center">Questions Attempted</th>
                                        <th className="p-4 pr-6 whitespace-nowrap text-right">Avg. Accuracy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user, idx) => (
                                        <tr key={user._id || idx} className="border-b border-slate-100 hover:bg-upsc-blue/5 transition-colors group">
                                            <td className="p-4 pl-6 align-middle text-slate-400 font-mono text-xs">
                                                {(idx + 1).toString().padStart(2, '0')}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black shrink-0 border border-slate-200 group-hover:bg-white group-hover:border-blue-200 group-hover:text-upsc-blue transition-colors">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 mb-0.5">{user.name}</p>
                                                        <p className="text-xs text-slate-500 font-mono flex gap-2">
                                                            <span>{user.mobile}</span> 
                                                            {user.email && <span className="text-slate-300">|</span>}
                                                            {user.email && <span>{user.email}</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="p-4 align-middle">
                                                <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                    <CalendarDays className="w-4 h-4 text-slate-400" />
                                                    {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </td>
                                            
                                            <td className="p-4 align-middle text-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black ${user.stats.totalTests > 0 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                                    <Activity className="w-3.5 h-3.5 mr-1" />
                                                    {user.stats.totalTests} Mocks
                                                </span>
                                            </td>

                                            <td className="p-4 align-middle text-center">
                                                <p className="text-sm font-bold text-slate-700">{user.stats.totalAttempted.toLocaleString()}</p>
                                            </td>

                                            <td className="p-4 pr-6 align-middle text-right">
                                                {user.stats.totalTests > 0 ? (
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5 mb-1 text-emerald-600 font-black">
                                                            <Trophy className="w-4 h-4" />
                                                            {user.stats.overallAccuracy}%
                                                        </div>
                                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-emerald-500 rounded-full"
                                                                style={{ width: `${user.stats.overallAccuracy}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-300 italic">No Data Yet</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

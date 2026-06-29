import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, authFetch } from '../../config/api';
import { useSearch } from '../../context/SearchContext';

function BugReports() {
    const navigate = useNavigate();
    const { debouncedQuery } = useSearch();
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await authFetch(`${API_BASE}/bug-reports`);
                const data = await res.json();
                if (data.success && data.data.length > 0) {
                    setReports(data.data.map(r => ({
                        id: r.report_id,
                        reportedBy: `@${r.username}`,
                        email: r.email,
                        title: r.title || 'No title',
                        msg: r.description || r.title || '',
                        type: r.type || 'bug',
                        priority: r.priority || 'medium',
                        status: r.status || 'unresolved',
                        date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                    })));
                } else {
                    setReports([]);
                }
            } catch (err) {
                console.error('Failed to fetch reports:', err);
                setReports([]);
            }
        };
        fetchReports();
    }, []);

    const handleStatusChange = async (reportId, newStatus) => {
        try {
            const res = await authFetch(`${API_BASE}/bug-reports/${reportId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                setReports(reports.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // ─── SEARCH FILTERING ────────────────────────────────────────
    const filteredReports = debouncedQuery
        ? reports.filter(r =>
            r.reportedBy.toLowerCase().includes(debouncedQuery) ||
            r.title.toLowerCase().includes(debouncedQuery) ||
            r.msg.toLowerCase().includes(debouncedQuery) ||
            r.type.toLowerCase().includes(debouncedQuery) ||
            r.priority.toLowerCase().includes(debouncedQuery) ||
            r.status.toLowerCase().includes(debouncedQuery)
          )
        : reports;

    const priorityBadge = (p) => {
        const colors = {
            high: 'bg-red-500/20 text-red-400 border-red-500/30',
            medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            low: 'bg-green-500/20 text-green-400 border-green-500/30'
        };
        return colors[p] || colors.medium;
    };

    const typeBadge = (t) => {
        const colors = {
            bug: 'bg-red-500/10 text-red-300',
            content: 'bg-blue-500/10 text-blue-300',
            ui: 'bg-purple-500/10 text-purple-300',
            feature: 'bg-emerald-500/10 text-emerald-300'
        };
        return colors[t] || 'bg-gray-500/10 text-gray-300';
    };

    return (
        <div className="max-w-[1200px] mx-auto text-black dark:text-white pb-12 pt-6 px-4 lg:px-0">

            {/* Banner */}
            <div className="w-full bg-gradient-to-r from-indigo-500/90 via-primary-darker to-brand-dark/50 dark:to-[#090e17] rounded-2xl py-12 px-10 mb-10 shadow-lg relative overflow-hidden">
                <h1 className="font-bold text-3xl md:text-[34px] text-white mb-8 tracking-wide relative z-10">One Centralized Panel for Management</h1>
                <div className="flex flex-wrap gap-4 relative z-10">
                    <button onClick={() => navigate('/admin/users')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">mange users</button>
                    <button onClick={() => navigate('/admin/content')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">manage Q's</button>
                    <button onClick={() => navigate('/admin/tournaments')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">manage tournaments</button>
                    <button onClick={() => navigate('/admin/reports')} className="px-6 py-1.5 rounded-full border-2 border-primary-light bg-indigo-500 text-white font-semibold text-sm shadow-md">Reports</button>
                </div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            </div>

            {/* Table */}
            <div>
                <h2 className="text-lg font-bold mb-4 tracking-wider uppercase text-gray-800 dark:text-white">Manage Bug Reports</h2>
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                            <tr className="border-b border-gray-300 dark:border-gray-700 text-gray-500 dark:text-[#a1a1aa] text-[13px] font-bold tracking-wider uppercase">
                                <th className="py-3 px-2 w-[60px]">Sr</th>
                                <th className="py-3 px-4 w-[140px]">Username</th>
                                <th className="py-3 px-4 w-[250px]">Issue Details</th>
                                <th className="py-3 px-4 w-[90px]">Type</th>
                                <th className="py-3 px-4 w-[90px]">Priority</th>
                                <th className="py-3 px-4 w-[110px]">Date</th>
                                <th className="py-3 px-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReports.map((report, idx) => (
                                <tr key={report.id} className="border-b border-gray-200 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-2 font-bold text-[14px] text-gray-700 dark:text-gray-300">{idx + 1}</td>
                                    <td className="py-4 px-4 font-semibold text-[14px]">{report.reportedBy}</td>
                                    <td className="py-4 px-4">
                                        <div className="font-semibold text-[14px] text-gray-800 dark:text-gray-200">{report.title}</div>
                                        <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-1 break-words line-clamp-2">{report.msg}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${typeBadge(report.type)}`}>
                                            {report.type}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize border ${priorityBadge(report.priority)}`}>
                                            {report.priority}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-[13px] text-gray-500 dark:text-gray-400 font-medium">{report.date}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleStatusChange(report.id, 'unresolved')}
                                                className={`px-5 py-1.5 rounded-full border-2 font-bold text-[12px] transition-colors tracking-wide ${report.status === 'unresolved' ? 'border-red-400 bg-red-500/20 text-red-400' : 'border-gray-400 dark:border-gray-300 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'}`}>
                                                unresolved
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(report.id, 'resolved')}
                                                className={`px-6 py-1.5 rounded-full border-2 font-bold text-[12px] transition-colors tracking-wide ${report.status === 'resolved' ? 'border-green-400 bg-green-500/20 text-green-400' : 'border-indigo-500 bg-indigo-500/20 dark:bg-primary text-indigo-500 dark:text-white hover:bg-indigo-500 hover:text-white'}`}>
                                                resolved
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredReports.length === 0 && (
                                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No reports match your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default BugReports;

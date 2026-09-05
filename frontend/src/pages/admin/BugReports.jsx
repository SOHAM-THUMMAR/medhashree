import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, authFetch } from '../../config/api';
import { useSearch } from '../../context/SearchContext';
import AdminNavBanner from '../../components/admin/AdminNavBanner';

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
            medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
        return colors[p] || colors.medium;
    };

    const typeBadge = (t) => {
        const colors = {
            bug: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
            content: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
            ui: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
            feature: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        };
        return colors[t] || 'bg-slate-800 text-slate-300 border border-slate-700';
    };

    return (
        <div className="min-h-screen bg-[#090d16] text-white p-4 lg:p-8 font-sans">
            <div className="max-w-[1320px] mx-auto space-y-8">

                {/* Unified Admin Navigation Banner */}
                <AdminNavBanner 
                    title="User Feedback & Bug Reports" 
                    subtitle="Review issue tickets, content flag reports, and priority fixes from students and instructors" 
                />

                {/* Table Container */}
                <div className="bg-[#111726]/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <h2 className="text-base font-bold mb-6 tracking-wider uppercase text-slate-100 flex items-center gap-2">
                        🚨 Issue Tickets & User Reports ({filteredReports.length})
                    </h2>
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                                    <th className="py-3.5 px-3 w-[50px]">#</th>
                                    <th className="py-3.5 px-4 w-[160px]">User & Email</th>
                                    <th className="py-3.5 px-4">Issue Details</th>
                                    <th className="py-3.5 px-4 w-[100px]">Type</th>
                                    <th className="py-3.5 px-4 w-[100px]">Priority</th>
                                    <th className="py-3.5 px-4 w-[110px]">Date</th>
                                    <th className="py-3.5 px-4 text-center w-[200px]">Status Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                {filteredReports.map((report, idx) => (
                                    <tr key={report.id} className="hover:bg-slate-800/40 transition">
                                        <td className="py-4 px-3 font-bold text-slate-400">{idx + 1}</td>
                                        <td className="py-4 px-4 font-semibold">
                                            <div className="text-indigo-300 font-bold">{report.reportedBy}</div>
                                            <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{report.email}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-100 text-xs">{report.title}</div>
                                            <div className="text-[11px] text-slate-400 mt-1 break-words line-clamp-2">{report.msg}</div>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${typeBadge(report.type)}`}>
                                                {report.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border ${priorityBadge(report.priority)}`}>
                                                {report.priority}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-[11px] text-slate-400 font-mono whitespace-nowrap">{report.date}</td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleStatusChange(report.id, 'unresolved')}
                                                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${report.status === 'unresolved' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                                >
                                                    Unresolved
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(report.id, 'resolved')}
                                                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${report.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                                >
                                                    Resolved
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredReports.length === 0 && (
                                    <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-xs">No bug reports found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BugReports;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, authFetch } from '../../config/api';
import { useSearch } from '../../context/SearchContext';
import AdminNavBanner from '../../components/admin/AdminNavBanner';

function ManageTournaments() {
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTournament, setEditingTournament] = useState(null);
    const { debouncedQuery } = useSearch();

    const filteredTournaments = debouncedQuery
        ? tournaments.filter(t => t.name.toLowerCase().includes(debouncedQuery))
        : tournaments;

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch(`${API_BASE}/tournaments`);
                const data = await res.json();
                if (data.success) {
                    setTournaments(data.data.map(t => ({
                        id: t.tournament_id, name: t.name,
                        subject: t.category_name || t.subject || 'General',
                        participants: (parseInt(t.participant_count) || 0).toLocaleString(),
                        status: t.status
                    })));
                } else {
                    setTournaments([]);
                }
            } catch (err) {
                console.error('Failed to fetch tournaments:', err);
                setTournaments([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    const handleEnd = async (id) => {
        if (!window.confirm('End this tournament?')) return;
        try {
            await authFetch(`/tournaments/${id}/end`, { method: 'POST' });
            setTournaments(tournaments.map(t => t.id === id ? { ...t, status: 'completed' } : t));
        } catch (err) { console.error(err); }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = {
            name: formData.get('name'),
            description: formData.get('description'),
            status: formData.get('status')
        };
        try {
            const res = await authFetch(`/tournaments/${editingTournament.id}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            const data = await res.json();
            if (data.success) {
                alert('Tournament updated successfully!');
                setTournaments(tournaments.map(t => t.id === editingTournament.id ? { ...t, ...updates } : t));
                setEditingTournament(null);
            } else {
                alert(data.error || 'Failed to update');
            }
        } catch (err) {
            console.error(err);
            alert('Cannot connect to server');
        }
    };

    return (
        <div className="min-h-screen bg-[#090d16] text-white p-4 lg:p-8 font-sans">
            <div className="max-w-[1320px] mx-auto space-y-8">
                {/* Unified Admin Navigation Banner */}
                <AdminNavBanner 
                    title="Competitive Tournaments Arena Management" 
                    subtitle="Create, schedule, edit, and end high-octane engineering battles and seeded league contests" 
                />

                <div className="bg-[#111726]/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-bold tracking-wider uppercase text-slate-100 flex items-center gap-2">
                            🏆 Active & Past Tournaments ({filteredTournaments.length})
                        </h2>
                        <button
                            onClick={() => navigate('/admin/create-tournament')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg flex items-center gap-2"
                        >
                            <span>+</span> Create New Tournament
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center text-slate-400 py-12 text-xs">Loading tournaments...</div>
                    ) : tournaments.length === 0 ? (
                        <div className="text-center text-slate-400 py-12 text-xs">
                            <p className="text-sm font-bold text-slate-200 mb-1">No tournaments created yet</p>
                            <p className="text-xs">Click 'Create New Tournament' above to start your first arena</p>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <table className="w-full text-center border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                                        <th className="py-3.5 px-4 w-[80px] text-left">#</th>
                                        <th className="py-3.5 px-4 text-left">Tournament Name</th>
                                        <th className="py-3.5 px-4">Subject</th>
                                        <th className="py-3.5 px-4">Participants</th>
                                        <th className="py-3.5 px-4 text-center">Action Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                    {filteredTournaments.map((t, idx) => (
                                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                                            <td className="py-4 px-4 font-bold text-slate-400 text-left">{idx + 1}</td>
                                            <td className="py-4 px-4 font-bold text-slate-100 uppercase text-left">{t.name}</td>
                                            <td className="py-4 px-4 font-semibold text-indigo-300">{t.subject}</td>
                                            <td className="py-4 px-4 font-mono font-bold text-slate-200">{t.participants}</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button onClick={() => handleEnd(t.id)} disabled={t.status === 'completed'}
                                                        className={`px-4 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wide transition ${t.status === 'completed' ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-indigo-600/80 text-white hover:bg-indigo-500'}`}>
                                                        {t.status === 'completed' ? 'ENDED' : 'END ARENA'}
                                                    </button>
                                                    <button onClick={() => setEditingTournament(t)} className="px-4 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 font-bold text-[11px] uppercase hover:bg-slate-700 transition">UPDATE</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            {/* Edit Modal */}
            {editingTournament && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-[#12152a] rounded-xl w-full max-w-lg text-white p-8 border border-white/10 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Update Tournament</h2>
                        <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-300">Name</label>
                                <input name="name" defaultValue={editingTournament.name} className="w-full bg-[#1e2341] border border-white/10 rounded-lg py-2 px-3 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-300">Status</label>
                                <select name="status" defaultValue={editingTournament.status} className="w-full bg-[#1e2341] border border-white/10 rounded-lg py-2 px-3 focus:outline-none">
                                    <option value="upcoming">Upcoming</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-gray-300">Start Date</label>
                                    <input name="start_date" type="date" className="w-full bg-[#1e2341] border border-white/10 rounded-lg py-2 px-3 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-gray-300">End Date</label>
                                    <input name="end_date" type="date" className="w-full bg-[#1e2341] border border-white/10 rounded-lg py-2 px-3 focus:outline-none" />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setEditingTournament(null)} className="flex-1 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-500 hover:bg-primary rounded-lg shadow-md transition font-bold">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}

export default ManageTournaments;
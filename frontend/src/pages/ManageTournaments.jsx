  import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, authFetch } from '../../config/api';
import { useSearch } from '../../context/SearchContext';

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
        try {
            const formData = new FormData(e.target);
            const updates = Object.fromEntries(formData.entries());
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
        <div className="max-w-[1200px] mx-auto text-black dark:text-white pb-12 pt-6">
            <div className="w-full bg-gradient-to-r from-[#5b5bff]/90 via-[#312e81] to-[#0b1220]/50 dark:to-[#090e17] rounded-2xl py-12 px-10 mb-10 shadow-lg relative overflow-hidden">
                <h1 className="font-bold text-3xl md:text-[34px] text-white mb-8 tracking-wide relative z-10">One Centralized Panel for Management</h1>
                <div className="flex flex-wrap gap-4 relative z-10">
                    <button onClick={() => navigate('/admin/users')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Manage Users</button>
                    <button onClick={() => navigate('/admin/content')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Manage Q's</button>
                    <button onClick={() => navigate('/admin/tournaments')} className="px-6 py-1.5 rounded-full border-2 border-[#818cf8] bg-[#5b5bff] text-white font-semibold text-sm shadow-md">Manage Tournaments</button>
                    <button onClick={() => navigate('/admin/reports')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Reports</button>
                </div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#5b5bff]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[17px] font-bold tracking-wider uppercase text-gray-800 dark:text-white">MANAGE TOURNAMENT</h2>
                    <button
                        onClick={() => navigate('/admin/create-tournament')}
                        className="bg-[#5b5bff] hover:bg-[#4f4fe5] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md"
                    >
                        + Create New
                    </button>
                </div>

                {loading ? (
                    <div className="text-center text-gray-400 py-12">Loading tournaments...</div>
                ) : tournaments.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                        <p className="text-lg mb-2">No tournaments yet</p>
                        <p className="text-sm">Create your first tournament to get started</p>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-center border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-gray-300 dark:border-gray-600 text-gray-500 dark:text-[#a1a1aa] text-[13px] font-bold tracking-wider uppercase">
                                    <th className="py-3 px-4 w-[100px] text-left">Sr . no</th>
                                    <th className="py-3 px-4 w-[250px]">QUIZ NAME</th>
                                    <th className="py-3 px-4 w-[200px]">SUBJECT</th>
                                    <th className="py-3 px-4 w-[200px]">PARTICIPANTS</th>
                                    <th className="py-3 px-4">ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTournaments.map((t, idx) => (
                                    <tr key={t.id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="py-5 px-4 font-bold text-[15px] text-gray-700 dark:text-gray-300 text-left">{idx + 1}</td>
                                        <td className="py-5 px-4 font-bold text-[15px] text-gray-700 dark:text-gray-300 uppercase">{t.name}</td>
                                        <td className="py-5 px-4 font-bold text-[15px] text-gray-700 dark:text-gray-300">{t.subject}</td>
                                        <td className="py-5 px-4 font-bold text-[15px] text-gray-700 dark:text-gray-300">{t.participants}</td>
                                        <td className="py-5 px-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => handleEnd(t.id)} disabled={t.status === 'completed'}
                                                    className={`px-8 py-2 w-[140px] rounded-full border-[1.5px] border-white font-bold text-[13px] uppercase tracking-wide transition shadow-md ${t.status === 'completed' ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-[#5b5bff]/80 text-white hover:bg-[#5b5bff]'}`}>
                                                    {t.status === 'completed' ? 'ENDED' : 'END'}
                                                </button>
                                                <button onClick={() => setEditingTournament(t)} className="px-6 py-2 w-[140px] rounded-full border-[1.5px] border-white bg-transparent text-gray-800 dark:text-white font-bold text-[13px] uppercase tracking-wide hover:bg-white/10 transition">UPDATE</button>
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
                                <button type="submit" className="flex-1 py-2 bg-[#5b5bff] hover:bg-[#4f4fe5] rounded-lg shadow-md transition font-bold">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageTournaments;
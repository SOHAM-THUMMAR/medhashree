import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { API_BASE, authFetch, authUpload } from '../../config/api';

function CreateTournament() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({ category: '', subject: '', topic: '', difficulty: 'Medium', question_count: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState('');

    const handleUploadClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
    const handleFileChange = (e) => { if (e.target.files[0]) setSelectedFile(e.target.files[0]); };
    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const handleCreate = async () => {
        setCreating(true);
        setMessage('');
        try {
            // First create tournament
            const res = await authFetch(`${API_BASE}/tournaments`, {
                method: 'POST',
                body: JSON.stringify({
                    name: `${formData.subject || 'Quiz'}-HUNT`,
                    description: `Tournament for ${formData.topic || formData.subject || 'General'}`,
                    subject: formData.subject,
                    category_id: parseInt(formData.category) || null,
                    difficulty: formData.difficulty,
                    total_questions: parseInt(formData.question_count) || 50,
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                })
            });
            const data = await res.json();

            // If CSV file selected, upload it too
            if (selectedFile) {
                const fd = new FormData();
                fd.append('csvFile', selectedFile);
                fd.append('subject', formData.subject);
                if (formData.category) fd.append('categoryId', formData.category);
                fd.append('topic', formData.topic);
                fd.append('micro_topic', formData.micro_topic);
                fd.append('isTournament', 'true');
                await authUpload(`${API_BASE}/quizzes/upload`, fd);
            }

            if (data.success) {
                setMessage('Tournament created successfully!');
                setFormData({ subject: '', micro_topic: '', topic: '', question_count: '' });
                setSelectedFile(null);
            } else {
                setMessage(data.error || 'Failed to create tournament');
            }
        } catch {
            setMessage('Cannot connect to server');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-[1100px] mx-auto text-black dark:text-white pb-12 pt-6 px-4 md:px-0">
            <div className="w-full bg-gradient-to-r from-indigo-500/90 via-primary-darker to-brand-dark/50 dark:to-[#090e17] rounded-2xl py-12 px-10 mb-12 shadow-lg relative overflow-hidden">
                <h1 className="font-bold text-3xl md:text-[34px] text-white mb-8 tracking-wide relative z-10">One Centralized Panel for Management</h1>
                <div className="flex flex-wrap gap-4 relative z-10">
                    <button onClick={() => navigate('/admin/users')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">mange users</button>
                    <button onClick={() => navigate('/admin/content')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">manage Q's</button>
                    <button onClick={() => navigate('/admin/tournaments')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">manage tournaments</button>
                    <button onClick={() => navigate('/admin/reports')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Reports</button>
                </div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            </div>

            {message && (
                <div className={`text-center p-3 rounded-lg mb-6 text-sm font-semibold ${message.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{message}</div>
            )}

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 justify-between items-start">
                <div className="w-full lg:w-[45%]">
                    <h2 className="text-lg md:text-[17px] font-bold mb-6 text-gray-800 dark:text-white uppercase tracking-wider">CREATE TOURNAMENT</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                        <div className="flex flex-col">
                            <label className="text-gray-900 dark:text-white font-semibold mb-2 text-[15px]">Category ID</label>
                            <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. 1" className="bg-gray-300 dark:bg-[#475569] border-none rounded-lg h-12 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-gray-900 dark:text-white font-semibold mb-2 text-[15px]">Subject</label>
                            <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="bg-gray-300 dark:bg-[#475569] border-none rounded-lg h-12 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-gray-900 dark:text-white font-semibold mb-2 text-[15px]">Topic</label>
                            <input type="text" name="topic" value={formData.topic} onChange={handleChange} className="bg-gray-300 dark:bg-[#475569] border-none rounded-lg h-12 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-gray-900 dark:text-white font-semibold mb-2 text-[15px]">Difficulty</label>
                            <select name="difficulty" value={formData.difficulty} onChange={handleChange} className="bg-gray-300 dark:bg-[#475569] border-none rounded-lg h-12 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-gray-900 dark:text-white font-semibold mb-2 text-[15px]">Question Count</label>
                            <input type="number" name="question_count" value={formData.question_count} onChange={handleChange} className="bg-gray-300 dark:bg-[#475569] border-none rounded-lg h-12 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center w-full lg:w-[50%] mt-4 lg:mt-0">
                    <button className="bg-indigo-500 hover:bg-primary text-white font-semibold text-[15px] py-3.5 px-10 rounded-[14px] shadow-md transition-all mb-10 w-[350px]">Download Sample Q File here</button>
                    <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-white tracking-wide">Add your questions below !</h2>
                    <div onClick={handleUploadClick} className="w-full h-[220px] bg-[#4b5563]/30 border-2 border-dashed border-gray-400 dark:border-gray-500 rounded-3xl flex items-center justify-center p-8 cursor-pointer hover:bg-[#4b5563]/50 transition-colors mb-8 shadow-sm">
                        {selectedFile ? (
                            <p className="text-lg font-semibold text-green-400 text-center">✅ {selectedFile.name}<br /><span className="text-sm text-gray-400">Click to change</span></p>
                        ) : (
                            <p className="text-xl md:text-[22px] font-semibold text-gray-700 dark:text-white text-center leading-[1.4] tracking-wide">Upload .csv file for<br />larger amount of questions</p>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                    </div>
                    <button onClick={handleCreate} disabled={creating} className="w-full bg-[#64748b] hover:bg-[#475569] disabled:bg-[#64748b]/50 text-gray-200 font-semibold py-3.5 px-6 rounded-full shadow-md transition-all text-[15px] tracking-wide max-w-[450px]">
                        {creating ? 'Creating...' : 'Create Tournament Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateTournament;
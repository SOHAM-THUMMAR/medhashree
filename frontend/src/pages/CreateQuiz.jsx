import { useRef, useState, useEffect } from 'react';
import { API_BASE, authUpload, authFetch } from '../config/api';

function CreateQuiz() {
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({ subject: '', topic: '', micro_topic: '', question_count: '', isSolvedPaper: false });
    const [categories, setCategories] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await authFetch(`${API_BASE}/self-study`);
                const data = await res.json();
                if (data.success) {
                    setCategories(data.data);
                    if (data.data.length > 0) {
                        setFormData(prev => ({ ...prev, subject: data.data[0].name }));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleUploadClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) setSelectedFile(e.target.files[0]);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateQuiz = async () => {
        if (!selectedFile) {
            setMessage('Please select a CSV file first');
            return;
        }

        setUploading(true);
        setMessage('');

        try {
            const fd = new FormData();
            fd.append('csvFile', selectedFile);
            fd.append('subject', formData.subject);
            fd.append('topic', formData.topic);
            fd.append('micro_topic', formData.micro_topic);
            fd.append('isSolvedPaper', String(formData.isSolvedPaper));

            const response = await authUpload(`${API_BASE}/quizzes/upload`, fd);
            const data = await response.json();

            if (data.success) {
                setMessage(`Quiz created! ${data.data.insertedCount} questions uploaded.`);
                setSelectedFile(null);
                setFormData({ 
                    subject: categories.length > 0 ? categories[0].name : '', 
                    topic: '', 
                    micro_topic: '', 
                    question_count: '',
                    isSolvedPaper: false
                });
            } else {
                setMessage(data.error || 'Upload failed');
            }
        } catch (err) {
            setMessage('Cannot connect to server. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto text-gray-900 dark:text-white pb-20 pt-6 px-4 md:px-6">

            {/* Banner */}
            <div className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 rounded-3xl py-14 px-10 mb-12 shadow-xl relative overflow-hidden">
                <h1 className="font-bold text-3xl md:text-[34px] text-white mb-4 tracking-wide relative z-10">
                    Share Your Knowledge: Create a Custom<br />Quiz and Challenge the Community
                </h1>
                <p className="text-indigo-200 text-[15px] font-medium tracking-wide relative z-10">
                    Build specialized mock tests for any category in just a few minutes.
                </p>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            </div>

            {message && (
                <div className={`text-center p-3 rounded-xl mb-6 text-sm font-semibold ${message.includes('created') || message.includes('uploaded') ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
                    {message}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 justify-between items-start">

                {/* Left Column: Upload Questions Form */}
                <div className="w-full lg:w-[45%]">
                    <h2 className="text-lg md:text-xl font-bold mb-6 text-gray-800 dark:text-white uppercase tracking-wider">
                        UPLOAD QUESTIONS
                    </h2>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                        <div className="flex flex-col">
                            <label className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-[15px]">Subject / Category</label>
                            <select
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                className="bg-gray-50 dark:bg-brand-surfaceAlt text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            >
                                <option value="" disabled className="text-gray-500">Select a Category</option>
                                {categories.map(cat => (
                                    <option key={cat.category_id} value={cat.name} className="bg-white dark:bg-brand-surface text-gray-900 dark:text-white">
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-[15px]">Micro-Topic</label>
                            <input
                                type="text"
                                name="micro_topic"
                                value={formData.micro_topic}
                                onChange={handleChange}
                                className="bg-gray-50 dark:bg-brand-surfaceAlt text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-[15px]">Topic</label>
                            <input
                                type="text"
                                name="topic"
                                value={formData.topic}
                                onChange={handleChange}
                                className="bg-gray-50 dark:bg-brand-surfaceAlt text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-[15px]">Question Count</label>
                            <input
                                type="text"
                                name="question_count"
                                value={formData.question_count}
                                onChange={handleChange}
                                className="bg-gray-50 dark:bg-brand-surfaceAlt text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>
                        {isAdmin && (
                            <div className="col-span-2 flex items-center bg-indigo-550/10 dark:bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mt-2">
                                <input
                                    type="checkbox"
                                    id="isSolvedPaper"
                                    name="isSolvedPaper"
                                    checked={formData.isSolvedPaper}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isSolvedPaper: e.target.checked }))}
                                    className="w-5 h-5 text-indigo-600 bg-gray-50 border-gray-300 dark:border-white/10 rounded focus:ring-indigo-500 cursor-pointer dark:bg-gray-700"
                                />
                                <label htmlFor="isSolvedPaper" className="ml-3 text-gray-800 dark:text-white font-semibold text-sm cursor-pointer select-none">
                                    Mark as Solved Question Paper (Instant Publish & Blog Format)
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Upload Box and Buttons */}
                <div className="flex flex-col items-center w-full lg:w-[50%] mt-4 lg:mt-0">
                    {/* Download Button */}
                    <button className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold py-3 px-10 rounded-full shadow-lg shadow-indigo-500/20 transition-all mb-10 w-fit text-sm">
                        Download Sample Q File here
                    </button>

                    {/* Question Section */}
                    <h2 className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-white">
                        Add your questions below !
                    </h2>

                    {/* Upload Box */}
                    <div
                        onClick={handleUploadClick}
                        className="w-full h-[220px] bg-gray-50/50 dark:bg-brand-surfaceAlt/20 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-brand-surfaceAlt/40 transition-all mb-8 shadow-sm group"
                    >
                        {selectedFile ? (
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400 text-center">
                                ✅ {selectedFile.name}<br />
                                <span className="text-sm text-gray-500 dark:text-gray-400">Click to change file</span>
                            </p>
                        ) : (
                            <p className="text-xl md:text-2xl font-semibold text-gray-650 dark:text-gray-200 text-center leading-relaxed">
                                Upload .csv file for<br />larger amount of questions
                            </p>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Create Quiz Button */}
                    <button
                        onClick={handleCreateQuiz}
                        disabled={uploading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-indigo-600/50 text-white font-semibold py-3.5 px-6 rounded-full shadow-lg shadow-indigo-500/20 transition-all text-base max-w-[450px]"
                    >
                        {uploading ? 'Uploading...' : 'Create Quiz Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateQuiz;

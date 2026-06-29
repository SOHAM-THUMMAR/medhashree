import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, authFetch } from '../../config/api';

function UploadSolvedPaper() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [categories, setCategories] = useState([]);
    
    // Form details
    const [formData, setFormData] = useState({
        subject: '',
        topic: '',
        micro_topic: '',
        year: new Date().getFullYear(),
        month: 'May',
        hasImages: false
    });
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [questionImages, setQuestionImages] = useState({}); // { [index]: base64Data }
    const [optionImages, setOptionImages] = useState({}); // { [index]: { A: base64, B: base64, C: base64, D: base64 } }
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

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

    // Bulletproof RFC-4180 vanilla CSV parser
    const parseCSVText = (text) => {
        const lines = [];
        let row = [""];
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    row[row.length - 1] += '"';
                    i++; // skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push('');
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
                lines.push(row);
                row = [''];
            } else {
                row[row.length - 1] += char;
            }
        }
        if (row.length > 1 || row[0] !== '') {
            lines.push(row);
        }
        return lines;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setParsedQuestions([]);
        setQuestionImages({});
        setMessage('');
        setErrorMsg('');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvData = event.target.result;
                const rows = parseCSVText(csvData);
                if (rows.length < 2) {
                    setErrorMsg('CSV file is empty or invalid.');
                    return;
                }

                // Map header names to indices
                const headers = rows[0].map(h => h.toLowerCase().trim());
                
                let questionIdx = headers.findIndex(h => h === 'full_question_text' || h.includes('full_question_text'));
                if (questionIdx === -1) {
                    questionIdx = headers.findIndex(h => h.includes('question_text'));
                }
                if (questionIdx === -1) {
                    questionIdx = headers.findIndex(h => h.includes('question') && !h.includes('id') && !h.includes('code') && !h.includes('index') && !h.includes('no') && !h.includes('ind'));
                }
                const optAIdx = headers.findIndex(h => h.includes('option_a') || h === 'a');
                const optBIdx = headers.findIndex(h => h.includes('option_b') || h === 'b');
                const optCIdx = headers.findIndex(h => h.includes('option_c') || h === 'c');
                const optDIdx = headers.findIndex(h => h.includes('option_d') || h === 'd');
                const correctIdx = headers.findIndex(h => h.includes('correct_answer') || h.includes('answer'));
                const hintIdx = headers.findIndex(h => h.includes('hint'));
                const explanationIdx = headers.findIndex(h => h.includes('explanation'));
                let diffIdx = headers.findIndex(h => h === 'difficulty_label' || h.includes('difficulty_label'));
                if (diffIdx === -1) {
                    diffIdx = headers.findIndex(h => h.includes('difficulty') && !h.includes('concept') && !h.includes('calculation') && !h.includes('logical') && !h.includes('visual') && !h.includes('overall'));
                }
                if (diffIdx === -1) {
                    diffIdx = headers.findIndex(h => h.includes('difficulty') || h.includes('level'));
                }
                const conceptIdx = headers.findIndex(h => h.includes('concept'));

                if (questionIdx === -1 || correctIdx === -1) {
                    setErrorMsg('CSV must contain at least "full_question_text" and "correct_answer" headers.');
                    return;
                }

                const questionsList = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row.length <= 1 && row[0] === '') continue; // skip empty rows

                    const optA = optAIdx !== -1 ? row[optAIdx] : '';
                    const optB = optBIdx !== -1 ? row[optBIdx] : '';
                    const optC = optCIdx !== -1 ? row[optCIdx] : '';
                    const optD = optDIdx !== -1 ? row[optDIdx] : '';

                    let corr = correctIdx !== -1 ? row[correctIdx].trim() : 'A';
                    // If the correct answer matches the full option text, map it to the corresponding letter!
                    if (corr.toLowerCase() === optA.toLowerCase() && optA) corr = 'A';
                    else if (corr.toLowerCase() === optB.toLowerCase() && optB) corr = 'B';
                    else if (corr.toLowerCase() === optC.toLowerCase() && optC) corr = 'C';
                    else if (corr.toLowerCase() === optD.toLowerCase() && optD) corr = 'D';
                    else {
                        // Safe fallback: if it's "option a" or "option_a" or "a", normalize it to "A"
                        const cleanCorr = corr.toUpperCase().replace(/[^A-D]/g, '');
                        if (cleanCorr && cleanCorr.length === 1) {
                            corr = cleanCorr;
                        } else {
                            const firstChar = corr.charAt(0).toUpperCase();
                            if (['A', 'B', 'C', 'D'].includes(firstChar)) {
                                corr = firstChar;
                            } else {
                                corr = 'A'; // fallback
                            }
                        }
                    }

                    let diff = diffIdx !== -1 ? row[diffIdx].trim() : 'Medium';
                    if (diff) {
                        if (diff === '1' || diff === '2') diff = 'Easy';
                        else if (diff === '3') diff = 'Medium';
                        else if (diff === '4' || diff === '5') diff = 'Hard';
                        else if (diff.toLowerCase() === 'moderate') diff = 'Medium';
                        else if (diff.toLowerCase() === 'expert' || diff.toLowerCase() === 'difficult') diff = 'Hard';
                        
                        diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
                    }
                    if (!['Easy', 'Medium', 'Hard'].includes(diff)) {
                        diff = 'Medium'; // default fallback for safety
                    }

                    questionsList.push({
                        full_question_text: row[questionIdx] || '',
                        option_a: optA,
                        option_b: optB,
                        option_c: optC,
                        option_d: optD,
                        correct_answer: corr,
                        hint: hintIdx !== -1 ? row[hintIdx] : '',
                        explanation: explanationIdx !== -1 ? row[explanationIdx] : '',
                        difficulty_label: diff,
                        primary_concept: conceptIdx !== -1 ? row[conceptIdx] : ''
                    });
                }

                if (questionsList.length === 0) {
                    setErrorMsg('No valid question rows found in CSV.');
                } else {
                    setParsedQuestions(questionsList);
                    setMessage(`Successfully parsed ${questionsList.length} questions from CSV! Headers matched - Question Column: "${rows[0][questionIdx]}", Correct Answer Column: "${rows[0][correctIdx]}".`);
                }
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to parse CSV file.');
            }
        };
        reader.readAsText(file);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageUpload = (index, file) => {
        if (!file) return;

        // Verify type is image
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        // Limit size to 2MB to keep base64 storage fast
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be smaller than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setQuestionImages(prev => ({
                ...prev,
                [index]: e.target.result // base64 string
            }));
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (index) => {
        setQuestionImages(prev => {
            const copy = { ...prev };
            delete copy[index];
            return copy;
        });
    };

    const handleOptionImageUpload = (index, optKey, file) => {
        if (!file) return;

        // Verify type is image
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        // Limit size to 2MB to keep base64 storage fast
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be smaller than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setOptionImages(prev => {
                const currentQuestionOpts = prev[index] || {};
                return {
                    ...prev,
                    [index]: {
                        ...currentQuestionOpts,
                        [optKey]: e.target.result // base64 string
                    }
                };
            });
        };
        reader.readAsDataURL(file);
    };

    const removeOptionImage = (index, optKey) => {
        setOptionImages(prev => {
            const currentQuestionOpts = { ...(prev[index] || {}) };
            delete currentQuestionOpts[optKey];
            return {
                ...prev,
                [index]: currentQuestionOpts
            };
        });
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleSubmit = async () => {
        if (parsedQuestions.length === 0) {
            setErrorMsg('Please select and parse a valid CSV file first.');
            return;
        }

        setUploading(true);
        setMessage('');
        setErrorMsg('');

        try {
            // Attach base64 images to questions list
            const finalQuestions = parsedQuestions.map((q, idx) => {
                const optImg = optionImages[idx] || {};
                
                const getOptionValue = (textVal, imgVal) => {
                    if (textVal && imgVal) {
                        return JSON.stringify({ text: textVal, image: imgVal });
                    }
                    return imgVal || textVal || '';
                };

                return {
                    ...q,
                    question_image_url: questionImages[idx] || null,
                    option_a: getOptionValue(q.option_a, optImg.A),
                    option_b: getOptionValue(q.option_b, optImg.B),
                    option_c: getOptionValue(q.option_c, optImg.C),
                    option_d: getOptionValue(q.option_d, optImg.D)
                };
            });

            const payload = {
                subject: formData.subject,
                topic: formData.topic,
                micro_topic: formData.micro_topic,
                year: formData.year,
                month: formData.month,
                isSolvedPaper: true,
                questions: finalQuestions
            };

            const response = await authFetch(`${API_BASE}/quizzes/upload-json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                setMessage(`🎉 Solved PYQ Paper created! ${data.data.insertedCount} questions uploaded successfully.`);
                setSelectedFile(null);
                setParsedQuestions([]);
                setQuestionImages({});
                setOptionImages({});
                setFormData({
                    subject: categories.length > 0 ? categories[0].name : '',
                    topic: '',
                    micro_topic: '',
                    year: new Date().getFullYear(),
                    month: 'May',
                    hasImages: false
                });
            } else {
                setErrorMsg(data.error || 'Upload failed');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Cannot connect to server. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto text-gray-900 dark:text-white pb-20 pt-6 px-4 md:px-6">
            
            {/* Beautiful Banner */}
            <div className="w-full bg-gradient-to-r from-violet-600 via-indigo-700 to-indigo-900 rounded-3xl py-14 px-10 mb-12 shadow-xl relative overflow-hidden">
                <span className="inline-block bg-white/10 border border-white/20 text-indigo-200 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                    Solved PYQs Publisher
                </span>
                <h1 className="font-bold text-3xl md:text-[34px] text-white mb-4 tracking-wide relative z-10 leading-tight">
                    Publish Solved Previous Year<br />Question Papers
                </h1>
                <p className="text-indigo-200 text-[15px] font-medium tracking-wide relative z-10 max-w-xl leading-relaxed">
                    Instantly publish completely solved exam papers to the archive. Users will study step-by-step math rendering, hints, and explanations in deep blog layouts.
                </p>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            </div>

            {/* Notification Boxes */}
            {message && (
                <div className="p-4 rounded-2xl mb-6 text-sm font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 shadow-sm animate-pulse">
                    {message}
                </div>
            )}
            {errorMsg && (
                <div className="p-4 rounded-2xl mb-6 text-sm font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-sm">
                    {errorMsg}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-12 justify-between items-start">
                
                {/* Left Side: Details Form & CSV Upload */}
                <div className="w-full lg:w-[48%] space-y-8">
                    <div className="bg-white dark:bg-[#0d0e16]/60 border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl backdrop-blur-xl">
                        <h2 className="text-lg font-bold mb-6 text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-4 bg-indigo-500 rounded-full"></span> Details & Settings
                        </h2>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Subject dropdown */}
                            <div className="flex flex-col col-span-2 md:col-span-1">
                                <label className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-[14px]">Exam / Subject</label>
                                <select
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleFormChange}
                                    className="bg-gray-50 dark:bg-brand-surfaceAlt text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                >
                                    {categories.map(cat => (
                                        <option key={cat.category_id} value={cat.name}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Year input */}
                            <div className="flex flex-col col-span-2 md:col-span-1">
                                <label className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-[14px]">Which Year is it?</label>
                                <input
                                    type="number"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleFormChange}
                                    placeholder="e.g. 2026"
                                    className="bg-gray-50 dark:bg-brand-surfaceAlt text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm font-semibold"
                                />
                            </div>

                            {/* Month field */}
                            <div className="flex flex-col col-span-2 md:col-span-1">
                                <label className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-[14px]">Exam Month</label>
                                <select
                                    name="month"
                                    value={formData.month}
                                    onChange={handleFormChange}
                                    className="bg-gray-50 dark:bg-brand-surfaceAlt text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                >
                                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Topic */}
                            <div className="flex flex-col col-span-2 md:col-span-1">
                                <label className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-[14px]">Paper Code / Topic</label>
                                <input
                                    type="text"
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Session 1, Code A"
                                    className="bg-gray-50 dark:bg-brand-surfaceAlt text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                />
                            </div>

                            {/* Micro-topic */}
                            <div className="flex flex-col col-span-2">
                                <label className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-[14px]">Paper Description (Micro-topic)</label>
                                <input
                                    type="text"
                                    name="micro_topic"
                                    value={formData.micro_topic}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Official NEET Chemistry & Physics solved set"
                                    className="bg-gray-50 dark:bg-brand-surfaceAlt text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl h-12 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                />
                            </div>

                            {/* Has images checkbox */}
                            <div className="col-span-2 flex items-center bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl mt-2 hover:bg-indigo-500/10 transition-colors">
                                <input
                                    type="checkbox"
                                    id="hasImages"
                                    name="hasImages"
                                    checked={formData.hasImages}
                                    onChange={handleFormChange}
                                    className="w-5 h-5 text-indigo-600 bg-gray-50 border-gray-300 dark:border-white/10 rounded focus:ring-indigo-500 cursor-pointer dark:bg-gray-700"
                                />
                                <label htmlFor="hasImages" className="ml-3 text-gray-800 dark:text-white font-semibold text-sm cursor-pointer select-none">
                                    Does it have images? (Map base64 images question-by-question)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* CSV Upload Dropzone */}
                    <div className="bg-white dark:bg-[#0d0e16]/60 border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl backdrop-blur-xl">
                        <h2 className="text-lg font-bold mb-6 text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-4 bg-indigo-500 rounded-full"></span> Upload CSV File
                        </h2>

                        <div
                            onClick={handleUploadClick}
                            className="w-full h-[200px] bg-gray-50/50 dark:bg-brand-surfaceAlt/20 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-brand-surfaceAlt/40 hover:border-indigo-500/50 dark:hover:border-indigo-500/30 transition-all shadow-sm group"
                        >
                            {selectedFile ? (
                                <p className="text-base font-semibold text-green-600 dark:text-green-400 text-center leading-relaxed">
                                    ✅ {selectedFile.name}<br />
                                    <span className="text-xs text-gray-400 mt-2 block">Click or drag another CSV to replace</span>
                                </p>
                            ) : (
                                <p className="text-md font-semibold text-gray-650 dark:text-gray-200 text-center leading-relaxed">
                                    📁 Click or Drag & Drop .csv file here<br />
                                    <span className="text-xs text-gray-400 mt-2 block font-normal">Parsed immediately on client side</span>
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
                    </div>
                </div>

                {/* Right Side: Question List & Image Mapper */}
                <div className="w-full lg:w-[48%] bg-white dark:bg-[#0d0e16]/60 border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-xl backdrop-blur-xl min-h-[500px] flex flex-col">
                    <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-4 bg-indigo-500 rounded-full"></span> Question List & Image Mapper
                    </h2>

                    {parsedQuestions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-400 border border-dashed border-gray-200 dark:border-white/5 rounded-2xl bg-gray-50/20 dark:bg-brand-surfaceAlt/10">
                            <span className="text-5xl mb-4">📝</span>
                            <p className="text-sm font-semibold">No questions loaded.</p>
                            <p className="text-xs text-gray-500 max-w-[280px] text-center mt-2 leading-relaxed">
                                Upload a questions CSV file on the left. The parsed question list will render here.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">
                                Parse successful! Showing all <strong>{parsedQuestions.length}</strong> questions below.
                                {formData.hasImages && " Map images for individual questions before saving."}
                            </p>

                            {/* Scrollable Questions Container */}
                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 flex-1 mb-8">
                                {parsedQuestions.map((q, idx) => (
                                    <div key={idx} className="border border-gray-150 dark:border-white/5 p-5 rounded-2xl bg-gray-50/50 dark:bg-brand-surfaceAlt/25 hover:border-indigo-500/20 dark:hover:border-indigo-500/10 transition-colors">
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-white/5 pb-2">
                                            <span className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-black px-2.5 py-1 rounded-lg">
                                                Q. {idx + 1}
                                            </span>
                                            <span className="text-[11px] font-extrabold uppercase bg-gray-200/50 dark:bg-white/5 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                                {q.difficulty_label}
                                            </span>
                                        </div>

                                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-4">
                                            {q.full_question_text}
                                        </p>

                                        {/* Dynamic Image Uploader per Question */}
                                        {formData.hasImages && (
                                            <div className="border-t border-gray-200 dark:border-white/5 pt-4 mt-3 space-y-4">
                                                <div>
                                                    <label className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400/90 tracking-wider block mb-2 leading-relaxed">
                                                        Attach Illustration for Q{idx + 1}: <span className="font-semibold text-gray-700 dark:text-gray-300 italic">"{q.full_question_text}"</span>
                                                    </label>

                                                    {questionImages[idx] ? (
                                                        <div className="relative w-fit border border-gray-200 dark:border-white/10 rounded-xl p-1 bg-white dark:bg-brand-surfaceAlt">
                                                            <img
                                                                src={questionImages[idx]}
                                                                alt={`Preview for Q${idx + 1}: ${q.full_question_text}`}
                                                                className="h-28 w-auto rounded-lg object-cover"
                                                            />
                                                            <button
                                                                onClick={() => removeImage(idx)}
                                                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs hover:bg-red-700 shadow-md transition-colors"
                                                                title="Delete image"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="file"
                                                                id={`q-img-${idx}`}
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleImageUpload(idx, e.target.files[0])}
                                                            />
                                                            <label
                                                                htmlFor={`q-img-${idx}`}
                                                                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
                                                            >
                                                                🖼️ Question Image
                                                            </label>
                                                            <span className="text-[11px] text-gray-400">Add illustration</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Option Images Grid */}
                                                <div>
                                                    <label className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400/90 tracking-wider block mb-2">
                                                        Attach Option Images (A, B, C, D)
                                                    </label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {['A', 'B', 'C', 'D'].map(optKey => {
                                                            const optImg = optionImages[idx]?.[optKey];
                                                            const optionTextVal = q[`option_${optKey.toLowerCase()}`];
                                                            return (
                                                                <div key={optKey} className="border border-gray-250 dark:border-white/5 p-3 rounded-xl bg-white dark:bg-brand-surfaceAlt/10 flex flex-col gap-2">
                                                                    <span className="text-[10px] font-bold text-gray-500 leading-relaxed truncate" title={optionTextVal || ''}>
                                                                        Option {optKey}: <span className="font-semibold text-gray-700 dark:text-gray-300 italic">{optionTextVal || '(empty)'}</span>
                                                                    </span>
                                                                    
                                                                    {optImg ? (
                                                                        <div className="relative w-fit border border-gray-200 dark:border-white/10 rounded-lg p-0.5 bg-white dark:bg-brand-surfaceAlt">
                                                                            <img
                                                                                src={optImg}
                                                                                alt={`Preview Q${idx + 1} Opt ${optKey}`}
                                                                                className="h-16 w-auto rounded object-cover"
                                                                            />
                                                                            <button
                                                                                onClick={() => removeOptionImage(idx, optKey)}
                                                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold text-[10px] hover:bg-red-700 shadow-md transition-colors"
                                                                                title="Delete image"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col gap-1">
                                                                            <input
                                                                                type="file"
                                                                                id={`opt-${optKey}-img-${idx}`}
                                                                                accept="image/*"
                                                                                className="hidden"
                                                                                onChange={(e) => handleOptionImageUpload(idx, optKey, e.target.files[0])}
                                                                            />
                                                                            <label
                                                                                htmlFor={`opt-${optKey}-img-${idx}`}
                                                                                className="bg-indigo-650 hover:bg-indigo-750 active:scale-95 text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer text-center transition-all"
                                                                            >
                                                                                🖼️ Add Image {optKey}
                                                                            </label>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Upload solved paper action */}
                            <button
                                onClick={handleSubmit}
                                disabled={uploading}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] disabled:from-indigo-600/50 disabled:to-indigo-600/50 text-white font-bold py-4 px-6 rounded-full shadow-lg shadow-indigo-600/20 transition-all text-[15px] flex items-center justify-center gap-2 mt-auto"
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Publishing Exam Paper...
                                    </>
                                ) : (
                                    '🚀 Publish Solved Question Paper Now'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UploadSolvedPaper;

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE, authFetch } from '../../config/api';
import { useSearch } from '../../context/SearchContext';

const parseOptionValue = (val) => {
  if (!val) return { text: '', image: null };
  const strVal = String(val).trim();
  if (strVal.startsWith('{') && strVal.endsWith('}')) {
    try {
      const parsed = JSON.parse(strVal);
      if (parsed.text !== undefined || parsed.image !== undefined) {
        return { text: parsed.text || '', image: parsed.image || null };
      }
    } catch (e) {
      // Fallback
    }
  }
  if (strVal.startsWith('data:image/')) {
    return { text: '', image: strVal };
  }
  return { text: strVal, image: null };
};

function ManageContent() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { debouncedQuery } = useSearch();
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [questions, setQuestions] = useState([]);

    // Edit question state
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editForm, setEditForm] = useState({
        full_question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
        correct_answer: '', hint: ''
    });
    const [saving, setSaving] = useState(false);

    // Dynamic Separation and Metadata States
    const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' or 'papers'
    const [editingMetadata, setEditingMetadata] = useState(null);
    const [metadataForm, setMetadataForm] = useState({
        file_name: '', subject: '', topic: '', micro_topic: '',
        year: '', month: '', status: 'Draft', is_solved_paper: false
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await authFetch(`${API_BASE}/self-study`);
                const data = await res.json();
                if (data.success) setCategories(data.data);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await authFetch(`${API_BASE}/admin/content`);
                const data = await res.json();
                if (data.success && data.data.length > 0) {
                    setQuizzes(data.data.map(f => ({
                        id: f.file_id,
                        title: f.file_name || `${f.subject || 'Quiz'} - ${f.topic || 'Set'}`,
                        category: f.subject || 'General',
                        questions: f.question_count,
                        status: f.status || 'Draft',
                        isSolvedPaper: f.is_solved_paper,
                        uploadedAt: f.uploaded_at,
                        subject: f.subject || '',
                        topic: f.topic || '',
                        microTopic: f.micro_topic || '',
                        year: f.year || '',
                        month: f.month || '',
                        fileName: f.file_name || ''
                    })));
                } else {
                    setQuizzes([]);
                }
            } catch (err) {
                console.error('Failed to fetch content:', err);
                setQuizzes([]);
            }
        };
        fetchContent();
    }, []);

    // ─── FIXED QUIZZES (EXPLORE QUIZZES) STATE & LOGIC ───
    const [fixedQuizzes, setFixedQuizzes] = useState([]);
    const [showFixedForm, setShowFixedForm] = useState(false);
    const [presetStyle, setPresetStyle] = useState('indigo');
    const [fixedSubjects, setFixedSubjects] = useState([]);
    const [fixedTopics, setFixedTopics] = useState([]);
    const [fixedMicroTopics, setFixedMicroTopics] = useState([]);
    const [fixedQuizForm, setFixedQuizForm] = useState({
        quiz_id: null,
        title: '',
        category_id: '',
        subject_id: '',
        topic_id: '',
        micro_topic_id: '',
        question_count: 10,
        gradient_from: '#4f46e5',
        gradient_to: '#06b6d4',
        border_color: '#6366f1'
    });

    const fetchFixedQuizzes = async () => {
        try {
            const res = await authFetch(`${API_BASE}/fixed-quizzes`);
            const data = await res.json();
            if (data.success) {
                setFixedQuizzes(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch fixed quizzes:', err);
        }
    };

    useEffect(() => {
        fetchFixedQuizzes();
    }, []);

    const presets = {
        indigo: { f: '#4f46e5', t: '#06b6d4', b: '#6366f1' },
        fuchsia: { f: '#d946ef', t: '#8b5cf6', b: '#a855f7' },
        violet: { f: '#7c3aed', t: '#db2777', b: '#c084fc' },
        emerald: { f: '#059669', t: '#3b82f6', b: '#34d399' },
        amber: { f: '#d97706', t: '#f43f5e', b: '#fbbf24' },
        rose: { f: '#e11d48', t: '#d946ef', b: '#fda4af' }
    };

    const handlePresetStyleChange = (preset) => {
        setPresetStyle(preset);
        if (preset !== 'custom' && presets[preset]) {
            setFixedQuizForm(prev => ({
                ...prev,
                gradient_from: presets[preset].f,
                gradient_to: presets[preset].t,
                border_color: presets[preset].b
            }));
        }
    };

    const handleCategoryChange = async (catId) => {
        setFixedQuizForm(prev => ({ ...prev, category_id: catId, subject_id: '', topic_id: '', micro_topic_id: '' }));
        setFixedSubjects([]);
        setFixedTopics([]);
        setFixedMicroTopics([]);
        if (catId) {
            try {
                const res = await authFetch(`${API_BASE}/self-study/${catId}/subjects`);
                const data = await res.json();
                if (data.success) setFixedSubjects(data.data);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSubjectChange = async (subId) => {
        setFixedQuizForm(prev => ({ ...prev, subject_id: subId, topic_id: '', micro_topic_id: '' }));
        setFixedTopics([]);
        setFixedMicroTopics([]);
        if (subId) {
            try {
                const res = await authFetch(`${API_BASE}/subjects/${subId}/topics`);
                const data = await res.json();
                if (data.success) setFixedTopics(data.data);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleTopicChange = async (topicId) => {
        setFixedQuizForm(prev => ({ ...prev, topic_id: topicId, micro_topic_id: '' }));
        setFixedMicroTopics([]);
        if (topicId) {
            try {
                const res = await authFetch(`${API_BASE}/topics/${topicId}/micro-topics`);
                const data = await res.json();
                if (data.success) setFixedMicroTopics(data.data);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleCreateNewFixedQuiz = () => {
        setPresetStyle('indigo');
        setFixedSubjects([]);
        setFixedTopics([]);
        setFixedMicroTopics([]);
        setFixedQuizForm({
            quiz_id: null,
            title: '',
            category_id: '',
            subject_id: '',
            topic_id: '',
            micro_topic_id: '',
            question_count: 10,
            gradient_from: '#4f46e5',
            gradient_to: '#06b6d4',
            border_color: '#6366f1'
        });
        setShowFixedForm(true);
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        const action = searchParams.get('action');
        if (tab === 'fixed') {
            setActiveTab('fixed');
            if (action === 'new') {
                handleCreateNewFixedQuiz();
            }
        }
    }, [searchParams]);

    const handleStartEditFixed = async (quiz) => {
        setPresetStyle('custom');
        
        // Load subjects for the category
        if (quiz.category_id) {
            try {
                const res = await authFetch(`${API_BASE}/self-study/${quiz.category_id}/subjects`);
                const data = await res.json();
                if (data.success) setFixedSubjects(data.data);
            } catch (err) { console.error(err); }
        }
        
        // Load topics for the subject
        if (quiz.subject_id) {
            try {
                const res = await authFetch(`${API_BASE}/subjects/${quiz.subject_id}/topics`);
                const data = await res.json();
                if (data.success) setFixedTopics(data.data);
            } catch (err) { console.error(err); }
        }
        
        // Load microtopics for the topic
        if (quiz.topic_id) {
            try {
                const res = await authFetch(`${API_BASE}/topics/${quiz.topic_id}/micro-topics`);
                const data = await res.json();
                if (data.success) setFixedMicroTopics(data.data);
            } catch (err) { console.error(err); }
        }
        
        // Check matching preset
        let matchedPreset = 'custom';
        for (const [name, colors] of Object.entries(presets)) {
            if (quiz.gradient_from === colors.f && quiz.gradient_to === colors.t) {
                matchedPreset = name;
                break;
            }
        }
        setPresetStyle(matchedPreset);

        setFixedQuizForm({
            quiz_id: quiz.quiz_id,
            title: quiz.title,
            category_id: quiz.category_id || '',
            subject_id: quiz.subject_id || '',
            topic_id: quiz.topic_id || '',
            micro_topic_id: quiz.micro_topic_id || '',
            question_count: quiz.question_count || 10,
            gradient_from: quiz.gradient_from || '#4f46e5',
            gradient_to: quiz.gradient_to || '#06b6d4',
            border_color: quiz.border_color || '#6366f1'
        });
        
        setShowFixedForm(true);
    };

    const handleSaveFixedQuiz = async () => {
        if (!fixedQuizForm.title.trim()) {
            alert('Title is required for the quiz card.');
            return;
        }

        setSaving(true);
        try {
            const isEdit = fixedQuizForm.quiz_id !== null;
            const url = isEdit 
                ? `${API_BASE}/fixed-quizzes/${fixedQuizForm.quiz_id}`
                : `${API_BASE}/fixed-quizzes`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fixedQuizForm)
            });
            const data = await res.json();

            if (data.success) {
                await fetchFixedQuizzes();
                setShowFixedForm(false);
            } else {
                alert(data.message || 'Failed to save quiz card');
            }
        } catch (err) {
            console.error('Failed to save fixed quiz:', err);
            alert('Error saving fixed quiz');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFixedQuiz = async (id) => {
        if (!window.confirm('Are you sure you want to delete this explore quiz card?')) return;
        try {
            const res = await authFetch(`${API_BASE}/fixed-quizzes/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setFixedQuizzes(fixedQuizzes.filter(q => q.quiz_id !== id));
            } else {
                alert(data.message || 'Failed to delete');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditQuiz = async (fileId) => {
        setEditingQuiz(fileId);
        try {
            const res = await authFetch(`${API_BASE}/admin/content/${fileId}/questions`);
            const data = await res.json();
            if (data.success) {
                setQuestions(data.data.map(q => ({
                    id: q.question_id,
                    text: q.full_question_text,
                    options: { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d },
                    correctKey: q.correct_answer?.charAt(0) || 'A',
                    correctValue: q.correct_answer,
                    isRevealed: false,
                    hint: q.hint || q.explanation || 'No hint available',
                    createdAt: q.created_at
                })));
            }
        } catch (err) {
            console.error('Failed to fetch questions:', err);
            setQuestions([]);
        }
    };

    const startEditMetadata = (quiz) => {
        setEditingMetadata(quiz.id);
        setMetadataForm({
            file_name: quiz.fileName || quiz.title,
            subject: quiz.subject || quiz.category,
            topic: quiz.topic || '',
            micro_topic: quiz.microTopic || '',
            year: quiz.year || '',
            month: quiz.month || '',
            status: quiz.status || 'Draft',
            is_solved_paper: quiz.isSolvedPaper || false
        });
    };

    const saveMetadataEdit = async () => {
        if (!metadataForm.file_name.trim() || !metadataForm.subject.trim()) {
            alert('File title and self study path (subject) are required.');
            return;
        }
        setSaving(true);
        try {
            const res = await authFetch(`${API_BASE}/admin/content/${editingMetadata}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metadataForm)
            });
            const data = await res.json();
            if (data.success) {
                // Update local state immediately
                setQuizzes(quizzes.map(q => q.id === editingMetadata ? {
                    ...q,
                    title: data.data.file_name || `${data.data.subject} - ${data.data.topic}`,
                    category: data.data.subject || 'General',
                    subject: data.data.subject || '',
                    topic: data.data.topic || '',
                    microTopic: data.data.micro_topic || '',
                    year: data.data.year || '',
                    month: data.data.month || '',
                    status: data.data.status || 'Draft',
                    isSolvedPaper: data.data.is_solved_paper,
                    uploadedAt: data.data.uploaded_at,
                    fileName: data.data.file_name
                } : q));
                setEditingMetadata(null);
            } else {
                alert(data.message || 'Failed to update metadata');
            }
        } catch (err) {
            console.error('Failed to update metadata:', err);
            alert('Failed to update metadata');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm('Delete this quiz file and all its questions?')) return;
        try {
            const res = await authFetch(`${API_BASE}/admin/content/${fileId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setQuizzes(quizzes.filter(q => q.id !== fileId));
            }
        } catch (err) {
            console.error('Failed to delete content:', err);
        }
    };

    const handleDeleteQuestion = async (questionId) => {
        try {
            const res = await authFetch(`${API_BASE}/admin/questions/${questionId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setQuestions(questions.filter(q => q.id !== questionId));
            }
        } catch (err) {
            console.error('Failed to delete question:', err);
        }
    };

    // ─── EDIT QUESTION HANDLERS ──────────────────────────────────
    const startEditQuestion = (q) => {
        setEditingQuestion(q.id);
        setEditForm({
            full_question_text: q.text || '',
            option_a: q.options?.A || '',
            option_b: q.options?.B || '',
            option_c: q.options?.C || '',
            option_d: q.options?.D || '',
            correct_answer: q.correctValue || '',
            hint: q.hint || ''
        });
    };

    const cancelEditQuestion = () => {
        setEditingQuestion(null);
        setEditForm({ full_question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', hint: '' });
    };

    const saveEditQuestion = async (questionId) => {
        if (!editForm.full_question_text.trim() || !editForm.option_a.trim() || !editForm.option_b.trim() || !editForm.correct_answer.trim()) {
            alert('Question text, options A & B, and correct answer are required.');
            return;
        }
        setSaving(true);
        try {
            const res = await authFetch(`${API_BASE}/admin/questions/${questionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (data.success) {
                // Update local state immediately
                setQuestions(questions.map(q => q.id === questionId ? {
                    ...q,
                    text: editForm.full_question_text,
                    options: { A: editForm.option_a, B: editForm.option_b, C: editForm.option_c, D: editForm.option_d },
                    correctValue: editForm.correct_answer,
                    correctKey: editForm.correct_answer.charAt(0) || 'A',
                    hint: editForm.hint
                } : q));
                setEditingQuestion(null);
            } else {
                alert(data.message || 'Failed to update question');
            }
        } catch (err) {
            console.error('Failed to update question:', err);
            alert('Failed to update question');
        } finally {
            setSaving(false);
        }
    };

    const toggleReveal = (id) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, isRevealed: !q.isRevealed } : q));
    };

    // ─── SEARCH FILTERING ────────────────────────────────────────
    const activeList = quizzes.filter(q => activeTab === 'papers' ? q.isSolvedPaper : !q.isSolvedPaper);
    const filteredQuizzes = debouncedQuery
        ? activeList.filter(q =>
            q.title.toLowerCase().includes(debouncedQuery) ||
            q.category.toLowerCase().includes(debouncedQuery)
          )
        : activeList;

    const filteredQuestions = debouncedQuery
        ? questions.filter(q => q.text.toLowerCase().includes(debouncedQuery))
        : questions;

    return (
        <div className="max-w-[1200px] mx-auto text-black dark:text-white pb-12 pt-6 px-4 lg:px-0">

            {/* Banner */}
            <div className="w-full bg-gradient-to-r from-indigo-500/90 via-primary-darker to-brand-dark/50 dark:to-[#090e17] rounded-2xl py-12 px-10 mb-10 shadow-lg relative overflow-hidden">
                <h1 className="font-bold text-3xl md:text-[34px] text-white mb-8 tracking-wide relative z-10">One Centralized Panel for Management</h1>
                <div className="flex flex-wrap gap-4 relative z-10">
                    <button onClick={() => navigate('/admin/users')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">mange users</button>
                    <button onClick={() => navigate('/admin/content')} className="px-6 py-1.5 rounded-full border-2 border-primary-light bg-indigo-500 text-white font-semibold text-sm shadow-md">manage Q's</button>
                    <button onClick={() => navigate('/admin/self-study')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">manage self study</button>
                    <button onClick={() => navigate('/admin/tournaments')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">manage tournaments</button>
                    <button onClick={() => navigate('/admin/reports')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Reports</button>
                </div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            </div>

            {editingMetadata !== null ? (
                /* ─── EDIT METADATA MODE ─── */
                <div className="bg-white dark:bg-brand-surfaceAlt border border-gray-250 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl max-w-[800px] mx-auto text-left">
                    <h2 className="text-xl font-black mb-6 text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                        <span>📝</span> Edit {metadataForm.is_solved_paper ? 'Question Paper' : 'Quiz'} Details
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="flex flex-col col-span-1 md:col-span-2">
                            <label className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-xs uppercase tracking-wider">File / Quiz Title</label>
                            <input
                                type="text"
                                value={metadataForm.file_name}
                                onChange={e => setMetadataForm({ ...metadataForm, file_name: e.target.value })}
                                className="bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-xs uppercase tracking-wider">Self Study Path (Subject)</label>
                            <select
                                value={metadataForm.subject}
                                onChange={e => setMetadataForm({ ...metadataForm, subject: e.target.value })}
                                className="bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-black dark:text-white"
                            >
                                <option value="" disabled>Select Path</option>
                                {categories.map(c => (
                                    <option key={c.category_id} value={c.name} className="bg-white dark:bg-[#1a1d2e] text-black dark:text-white">{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-xs uppercase tracking-wider">Topic / Paper Code</label>
                            <input
                                type="text"
                                value={metadataForm.topic}
                                onChange={e => setMetadataForm({ ...metadataForm, topic: e.target.value })}
                                className="bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex flex-col col-span-1 md:col-span-2">
                            <label className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-xs uppercase tracking-wider">Description (Micro-topic)</label>
                            <input
                                type="text"
                                value={metadataForm.micro_topic}
                                onChange={e => setMetadataForm({ ...metadataForm, micro_topic: e.target.value })}
                                className="bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-xs uppercase tracking-wider">Year</label>
                            <input
                                type="number"
                                value={metadataForm.year || ''}
                                onChange={e => setMetadataForm({ ...metadataForm, year: e.target.value })}
                                className="bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-xs uppercase tracking-wider">Month</label>
                            <select
                                value={metadataForm.month || ''}
                                onChange={e => setMetadataForm({ ...metadataForm, month: e.target.value })}
                                className="bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-black dark:text-white"
                            >
                                <option value="">None</option>
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                    <option key={m} value={m} className="bg-white dark:bg-[#1a1d2e] text-black dark:text-white">{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-xs uppercase tracking-wider">Status</label>
                            <select
                                value={metadataForm.status}
                                onChange={e => setMetadataForm({ ...metadataForm, status: e.target.value })}
                                className="bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl h-12 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-black dark:text-white"
                            >
                                <option value="Draft" className="bg-white dark:bg-[#1a1d2e] text-black dark:text-white">Draft</option>
                                <option value="Published" className="bg-white dark:bg-[#1a1d2e] text-black dark:text-white">Published</option>
                                <option value="Archived" className="bg-white dark:bg-[#1a1d2e] text-black dark:text-white">Archived</option>
                            </select>
                        </div>

                        <div className="flex items-center col-span-1 md:col-span-2 mt-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl hover:bg-indigo-500/10 transition-colors">
                            <input
                                type="checkbox"
                                id="is_solved_paper"
                                checked={metadataForm.is_solved_paper}
                                onChange={e => setMetadataForm({ ...metadataForm, is_solved_paper: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 bg-gray-50 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="is_solved_paper" className="ml-3 text-gray-855 dark:text-gray-200 font-extrabold text-sm cursor-pointer select-none">
                                Is this a Solved Question Paper? (Displays in public catalog)
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={saveMetadataEdit}
                            disabled={saving}
                            className="bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 disabled:opacity-50 text-white font-bold py-3.5 px-8 rounded-full text-sm transition-all shadow-lg shadow-indigo-600/10"
                        >
                            {saving ? 'Saving...' : 'Save Details'}
                        </button>
                        <button
                            onClick={() => setEditingMetadata(null)}
                            className="border border-gray-300 dark:border-white/10 hover:bg-gray-150 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 font-bold py-3.5 px-8 rounded-full text-sm transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : editingQuiz === null ? (
                /* ─── LIST VIEW MODE ─── */
                <div>
                    {/* Management Tab Switchers */}
                    <div className="flex flex-wrap gap-4 border-b border-gray-200 dark:border-white/10 pb-4 mb-8">
                        <button
                            onClick={() => { setActiveTab('quizzes'); setShowFixedForm(false); }}
                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                activeTab === 'quizzes'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 border border-indigo-600'
                                    : 'bg-white dark:bg-brand-surfaceAlt text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                        >
                            📁 Manage Quizzes
                        </button>
                        <button
                            onClick={() => { setActiveTab('papers'); setShowFixedForm(false); }}
                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                activeTab === 'papers'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 border border-indigo-600'
                                    : 'bg-white dark:bg-brand-surfaceAlt text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                        >
                            📜 Manage Question Papers
                        </button>
                        <button
                            onClick={() => { setActiveTab('fixed'); setShowFixedForm(false); }}
                            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                activeTab === 'fixed'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 border border-indigo-600'
                                    : 'bg-white dark:bg-brand-surfaceAlt text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                        >
                            🎯 Manage Explore Quizzes
                        </button>
                    </div>

                    <h2 className="text-xl font-extrabold uppercase tracking-widest text-gray-800 dark:text-white mb-6 flex items-center gap-2 text-left">
                        {activeTab === 'papers' 
                            ? '📜 Existing Question Papers' 
                            : activeTab === 'fixed' 
                                ? '🎯 Explore Quiz Cards' 
                                : '📁 Existing Quizzes'}
                    </h2>
                    
                    {activeTab === 'fixed' ? (
                        /* ─── FIXED QUIZZES tab content ─── */
                        showFixedForm ? (
                            <div className="bg-white dark:bg-brand-surface border border-gray-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl max-w-[900px] mx-auto text-left">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
                                    <h3 className="text-lg font-black tracking-widest uppercase text-indigo-500">
                                        {fixedQuizForm.quiz_id ? '✏️ Edit Explore Quiz Card' : '✨ Create Explore Quiz Card'}
                                    </h3>
                                    <button 
                                        onClick={() => setShowFixedForm(false)}
                                        className="text-xs font-bold border border-gray-300 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full px-4 py-2 transition text-gray-600 dark:text-gray-300"
                                    >
                                        &larr; Cancel
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    {/* Form Fields - 3 Columns */}
                                    <div className="lg:col-span-3 space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Quiz Card Title</label>
                                            <input 
                                                type="text" 
                                                value={fixedQuizForm.title} 
                                                onChange={e => setFixedQuizForm({ ...fixedQuizForm, title: e.target.value })}
                                                placeholder="e.g. React 19 RSC Challenge"
                                                className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white outline-none focus:border-indigo-500 transition"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Self Study Path</label>
                                                <select 
                                                    value={fixedQuizForm.category_id}
                                                    onChange={e => handleCategoryChange(e.target.value)}
                                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white outline-none focus:border-indigo-500 transition"
                                                >
                                                    <option value="">Select Path (All)</option>
                                                    {categories.map(c => (
                                                        <option key={c.category_id} value={c.category_id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Subject</label>
                                                <select 
                                                    value={fixedQuizForm.subject_id}
                                                    onChange={e => handleSubjectChange(e.target.value)}
                                                    disabled={!fixedQuizForm.category_id}
                                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white outline-none focus:border-indigo-500 transition disabled:opacity-50"
                                                >
                                                    <option value="">Select Subject (All)</option>
                                                    {fixedSubjects.map(s => (
                                                        <option key={s.subject_id} value={s.subject_id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Topic</label>
                                                <select 
                                                    value={fixedQuizForm.topic_id}
                                                    onChange={e => handleTopicChange(e.target.value)}
                                                    disabled={!fixedQuizForm.subject_id}
                                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white outline-none focus:border-indigo-500 transition disabled:opacity-50"
                                                >
                                                    <option value="">Select Topic (All)</option>
                                                    {fixedTopics.map(t => (
                                                        <option key={t.topic_id} value={t.topic_id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Microtopic / Subtopic</label>
                                                <select 
                                                    value={fixedQuizForm.micro_topic_id}
                                                    onChange={e => setFixedQuizForm({ ...fixedQuizForm, micro_topic_id: e.target.value })}
                                                    disabled={!fixedQuizForm.topic_id}
                                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white outline-none focus:border-indigo-500 transition disabled:opacity-50"
                                                >
                                                    <option value="">Select Microtopic (All)</option>
                                                    {fixedMicroTopics.map(mt => (
                                                        <option key={mt.micro_topic_id} value={mt.micro_topic_id}>{mt.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Question Count</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="50"
                                                    value={fixedQuizForm.question_count}
                                                    onChange={e => setFixedQuizForm({ ...fixedQuizForm, question_count: Math.max(1, parseInt(e.target.value) || 10) })}
                                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white outline-none focus:border-indigo-500 transition"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Styling Preset</label>
                                                <select 
                                                    value={presetStyle}
                                                    onChange={e => handlePresetStyleChange(e.target.value)}
                                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-250 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white outline-none focus:border-indigo-500 transition"
                                                >
                                                    <option value="indigo">✨ Electric Indigo</option>
                                                    <option value="fuchsia">🔮 Vibrant Fuchsia</option>
                                                    <option value="violet">🧬 Mystic Violet</option>
                                                    <option value="emerald">🌿 Deep Emerald</option>
                                                    <option value="amber">🔥 Glowing Amber</option>
                                                    <option value="rose">💖 Neon Rose</option>
                                                    <option value="custom">🛠️ Custom Styling</option>
                                                </select>
                                            </div>
                                        </div>

                                        {presetStyle === 'custom' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-brand-surfaceAlt/30 border border-gray-250 dark:border-white/5 rounded-2xl p-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Gradient From</label>
                                                    <input 
                                                        type="text" 
                                                        value={fixedQuizForm.gradient_from}
                                                        onChange={e => setFixedQuizForm({ ...fixedQuizForm, gradient_from: e.target.value })}
                                                        className="w-full bg-white dark:bg-brand-surface border border-gray-250 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-black dark:text-white outline-none focus:border-indigo-500 font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Gradient To</label>
                                                    <input 
                                                        type="text" 
                                                        value={fixedQuizForm.gradient_to}
                                                        onChange={e => setFixedQuizForm({ ...fixedQuizForm, gradient_to: e.target.value })}
                                                        className="w-full bg-white dark:bg-brand-surface border border-gray-250 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-black dark:text-white outline-none focus:border-indigo-500 font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Border Color</label>
                                                    <input 
                                                        type="text" 
                                                        value={fixedQuizForm.border_color}
                                                        onChange={e => setFixedQuizForm({ ...fixedQuizForm, border_color: e.target.value })}
                                                        className="w-full bg-white dark:bg-brand-surface border border-gray-250 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-black dark:text-white outline-none focus:border-indigo-500 font-mono"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleSaveFixedQuiz}
                                            disabled={saving}
                                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest transition shadow-lg shadow-indigo-600/10 disabled:opacity-50 mt-6"
                                        >
                                            {saving ? 'Saving...' : '💾 Save Explore Quiz Card'}
                                        </button>
                                    </div>

                                    {/* Preview - 2 Columns */}
                                    <div className="lg:col-span-2 flex flex-col justify-start">
                                        <label className="block text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider text-left">Live Card Preview</label>
                                        <div 
                                            style={{
                                                background: `linear-gradient(135deg, ${fixedQuizForm.gradient_from}, ${fixedQuizForm.gradient_to})`,
                                                borderColor: fixedQuizForm.border_color,
                                                borderWidth: '1px'
                                            }}
                                            className="group relative rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full min-h-[170px] text-white overflow-hidden text-left w-full"
                                        >
                                            {/* Glow reflect overlays */}
                                            <div className="absolute inset-0 bg-black/5 dark:bg-black/10"></div>
                                            <div className="absolute top-0 right-0 w-[45%] h-[150%] bg-white/10 blur-[40px] rounded-full pointer-events-none"></div>

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="bg-white/15 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-white/10 backdrop-blur-sm">
                                                        {categories.find(c => String(c.category_id) === String(fixedQuizForm.category_id))?.name || 'General'}
                                                    </span>
                                                    <span className="text-[11px] text-white/80 font-medium">
                                                        {fixedQuizForm.question_count} Questions
                                                    </span>
                                                </div>

                                                <h3 className="font-bold text-white text-sm line-clamp-2 leading-relaxed mb-4 text-left">
                                                    {fixedQuizForm.title || 'Untitled Quiz Card'}
                                                </h3>
                                            </div>

                                            <div className="relative z-10 flex items-center justify-between text-xs text-white/80 pt-3 border-t border-white/15 mt-auto">
                                                <span className="font-mono text-[9px] truncate max-w-[60%]">
                                                    {fixedSubjects.find(s => String(s.subject_id) === String(fixedQuizForm.subject_id))?.name || 'General'} {fixedTopics.find(t => String(t.topic_id) === String(fixedQuizForm.topic_id))?.name ? `➔ ${fixedTopics.find(t => String(t.topic_id) === String(fixedQuizForm.topic_id))?.name}` : ''}
                                                </span>
                                                <span className="font-extrabold text-white flex items-center gap-0.5 whitespace-nowrap">
                                                    Play Quiz <span className="text-[14px]">&rarr;</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium text-left">Create and style fixed quiz templates linked directly to dynamic database question selections.</p>
                                    <button 
                                        onClick={handleCreateNewFixedQuiz}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest px-5 py-3 transition shadow-lg shadow-indigo-600/10 shrink-0 self-start sm:self-auto"
                                    >
                                        ✨ Add Explore Quiz Card
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-brand-surfaceAlt rounded-2xl shadow-sm border border-gray-150 dark:border-gray-800 overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[850px]">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-[#111823] text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                                <th className="py-4 px-6 font-semibold">Title</th>
                                                <th className="py-4 px-6 font-semibold">Hierarchy Filters</th>
                                                <th className="py-4 px-6 font-semibold">Questions</th>
                                                <th className="py-4 px-6 font-semibold">Card Gradient Style</th>
                                                <th className="py-4 px-6 font-semibold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fixedQuizzes.map((quiz) => (
                                                <tr key={quiz.quiz_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors">
                                                    <td className="py-4 px-6 font-bold text-gray-900 dark:text-white">{quiz.title}</td>
                                                    <td className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-450">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-extrabold text-indigo-500 uppercase">{quiz.category_name || 'All Paths'}</span>
                                                            <span className="opacity-90">{quiz.subject_name ? `${quiz.subject_name}` : ''}</span>
                                                            <span className="opacity-75">{quiz.topic_name ? `➔ ${quiz.topic_name}` : ''}</span>
                                                            <span className="opacity-60">{quiz.micro_topic_name ? `➔ ${quiz.micro_topic_name}` : ''}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium">{quiz.question_count} Qs</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <div 
                                                                style={{
                                                                    background: `linear-gradient(135deg, ${quiz.gradient_from}, ${quiz.gradient_to})`,
                                                                    borderColor: quiz.border_color
                                                                }}
                                                                className="w-12 h-6 rounded border shadow-sm shrink-0"
                                                            ></div>
                                                            <span className="font-mono text-[10px]">{quiz.gradient_from} / {quiz.gradient_to}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-semibold text-sm">
                                                        <button 
                                                            onClick={() => handleStartEditFixed(quiz)}
                                                            className="text-emerald-500 font-bold hover:underline mr-4 transition-colors"
                                                        >
                                                            ✏️ Edit Card
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteFixedQuiz(quiz.quiz_id)}
                                                            className="text-red-400 hover:text-red-600 font-bold transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {fixedQuizzes.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                                                        No explore quiz cards created yet. Click "Add Explore Quiz Card" to build one!
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    ) : (
                        /* ─── STANDARD QUIZZES / QUESTION PAPERS LIST TABLE ─── */
                        <div className="bg-white dark:bg-brand-surfaceAlt rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[850px]">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-[#111823] text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                        <th className="py-4 px-6 font-semibold">Title</th>
                                        <th className="py-4 px-6 font-semibold">Self Study Path</th>
                                        <th className="py-4 px-6 font-semibold">Questions</th>
                                        <th className="py-4 px-6 font-semibold">Upload Date</th>
                                        <th className="py-4 px-6 font-semibold">Status</th>
                                        <th className="py-4 px-6 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuizzes.map((quiz) => (
                                        <tr key={quiz.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors">
                                            <td className="py-4 px-6 font-bold text-gray-900 dark:text-white max-w-[280px] truncate" title={quiz.title}>{quiz.title}</td>
                                            <td className="py-4 px-6">
                                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-350 px-3 py-1 rounded text-xs font-bold">{quiz.category}</span>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium">{quiz.questions} Qs</td>
                                            <td className="py-4 px-6 text-gray-600 dark:text-gray-400 text-xs font-semibold">
                                                {quiz.uploadedAt ? new Date(quiz.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Seeded'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${quiz.status === 'Published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                    {quiz.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right font-semibold text-sm">
                                                <button onClick={() => handleEditQuiz(quiz.id)} className="text-indigo-500 font-bold hover:underline mr-4 transition-colors">Edit Q's</button>
                                                <button onClick={() => startEditMetadata(quiz)} className="text-emerald-500 font-bold hover:underline mr-4 transition-colors">✏️ Edit Info</button>
                                                <button onClick={() => handleDeleteFile(quiz.id)} className="text-red-400 hover:text-red-600 font-bold transition-colors">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredQuizzes.length === 0 && (
                                        <tr><td colSpan={6} className="py-12 text-center text-gray-400 font-medium">No items match your query.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* ─── QUESTIONS EDITING SUB-VIEW MODE ─── */
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-[17px] font-black tracking-widest uppercase text-gray-800 dark:text-white flex items-center gap-2">
                            <span>📂</span> QUESTIONS LIST
                        </h2>
                        <button onClick={() => { setEditingQuiz(null); setEditingQuestion(null); }} className="text-xs font-bold border-2 border-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full px-5 py-2 text-gray-600 dark:text-gray-300 transition-all">&larr; Back to Catalog</button>
                    </div>
                    <div className="w-full flex flex-col">
                        <div className="border-t border-gray-200 dark:border-white/5"></div>
                        {filteredQuestions.map((q, index) => (
                            <div key={q.id} className="py-10 border-b border-gray-200 dark:border-white/5">
                                {editingQuestion === q.id ? (
                                    /* ─── SINGLE QUESTION EDIT MODE ─── */
                                    <div className="bg-[#111827] border border-indigo-500/20 rounded-2xl p-6 text-left">
                                        <h3 className="text-xs font-black text-indigo-400 mb-6 uppercase tracking-widest">Editing Question #{index + 1}</h3>
                                        
                                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Question Text</label>
                                        <textarea
                                            value={editForm.full_question_text}
                                            onChange={e => setEditForm({...editForm, full_question_text: e.target.value})}
                                            className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-4 min-h-[80px] outline-none focus:border-indigo-500 transition"
                                        />

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            {['A', 'B', 'C', 'D'].map(key => (
                                                <div key={key}>
                                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Option {key}</label>
                                                    <input
                                                        value={editForm[`option_${key.toLowerCase()}`]}
                                                        onChange={e => setEditForm({...editForm, [`option_${key.toLowerCase()}`]: e.target.value})}
                                                        className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 transition"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Correct Answer</label>
                                                <input
                                                    value={editForm.correct_answer}
                                                    onChange={e => setEditForm({...editForm, correct_answer: e.target.value})}
                                                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 transition"
                                                    placeholder="e.g. Species interaction"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Hint</label>
                                                <input
                                                    value={editForm.hint}
                                                    onChange={e => setEditForm({...editForm, hint: e.target.value})}
                                                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500 transition"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => saveEditQuestion(q.id)}
                                                disabled={saving}
                                                className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-primary text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-50"
                                            >
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                onClick={cancelEditQuestion}
                                                className="px-6 py-2.5 rounded-xl border border-gray-600 text-gray-300 font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ─── SINGLE QUESTION VIEW MODE ─── */
                                    <div className="flex flex-col xl:flex-row gap-8 justify-between items-start text-left">
                                        <div className="flex-1 w-full xl:max-w-[650px]">
                                            <h3 className="font-bold text-[14px] md:text-[15px] mb-8 leading-tight">{index + 1}. {q.text}</h3>
                                            <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 w-full max-w-[500px]">
                                                {Object.entries(q.options).map(([key, val]) => {
                                                    const parsedOpt = parseOptionValue(val);
                                                    return (
                                                        <div key={key} className="flex flex-row items-start text-[12px] md:text-[13px] font-bold border-b border-gray-350 dark:border-white/5 pb-2">
                                                            <span className="w-5 md:w-6 flex-shrink-0 mt-0.5">{key})</span>
                                                            <div className="flex flex-col gap-1 w-full overflow-hidden">
                                                                {parsedOpt.text && <span className="truncate">{parsedOpt.text}</span>}
                                                                {parsedOpt.image && (
                                                                    <img
                                                                        src={parsedOpt.image}
                                                                        alt={`Option ${key}`}
                                                                        className="max-h-16 object-contain rounded border border-gray-200 dark:border-gray-700 bg-white/5 self-start"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div>
                                                {q.isRevealed ? (
                                                    <button onClick={() => toggleReveal(q.id)} className="px-5 py-2.5 rounded-[6px] border border-primary-light bg-indigo-500/20 text-primary-light font-semibold text-[12px] shadow-sm transition tracking-wide">
                                                        {q.correctValue}
                                                    </button>
                                                ) : (
                                                    <button onClick={() => toggleReveal(q.id)} className="px-5 py-2.5 rounded-[6px] border border-gray-400 dark:border-white/15 text-gray-700 dark:text-gray-300 font-semibold text-[12px] hover:bg-gray-100 dark:hover:bg-white/5 transition tracking-wide">
                                                        Reveal Answer
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full xl:w-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 xl:gap-8 xl:border-l border-gray-200 dark:border-white/5 xl:pl-8 pt-4 xl:pt-0">
                                            <div className="text-[11px] text-gray-500 dark:text-[#d4d4d8] font-medium leading-relaxed max-w-[300px] xl:max-w-[260px] flex flex-col gap-3">
                                                <div>
                                                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px] block mb-1">HINT / STUDY BLOCK</span>
                                                    {q.hint}
                                                </div>
                                                {q.createdAt && (
                                                    <div className="text-[10px] text-gray-450 dark:text-[#a1a1aa] font-semibold border-t border-gray-100 dark:border-white/5 pt-2">
                                                        🗓️ Question Uploaded: {new Date(q.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                <button onClick={() => startEditQuestion(q)} className="px-6 py-2.5 rounded-[6px] border-[1.5px] border-indigo-500 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-400 hover:text-white font-bold text-[11px] uppercase tracking-wider transition whitespace-nowrap">
                                                    ✏️ Edit Question
                                                </button>
                                                <button onClick={() => handleDeleteQuestion(q.id)} className="px-6 py-2.5 rounded-[6px] border-[1.5px] border-transparent bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-[11px] uppercase tracking-wider transition whitespace-nowrap shadow-md">
                                                    Remove Question
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredQuestions.length === 0 && (
                            <div className="py-12 text-center text-gray-400 font-semibold text-sm">No questions match your query.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageContent;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, authFetch } from '../../config/api';

function ManageCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        gradient_from: '',
        gradient_to: '',
        border_color: '',
        sort_order: 0,
        is_active: true
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const fetchCategories = async () => {
        try {
            const res = await authFetch(`${API_BASE}/categories`);
            const data = await res.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCategories();
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const handleOpenForm = (category = null) => {
        setMessage('');
        if (category) {
            setEditingId(category.category_id);
            setFormData({
                name: category.name || '',
                description: category.description || '',
                gradient_from: category.gradient_from || '',
                gradient_to: category.gradient_to || '',
                border_color: category.border_color || '',
                sort_order: category.sort_order || 0,
                is_active: category.is_active !== false // default true
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                description: '',
                gradient_from: '',
                gradient_to: '',
                border_color: '',
                sort_order: 0,
                is_active: true
            });
        }
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setMessage('Name is required');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const url = editingId 
                ? `${API_BASE}/categories/${editingId}`
                : `${API_BASE}/categories`;
            
            const method = editingId ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                fetchCategories();
                handleCloseForm();
            } else {
                setMessage(data.message || 'Failed to save category');
            }
        } catch (err) {
            console.error('Save Category Error:', err);
            setMessage('Failed to connect to server');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        
        try {
            const res = await authFetch(`${API_BASE}/categories/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            
            if (data.success) {
                setCategories(categories.filter(c => c.category_id !== id));
            } else {
                alert(data.message || 'Failed to delete category');
            }
        } catch (err) {
            console.error('Delete Category Error:', err);
            alert('Failed to delete category');
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto text-black dark:text-white pb-12 pt-6 px-4 lg:px-0">
            {/* Banner */}
            <div className="w-full bg-gradient-to-r from-indigo-500/90 via-primary-darker to-brand-dark/50 dark:to-[#090e17] rounded-2xl py-12 px-10 mb-10 shadow-lg relative overflow-hidden">
                <h1 className="font-bold text-3xl md:text-[34px] text-white mb-8 tracking-wide relative z-10">Manage Categories</h1>
                <div className="flex flex-wrap gap-4 relative z-10">
                    <button onClick={() => navigate('/admin/users')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Manage Users</button>
                    <button onClick={() => navigate('/admin/content')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Manage Q's</button>
                    <button onClick={() => navigate('/admin/categories')} className="px-6 py-1.5 rounded-full border-2 border-primary-light bg-indigo-500 text-white font-semibold text-sm shadow-md">Manage Categories</button>
                    <button onClick={() => navigate('/admin/tournaments')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Manage Tournaments</button>
                    <button onClick={() => navigate('/admin/reports')} className="px-6 py-1.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition">Reports</button>
                </div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            </div>

            {/* Content Area */}
            {!showForm ? (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold uppercase tracking-wider text-gray-800 dark:text-white">Existing Categories</h2>
                        <button 
                            onClick={() => handleOpenForm()} 
                            className="bg-indigo-500 hover:bg-primary text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            + Add Category
                        </button>
                    </div>

                    <div className="bg-white dark:bg-brand-surfaceAlt rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-[#111823] text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                    <th className="py-4 px-6 font-semibold">Name</th>
                                    <th className="py-4 px-6 font-semibold">Description</th>
                                    <th className="py-4 px-6 font-semibold">Status</th>
                                    <th className="py-4 px-6 font-semibold">Sort Order</th>
                                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">Loading categories...</td></tr>
                                ) : categories.length > 0 ? (
                                    categories.map(cat => (
                                        <tr key={cat.category_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#252e3f] transition-colors">
                                            <td className="py-4 px-6 font-bold">{cat.name}</td>
                                            <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[250px]">{cat.description || '-'}</td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${cat.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {cat.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">{cat.sort_order}</td>
                                            <td className="py-4 px-6 text-right">
                                                <button onClick={() => handleOpenForm(cat)} className="text-indigo-500 font-semibold hover:underline mr-4">Edit</button>
                                                <button onClick={() => handleDelete(cat.category_id)} className="text-red-400 hover:text-red-600 font-semibold">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No categories found. Create one above!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-white dark:bg-brand-surfaceAlt rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                        {editingId ? 'Edit Category' : 'Create New Category'}
                    </h2>
                    
                    {message && (
                        <div className={`mb-6 p-3 rounded-lg text-sm font-semibold ${message.includes('success') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Category Name *</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="e.g. Science"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold mb-2">Description</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 min-h-[100px]"
                                placeholder="Brief description of this category..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Gradient From (Hex)</label>
                                <input 
                                    type="text" 
                                    value={formData.gradient_from}
                                    onChange={(e) => setFormData({...formData, gradient_from: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. #3b82f6"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Gradient To (Hex)</label>
                                <input 
                                    type="text" 
                                    value={formData.gradient_to}
                                    onChange={(e) => setFormData({...formData, gradient_to: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. #8b5cf6"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Border Color (Hex)</label>
                                <input 
                                    type="text" 
                                    value={formData.border_color}
                                    onChange={(e) => setFormData({...formData, border_color: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g. #4f46e5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Sort Order</label>
                                <input 
                                    type="number" 
                                    value={formData.sort_order}
                                    onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                                    className="w-full bg-gray-50 dark:bg-[#1a1d2e] border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4">
                            <input 
                                type="checkbox" 
                                id="isActive"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-semibold cursor-pointer">
                                Category is Active
                            </label>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="px-6 py-2.5 bg-indigo-500 hover:bg-primary text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Category'}
                            </button>
                            <button 
                                type="button" 
                                onClick={handleCloseForm}
                                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default ManageCategories;

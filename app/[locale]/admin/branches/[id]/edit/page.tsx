'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditBranchPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(false);
    const [fetchingLoading, setFetchingLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
    });

    useEffect(() => {
        if (id) {
            fetchBranch();
        }
    }, [id]);

    const fetchBranch = async () => {
        try {
            const res = await fetch(`/api/admin/branches/${id}`);
            if (!res.ok) throw new Error('Failed to fetch branch');
            const data = await res.json();
            setFormData({
                name: data.name,
                code: data.code,
                address: data.address || '',
                phone: data.phone || '',
                email: data.email || '',
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setFetchingLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/branches/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update branch');
            }

            router.push('/admin/branches');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading branch...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
                    >
                        ← Back to Branches
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Branch</h1>
                    <p className="text-gray-600 mt-2">Update branch information</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

                        <div className="space-y-4">
                            {/* Branch Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Branch Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Downtown Location, Mall Branch"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Branch Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Branch Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., DT, ML, MAIN"
                                    maxLength={10}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Short unique code for this branch (2-10 characters)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>

                        <div className="space-y-4">
                            {/* Address */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full address of the branch"
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+962 X XXX XXXX"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="branch@althawaq.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {loading ? 'Updating...' : 'Update Branch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

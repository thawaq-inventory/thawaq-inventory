'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Branch {
    id: string;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    isActive: boolean;
    _count: {
        users: number;
        products: number;
        shifts: number;
    };
}

export default function BranchesPage() {
    const router = useRouter();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await fetch('/api/admin/branches');
            if (!res.ok) throw new Error('Failed to fetch branches');
            const data = await res.json();
            setBranches(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleBranchStatus = async (branchId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/admin/branches/${branchId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (!res.ok) throw new Error('Failed to update branch');
            fetchBranches();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading branches...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
                    <p className="text-gray-600 mt-2">Manage all franchise locations</p>
                </div>
                <button
                    onClick={() => router.push('/admin/branches/create')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                    + Create New Branch
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="text-3xl font-bold">{branches.length}</div>
                    <div className="text-blue-100 mt-1">Total Branches</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="text-3xl font-bold">
                        {branches.filter(b => b.isActive).length}
                    </div>
                    <div className="text-green-100 mt-1">Active Branches</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="text-3xl font-bold">
                        {branches.reduce((sum, b) => sum + b._count.users, 0)}
                    </div>
                    <div className="text-purple-100 mt-1">Total Employees</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="text-3xl font-bold">
                        {branches.reduce((sum, b) => sum + b._count.products, 0)}
                    </div>
                    <div className="text-orange-100 mt-1">Total Products</div>
                </div>
            </div>

            {/* Branches List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch) => (
                    <div
                        key={branch.id}
                        className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all border-2 ${branch.isActive ? 'border-green-200' : 'border-gray-200'
                            }`}
                    >
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{branch.name}</h3>
                                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mt-2">
                                        {branch.code}
                                    </span>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${branch.isActive
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {branch.isActive ? '● Active' : '○ Inactive'}
                                </span>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-100">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{branch._count.users}</div>
                                    <div className="text-xs text-gray-600">Employees</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{branch._count.products}</div>
                                    <div className="text-xs text-gray-600">Products</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{branch._count.shifts}</div>
                                    <div className="text-xs text-gray-600">Shifts</div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            {(branch.address || branch.phone || branch.email) && (
                                <div className="space-y-2 mb-4">
                                    {branch.address && (
                                        <div className="flex items-start text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{branch.address}</span>
                                        </div>
                                    )}
                                    {branch.phone && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span>{branch.phone}</span>
                                        </div>
                                    )}
                                    {branch.email && (
                                        <div className="flex items-center text-sm text-gray-600">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>{branch.email}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/admin/branches/${branch.id}/edit`)}
                                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => toggleBranchStatus(branch.id, branch.isActive)}
                                    className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${branch.isActive
                                            ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                                        }`}
                                >
                                    {branch.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {branches.length === 0 && !loading && (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No branches yet</h3>
                    <p className="text-gray-600 mb-6">Create your first branch to get started</p>
                    <button
                        onClick={() => router.push('/admin/branches/create')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Create First Branch
                    </button>
                </div>
            )}
        </div>
    );
}

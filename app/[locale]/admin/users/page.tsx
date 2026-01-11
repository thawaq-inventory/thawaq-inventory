'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Edit, Trash2, Shield, UserPlus, X } from "lucide-react";

interface Branch {
    id: string;
    name: string;
    code: string;
}

interface User {
    id: string;
    name: string;
    username: string;
    role: string;
    isActive: boolean;
    isSuperAdmin: boolean;
    branchId: string | null;
    branch?: Branch | null;
    cliqAlias: string | null;
    hourlyRate: number | null;
    pinCode: string | null;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        pinCode: '',
        role: 'EMPLOYEE',
        isSuperAdmin: false,
        branchId: '',
        cliqAlias: '',
        hourlyRate: '5',
    });

    useEffect(() => {
        fetchUsers();
        fetchBranches();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchBranches = async () => {
        try {
            const res = await fetch('/api/admin/branches');
            const data = await res.json();
            setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            username: '',
            password: '',
            pinCode: '',
            role: 'EMPLOYEE',
            isSuperAdmin: false,
            branchId: '',
            cliqAlias: '',
            hourlyRate: '5',
        });
        setShowForm(false);
        setEditingId(null);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users';
            const method = editingId ? 'PUT' : 'POST';

            const payload: any = {
                name: formData.name,
                username: formData.username,
                role: formData.role,
                isSuperAdmin: formData.isSuperAdmin,
                branchId: formData.isSuperAdmin ? null : (formData.branchId || null),
                cliqAlias: formData.cliqAlias || null,
                hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : 5.0,
                pinCode: formData.pinCode,
            };

            // Only include password if creating new user or editing and password is provided
            if (!editingId || formData.password) {
                payload.password = formData.password || 'temp123';
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save user');
            }

            setSuccess(editingId ? 'User updated successfully' : 'User created successfully');
            resetForm();
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
            setError(error.message || 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user: User) => {
        setEditingId(user.id);
        setFormData({
            name: user.name,
            username: user.username,
            password: '', // Don't prefill password
            pinCode: user.pinCode || '',
            role: user.role,
            isSuperAdmin: user.isSuperAdmin,
            branchId: user.branchId || '',
            cliqAlias: user.cliqAlias || '',
            hourlyRate: user.hourlyRate?.toString() || '5',
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this user?')) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to deactivate user');

            setSuccess('User deactivated successfully');
            fetchUsers();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Failed to deactivate user');
        }
    };

    const getRoleBadge = (user: User) => {
        if (user.isSuperAdmin) {
            return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">👑 Super Admin</span>;
        }
        if (user.role === 'ADMIN') {
            return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">🛡️ Admin</span>;
        }
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">👤 Employee</span>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-600 mt-2">Manage all system users and permissions</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                )}
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    {success}
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {error}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{editingId ? 'Edit User' : 'Add New User'}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        placeholder="john.doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="password">Password {!editingId && formData.role === 'ADMIN' && '*'}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingId && formData.role === 'ADMIN'}
                                    placeholder={editingId ? "Leave blank to keep current" : (formData.role === 'ADMIN' ? "Required for Admins" : "Optional for Employees")}
                                />
                            </div>

                            <div>
                                <Label htmlFor="pinCode">PIN Code * (Required for App Access)</Label>
                                <Input
                                    id="pinCode"
                                    value={formData.pinCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setFormData({ ...formData, pinCode: value });
                                    }}
                                    required
                                    placeholder="4-digit PIN"
                                    maxLength={4}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="role">Role *</Label>
                                    <select
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="branch">Branch</Label>
                                    <select
                                        id="branch"
                                        value={formData.branchId}
                                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                        disabled={formData.isSuperAdmin}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(branch => (
                                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                                        ))}
                                    </select>
                                    {formData.isSuperAdmin && (
                                        <p className="text-xs text-gray-500 mt-1">Super admins don't need a branch</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isSuperAdmin"
                                    checked={formData.isSuperAdmin}
                                    onChange={(e) => setFormData({ ...formData, isSuperAdmin: e.target.checked, branchId: e.target.checked ? '' : formData.branchId })}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="isSuperAdmin" className="cursor-pointer">
                                    👑 Super Admin (Can manage all branches)
                                </Label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="cliqAlias">CliQ Alias</Label>
                                    <Input
                                        id="cliqAlias"
                                        value={formData.cliqAlias}
                                        onChange={(e) => setFormData({ ...formData, cliqAlias: e.target.value })}
                                        placeholder="0790123456 or email@bank"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="hourlyRate">Hourly Rate (JOD)</Label>
                                    <Input
                                        id="hourlyRate"
                                        type="number"
                                        value={formData.hourlyRate}
                                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                        placeholder="5.0"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : (editingId ? 'Update User' : 'Create User')}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Users List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>{users.length} user{users.length !== 1 ? 's' : ''} total</CardDescription>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                            <p>No users yet. Click "Add User" to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            {user.isSuperAdmin ? <Shield className="w-5 h-5 text-purple-600" /> : <Users className="w-5 h-5 text-blue-600" />}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">{user.name}</div>
                                            <div className="text-sm text-slate-500">@{user.username}</div>
                                            {user.pinCode && <div className="text-xs text-slate-400 mt-0.5">PIN: {user.pinCode}</div>}
                                        </div>
                                        {getRoleBadge(user)}
                                        {user.branch && (
                                            <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                                📍 {user.branch.name}
                                            </div>
                                        )}
                                        {!user.isActive && (
                                            <div className="px-2 py-1 bg-red-50 rounded text-xs text-red-700">
                                                Inactive
                                            </div>
                                        )}
                                        {user.cliqAlias && (
                                            <div className="px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
                                                ⚡ {user.cliqAlias}
                                            </div>
                                        )}
                                        {user.hourlyRate && (
                                            <div className="px-2 py-1 bg-green-50 rounded text-xs text-green-700">
                                                {user.hourlyRate} JOD/hr
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(user)}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        {user.isActive && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Deactivate
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Edit, Trash2, Lock, X, UserPlus } from "lucide-react";

interface Employee {
    id: string;
    name: string;
    username: string;
    pinCode: string | null;
    isActive: boolean;
    cliqAlias: string | null;
    hourlyRate: number | null;
    userBranches?: Array<{
        id: string;
        branchId: string;
        branch: {
            id: string;
            name: string;
            code: string;
        };
    }>;
}

interface Branch {
    id: string;
    name: string;
    code: string;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        pinCode: '',
        cliqAlias: '',
        hourlyRate: '5',
        branchIds: [] as string[],
    });

    useEffect(() => {
        fetchEmployees();
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await fetch('/api/admin/branches');
            const data = await res.json();
            setBranches(data);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            const employeeUsers = data.filter((u: any) => u.role === 'employee');
            setEmployees(employeeUsers);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', username: '', pinCode: '', cliqAlias: '', hourlyRate: '5', branchIds: [] });
        setShowForm(false);
        setEditingId(null);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validation
        if (!formData.name || !formData.username) {
            setError('Name and username are required');
            setLoading(false);
            return;
        }

        if (!formData.pinCode || !/^\d{4}$/.test(formData.pinCode)) {
            setError('A 4-digit PIN is required for employee login');
            setLoading(false);
            return;
        }

        // Check for duplicate PIN
        if (formData.pinCode) {
            const duplicatePinEmployee = employees.find(
                emp => emp.pinCode === formData.pinCode && emp.id !== editingId
            );
            if (duplicatePinEmployee) {
                setError(`PIN ${formData.pinCode} is already used by ${duplicatePinEmployee.name}. Please choose a different PIN.`);
                setLoading(false);
                return;
            }
        }

        try {
            const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users';
            const method = editingId ? 'PUT' : 'POST';

            const payload: any = {
                name: formData.name,
                username: formData.username,
                role: 'employee',
                pinCode: formData.pinCode,
                password: 'temp123', // Temporary password (not used by employees)
                cliqAlias: formData.cliqAlias || null,
                hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : 5.0,
                branchIds: formData.branchIds,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                // Handle specific error cases
                if (data.error?.includes('pinCode') || data.error?.includes('Unique constraint')) {
                    throw new Error('This PIN is already in use by another employee. Please choose a different PIN.');
                }
                throw new Error(data.error || 'Failed to save employee');
            }

            setSuccess(editingId ? 'Employee updated successfully' : 'Employee created successfully');
            resetForm();
            fetchEmployees();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
            setError(error.message || 'Failed to save employee');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee: any) => {
        setEditingId(employee.id);
        setFormData({
            name: employee.name,
            username: employee.username,
            pinCode: employee.pinCode || '',
            cliqAlias: employee.cliqAlias || '',
            hourlyRate: employee.hourlyRate?.toString() || '5',
            branchIds: employee.userBranches?.map((ub: any) => ub.branchId) || [],
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to deactivate this employee?')) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to deactivate employee');

            setSuccess('Employee deactivated successfully');
            fetchEmployees();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Failed to deactivate employee');
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Employee Management</h1>
                    <p className="text-slate-600 mt-2">Add and manage employee accounts</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Employee
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
                            <CardTitle>{editingId ? 'Edit Employee' : 'Add New Employee'}</CardTitle>
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
                                <Label htmlFor="pinCode">4-Digit PIN * (Required for mobile app login)</Label>
                                <Input
                                    id="pinCode"
                                    type="text"
                                    value={formData.pinCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setFormData({ ...formData, pinCode: value });
                                    }}
                                    placeholder="1234"
                                    maxLength={4}
                                    required
                                />
                            </div>

                            {/* Branch Assignment */}
                            <div>
                                <Label htmlFor="branches">Assign to Branches *</Label>
                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                                    {branches.map((branch) => (
                                        <label
                                            key={branch.id}
                                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.branchIds.includes(branch.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({
                                                            ...formData,
                                                            branchIds: [...formData.branchIds, branch.id]
                                                        });
                                                    } else {
                                                        setFormData({
                                                            ...formData,
                                                            branchIds: formData.branchIds.filter(id => id !== branch.id)
                                                        });
                                                    }
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">{branch.name} ({branch.code})</span>
                                        </label>
                                    ))}
                                    {branches.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-2">No branches available</p>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Select all branches this employee works at
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="cliqAlias">CliQ Alias (Mobile/Email)</Label>
                                    <Input
                                        id="cliqAlias"
                                        value={formData.cliqAlias}
                                        onChange={(e) => setFormData({ ...formData, cliqAlias: e.target.value })}
                                        placeholder="0790123456 or email@bank"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        For CliQ instant transfers
                                    </p>
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
                                    {loading ? 'Saving...' : (editingId ? 'Update Employee' : 'Create Employee')}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Employee List */}
            <Card>
                <CardHeader>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>{employees.length} employee{employees.length !== 1 ? 's' : ''} total</CardDescription>
                </CardHeader>
                <CardContent>
                    {employees.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                            <p>No employees yet. Click "Add Employee" to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {employees.map((employee) => (
                                <div
                                    key={employee.id}
                                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{employee.name}</h3>
                                            <p className="text-sm text-slate-500">@{employee.username}</p>
                                            {employee.pinCode && (
                                                <p className="text-sm text-blue-600 mt-1">PIN: {employee.pinCode}</p>
                                            )}

                                            {/* Branch Badges */}
                                            {employee.userBranches && employee.userBranches.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {employee.userBranches.map((ub: any) => (
                                                        <span
                                                            key={ub.id}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                                        >
                                                            {ub.branch.name} ({ub.branch.code})
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {employee.pinCode && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-xs text-green-700">
                                                <Lock className="w-3 h-3" />
                                                PIN Set
                                            </div>
                                        )}
                                        {!employee.isActive && (
                                            <div className="px-2 py-1 bg-red-50 rounded text-xs text-red-700">
                                                Inactive
                                            </div>
                                        )}
                                        {employee.cliqAlias && (
                                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
                                                ⚡ CliQ: {employee.cliqAlias}
                                            </div>
                                        )}
                                        {employee.hourlyRate && (
                                            <div className="px-2 py-1 bg-green-50 rounded text-xs text-green-700">
                                                {employee.hourlyRate} JOD/hr
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(employee)}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        {employee.isActive && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(employee.id)}
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

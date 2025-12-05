'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Lock, Plus, Trash2, Edit, CheckCircle } from "lucide-react";

interface Employee {
    id: string;
    name: string;
    username: string;
    pinCode: string | null;
    isActive: boolean;
}

export default function EmployeePinsPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newPin, setNewPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

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

    const handleSetPin = async (employeeId: string) => {
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/admin/users/${employeeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinCode: newPin }),
            });

            if (!res.ok) {
                throw new Error('Failed to set PIN');
            }

            setSuccess('PIN updated successfully');
            setNewPin('');
            setEditingId(null);
            fetchEmployees();
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Failed to update PIN');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Employee PIN Management</h1>
                <p className="text-slate-600 mt-2">Set or update 4-digit PINs for employee login</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">{success}</span>
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-red-800">{error}</span>
                </div>
            )}

            {/* Employee List */}
            <Card>
                <CardHeader>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>Manage employee PINs for mobile access</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
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
                                        <div className="font-semibold text-slate-900">{employee.name}</div>
                                        <div className="text-sm text-slate-500">{employee.username}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {editingId === employee.id ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="text"
                                                value={newPin}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                    setNewPin(value);
                                                    setError('');
                                                }}
                                                placeholder="4-digit PIN"
                                                className="w-32"
                                                maxLength={4}
                                            />
                                            <Button
                                                onClick={() => handleSetPin(employee.id)}
                                                disabled={loading || newPin.length !== 4}
                                                size="sm"
                                            >
                                                Save
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setNewPin('');
                                                    setError('');
                                                }}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-sm">
                                                {employee.pinCode ? (
                                                    <span className="flex items-center gap-2 text-green-600">
                                                        <Lock className="w-4 h-4" />
                                                        PIN Set
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">No PIN</span>
                                                )}
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setEditingId(employee.id);
                                                    setNewPin('');
                                                    setError('');
                                                }}
                                                variant="outline"
                                                size="sm"
                                            >
                                                {employee.pinCode ? 'Change PIN' : 'Set PIN'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Lock } from "lucide-react";

interface Employee {
    id: string;
    name: string;
}

export default function EmployeeLoginPage() {
    const t = useTranslations('Employee');
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employee/list');
            const data = await res.json();
            // Data is already filtered by the API
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handlePinClick = (digit: string) => {
        if (pin.length < 4) {
            setPin(pin + digit);
        }
    };

    const handleClear = () => {
        setPin('');
        setError('');
    };

    const handleLogin = async () => {
        if (!selectedEmployeeId) {
            setError('Please select an employee');
            return;
        }

        if (pin.length !== 4) {
            setError('Please enter a 4-digit PIN');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/employee/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: selectedEmployeeId,
                    pinCode: pin,
                }),
            });

            if (!res.ok) {
                throw new Error('Invalid PIN');
            }

            const data = await res.json();

            // Store employee info in localStorage
            localStorage.setItem('employeeSession', JSON.stringify(data));

            // Redirect to employee home
            router.push('/employee');
        } catch (error) {
            setError('Invalid PIN. Please try again.');
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (pin.length === 4 && selectedEmployeeId) {
            handleLogin();
        }
    }, [pin]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
                    <CardDescription>{t('login.selectEmployee')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Employee Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('login.selectEmployee')}
                        </label>
                        <select
                            value={selectedEmployeeId}
                            onChange={(e) => {
                                setSelectedEmployeeId(e.target.value);
                                setPin('');
                                setError('');
                            }}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                        >
                            <option value="">{t('login.chooseName')}</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* PIN Display */}
                    {selectedEmployeeId && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
                                    {t('login.enterPin')}
                                </label>
                                <div className="flex justify-center gap-3 mb-4">
                                    {[0, 1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="w-14 h-14 rounded-lg border-2 border-slate-300 flex items-center justify-center"
                                        >
                                            {pin[i] && (
                                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PIN Pad */}
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                                    <button
                                        key={digit}
                                        onClick={() => handlePinClick(digit.toString())}
                                        disabled={loading}
                                        className="h-16 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-2xl font-semibold text-slate-900 transition-colors disabled:opacity-50"
                                    >
                                        {digit}
                                    </button>
                                ))}
                                <button
                                    onClick={handleClear}
                                    disabled={loading}
                                    className="h-16 rounded-lg bg-red-100 hover:bg-red-200 active:bg-red-300 text-sm font-medium text-red-700 transition-colors disabled:opacity-50"
                                >
                                    {t('login.clear')}
                                </button>
                                <button
                                    onClick={() => handlePinClick('0')}
                                    disabled={loading}
                                    className="h-16 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-2xl font-semibold text-slate-900 transition-colors disabled:opacity-50"
                                >
                                    0
                                </button>
                                <div className="h-16"></div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Loading */}
                            {loading && (
                                <div className="text-center text-sm text-slate-600">
                                    <Lock className="w-5 h-5 mx-auto mb-2 animate-pulse" />
                                    {t('login.loggingIn')}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

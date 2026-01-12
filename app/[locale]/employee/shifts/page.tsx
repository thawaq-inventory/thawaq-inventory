'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Loader2, CalendarDays } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Shift {
    id: string;
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    role: string;
    notes?: string;
    status: string;
}

export default function EmployeeShiftsPage() {
    const t = useTranslations('Employee');
    const router = useRouter();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [employeeName, setEmployeeName] = useState<string>('');

    useEffect(() => {
        // Check authentication
        const session = localStorage.getItem('employeeSession');
        if (!session) {
            router.push('/employee/login');
            return;
        }

        // Get employee ID from session
        try {
            const sessionData = JSON.parse(session);
            // Support both 'id' (from login API) and 'userId' field names
            const userId = sessionData.id || sessionData.userId;
            const name = sessionData.name || 'Employee';
            setEmployeeName(name);

            if (!userId) {
                console.error('No user ID found in session:', sessionData);
                setError('Session error. Please log in again.');
                return;
            }

            // Fetch shifts for this employee
            fetchShifts(userId);
        } catch (err) {
            console.error('Error parsing session:', err);
            router.push('/employee/login');
        }
    }, [router]);

    async function fetchShifts(userId: string) {
        try {
            setLoading(true);
            setError(null);

            // Get shifts for the next 30 days
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(today.getDate() + 30);

            const startDate = today.toISOString().split('T')[0];
            const endDate = futureDate.toISOString().split('T')[0];

            console.log('Fetching shifts for userId:', userId, 'from', startDate, 'to', endDate);

            const response = await fetch(
                `/api/shifts?userId=${userId}&startDate=${startDate}&endDate=${endDate}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch shifts');
            }

            const data = await response.json();
            console.log('Fetched shifts:', data);
            setShifts(data);
        } catch (err) {
            console.error('Error fetching shifts:', err);
            setError('Failed to load your shifts. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // Calculate total hours for upcoming shifts
    function calculateTotalHours(): number {
        let total = 0;
        shifts.forEach(shift => {
            const [startHour, startMin] = shift.startTime.split(':').map(Number);
            const [endHour, endMin] = shift.endTime.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const hours = (endMinutes - startMinutes) / 60;
            total += hours;
        });
        return total;
    }

    // Format date for display
    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        };
        return date.toLocaleDateString('ar-JO', options);
    }

    // Group shifts by week
    function groupShiftsByWeek(): { [key: string]: Shift[] } {
        const grouped: { [key: string]: Shift[] } = {};

        shifts.forEach(shift => {
            const date = new Date(shift.date);
            const weekStart = getMonday(date);
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!grouped[weekKey]) {
                grouped[weekKey] = [];
            }
            grouped[weekKey].push(shift);
        });

        return grouped;
    }

    function getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    const groupedShifts = groupShiftsByWeek();
    const weekKeys = Object.keys(groupedShifts).sort();

    if (loading) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-slate-50">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/employee')}
                            className="text-slate-600 hover:text-teal-600"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('backToDashboard')}
                        </Button>
                        <LanguageSwitcher />
                    </div>

                    <div className="text-center mb-8">
                        <Logo size="lg" />
                    </div>

                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3 mb-2">
                            <CalendarDays className="w-8 h-8 text-teal-600" />
                            {t('shifts.title')}
                        </h1>
                        <p className="text-slate-600">{t('timesheet.welcomeBack')}, {employeeName}</p>
                    </div>
                </header>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-white">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-teal-600">{shifts.length}</div>
                                <div className="text-sm text-slate-600 mt-1">{t('timesheet.shiftsThisWeek')}</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                        <CardContent className="p-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-blue-600">{calculateTotalHours().toFixed(1)}{t('timesheet.hours')}</div>
                                <div className="text-sm text-slate-600 mt-1">{t('timesheet.hoursWorked')}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Shifts List */}
                {shifts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">{t('shifts.description')}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {weekKeys.map(weekKey => {
                            const weekShifts = groupedShifts[weekKey];
                            const weekStart = new Date(weekKey);
                            const weekEnd = new Date(weekStart);
                            weekEnd.setDate(weekEnd.getDate() + 6);

                            return (
                                <div key={weekKey}>
                                    <h2 className="text-lg font-semibold text-slate-700 mb-3">
                                        {weekStart.toLocaleDateString('ar-JO', { month: 'long', day: 'numeric' })} - {weekEnd.toLocaleDateString('ar-JO', { month: 'long', day: 'numeric' })}
                                    </h2>
                                    <div className="space-y-3">
                                        {weekShifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(shift => (
                                            <Card
                                                key={shift.id}
                                                className="border-slate-200 hover:border-teal-300 hover:shadow-md transition-all"
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Calendar className="w-5 h-5 text-teal-600" />
                                                                <span className="font-semibold text-slate-900">
                                                                    {formatDate(shift.date)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{shift.startTime} - {shift.endTime}</span>
                                                            </div>
                                                            {shift.notes && (
                                                                <div className="mt-2 text-sm text-slate-500">
                                                                    {shift.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                                                                {shift.role}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

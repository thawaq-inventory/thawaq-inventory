'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, LogIn, LogOut, CheckCircle2, MapPin, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface ClockEntry {
    id: string;
    clockInTime: string;
    clockOutTime?: string;
    totalHours?: number;
    branch: {
        id: string;
        name: string;
        code: string;
    };
}

interface ClockStatus {
    isClockedIn: boolean;
    entry: ClockEntry | null;
    elapsedHours?: number;
    lastEntry?: ClockEntry | null;
}

export default function EmployeeTimesheetPage() {
    const t = useTranslations('Employee');
    const router = useRouter();

    const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null);
    const [clockHistory, setClockHistory] = useState<ClockEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [employeeData, setEmployeeData] = useState<{ id: string; name: string; branchId: string } | null>(null);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Load employee data from session
    useEffect(() => {
        const session = localStorage.getItem('employeeSession');
        if (!session) {
            router.push('/employee/login');
            return;
        }

        try {
            const data = JSON.parse(session);
            setEmployeeData({
                id: data.id || data.userId,
                name: data.name || 'Employee',
                branchId: data.branchId || ''
            });
        } catch (err) {
            console.error('Error parsing session:', err);
            router.push('/employee/login');
        }
    }, [router]);

    // Fetch clock status and history
    const fetchClockData = useCallback(async () => {
        if (!employeeData?.id) return;

        try {
            setLoading(true);

            // Fetch current status
            const statusRes = await fetch(`/api/clock/status?userId=${employeeData.id}`);
            if (statusRes.ok) {
                const status = await statusRes.json();
                setClockStatus(status);
            }

            // Fetch recent clock history
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);

            const historyRes = await fetch(
                `/api/clock?userId=${employeeData.id}&startDate=${weekAgo.toISOString().split('T')[0]}`
            );
            if (historyRes.ok) {
                const entries = await historyRes.json();
                setClockHistory(entries);
            }
        } catch (err) {
            console.error('Error fetching clock data:', err);
            setError(t('timesheet.fetchError') || 'Failed to load clock data');
        } finally {
            setLoading(false);
        }
    }, [employeeData?.id, t]);

    useEffect(() => {
        if (employeeData) {
            fetchClockData();
        }
    }, [employeeData, fetchClockData]);

    // Get current location
    const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            reject(new Error('Location permission denied. Please enable location access.'));
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject(new Error('Location unavailable. Please try again.'));
                            break;
                        case error.TIMEOUT:
                            reject(new Error('Location request timed out. Please try again.'));
                            break;
                        default:
                            reject(new Error('An unknown location error occurred.'));
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    };

    // Handle clock in/out
    const handleClockAction = async (action: 'in' | 'out') => {
        if (!employeeData) return;

        setActionLoading(true);
        setError(null);
        setLocationError(null);

        try {
            // Try to get location (may fail if not available)
            let location: { latitude: number; longitude: number } | null = null;
            try {
                location = await getCurrentLocation();
            } catch (locError: any) {
                // Location might not be available, but we'll still try the request
                // The backend will decide if location is required
                setLocationError(locError.message);
            }

            // Get branch ID from employee data or status
            const branchId = employeeData.branchId || clockStatus?.entry?.branch?.id;

            if (!branchId) {
                setError('No branch assigned. Please contact admin.');
                setActionLoading(false);
                return;
            }

            const response = await fetch('/api/clock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: employeeData.id,
                    branchId,
                    action,
                    latitude: location?.latitude,
                    longitude: location?.longitude,
                    source: 'app'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to process clock request');
                return;
            }

            // Success - refresh data
            await fetchClockData();
            setLocationError(null);

        } catch (err: any) {
            console.error('Clock action error:', err);
            setError(err.message || 'Failed to process clock request');
        } finally {
            setActionLoading(false);
        }
    };

    // Calculate week totals
    const getWeekTotal = () => {
        return clockHistory
            .filter(entry => entry.totalHours)
            .reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-JO', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <header className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/employee')}
                        className="text-slate-600 hover:text-blue-600 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('backToDashboard')}
                    </Button>

                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('timesheet.title')}</h1>
                        <p className="text-slate-600">{t('timesheet.welcomeBack')}, {employeeData?.name}! 👋</p>
                    </div>
                </header>

                {/* Error Messages */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {locationError && !error && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-amber-700">
                        <MapPin className="w-5 h-5 flex-shrink-0" />
                        <span>{locationError}</span>
                    </div>
                )}

                {/* Clock In/Out Card */}
                <Card className="border-2 shadow-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
                    <CardContent className="p-8">
                        <div className="text-center">
                            <div className="text-6xl font-bold mb-2 font-mono">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                            </div>
                            <div className="text-blue-100 mb-6">
                                {currentTime.toLocaleDateString('ar-JO', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>

                            {clockStatus?.isClockedIn ? (
                                <div>
                                    <div className="bg-green-500/20 border-2 border-green-300 rounded-lg p-4 mb-4">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <CheckCircle2 className="w-6 h-6" />
                                            <span className="font-semibold">{t('timesheet.currentlyClocked')}</span>
                                        </div>
                                        <div className="text-sm">
                                            {t('timesheet.startedAt')} {formatTime(clockStatus.entry!.clockInTime)}
                                        </div>
                                        <div className="text-lg font-bold mt-2">
                                            {clockStatus.elapsedHours?.toFixed(2)} {t('timesheet.hours')}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleClockAction('out')}
                                        disabled={actionLoading}
                                        size="lg"
                                        className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                        ) : (
                                            <LogOut className="w-6 h-6 mr-3" />
                                        )}
                                        {t('timesheet.clockOut')}
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => handleClockAction('in')}
                                    disabled={actionLoading}
                                    size="lg"
                                    className="bg-white hover:bg-blue-50 text-blue-700 px-8 py-6 text-lg rounded-xl shadow-lg"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                    ) : (
                                        <LogIn className="w-6 h-6 mr-3" />
                                    )}
                                    {t('timesheet.clockIn')}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Week Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold text-blue-600">{clockHistory.length}</div>
                            <div className="text-sm text-gray-600 mt-1">{t('timesheet.shiftsThisWeek')}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold text-green-600">{getWeekTotal().toFixed(1)}h</div>
                            <div className="text-sm text-gray-600 mt-1">{t('timesheet.hoursWorked')}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {clockHistory.filter(e => e.clockOutTime).length}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{t('timesheet.completedShifts')}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Clock History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            {t('timesheet.recentRecords')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {clockHistory.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>No clock records this week</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {clockHistory.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div>
                                            <div className="font-medium text-slate-900">{formatDate(entry.clockInTime)}</div>
                                            <div className="text-sm text-slate-600">
                                                {t('timesheet.in')}: {formatTime(entry.clockInTime)} • {t('timesheet.out')}: {entry.clockOutTime ? formatTime(entry.clockOutTime) : '-'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {entry.totalHours ? (
                                                <div className="text-lg font-bold text-blue-600">
                                                    {entry.totalHours.toFixed(2)}h
                                                </div>
                                            ) : (
                                                <div className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                                    {t('timesheet.in')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

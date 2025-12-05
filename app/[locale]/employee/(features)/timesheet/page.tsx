'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, LogIn, LogOut, CheckCircle2, Circle } from "lucide-react";

interface Shift {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    role: string;
    status: 'upcoming' | 'completed';
}

interface ClockRecord {
    id: string;
    date: string;
    clockIn: string;
    clockOut?: string;
    totalHours?: number;
}

// Sample data for Yanal
const YANAL_SHIFTS: Shift[] = [
    { id: '1', date: '2025-12-05', startTime: '09:00', endTime: '17:00', role: 'Manager', status: 'completed' },
    { id: '2', date: '2025-12-06', startTime: '09:00', endTime: '17:00', role: 'Manager', status: 'upcoming' },
    { id: '3', date: '2025-12-07', startTime: '10:00', endTime: '18:00', role: 'Manager', status: 'upcoming' },
    { id: '4', date: '2025-12-09', startTime: '09:00', endTime: '17:00', role: 'Manager', status: 'upcoming' },
    { id: '5', date: '2025-12-10', startTime: '09:00', endTime: '17:00', role: 'Manager', status: 'upcoming' },
];

const YANAL_CLOCK_RECORDS: ClockRecord[] = [
    { id: '1', date: '2025-12-05', clockIn: '08:55', clockOut: '17:10', totalHours: 8.25 },
    { id: '2', date: '2025-12-04', clockIn: '09:02', clockOut: '17:05', totalHours: 8.05 },
    { id: '3', date: '2025-12-03', clockIn: '09:00', clockOut: '17:00', totalHours: 8.0 },
    { id: '4', date: '2025-12-02', clockIn: '08:58', clockOut: '17:15', totalHours: 8.28 },
];

export default function EmployeeTimesheetPage() {
    const [shifts] = useState<Shift[]>(YANAL_SHIFTS);
    const [clockRecords] = useState<ClockRecord[]>(YANAL_CLOCK_RECORDS);
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [currentSession, setCurrentSession] = useState<{ clockIn: string } | null>(null);

    const handleClockIn = () => {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        setCurrentSession({ clockIn: time });
        setIsClockedIn(true);
    };

    const handleClockOut = () => {
        setIsClockedIn(false);
        setCurrentSession(null);
    };

    const getWeekTotal = () => {
        return clockRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0).toFixed(2);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    };

    const isToday = (dateStr: string) => {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">My Timesheet</h1>
                    <p className="text-slate-600">Welcome back, Yanal! 👋</p>
                </div>

                {/* Clock In/Out Card */}
                <Card className="border-2 shadow-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                    <CardContent className="p-8">
                        <div className="text-center">
                            <div className="text-6xl font-bold mb-2">
                                {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-blue-100 mb-6">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>

                            {isClockedIn ? (
                                <div>
                                    <div className="bg-green-500/20 border-2 border-green-300 rounded-lg p-4 mb-4">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <CheckCircle2 className="w-6 h-6" />
                                            <span className="font-semibold">Currently Clocked In</span>
                                        </div>
                                        <div className="text-sm">Started at {currentSession?.clockIn}</div>
                                    </div>
                                    <Button
                                        onClick={handleClockOut}
                                        size="lg"
                                        className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg"
                                    >
                                        <LogOut className="w-6 h-6 mr-3" />
                                        Clock Out
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleClockIn}
                                    size="lg"
                                    className="bg-white hover:bg-blue-50 text-blue-700 px-8 py-6 text-lg rounded-xl shadow-lg"
                                >
                                    <LogIn className="w-6 h-6 mr-3" />
                                    Clock In
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Week Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold text-blue-600">{shifts.length}</div>
                            <div className="text-sm text-gray-600 mt-1">Shifts This Week</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold text-green-600">{getWeekTotal()}h</div>
                            <div className="text-sm text-gray-600 mt-1">Hours Worked</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {clockRecords.filter(r => r.clockOut).length}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Completed Shifts</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Shifts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            My Shifts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {shifts.map(shift => (
                            <div
                                key={shift.id}
                                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${isToday(shift.date)
                                        ? 'bg-blue-50 border-blue-300 shadow-md'
                                        : shift.status === 'completed'
                                            ? 'bg-gray-50 border-gray-200 opacity-60'
                                            : 'bg-white border-gray-200 hover:border-blue-200'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {shift.status === 'completed' ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    ) : isToday(shift.date) ? (
                                        <Circle className="w-6 h-6 text-blue-600 animate-pulse" fill="currentColor" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-gray-400" />
                                    )}
                                    <div>
                                        <div className="font-semibold text-slate-900">
                                            {formatDate(shift.date)}
                                            {isToday(shift.date) && (
                                                <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                                    TODAY
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-600">{shift.role}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-slate-900 font-medium">
                                        <Clock className="w-4 h-4" />
                                        {shift.startTime} - {shift.endTime}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {(() => {
                                            const start = new Date(`2000-01-01T${shift.startTime}`);
                                            const end = new Date(`2000-01-01T${shift.endTime}`);
                                            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                            return `${hours} hours`;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Clock History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Recent Clock Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {clockRecords.map(record => (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div>
                                        <div className="font-medium text-slate-900">{formatDate(record.date)}</div>
                                        <div className="text-sm text-slate-600">
                                            In: {record.clockIn} • Out: {record.clockOut || '-'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-blue-600">
                                            {record.totalHours?.toFixed(2)}h
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

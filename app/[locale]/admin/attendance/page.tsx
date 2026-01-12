'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Users, Calendar, MapPin, CheckCircle2, LogIn, LogOut, Filter } from "lucide-react";

interface ClockEntry {
    id: string;
    clockInTime: string;
    clockOutTime?: string;
    totalHours?: number;
    clockInLat?: number;
    clockInLng?: number;
    clockOutLat?: number;
    clockOutLng?: number;
    clockInSource: string;
    clockOutSource?: string;
    user: {
        id: string;
        name: string;
        username: string;
    };
    branch: {
        id: string;
        name: string;
        code: string;
    };
}

interface ActiveEntry extends ClockEntry {
    elapsedHours: number;
}

export default function AttendancePage() {
    const [entries, setEntries] = useState<ClockEntry[]>([]);
    const [activeEntries, setActiveEntries] = useState<ActiveEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
        // Refresh active entries every minute
        const interval = setInterval(fetchActiveEntries, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchActiveEntries = async () => {
        try {
            const res = await fetch('/api/clock?activeOnly=true');
            if (res.ok) {
                const data = await res.json();
                const now = new Date();
                const active = data.map((entry: ClockEntry) => ({
                    ...entry,
                    elapsedHours: (now.getTime() - new Date(entry.clockInTime).getTime()) / (1000 * 60 * 60)
                }));
                setActiveEntries(active);
            }
        } catch (error) {
            console.error('Error fetching active entries:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all entries for date range
            const res = await fetch(`/api/clock?startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }

            // Fetch active entries
            await fetchActiveEntries();
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // Calculate totals
    const totalHours = entries.reduce((sum, e) => sum + (e.totalHours || 0), 0);
    const completedEntries = entries.filter(e => e.clockOutTime).length;

    // Group by employee for summary
    const employeeSummary = entries.reduce((acc, entry) => {
        const userId = entry.user.id;
        if (!acc[userId]) {
            acc[userId] = {
                user: entry.user,
                totalHours: 0,
                entries: 0
            };
        }
        acc[userId].totalHours += entry.totalHours || 0;
        acc[userId].entries += 1;
        return acc;
    }, {} as Record<string, { user: ClockEntry['user']; totalHours: number; entries: number }>);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
                <p className="text-slate-500 mt-1">Monitor employee clock in/out activity</p>
            </div>

            {/* Currently Working */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Currently Working ({activeEntries.length})
                    </CardTitle>
                    <CardDescription>Employees who are clocked in right now</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeEntries.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">No employees currently clocked in</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeEntries.map(entry => (
                                <div
                                    key={entry.id}
                                    className="p-4 bg-white border border-green-200 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-900">{entry.user.name}</div>
                                            <div className="text-sm text-slate-500">{entry.branch.name}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-sm">
                                        <span className="text-slate-600">
                                            <LogIn className="w-4 h-4 inline mr-1" />
                                            {formatTime(entry.clockInTime)}
                                        </span>
                                        <span className="font-bold text-green-600">
                                            {entry.elapsedHours.toFixed(1)}h
                                        </span>
                                    </div>
                                    {entry.clockInLat && (
                                        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            Location verified
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-blue-600">{entries.length}</div>
                        <div className="text-sm text-slate-500 mt-1">Total Entries</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-green-600">{completedEntries}</div>
                        <div className="text-sm text-slate-500 mt-1">Completed</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-purple-600">{totalHours.toFixed(1)}h</div>
                        <div className="text-sm text-slate-500 mt-1">Total Hours</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-orange-600">
                            {Object.keys(employeeSummary).length}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">Employees</div>
                    </CardContent>
                </Card>
            </div>

            {/* Employee Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Employee Summary</CardTitle>
                    <CardDescription>Hours worked per employee this period</CardDescription>
                </CardHeader>
                <CardContent>
                    {Object.keys(employeeSummary).length === 0 ? (
                        <p className="text-slate-500 text-center py-4">No data for this period</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.values(employeeSummary).map(summary => (
                                <div
                                    key={summary.user.id}
                                    className="p-4 border border-slate-200 rounded-lg flex items-center justify-between"
                                >
                                    <div>
                                        <div className="font-semibold text-slate-900">{summary.user.name}</div>
                                        <div className="text-sm text-slate-500">{summary.entries} entries</div>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {summary.totalHours.toFixed(1)}h
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Clock History
                    </CardTitle>
                    <div className="flex gap-4 mt-4">
                        <div>
                            <label className="text-sm text-slate-600 block mb-1">Start Date</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-600 block mb-1">End Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading...</div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No clock entries for this period</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Branch</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Clock In</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Clock Out</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Hours</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => (
                                        <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-slate-900">{entry.user.name}</div>
                                                <div className="text-sm text-slate-500">@{entry.user.username}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-sm">
                                                    {entry.branch.code}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-slate-900">{formatDateTime(entry.clockInTime)}</div>
                                                <div className="text-xs text-slate-400">{entry.clockInSource}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {entry.clockOutTime ? (
                                                    <div className="text-slate-900">{formatDateTime(entry.clockOutTime)}</div>
                                                ) : (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {entry.totalHours ? (
                                                    <span className="font-bold text-blue-600">{entry.totalHours.toFixed(2)}h</span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {entry.clockInLat ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

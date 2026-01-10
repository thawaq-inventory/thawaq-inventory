'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, Trash2, Users, Save, ChevronLeft, ChevronRight, Loader2, DollarSign, Search, TrendingUp, BarChart3 } from "lucide-react";
import { PaymentConfirmationModal } from "@/components/payroll/PaymentConfirmationModal";

interface Employee {
    id: string;
    name: string;
    username: string;
    role: string;
}

interface Shift {
    id: string;
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    role: string;
    notes?: string;
    status: string;
    user: Employee;
}

interface WeekData {
    shifts: Shift[];
    employees: Employee[];
    employeeHours: { [key: string]: number };
    startDate: string;
    endDate: string;
}

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminRosterPage() {
    const [weekData, setWeekData] = useState<WeekData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
    const [showAddForm, setShowAddForm] = useState(false);
    const [newShift, setNewShift] = useState({
        userId: '',
        date: '',
        startTime: '09:00',
        endTime: '17:00',
        role: 'Server'
    });
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedEmployeeForPayment, setSelectedEmployeeForPayment] = useState<Employee | null>(null);
    const [employeeSearch, setEmployeeSearch] = useState('');

    // Get Monday of the current week
    function getMonday(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    // Format date for API (YYYY-MM-DD)
    function formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    // Get week dates from Monday
    function getWeekDates(monday: Date): string[] {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            dates.push(formatDate(date));
        }
        return dates;
    }

    // Fetch week data
    async function fetchWeekData() {
        try {
            setLoading(true);
            setError(null);
            const startDate = formatDate(currentWeekStart);
            const response = await fetch(`/api/shifts/week?startDate=${startDate}`);

            if (!response.ok) {
                throw new Error('Failed to fetch shifts');
            }

            const data: WeekData = await response.json();
            setWeekData(data);
        } catch (err) {
            console.error('Error fetching week data:', err);
            setError('Failed to load shifts. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // Load data when week changes
    useEffect(() => {
        fetchWeekData();
    }, [currentWeekStart]);

    // Navigate to previous week
    function goToPreviousWeek() {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    }

    // Navigate to next week
    function goToNextWeek() {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    }

    // Add new shift
    async function handleAddShift() {
        if (!newShift.userId || !newShift.date) {
            setError('Please select an employee and date');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const response = await fetch('/api/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newShift),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create shift');
            }

            // Refresh data
            await fetchWeekData();

            // Reset form
            setShowAddForm(false);
            setNewShift({
                userId: '',
                date: '',
                startTime: '09:00',
                endTime: '17:00',
                role: 'Server'
            });
        } catch (err: any) {
            console.error('Error creating shift:', err);
            setError(err.message || 'Failed to create shift');
        } finally {
            setSubmitting(false);
        }
    }

    // Delete shift
    async function handleDeleteShift(id: string) {
        if (!confirm('Are you sure you want to delete this shift?')) {
            return;
        }

        try {
            const response = await fetch(`/api/shifts/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete shift');
            }

            // Refresh data
            await fetchWeekData();
        } catch (err) {
            console.error('Error deleting shift:', err);
            setError('Failed to delete shift');
        }
    }

    // Get shifts for a specific date and employee
    function getShiftsForDateAndEmployee(date: string, userId: string): Shift[] {
        if (!weekData) return [];
        return weekData.shifts.filter(
            s => formatDate(new Date(s.date)) === date && s.userId === userId
        );
    }

    // Format date range for display
    function getWeekRangeDisplay(): string {
        const start = currentWeekStart;
        const end = new Date(currentWeekStart);
        end.setDate(end.getDate() + 6);

        const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
    }

    // Helper to determine shift time category and color
    function getShiftStyle(startTime: string) {
        const hour = parseInt(startTime.split(':')[0]);
        if (hour >= 5 && hour < 12) {
            return { bg: 'from-amber-400 to-orange-500', label: 'Morning', icon: '🌅' };
        } else if (hour >= 12 && hour < 17) {
            return { bg: 'from-blue-400 to-blue-600', label: 'Afternoon', icon: '☀️' };
        } else {
            return { bg: 'from-indigo-500 to-purple-600', label: 'Evening', icon: '🌙' };
        }
    }

    // Helper to calculate shift hours
    function calculateShiftHours(startTime: string, endTime: string): number {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        return (endHour + endMin / 60) - (startHour + startMin / 60);
    }

    // Helper to get shift count per day
    function getShiftsForDate(date: string): Shift[] {
        return weekData?.shifts.filter(s => s.date === date) || [];
    }

    // Filter employees by search
    const filteredEmployees = weekData?.employees.filter(emp =>
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.username.toLowerCase().includes(employeeSearch.toLowerCase())
    ) || [];

    const weekDates = getWeekDates(currentWeekStart);

    if (loading && !weekData) {
        return (
            <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-blue-600" />
                            Weekly Roster
                        </h1>
                        <p className="text-slate-600 mt-2">{getWeekRangeDisplay()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={goToPreviousWeek}
                            disabled={loading}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={goToNextWeek}
                            disabled={loading}
                        >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Shift
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Cards - Moved to Top */}
            {weekData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-3xl font-bold">{weekData.shifts.length}</div>
                                    <div className="text-sm opacity-90 mt-1">Total Shifts</div>
                                </div>
                                <Calendar className="w-10 h-10 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-3xl font-bold">{weekData.employees.length}</div>
                                    <div className="text-sm opacity-90 mt-1">Active Employees</div>
                                </div>
                                <Users className="w-10 h-10 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-3xl font-bold">
                                        {Object.values(weekData.employeeHours).reduce((a, b) => a + b, 0).toFixed(1)}h
                                    </div>
                                    <div className="text-sm opacity-90 mt-1">Total Hours</div>
                                </div>
                                <Clock className="w-10 h-10 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-3xl font-bold">
                                        {weekData.employees.length > 0
                                            ? (Object.values(weekData.employeeHours).reduce((a, b) => a + b, 0) / weekData.employees.length).toFixed(1)
                                            : '0.0'}h
                                    </div>
                                    <div className="text-sm opacity-90 mt-1">Avg per Employee</div>
                                </div>
                                <TrendingUp className="w-10 h-10 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Add Shift Form */}
            {showAddForm && weekData && (
                <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="text-blue-900">Add New Shift</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <Label>Employee</Label>
                                <select
                                    value={newShift.userId}
                                    onChange={(e) => setNewShift({ ...newShift, userId: e.target.value })}
                                    className="w-full p-2 border rounded-md mt-1"
                                    disabled={submitting}
                                >
                                    <option value="">Select...</option>
                                    {weekData.employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={newShift.date}
                                    onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                                    className="mt-1"
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <Label>Start Time</Label>
                                <Input
                                    type="time"
                                    value={newShift.startTime}
                                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                                    className="mt-1"
                                    disabled={submitting}
                                />
                            </div>
                            <div>
                                <Label>End Time</Label>
                                <Input
                                    type="time"
                                    value={newShift.endTime}
                                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                                    className="mt-1"
                                    disabled={submitting}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button
                                    onClick={handleAddShift}
                                    className="flex-1"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Add
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAddForm(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Employee Search and Legend */}
            {weekData && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                type="text"
                                placeholder="Search employees..."
                                value={employeeSearch}
                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 font-medium">Shift Types:</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-400 to-orange-500"></div>
                                <span className="text-sm text-gray-700">Morning</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-400 to-blue-600"></div>
                                <span className="text-sm text-gray-700">Afternoon</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                                <span className="text-sm text-gray-700">Evening</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly Roster Grid */}
            {weekData && (
                <>
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                                        <tr>
                                            <th className="p-4 text-left text-white font-semibold sticky left-0 bg-blue-600 z-10">
                                                Employee
                                            </th>
                                            {weekDates.map((date, idx) => {
                                                const d = new Date(date);
                                                const dayShifts = getShiftsForDate(date);
                                                return (
                                                    <th key={date} className="p-4 text-center text-white min-w-[140px]">
                                                        <div className="font-semibold">{WEEK_DAYS[idx].slice(0, 3)}</div>
                                                        <div className="text-sm opacity-90">{d.getDate()}/{d.getMonth() + 1}</div>
                                                        {dayShifts.length > 0 && (
                                                            <div className="mt-1">
                                                                <span className="inline-block bg-blue-800 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                                                                    {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </th>
                                                );
                                            })}
                                            <th className="p-4 text-center text-white">
                                                Total Hours
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.map((employee, empIdx) => (
                                            <tr key={employee.id} className={empIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="p-4 font-semibold text-slate-900 sticky left-0 bg-inherit">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-5 h-5 text-blue-600" />
                                                        {employee.name}
                                                    </div>
                                                </td>
                                                {weekDates.map(date => {
                                                    const dayShifts = getShiftsForDateAndEmployee(date, employee.id);
                                                    return (
                                                        <td key={date} className="p-2 align-top border-l border-gray-200">
                                                            {dayShifts.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {dayShifts.map(shift => {
                                                                        const shiftStyle = getShiftStyle(shift.startTime);
                                                                        const hours = calculateShiftHours(shift.startTime, shift.endTime);
                                                                        return (
                                                                            <div
                                                                                key={shift.id}
                                                                                className={`bg-gradient-to-br ${shiftStyle.bg} text-white p-2 rounded-lg shadow-sm group hover:shadow-md transition-all relative`}
                                                                            >
                                                                                {/* Duration bar */}
                                                                                <div
                                                                                    className="absolute top-0 left-0 h-1 bg-white/30 rounded-t-lg"
                                                                                    style={{ width: `${Math.min(hours / 12 * 100, 100)}%` }}
                                                                                />
                                                                                <div className="flex items-center justify-between text-xs font-medium mb-1">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <span>{shiftStyle.icon}</span>
                                                                                        <span>{shift.role}</span>
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() => handleDeleteShift(shift.id)}
                                                                                        className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded p-1 transition-opacity"
                                                                                    >
                                                                                        <Trash2 className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>
                                                                                <div className="flex items-center justify-between text-sm">
                                                                                    <div className="flex items-center gap-1">
                                                                                        <Clock className="w-3 h-3" />
                                                                                        {shift.startTime} - {shift.endTime}
                                                                                    </div>
                                                                                    <div className="text-xs opacity-90">
                                                                                        {hours.toFixed(1)}h
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center text-gray-400 text-sm py-4">
                                                                    -
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-4 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="font-bold text-lg text-blue-600">
                                                            {(weekData.employeeHours[employee.id] || 0).toFixed(1)}h
                                                        </div>
                                                        {weekData.employeeHours[employee.id] > 0 && (
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => {
                                                                    setSelectedEmployeeForPayment(employee);
                                                                    setPaymentModalOpen(true);
                                                                }}
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                <DollarSign className="w-4 h-4 mr-1" />
                                                                Pay
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>


                </>
            )}

            {/* Payment Modal */}
            {selectedEmployeeForPayment && (
                <PaymentConfirmationModal
                    isOpen={paymentModalOpen}
                    onClose={() => {
                        setPaymentModalOpen(false);
                        setSelectedEmployeeForPayment(null);
                    }}
                    employee={selectedEmployeeForPayment}
                    totalHours={weekData?.employeeHours[selectedEmployeeForPayment.id] || 0}
                    hourlyRate={5} // Default rate, editable in modal
                    periodStart={currentWeekStart}
                    periodEnd={new Date(new Date(currentWeekStart).setDate(currentWeekStart.getDate() + 6))}
                    onSuccess={() => {
                        // Optionally refresh data or show success state
                        fetchWeekData();
                    }}
                />
            )}
        </div>
    );
}

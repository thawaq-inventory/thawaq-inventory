'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Plus, Edit, Trash2, Users, Save } from "lucide-react";

interface Shift {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    startTime: string;
    endTime: string;
    role: string;
}

const SAMPLE_SHIFTS: Shift[] = [
    // Yanal's shifts
    { id: '1', employeeId: '1', employeeName: 'Yanal', date: '2025-12-05', startTime: '09:00', endTime: '17:00', role: 'Manager' },
    { id: '2', employeeId: '1', employeeName: 'Yanal', date: '2025-12-06', startTime: '09:00', endTime: '17:00', role: 'Manager' },
    { id: '3', employeeId: '1', employeeName: 'Yanal', date: '2025-12-07', startTime: '10:00', endTime: '18:00', role: 'Manager' },
    { id: '4', employeeId: '1', employeeName: 'Yanal', date: '2025-12-09', startTime: '09:00', endTime: '17:00', role: 'Manager' },
    { id: '5', employeeId: '1', employeeName: 'Yanal', date: '2025-12-10', startTime: '09:00', endTime: '17:00', role: 'Manager' },

    // Daniah's shifts
    { id: '6', employeeId: '2', employeeName: 'Daniah', date: '2025-12-05', startTime: '14:00', endTime: '22:00', role: 'Server' },
    { id: '7', employeeId: '2', employeeName: 'Daniah', date: '2025-12-06', startTime: '14:00', endTime: '22:00', role: 'Server' },
    { id: '8', employeeId: '2', employeeName: 'Daniah', date: '2025-12-08', startTime: '12:00', endTime: '20:00', role: 'Server' },
    { id: '9', employeeId: '2', employeeName: 'Daniah', date: '2025-12-09', startTime: '14:00', endTime: '22:00', role: 'Server' },
    { id: '10', employeeId: '2', employeeName: 'Daniah', date: '2025-12-11', startTime: '14:00', endTime: '22:00', role: 'Server' },
];

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const EMPLOYEES = [
    { id: '1', name: 'Yanal' },
    { id: '2', name: 'Daniah' },
];

export default function AdminRosterPage() {
    const [shifts, setShifts] = useState<Shift[]>(SAMPLE_SHIFTS);
    const [selectedDate, setSelectedDate] = useState('2025-12-05');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newShift, setNewShift] = useState({
        employeeId: '',
        date: selectedDate,
        startTime: '09:00',
        endTime: '17:00',
        role: 'Server'
    });

    const getWeekDates = () => {
        const start = new Date(2025, 11, 5); // Dec 5, 2025 (Thursday)
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    };

    const weekDates = getWeekDates();

    const getShiftsForDateAndEmployee = (date: string, employeeId: string) => {
        return shifts.filter(s => s.date === date && s.employeeId === employeeId);
    };

    const handleAddShift = () => {
        if (!newShift.employeeId) return;

        const employee = EMPLOYEES.find(e => e.id === newShift.employeeId);
        const shift: Shift = {
            id: Date.now().toString(),
            employeeId: newShift.employeeId,
            employeeName: employee?.name || '',
            date: newShift.date,
            startTime: newShift.startTime,
            endTime: newShift.endTime,
            role: newShift.role
        };

        setShifts([...shifts, shift]);
        setShowAddForm(false);
        setNewShift({
            employeeId: '',
            date: selectedDate,
            startTime: '09:00',
            endTime: '17:00',
            role: 'Server'
        });
    };

    const handleDeleteShift = (id: string) => {
        setShifts(shifts.filter(s => s.id !== id));
    };

    const getTotalHours = (employeeId: string) => {
        const employeeShifts = shifts.filter(s => s.employeeId === employeeId);
        let total = 0;
        employeeShifts.forEach(shift => {
            const start = new Date(`2000-01-01T${shift.startTime}`);
            const end = new Date(`2000-01-01T${shift.endTime}`);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            total += hours;
        });
        return total.toFixed(1);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-blue-600" />
                            Weekly Roster
                        </h1>
                        <p className="text-slate-600 mt-2">December 5-11, 2025</p>
                    </div>
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Shift
                    </Button>
                </div>
            </div>

            {/* Add Shift Form */}
            {showAddForm && (
                <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
                    <CardHeader>
                        <CardTitle className="text-blue-900">Add New Shift</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <Label>Employee</Label>
                                <select
                                    value={newShift.employeeId}
                                    onChange={(e) => setNewShift({ ...newShift, employeeId: e.target.value })}
                                    className="w-full p-2 border rounded-md mt-1"
                                >
                                    <option value="">Select...</option>
                                    {EMPLOYEES.map(emp => (
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
                                />
                            </div>
                            <div>
                                <Label>Start Time</Label>
                                <Input
                                    type="time"
                                    value={newShift.startTime}
                                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>End Time</Label>
                                <Input
                                    type="time"
                                    value={newShift.endTime}
                                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleAddShift} className="flex-1">
                                    <Save className="w-4 h-4 mr-2" />
                                    Add
                                </Button>
                                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Weekly Roster Grid */}
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
                                        return (
                                            <th key={date} className="p-4 text-center text-white min-w-[140px]">
                                                <div className="font-semibold">{WEEK_DAYS[idx].slice(0, 3)}</div>
                                                <div className="text-sm opacity-90">{d.getDate()}/{d.getMonth() + 1}</div>
                                            </th>
                                        );
                                    })}
                                    <th className="p-4 text-center text-white">
                                        Total Hours
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {EMPLOYEES.map((employee, empIdx) => (
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
                                                            {dayShifts.map(shift => (
                                                                <div
                                                                    key={shift.id}
                                                                    className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-lg shadow-sm group hover:shadow-md transition-all"
                                                                >
                                                                    <div className="flex items-center justify-between text-xs font-medium mb-1">
                                                                        <span>{shift.role}</span>
                                                                        <button
                                                                            onClick={() => handleDeleteShift(shift.id)}
                                                                            className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded p-1 transition-opacity"
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-sm">
                                                                        <Clock className="w-3 h-3" />
                                                                        {shift.startTime} - {shift.endTime}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-gray-400 text-sm py-4">
                                                            -
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="p-4 text-center font-bold text-lg text-blue-600">
                                            {getTotalHours(employee.id)}h
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">{shifts.length}</div>
                            <div className="text-sm text-gray-600 mt-1">Total Shifts</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{EMPLOYEES.length}</div>
                            <div className="text-sm text-gray-600 mt-1">Active Employees</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">
                                {(parseFloat(getTotalHours('1')) + parseFloat(getTotalHours('2'))).toFixed(1)}h
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Total Hours This Week</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

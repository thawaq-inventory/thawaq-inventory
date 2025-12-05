'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Users, Rocket, Zap, Plus, X } from "lucide-react";

interface ShiftCard {
    id: string;
    employee: string;
    startTime: string;
    endTime: string;
    color: string;
    position: { x: number; y: number };
}

interface TimeLog {
    id: string;
    employee: string;
    time: string;
    type: 'in' | 'out';
    color: string;
    position: { x: number; y: number };
}

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853']; // Blue, Red, Yellow, Green

export default function ShiftsPlayground() {
    const [gravityOn, setGravityOn] = useState(false);
    const [mode, setMode] = useState<'employee' | 'admin'>('employee');
    const [shifts, setShifts] = useState<ShiftCard[]>([]);
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [newShift, setNewShift] = useState({ employee: '', startTime: '', endTime: '' });

    // Initialize with sample data
    useEffect(() => {
        const sampleShifts: ShiftCard[] = [
            { id: '1', employee: 'Yanal', startTime: '09:00', endTime: '17:00', color: GOOGLE_COLORS[0], position: { x: 20, y: 20 } },
            { id: '2', employee: 'Ahmad', startTime: '10:00', endTime: '18:00', color: GOOGLE_COLORS[1], position: { x: 40, y: 30 } },
            { id: '3', employee: 'Sara', startTime: '08:00', endTime: '16:00', color: GOOGLE_COLORS[2], position: { x: 60, y: 25 } },
        ];
        setShifts(sampleShifts);
    }, []);

    const handleClockIn = () => {
        const newLog: TimeLog = {
            id: Date.now().toString(),
            employee: 'You',
            time: new Date().toLocaleTimeString(),
            type: 'in',
            color: GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)],
            position: { x: Math.random() * 70 + 10, y: 10 }
        };
        setTimeLogs([...timeLogs, newLog]);
    };

    const handlePublishShift = () => {
        if (!newShift.employee || !newShift.startTime || !newShift.endTime) return;

        const shift: ShiftCard = {
            id: Date.now().toString(),
            employee: newShift.employee,
            startTime: newShift.startTime,
            endTime: newShift.endTime,
            color: GOOGLE_COLORS[Math.floor(Math.random() * GOOGLE_COLORS.length)],
            position: { x: 50, y: -10 }
        };
        setShifts([...shifts, shift]);
        setNewShift({ employee: '', startTime: '', endTime: '' });
    };

    const removeShift = (id: string) => {
        setShifts(shifts.filter(s => s.id !== id));
    };

    const removeLog = (id: string) => {
        setTimeLogs(timeLogs.filter(l => l.id !== id));
    };

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            {/* Header Controls */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Rocket className="w-8 h-8 text-blue-600" />
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                            Shift Manager Playground
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Mode Toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setMode('employee')}
                                className={`px-4 py-2 rounded-md transition-all ${mode === 'employee'
                                        ? 'bg-white shadow-sm text-blue-600 font-medium'
                                        : 'text-gray-600'
                                    }`}
                            >
                                <Users className="w-4 h-4 inline mr-2" />
                                Employee
                            </button>
                            <button
                                onClick={() => setMode('admin')}
                                className={`px-4 py-2 rounded-md transition-all ${mode === 'admin'
                                        ? 'bg-white shadow-sm text-red-600 font-medium'
                                        : 'text-gray-600'
                                    }`}
                            >
                                <Zap className="w-4 h-4 inline mr-2" />
                                Admin
                            </button>
                        </div>

                        {/* Gravity Toggle */}
                        <button
                            onClick={() => setGravityOn(!gravityOn)}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${gravityOn
                                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                }`}
                        >
                            {gravityOn ? '🌍 Gravity ON' : '🚀 Zero-G'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="pt-24 pb-8 px-4 min-h-screen relative">
                {/* Employee Mode */}
                {mode === 'employee' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <Button
                                onClick={handleClockIn}
                                size="lg"
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-2xl shadow-xl"
                            >
                                <Clock className="w-6 h-6 mr-3" />
                                Clock In
                            </Button>
                            <p className="text-gray-500 mt-4">Click to spawn a new time log!</p>
                        </div>

                        {/* Time Logs */}
                        <div className="relative h-[500px]">
                            {timeLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`absolute transition-all duration-1000 ${gravityOn
                                            ? 'translate-y-[450px]'
                                            : 'animate-float'
                                        }`}
                                    style={{
                                        left: `${log.position.x}%`,
                                        top: `${log.position.y}%`,
                                        animationDelay: `${Math.random() * 2}s`
                                    }}
                                >
                                    <Card
                                        className="p-4 cursor-move hover:scale-110 transition-transform shadow-xl"
                                        style={{ backgroundColor: log.color, border: 'none' }}
                                    >
                                        <div className="flex items-center gap-3 text-white">
                                            <Clock className="w-8 h-8" />
                                            <div>
                                                <div className="font-bold">{log.employee}</div>
                                                <div className="text-sm opacity-90">{log.time}</div>
                                            </div>
                                            <button
                                                onClick={() => removeLog(log.id)}
                                                className="ml-2 hover:bg-white/20 rounded-full p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Admin Mode */}
                {mode === 'admin' && (
                    <div className="max-w-6xl mx-auto">
                        {/* Roster Builder */}
                        <Card className="p-6 mb-8 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                            <h2 className="text-xl font-bold mb-4 text-blue-900">📅 Roster Builder</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label>Employee</Label>
                                    <Input
                                        value={newShift.employee}
                                        onChange={(e) => setNewShift({ ...newShift, employee: e.target.value })}
                                        placeholder="Name"
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
                                <div className="flex items-end">
                                    <Button
                                        onClick={handlePublishShift}
                                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Publish Shift
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Shift Cards Canvas */}
                        <div className="relative h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                            {shifts.map((shift) => (
                                <div
                                    key={shift.id}
                                    className={`absolute transition-all duration-1000 cursor-grab active:cursor-grabbing ${gravityOn
                                            ? 'translate-y-[540px]'
                                            : 'animate-float-slow'
                                        }`}
                                    style={{
                                        left: `${shift.position.x}%`,
                                        top: `${shift.position.y}%`,
                                        animationDelay: `${Math.random() * 3}s`
                                    }}
                                >
                                    <Card
                                        className="p-6 hover:scale-105 transition-transform shadow-2xl min-w-[200px]"
                                        style={{ backgroundColor: shift.color, border: 'none' }}
                                    >
                                        <div className="text-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <Users className="w-6 h-6" />
                                                <button
                                                    onClick={() => removeShift(shift.id)}
                                                    className="hover:bg-white/20 rounded-full p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="font-bold text-lg">{shift.employee}</div>
                                            <div className="text-sm opacity-90 mt-2">
                                                {shift.startTime} - {shift.endTime}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))}

                            {shifts.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <Rocket className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p className="text-lg">Create your first shift to see the magic!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* CSS Animations */}
            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    25% { transform: translateY(-20px) rotate(2deg); }
                    50% { transform: translateY(-10px) rotate(-2deg); }
                    75% { transform: translateY(-15px) rotate(1deg); }
                }

                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
                    25% { transform: translateY(-30px) translateX(10px) rotate(3deg); }
                    50% { transform: translateY(-15px) translateX(-10px) rotate(-3deg); }
                    75% { transform: translateY(-25px) translateX(5px) rotate(2deg); }
                }

                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }

                .animate-float-slow {
                    animation: float-slow 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}

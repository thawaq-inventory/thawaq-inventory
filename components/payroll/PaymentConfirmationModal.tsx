'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, DollarSign, Clock, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: {
        id: string;
        name: string;
        username?: string;
    };
    totalHours: number;
    hourlyRate?: number;
    periodStart?: Date | string;
    periodEnd?: Date | string;
    onSuccess?: () => void;
}

export function PaymentConfirmationModal({
    isOpen,
    onClose,
    employee,
    totalHours,
    hourlyRate: initialRate = 5,
    periodStart,
    periodEnd,
    onSuccess,
}: PaymentConfirmationModalProps) {
    const [hourlyRate, setHourlyRate] = useState(initialRate);
    const [cliqAlias, setCliqAlias] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const finalAmount = totalHours * hourlyRate;

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/payroll/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    employeeId: employee.id,
                    totalHours,
                    hourlyRate,
                    periodStart: periodStart || new Date().toISOString(),
                    periodEnd: periodEnd || new Date().toISOString(),
                    accountNumber: cliqAlias || undefined,  // CliQ alias sent as accountNumber field
                    notes: notes || undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: '⚡ Instant CliQ Transfer Initiated',
                    description: 'Draft payment created. Approve in your Bank al Etihad app for instant settlement.',
                    duration: 5000,
                });

                onSuccess?.();
                onClose();

                // Reset form
                setCliqAlias('');
                setNotes('');
            } else {
                toast({
                    variant: 'destructive',
                    title: '❌ Payment Failed',
                    description: data.error || 'Failed to create payroll transaction',
                    duration: 7000,
                });
            }
        } catch (error: any) {
            console.error('Payroll submission error:', error);
            toast({
                variant: 'destructive',
                title: '❌ Error',
                description: error.message || 'An unexpected error occurred',
                duration: 7000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <DollarSign className="h-6 w-6 text-green-600" />
                        CliQ Instant Payroll
                    </DialogTitle>
                    <DialogDescription>
                        Instant settlement via CliQ. Payment requires approval in Bank al Etihad app.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Employee Info */}
                    <div className="rounded-lg bg-muted p-4">
                        <h3 className="font-semibold text-lg mb-2">{employee.name}</h3>
                        {employee.username && (
                            <p className="text-sm text-muted-foreground">@{employee.username}</p>
                        )}
                    </div>

                    {/* Calculation Display */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-medium">Total Hours</span>
                            </div>
                            <span className="text-lg font-bold">{totalHours.toFixed(1)} hrs</span>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium">Hourly Rate</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right"
                                    step="0.5"
                                    min="0"
                                />
                                <span className="text-sm text-muted-foreground">JOD</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border-2 border-primary bg-primary/5">
                            <div className="flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">Final Amount</span>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                    {finalAmount.toFixed(2)} JOD
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {totalHours.toFixed(1)} hrs × {hourlyRate} JOD/hr
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CliQ Transfer Details */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-muted-foreground">
                                CliQ Transfer Details
                            </h4>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium">
                                ⚡ Instant Settlement
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div>
                                <Label htmlFor="cliqAlias" className="text-sm">
                                    CliQ Alias <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="cliqAlias"
                                    value={cliqAlias}
                                    onChange={(e) => setCliqAlias(e.target.value)}
                                    placeholder="Mobile number or email (e.g., 0790123456)"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Employee's registered CliQ alias for instant transfer
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="notes" className="text-sm">
                                    Notes
                                </Label>
                                <Input
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Additional notes (optional)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* CliQ Instant Transfer Notice */}
                    <div className="rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-4 border border-green-200 dark:border-green-800">
                        <div className="space-y-2 text-sm">
                            <p className="text-green-900 dark:text-green-100">
                                <strong>⚡ CliQ Instant Transfer:</strong> Funds will be settled <strong>instantly</strong> (24/7) upon approval.
                            </p>
                            <p className="text-blue-900 dark:text-blue-100">
                                <strong>🔒 Maker-Checker:</strong> Payment created in <strong>DRAFT</strong> status. Approve in your Bank al Etihad app to execute.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || totalHours <= 0 || hourlyRate <= 0 || !cliqAlias.trim()}
                        className="min-w-[200px] bg-green-600 hover:bg-green-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                ⚡
                                <span className="ml-1">Send CliQ Transfer</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, Upload, Camera, CheckCircle, XCircle, Clock } from "lucide-react";
import Image from 'next/image';

interface ExpenseCategory {
    id: string;
    name: string;
}

export default function EmployeeExpensesPage() {
    const t = useTranslations('Employee');
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form state
    const [amount, setAmount] = useState('');
    const [taxRate, setTaxRate] = useState('0');
    const [customTaxRate, setCustomTaxRate] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [customCategory, setCustomCategory] = useState('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState('');

    // Calculate tax and total
    const baseAmount = parseFloat(amount) || 0;
    const taxRateNum = taxRate === 'custom' ? (parseFloat(customTaxRate) || 0) : (parseFloat(taxRate) || 0);
    const taxAmount = baseAmount * (taxRateNum / 100);
    const totalAmount = baseAmount + taxAmount;

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/expenses/categories');
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!photoFile) {
            alert(t('expenses.uploadRequired'));
            return;
        }

        setLoading(true);
        setSuccess(false);

        try {
            // Upload photo first
            const formData = new FormData();
            formData.append('file', photoFile);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                throw new Error('Failed to upload photo');
            }

            const { url: photoUrl } = await uploadRes.json();

            // Get current user (for demo, using hardcoded - you should get from session)
            const userId = '1'; // TODO: Get from auth session

            // Submit expense
            const expenseRes = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: baseAmount,
                    taxRate: taxRateNum,
                    taxAmount,
                    totalAmount,
                    description,
                    expenseDate,
                    photoUrl,
                    notes,
                    categoryId: categoryId === 'other' ? null : categoryId,
                    customCategory: categoryId === 'other' ? customCategory : null,
                    submittedById: userId,
                }),
            });

            if (!expenseRes.ok) {
                throw new Error('Failed to submit expense');
            }

            setSuccess(true);

            // Reset form
            setAmount('');
            setTaxRate('0');
            setCustomTaxRate('');
            setCategoryId('');
            setCustomCategory('');
            setDescription('');
            setNotes('');
            setPhotoFile(null);
            setPhotoPreview('');
            setExpenseDate(new Date().toISOString().split('T')[0]);

            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            console.error('Error submitting expense:', error);
            alert(t('Common.saveFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Receipt className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('expenses.title')}</h1>
                    <p className="text-slate-500 mt-2">{t('expenses.subtitle')}</p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="font-semibold text-green-900">{t('expenses.submitted')}</p>
                            <p className="text-sm text-green-700">{t('expenses.pendingApproval')}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('expenses.expenseDetails')}</CardTitle>
                        <CardDescription>{t('expenses.fillRequired')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Amount & Tax */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="amount">{t('expenses.amount')} *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        placeholder="0.00"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="taxRate">{t('expenses.taxRate')} *</Label>
                                    <select
                                        id="taxRate"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="0">{t('expenses.noTax')}</option>
                                        <option value="5">5%</option>
                                        <option value="10">10%</option>
                                        <option value="16">16%</option>
                                        <option value="custom">{t('expenses.customTax')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Custom Tax Rate Input */}
                            {taxRate === 'custom' && (
                                <div>
                                    <Label htmlFor="customTaxRate">{t('expenses.customTaxRate')} *</Label>
                                    <Input
                                        id="customTaxRate"
                                        type="number"
                                        step="0.01"
                                        max="16"
                                        value={customTaxRate}
                                        onChange={(e) => setCustomTaxRate(e.target.value)}
                                        required
                                        placeholder={t('expenses.enterRate')}
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {/* Tax Summary */}
                            {baseAmount > 0 && taxRateNum > 0 && (
                                <div className="p-3 bg-blue-50 rounded-lg space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">{t('expenses.baseAmount')}</span>
                                        <span className="font-medium">{baseAmount.toFixed(2)} JOD</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">{t('expenses.tax')} ({taxRateNum}%):</span>
                                        <span className="font-medium">{taxAmount.toFixed(2)} JOD</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-blue-200">
                                        <span className="font-semibold text-slate-900">{t('expenses.totalAmount')}</span>
                                        <span className="font-bold text-blue-600">{totalAmount.toFixed(2)} JOD</span>
                                    </div>
                                </div>
                            )}

                            {/* Category */}
                            <div>
                                <Label htmlFor="category">{t('expenses.category')} *</Label>
                                <select
                                    id="category"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    required
                                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t('expenses.selectCategory')}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                    <option value="other">{t('expenses.other')}</option>
                                </select>
                            </div>

                            {/* Custom Category */}
                            {categoryId === 'other' && (
                                <div>
                                    <Label htmlFor="customCategory">{t('expenses.specifyCategory')} *</Label>
                                    <Input
                                        id="customCategory"
                                        value={customCategory}
                                        onChange={(e) => setCustomCategory(e.target.value)}
                                        required
                                        placeholder={t('expenses.enterCategory')}
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {/* Date */}
                            <div>
                                <Label htmlFor="date">{t('expenses.expenseDate')} *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={expenseDate}
                                    onChange={(e) => setExpenseDate(e.target.value)}
                                    required
                                    className="mt-1"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">{t('expenses.description')}</Label>
                                <Input
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('expenses.descriptionPlaceholder')}
                                    className="mt-1"
                                />
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <Label>{t('expenses.receiptPhoto')} *</Label>
                                <div className="mt-2">
                                    {photoPreview ? (
                                        <div className="relative">
                                            <Image
                                                src={photoPreview}
                                                alt="Receipt preview"
                                                width={400}
                                                height={300}
                                                className="rounded-lg border border-slate-200 w-full h-auto max-h-96 object-contain"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setPhotoFile(null);
                                                    setPhotoPreview('');
                                                }}
                                                className="mt-2"
                                            >
                                                {t('expenses.changePhoto')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Camera className="w-12 h-12 text-slate-400 mb-3" />
                                                <p className="text-sm font-medium text-slate-700">{t('expenses.clickUpload')}</p>
                                                <p className="text-xs text-slate-500 mt-1">{t('expenses.fileTypes')}</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                                required
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <Label htmlFor="notes">{t('expenses.notes')}</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t('expenses.notesPlaceholder')}
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg"
                            >
                                {loading ? (
                                    <>
                                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                                        {t('expenses.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5 mr-2" />
                                        {t('expenses.submitExpense')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

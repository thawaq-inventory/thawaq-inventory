'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, Plus, X, Save } from "lucide-react";
import { useRouter } from 'next/navigation';

interface Vendor {
    id: string;
    name: string;
}

interface InvoiceItem {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export default function InvoicesPage() {
    const router = useRouter();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [selectedVendor, setSelectedVendor] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [taxAmount, setTaxAmount] = useState('0');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        const response = await fetch('/api/accounting/vendors');
        const data = await response.json();
        setVendors(data);
    };

    const addItem = () => {
        setItems([...items, {
            description: '',
            quantity: 1,
            unitPrice: 0,
            amount: 0
        }]);
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-calculate amount
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
        }

        setItems(newItems);

        // Update total amount
        const totalItems = newItems.reduce((sum, item) => sum + item.amount, 0);
        setAmount(totalItems.toString());
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        const totalItems = newItems.reduce((sum, item) => sum + item.amount, 0);
        setAmount(totalItems.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendor) {
            alert('Please select a vendor');
            return;
        }

        setLoading(true);

        try {
            const totalAmount = parseFloat(amount) + parseFloat(taxAmount);

            const response = await fetch('/api/accounting/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendorId: selectedVendor,
                    invoiceNumber,
                    date,
                    amount: parseFloat(amount),
                    taxAmount: parseFloat(taxAmount),
                    totalAmount,
                    description,
                    items
                }),
            });

            if (response.ok) {
                alert('Invoice recorded successfully!');
                // Reset form
                setSelectedVendor('');
                setInvoiceNumber('');
                setAmount('');
                setTaxAmount('0');
                setDescription('');
                setItems([]);
            }
        } catch (error) {
            console.error('Failed to create invoice:', error);
            alert('Failed to record invoice');
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = (parseFloat(amount) || 0) + (parseFloat(taxAmount) || 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Record Invoice</h1>
                    <p className="text-slate-500 mt-1">Upload and record purchase invoices</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                        <CardDescription>Enter the invoice information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Vendor *</Label>
                                <Select value={selectedVendor} onValueChange={setSelectedVendor} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vendors.map(vendor => (
                                            <SelectItem key={vendor.id} value={vendor.id}>
                                                {vendor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Invoice Number</Label>
                                <Input
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    placeholder="INV-001"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Date *</Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Purchase description"
                                />
                            </div>
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <div className="p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 text-center">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                <p className="text-sm text-slate-600 mb-2">Upload invoice image (Coming soon)</p>
                                <p className="text-xs text-slate-500">Drag and drop or click to browse</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Invoice Items</CardTitle>
                                <CardDescription>Add line items for this invoice</CardDescription>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="w-4 h-4 mr-1" />
                                Add Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>No items added yet</p>
                                <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-3">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add First Item
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-24">Qty</TableHead>
                                        <TableHead className="w-32">Unit Price</TableHead>
                                        <TableHead className="w-32">Amount</TableHead>
                                        <TableHead className="w-16"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                    placeholder="Item description"
                                                    required
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                                    required
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                                                    required
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">
                                                ${item.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeItem(index)}
                                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 max-w-md ml-auto">
                                <div className="space-y-2">
                                    <Label>Subtotal *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        readOnly={items.length > 0}
                                        className={items.length > 0 ? 'bg-slate-50' : ''}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tax Amount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={taxAmount}
                                        onChange={(e) => setTaxAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center max-w-md ml-auto">
                                    <span className="text-lg font-semibold text-slate-900">Total Amount:</span>
                                    <span className="text-2xl font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Invoice'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

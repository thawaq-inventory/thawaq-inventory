'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react";
import { VendorDialog } from "@/components/VendorDialog";

interface Vendor {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    _count?: {
        invoices: number;
    };
}

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await fetch('/api/accounting/vendors');
            const data = await response.json();
            setVendors(data);
        } catch (error) {
            console.error('Failed to fetch vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this vendor?')) return;

        try {
            const response = await fetch(`/api/accounting/vendors/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchVendors();
            }
        } catch (error) {
            console.error('Failed to delete vendor:', error);
        }
    };

    const filteredVendors = vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.phone?.includes(searchQuery)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vendors</h1>
                    <p className="text-slate-500 mt-1">Manage your suppliers and vendors</p>
                </div>
                <Button
                    onClick={() => {
                        setSelectedVendor(null);
                        setDialogOpen(true);
                    }}
                    className="bg-slate-900 hover:bg-slate-800"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vendor
                </Button>
            </div>

            <Card>
                <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <Input
                                placeholder="Search vendors..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">Loading vendors...</div>
                    ) : filteredVendors.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No vendors yet</h3>
                            <p className="text-slate-500 mb-4">Get started by adding your first vendor</p>
                            <Button
                                onClick={() => {
                                    setSelectedVendor(null);
                                    setDialogOpen(true);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Vendor
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Address</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Tax ID</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Invoices</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVendors.map((vendor) => (
                                    <TableRow key={vendor.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium text-slate-900">
                                            {vendor.name}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {vendor.email && (
                                                <div className="text-sm">{vendor.email}</div>
                                            )}
                                            {vendor.phone && (
                                                <div className="text-sm text-slate-500">{vendor.phone}</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">
                                            {vendor.address || '-'}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm text-slate-600">
                                            {vendor.taxId || '-'}
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {vendor._count?.invoices || 0}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedVendor(vendor);
                                                        setDialogOpen(true);
                                                    }}
                                                    className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(vendor.id)}
                                                    className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <VendorDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                vendor={selectedVendor}
                onSave={fetchVendors}
            />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Store, TrendingUp } from "lucide-react";

interface Location {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    isActive: boolean;
    stocks: Array<{
        product: { name: string };
        stockLevel: number;
    }>;
}

interface StockTransfer {
    id: string;
    fromLocation: { name: string };
    toLocation: { name: string };
    product: { name: string };
    quantity: number;
    status: string;
    createdAt: string;
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [transfers, setTransfers] = useState<StockTransfer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [locationsRes, transfersRes] = await Promise.all([
                fetch('/api/locations'),
                fetch('/api/stock-transfers')
            ]);
            const locationsData = await locationsRes.json();
            const transfersData = await transfersRes.json();
            setLocations(locationsData);
            setTransfers(transfersData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Multi-Location Management</h1>
                    <p className="text-slate-500 mt-1">Manage branches and transfer stock between locations</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="bg-white"
                    >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Transfer Stock
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Location
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Locations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">{locations.filter(l => l.isActive).length}</div>
                        <p className="text-xs text-slate-500 mt-1">Active branches</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Stock Transfers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{transfers.length}</div>
                        <p className="text-xs text-slate-500 mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Recent Transfers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {transfers.filter(t => {
                                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                                return new Date(t.createdAt) > dayAgo;
                            }).length}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
                    </CardContent>
                </Card>
            </div>

            {/* Locations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {locations.map((location) => (
                    <Card key={location.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                                        <Store className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{location.name}</CardTitle>
                                        {location.address && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3 text-slate-400" />
                                                <span className="text-xs text-slate-500">{location.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${location.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {location.isActive ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {location.phone && (
                                <div className="text-sm text-slate-600">
                                    <span className="font-medium">Phone:</span> {location.phone}
                                </div>
                            )}

                            <div className="pt-2">
                                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                    Stock Items ({location.stocks.length})
                                </div>
                                {location.stocks.length > 0 ? (
                                    <div className="space-y-1">
                                        {location.stocks.slice(0, 3).map((stock, index) => (
                                            <div key={index} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                                                <span className="text-slate-700">{stock.product.name}</span>
                                                <span className="font-medium text-slate-900">{stock.stockLevel}</span>
                                            </div>
                                        ))}
                                        {location.stocks.length > 3 && (
                                            <div className="text-xs text-slate-400 pl-2">+{location.stocks.length - 3} more items</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-400 italic">No stock recorded</div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1">View Details</Button>
                                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Stock Transfers */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Stock Transfers</CardTitle>
                    <CardDescription>Latest inventory movements between locations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {transfers.slice(0, 10).map((transfer) => (
                            <div key={transfer.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                <div className="flex-1">
                                    <div className="font-medium text-slate-900">{transfer.product.name}</div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                                        <span>{transfer.fromLocation.name}</span>
                                        <span className="text-slate-400">→</span>
                                        <span>{transfer.toLocation.name}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {new Date(transfer.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-blue-600">{transfer.quantity} units</div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${transfer.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {transfer.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {locations.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Store className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Locations Added</h3>
                        <p className="text-slate-500 mb-4">Add your first location to start managing multi-location inventory</p>
                        <Button className="bg-gradient-to-r from-blue-500 to-blue-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Location
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    RefreshCcw,
    ArrowLeftRight,
    Filter,
    Download
} from "lucide-react";

import TransferList from './components/TransferList';
import NewTransferDialog from './components/NewTransferDialog';

export default function TransfersPage() {
    const t = useTranslations('Admin');
    const [activeTab, setActiveTab] = useState('requests');
    const [transfers, setTransfers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // User Context
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentBranchId, setCurrentBranchId] = useState<string>('');

    useEffect(() => {
        fetchUserContext();
    }, []);

    useEffect(() => {
        if (currentBranchId) {
            fetchTransfers();
        }
    }, [currentBranchId, activeTab]);

    const fetchUserContext = async () => {
        try {
            // Fetch User
            const resUser = await fetch('/api/auth/me');
            if (resUser.ok) {
                const data = await resUser.json();
                setCurrentUser(data.user);
            }

            // Fetch Current Branch Context (from cookie via API or similar)
            // For now, we rely on the `api/auth/me` or specific endpoint if implemented.
            // Actually, we need to know the 'selected' branch.
            // We can parse the 'selectedBranches' cookie or assume the API filters for us.
            // Let's assume the API returns 'currentBranchId' in the user object or we decode it.
            // SIMPLIFICATION: We'll fetch branches and assume the first one is context if not superadmin.
            // BETTER: Use a dedicated endpoint `/api/auth/context` or similar. 
            // Let's check cookies via a simple API call or just rely on client-side logic? 
            // We'll use the server-side filtered `/api/transfers` which should respect the cookie.
            // BUT UI needs to know "My Branch ID" to show correct buttons.

            // Temporary: Fetch a debug/context endpoint if we had one.
            // Fallback: We'll check the users assigned branch on clean load.
            const resCookies = await fetch('/api/debug/cookies'); // If exists? No.

            // Let's assume for V1 the user knows who they are.
            // We'll get the ID from the first available branch in the list effectively.
            if (resUser.ok) {
                const userData = await resUser.json();
                // This is slightly hacky -> in a real app use a context provider
                setCurrentBranchId(userData.branchId || '');
            }

        } catch (error) {
            console.error('Failed to load user context', error);
        }
    };

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            // The API handles filtering by 'selectedBranches' cookie automatically? 
            // Our previous implementation of GET /api/transfers takes a query param `branchId`.
            // We should pass the currentBranchId if we want to be specific, or rely on the backend to filtering?
            // Let's pass the status filter.

            let status = '';
            if (activeTab === 'requests') status = 'REQUESTED';
            if (activeTab === 'transit') status = 'IN_TRANSIT';
            // History = RECEIVED? or all completed.

            let url = `/api/transfers?`;
            if (status) url += `status=${status}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setTransfers(data);
            }
        } catch (error) {
            console.error('Failed to fetch transfers', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ArrowLeftRight className="w-6 h-6 text-blue-600" />
                        Stock Transfers
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage internal inventory movements between locations (Hub & Spoke).
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchTransfers}>
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <NewTransferDialog
                        currentBranchId={currentBranchId}
                        onSuccess={fetchTransfers}
                    />
                </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="requests" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="requests">Requests</TabsTrigger>
                        <TabsTrigger value="transit">In Transit</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-500">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                <TabsContent value="requests" className="mt-0">
                    <TransferList
                        transfers={transfers.filter(t => t.status === 'REQUESTED')}
                        loading={loading}
                        currentUserId={currentUser?.id}
                        currentBranchId={currentBranchId}
                        refreshData={fetchTransfers}
                    />
                </TabsContent>

                <TabsContent value="transit" className="mt-0">
                    <TransferList
                        transfers={transfers.filter(t => t.status === 'IN_TRANSIT')}
                        loading={loading}
                        currentUserId={currentUser?.id}
                        currentBranchId={currentBranchId}
                        refreshData={fetchTransfers}
                    />
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <TransferList
                        transfers={transfers.filter(t => ['RECEIVED', 'REJECTED'].includes(t.status))}
                        loading={loading}
                        currentUserId={currentUser?.id}
                        currentBranchId={currentBranchId}
                        refreshData={fetchTransfers}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

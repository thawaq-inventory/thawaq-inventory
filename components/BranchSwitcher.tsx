'use client';

import { useState, useEffect } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';

interface Branch {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
}

interface BranchSwitcherProps {
    userBranchId: string | null;
    isSuperAdmin: boolean;
}

export default function BranchSwitcher({ userBranchId, isSuperAdmin }: BranchSwitcherProps) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [stagedBranches, setStagedBranches] = useState<string[]>([]); // Staging area
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBranches();
        loadSelectedBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await fetch('/api/admin/branches');
            if (!res.ok) {
                console.error('Failed to fetch branches:', res.status, res.statusText);
                setBranches([]);
                return;
            }
            const data = await res.json();
            // Ensure data is an array before filtering
            if (Array.isArray(data)) {
                setBranches(data.filter((b: Branch) => b.isActive));
            } else {
                console.error('Invalid branches data format:', data);
                setBranches([]);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    const loadSelectedBranches = () => {
        // Try cookie first (for server-side), then localStorage (for client-side)
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('selectedBranches='))
            ?.split('=')[1];

        if (cookieValue) {
            try {
                const branches = JSON.parse(decodeURIComponent(cookieValue));
                setSelectedBranches(branches);
                setStagedBranches(branches); // Initialize staged with current
                return;
            } catch (e) {
                console.error('Error parsing cookie:', e);
            }
        }

        // Fallback to localStorage
        const saved = localStorage.getItem('selectedBranches');
        if (saved) {
            const branches = JSON.parse(saved);
            setSelectedBranches(branches);
            setStagedBranches(branches);
        } else if (userBranchId) {
            setSelectedBranches([userBranchId]);
            setStagedBranches([userBranchId]);
        } else if (isSuperAdmin) {
            setSelectedBranches(['all']);
            setStagedBranches(['all']);
        }
    };

    const applySelection = () => {
        // Save to both localStorage and cookie
        localStorage.setItem('selectedBranches', JSON.stringify(stagedBranches));

        // Set cookie (expires in 30 days)
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        document.cookie = `selectedBranches=${encodeURIComponent(JSON.stringify(stagedBranches))}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

        setSelectedBranches(stagedBranches);
        setIsOpen(false);
        // Trigger a page refresh to reload data with new branch filter
        window.location.reload();
    };

    const toggleBranch = (branchId: string) => {
        if (!isSuperAdmin) return; // Non-super admins can't switch

        let newSelection = [...stagedBranches];

        if (branchId === 'all') {
            // Select all branches
            setStagedBranches(['all']);
        } else {
            // Remove 'all' if selecting specific branch
            newSelection = newSelection.filter(id => id !== 'all');

            if (newSelection.includes(branchId)) {
                // Deselect branch
                newSelection = newSelection.filter(id => id !== branchId);
                // If no branches selected, select all
                if (newSelection.length === 0) {
                    newSelection = ['all'];
                }
            } else {
                // Select branch
                newSelection.push(branchId);
            }

            setStagedBranches(newSelection);
        }
    };

    const getSelectedBranchesText = () => {
        if (selectedBranches.includes('all')) {
            return 'All Branches';
        }
        if (selectedBranches.length === 0 && userBranchId) {
            const userBranch = branches.find(b => b.id === userBranchId);
            return userBranch ? userBranch.name : 'Select Branch';
        }
        if (selectedBranches.length === 1) {
            const branch = branches.find(b => b.id === selectedBranches[0]);
            return branch ? branch.name : 'Select Branch';
        }
        return `${selectedBranches.length} Branches`;
    };

    const isBranchSelected = (branchId: string) => {
        return stagedBranches.includes('all') || stagedBranches.includes(branchId);
    };

    const hasChanges = () => {
        return JSON.stringify(selectedBranches.sort()) !== JSON.stringify(stagedBranches.sort());
    };

    const cancelChanges = () => {
        setStagedBranches([...selectedBranches]);
        setIsOpen(false);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Loading...</span>
            </div>
        );
    }

    // For non-super admins, show their branch (read-only)
    if (!isSuperAdmin && userBranchId) {
        const userBranch = branches.find(b => b.id === userBranchId);
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                    {userBranch?.name || 'My Branch'}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {userBranch?.code}
                </span>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all min-w-[200px]"
            >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 flex-1 text-left">
                    {getSelectedBranchesText()}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                        <div className="p-3 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Select Branches
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Choose which branches to view data from
                            </p>
                        </div>

                        <div className="p-2">
                            {/* All Branches Option */}
                            {isSuperAdmin && (
                                <button
                                    onClick={() => toggleBranch('all')}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors ${selectedBranches.includes('all') ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedBranches.includes('all')
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300'
                                            }`}>
                                            {selectedBranches.includes('all') && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-900">All Branches</p>
                                            <p className="text-xs text-gray-500">View data from all locations</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Divider */}
                            {isSuperAdmin && branches.length > 0 && (
                                <div className="my-2 border-t border-gray-100" />
                            )}

                            {/* Individual Branches */}
                            {branches.map((branch) => (
                                <button
                                    key={branch.id}
                                    onClick={() => toggleBranch(branch.id)}
                                    disabled={!isSuperAdmin}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${isSuperAdmin ? 'hover:bg-gray-50' : 'cursor-default'
                                        } ${isBranchSelected(branch.id) ? 'bg-gray-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isBranchSelected(branch.id)
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300'
                                            }`}>
                                            {isBranchSelected(branch.id) && (
                                                <Check className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                                            <p className="text-xs text-gray-500">{branch.code}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {branches.length === 0 && (
                                <p className="text-center text-sm text-gray-500 py-4">
                                    No active branches found
                                </p>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-100 bg-gray-50 space-y-2">
                            <p className="text-xs text-gray-500 text-center mb-2">
                                {stagedBranches.includes('all')
                                    ? 'Viewing all branches'
                                    : `${stagedBranches.length} branch${stagedBranches.length !== 1 ? 'es' : ''} selected`
                                }
                            </p>

                            {hasChanges() && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={cancelChanges}
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={applySelection}
                                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

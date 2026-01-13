'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function EmployeeBranchSwitcher() {
    const router = useRouter();
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [employeeId, setEmployeeId] = useState<string | null>(null);

    useEffect(() => {
        // Load Session
        const sessionData = localStorage.getItem('employeeSession');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (session.isSuperAdmin || session.role === 'SUPERADMIN') {
                    setIsSuperAdmin(true);
                    setEmployeeId(session.id);
                    setCurrentBranchId(session.branchId);

                    // Fetch branches immediately if Superadmin
                    fetchBranches(session.id);
                }
            } catch (e) {
                console.error('Error parsing session', e);
            }
        }
    }, []);

    const fetchBranches = async (empId: string) => {
        try {
            const res = await fetch(`/api/employee/branches?employeeId=${empId}`);
            if (res.ok) {
                const data = await res.json();
                setBranches(data);
            }
        } catch (error) {
            console.error('Failed to fetch branches', error);
        }
    };

    const handleSwitch = async (branchId: string) => {
        setLoading(true);
        try {
            // Update Context Cookie via API
            // We use the existing select-branch endpoint which sets the cookie
            // We need userId (employeeId), branchId, and a "secret" (which we faked/simplified in the earlier step check)
            // But wait, `api/auth/select-branch` (Step 934) checks for `user.isSuperAdmin`.
            // It expects { userId, branchId, secret }.
            // The secret was for the admin temporary login flow.
            // If we use it here, we might fail validation if we don't have a secret.

            // Let's re-examine /api/auth/select-branch.
            // It checks `if (!userId || !branchId || !secret)`.
            // So we NEED a secret.
            // But for an *already logged in* employee (Superadmin), this is annoying.

            // BETTER: Create a dedicated "switch-context" endpoint for authenticated employees
            // OR use my new `branches` endpoint to also handle POST?

            // Let's try to just update the cookie directly with a new Server Action or Route Handler?
            // Actually, `api/employee/auth/login` sets the cookie.
            // Let's create `api/employee/auth/switch-branch`.

            await fetch('/api/employee/auth/switch-branch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branchId }),
            });

            // Update local storage session to reflect new branchId (optional but good for UI consistency)
            const sessionData = localStorage.getItem('employeeSession');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                session.branchId = branchId;
                localStorage.setItem('employeeSession', JSON.stringify(session));
            }

            // Reload to apply changes (cookie takes effect)
            window.location.reload();

        } catch (error) {
            console.error('Failed to switch branch', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isSuperAdmin) return null;

    const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
                >
                    <Building2 className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">
                        {currentBranch?.name || 'Select Branch'}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
                {branches.map(branch => (
                    <DropdownMenuItem
                        key={branch.id}
                        onClick={() => handleSwitch(branch.id)}
                        className="flex items-center justify-between cursor-pointer"
                    >
                        <span className={currentBranchId === branch.id ? "font-bold" : ""}>
                            {branch.name}
                        </span>
                        {currentBranchId === branch.id && (
                            <Check className="w-4 h-4 text-slate-900" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

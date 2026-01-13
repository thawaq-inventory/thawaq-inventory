'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from "@/components/ui/logo";
import { Loader2, Store, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Multi-branch state
    const [showBranchSelector, setShowBranchSelector] = useState(false);
    const [availableBranches, setAvailableBranches] = useState<any[]>([]);
    const [userId, setUserId] = useState('');
    const [secret, setSecret] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.requiresBranchSelection) {
                setUserId(data.user.id);
                setSecret(data.secret);
                setAvailableBranches(data.availableBranches);
                setShowBranchSelector(true);
                setLoading(false); // Stop loading to show selector
            } else {
                // Auto-logged in (Single branch)
                router.push('/admin');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSelectBranch = async (branchId: string) => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/select-branch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, branchId, secret }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to select branch');
            }

            router.push('/admin');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (showBranchSelector) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Logo size="lg" />
                        <h1 className="mt-6 text-2xl font-bold text-gray-900">Select Location</h1>
                        <p className="mt-2 text-gray-600">Choose which branch to access</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}

                        <div className="grid gap-3">
                            {availableBranches.map((branch) => (
                                <button
                                    key={branch.id}
                                    onClick={() => handleSelectBranch(branch.id)}
                                    disabled={loading}
                                    className="flex items-center justify-between w-full p-4 text-left border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                            <Store className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                                                {branch.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {branch.code} • {branch.type}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowBranchSelector(false)}
                            className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Logo size="lg" />
                    <h1 className="mt-6 text-3xl font-bold text-gray-900">Admin Portal</h1>
                    <p className="mt-2 text-gray-600">Sign in to manage your business</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your username"
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Employee? <a href="/employee/login" className="text-blue-600 hover:text-blue-700 font-medium">Use PIN login instead</a>
                        </p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                        <strong>🔐 Admin Access</strong><br />
                        Use your username and password to access the admin dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
}

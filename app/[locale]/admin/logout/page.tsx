'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, CheckCircle } from 'lucide-react';

export default function LogoutPage() {
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const performLogout = async () => {
            try {
                // Call logout API
                const res = await fetch('/api/auth/logout', { method: 'POST' });

                if (res.ok) {
                    setStatus('success');

                    // Clear any local storage
                    localStorage.removeItem('employeeSession');
                    localStorage.removeItem('adminSession');

                    // Redirect to login after a brief delay
                    setTimeout(() => {
                        router.push('/admin/login');
                    }, 1500);
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Logout error:', error);
                setStatus('error');
            }
        };

        performLogout();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-slate-900 mb-2">Signing Out...</h1>
                        <p className="text-slate-500">Please wait while we log you out.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-slate-900 mb-2">Signed Out Successfully</h1>
                        <p className="text-slate-500">Redirecting to login page...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <LogOut className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-slate-900 mb-2">Logout Failed</h1>
                        <p className="text-slate-500 mb-4">There was an issue signing out.</p>
                        <button
                            onClick={() => router.push('/admin/login')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Go to Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

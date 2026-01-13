import { cookies } from 'next/headers';
import StockCountSheet from '@/components/StockCountSheet';

export default async function StockCountPage() {
    const cookieStore = await cookies();
    const selectedBranchCookie = cookieStore.get('selectedBranches');
    let currentBranchId = null;

    if (selectedBranchCookie) {
        try {
            const branches = JSON.parse(selectedBranchCookie.value);
            if (branches && branches.length > 0 && branches[0] !== 'all' && branches[0] !== 'HEAD_OFFICE') {
                currentBranchId = branches[0];
            }
        } catch (e) {
            console.error('Error parsing branch cookie', e);
        }
    }

    if (!currentBranchId) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-8 bg-red-50 text-red-800 rounded-xl border border-red-200 text-center">
                <h2 className="text-xl font-bold mb-2">Restricted Access</h2>
                <p>Stock Taking requires selecting a <strong>Specific Branch</strong>.</p>
                <p className="mt-2 text-sm text-red-600">Please switch to a specific branch (not Global View) to perform a stock count.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Physical Stock Count</h1>
                <p className="text-slate-500">Enter actual quantities found on shelf. Variances will be adjusted automatically.</p>
            </div>

            <StockCountSheet branchId={currentBranchId} />
        </div>
    );
}

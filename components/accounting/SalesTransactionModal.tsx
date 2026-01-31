
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { format } from 'date-fns';

interface JournalEntry {
    id: string;
    date: Date | string;
    description: string;
    reference: string | null;
    lines: {
        debit: number;
        credit: number;
        account: {
            code: string;
            name: string;
            type: string;
        };
    }[];
}

interface SalesTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: JournalEntry | null;
}

export function SalesTransactionModal({ isOpen, onClose, entry }: SalesTransactionModalProps) {
    if (!entry) return null;

    // Helper to find amount by account type/name
    const getAmount = (accName: string) => {
        const line = entry.lines.find(l => l.account.name === accName);
        return line ? Math.max(line.debit, line.credit) : 0;
    };

    // Revenue is usually Credit Food Sales
    const revenue = getAmount('Food Sales');
    const vat = getAmount('VAT Payable');
    const merchantFees = getAmount('Merchant Fees');
    const tips = getAmount('Tips Payable');
    const cashClearing = getAmount('Cash Clearing');
    const cogs = getAmount('COGS');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Sales Transaction Details</DialogTitle>
                    <DialogDescription>
                        Summary of Sales Upload
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-medium text-right">{format(new Date(entry.date), 'PPP')}</span>

                        <span className="text-slate-500">Receipt ID:</span>
                        <span className="font-medium text-right">{entry.reference}</span>
                    </div>

                    <div className="border-t border-slate-100 my-2"></div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">Total Revenue</span>
                            <span className="text-green-600 font-bold">{revenue.toFixed(2)} JOD</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">VAT (16%)</span>
                            <span>{vat.toFixed(2)} JOD</span>
                        </div>

                        {tips > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 text-xs italic">Includes Tips</span>
                                <span>{tips.toFixed(2)} JOD</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm text-red-500">
                            <span>Transaction Fees</span>
                            <span>-{merchantFees.toFixed(2)} JOD</span>
                        </div>

                        <div className="border-t border-slate-100 my-2"></div>

                        <div className="flex justify-between items-center text-base font-bold bg-slate-50 p-3 rounded-lg">
                            <span>Net Cash Received</span>
                            <span className="text-slate-900">{cashClearing.toFixed(2)} JOD</span>
                        </div>

                        {cogs > 0 && (
                            <div className="mt-4 pt-4 border-t border-dashed">
                                <div className="flex justify-between items-center text-sm text-slate-500">
                                    <span>Cost of Goods Sold</span>
                                    <span>{cogs.toFixed(2)} JOD</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}


import { FeeManager } from "@/components/settings/FeeManager";
import { GeneralConfig } from "@/components/settings/GeneralConfig";

export default function InventorySettingsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial & Inventory Settings</h1>
                <p className="text-slate-500 mt-1">Configure tax rates, sales channel fees, and inventory constants.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <GeneralConfig />
                <FeeManager />
            </div>
        </div>
    );
}

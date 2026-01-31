import { FeeManager } from "@/components/settings/FeeManager";

export default function SettingsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
                <p className="text-slate-500 mt-1">Configure your inventory system preferences</p>
            </div>

            <FeeManager />
        </div>
    );
}

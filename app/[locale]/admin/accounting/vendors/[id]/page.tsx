'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Placeholder for Vendor Details
export default function VendorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();

    return (
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Vendor Details</h1>
            <p className="text-slate-500 mb-6">This feature is coming soon.</p>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>
        </div>
    );
}

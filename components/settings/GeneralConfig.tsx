
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

export function GeneralConfig() {
    const [vatRate, setVatRate] = useState("16");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/settings/general')
            .then(res => res.json())
            .then(data => {
                if (data.VAT_RATE) {
                    // Stored as decimal (0.16), show as percent (16)
                    setVatRate((parseFloat(data.VAT_RATE) * 100).toString());
                }
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const decimal = parseFloat(vatRate) / 100;
            await fetch('/api/settings/general', {
                method: 'POST',
                body: JSON.stringify({ VAT_RATE: decimal })
            });
            alert('Saved');
        } catch (e) {
            alert('Error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>Global financial constants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="vat">VAT Rate (%)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="vat"
                            type="number"
                            value={vatRate}
                            onChange={e => setVatRate(e.target.value)}
                        />
                        <Button onClick={handleSave} disabled={saving || loading}>
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

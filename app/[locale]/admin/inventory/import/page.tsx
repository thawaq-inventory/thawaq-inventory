"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Upload, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

export default function ImportPage() {
    const [activeTab, setActiveTab] = useState("sales-report");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Import & Mapping</h2>
                    <p className="text-muted-foreground">Manage products, pricing, recipes, and sales data.</p>
                </div>
            </div>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 max-w-[1000px]">
                    <TabsTrigger value="sales-report">Sales Report</TabsTrigger>
                    <TabsTrigger value="products">Import Products</TabsTrigger>
                    <TabsTrigger value="prices">Price List (POS)</TabsTrigger>
                    <TabsTrigger value="channel-prices">Channel Pricing</TabsTrigger>
                    <TabsTrigger value="recipe-map">Recipe Map</TabsTrigger>
                </TabsList>

                <TabsContent value="sales-report" className="space-y-4 mt-4">
                    <SalesReportTab />
                </TabsContent>

                <TabsContent value="products" className="space-y-4 mt-4">
                    <ImportProductsTab />
                </TabsContent>

                <TabsContent value="prices" className="space-y-4 mt-4">
                    <ImportPricesTab />
                </TabsContent>

                <TabsContent value="channel-prices" className="space-y-4 mt-4">
                    <ChannelPricingTab />
                </TabsContent>

                <TabsContent value="recipe-map" className="space-y-4 mt-4">
                    <RecipeMapTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// --- Sub Components ---

function ImportProductsTab() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/inventory/import/products", { method: "POST", body: formData });
            const data = await res.json();
            setResult({ success: res.ok, data });
        } catch (e) {
            setResult({ success: false, data: { error: "Upload failed" } });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bulk Product Import</CardTitle>
                <CardDescription>
                    Upload CSV: <b>Name, SKU, Category, Base_Unit, Purchase_Unit, Conversion_Factor, Purchase_Price</b>
                    <br />System uses <b>SKU</b> to match. Re-uploading updates existing products (no duplicates).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input type="file" accept=".csv, .xlsx, .xls, .xlsm, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.ms-excel.sheet.macroEnabled.12" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <Button onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? "Importing..." : "Import Products"}
                </Button>
                {result && <ResultCard result={result} />}
            </CardContent>
        </Card>
    );
}

function ImportPricesTab() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/inventory/import/pos-prices", { method: "POST", body: formData });
            const data = await res.json();
            setResult({ success: res.ok, data });
        } catch (e) {
            setResult({ success: false, data: { error: "Upload failed" } });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Import Price List (POS)</CardTitle>
                <CardDescription>
                    Upload CSV: <b>pos_string, selling_price</b>
                    <br />Used for Revenue Validation in sales reports.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input type="file" accept=".csv, .xlsx, .xls, .xlsm, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.ms-excel.sheet.macroEnabled.12" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <Button onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? "Uploading..." : "Import Prices"}
                </Button>
                {result && <ResultCard result={result} />}
            </CardContent>
        </Card>
    );
}

function RecipeMapTab() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/inventory/recipe-map", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            setResult({ success: res.ok, data });
        } catch (error) {
            setResult({ success: false, data: { error: "Upload failed" } });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Recipe Map (Ingredients)</CardTitle>
                <CardDescription>
                    Upload CSV: <b>POS_String, Inventory_SKU, Quantity</b>.
                    <br />Matches on <b>POS String</b>. Re-uploading updates the mapping quantity/SKU.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input type="file" accept=".csv, .xlsx, .xls, .xlsm, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.ms-excel.sheet.macroEnabled.12" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <Button onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? "Uploading..." : "Import Map"}
                </Button>
                {result && <ResultCard result={result} />}
            </CardContent>
        </Card>
    );
}

function SalesReportTab() {
    const [branches, setBranches] = useState<any[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [selectedChannel, setSelectedChannel] = useState("IN_HOUSE"); // New: Channel selector
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [executionResult, setExecutionResult] = useState<any>(null);

    useEffect(() => {
        setLoadingBranches(true);
        fetch("/api/admin/branches")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setBranches(data);
                    if (data.length > 0) setSelectedBranch(data[0].id); // Auto-select first
                } else {
                    console.error("Expected array of branches, got:", data);
                    setBranches([]);
                }
            })
            .catch((err) => console.error(err))
            .finally(() => setLoadingBranches(false));
    }, []);

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        setExecutionResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("action", "ANALYZE");
        formData.append("channel", selectedChannel); // Pass channel

        try {
            const res = await fetch("/api/inventory/sales-import", { method: "POST", body: formData });
            const data = await res.json();
            setAnalysisResult(data);
        } catch (error) {
            alert("Analysis failed.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleExecute = async (action: string) => {
        if (!file || !selectedBranch) return;
        setExecuting(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("action", action);
        formData.append("branchId", selectedBranch);
        formData.append("channel", selectedChannel); // Pass channel

        try {
            const res = await fetch("/api/inventory/sales-import", { method: "POST", body: formData });
            const data = await res.json();
            setExecutionResult(data);
            setAnalysisResult(null); // Clear analysis to show success
        } catch (error) {
            alert("Execution failed.");
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Import Sales Report</CardTitle>
                    <CardDescription>
                        Upload Daily Sales CSV. System parses format, validates revenue, calculates COGS, and deducts inventory.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Select Branch (for Deduction)</Label>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={loadingBranches}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingBranches ? "Loading branches..." : "Select a branch..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Sales Channel</Label>
                        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select channel..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IN_HOUSE">In-House POS</SelectItem>
                                <SelectItem value="TALABAT">Talabat</SelectItem>
                                <SelectItem value="CAREEM">Careem</SelectItem>
                                <SelectItem value="DELIVEROO">Deliveroo</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {selectedChannel === 'TALABAT' && 'Talabat format: "Order Items" column with quantities'}
                            {selectedChannel === 'IN_HOUSE' && 'TabSense/Standard POS format'}
                            {selectedChannel === 'CAREEM' && 'Careem delivery format'}
                        </p>
                    </div>

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Sales Report CSV</Label>
                        <Input type="file" accept=".csv, .xlsx, .xls, .xlsm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </div>

                    <Button onClick={handleAnalyze} disabled={!file || analyzing || executing} className="btn-primary-blue">
                        {analyzing ? "Analyzing..." : "Step 1: Analyze Report"}
                    </Button>
                </CardContent>
            </Card>

            {analysisResult?.error && (
                <div className="mt-4">
                    <ResultCard result={{ success: false, data: analysisResult }} />
                </div>
            )}

            {/* SEQUENCE 1: FLASH P&L REPORT */}
            {analysisResult && analysisResult.flashReport && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-l-4 border-l-blue-600 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Flash P&L Report
                            </CardTitle>
                            <CardDescription>Review financial impact before posting.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead>Metric</TableHead>
                                        <TableHead>Logic</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {analysisResult.flashReport.map((row: any, idx: number) => (
                                        <TableRow key={idx} className={row.isTotal ? "font-bold bg-slate-100" : ""}>
                                            <TableCell className="font-medium">{row.metric}</TableCell>
                                            <TableCell className="text-xs text-slate-500">{row.logic}</TableCell>
                                            <TableCell className={`text-right font-mono ${row.isNegative ? "text-red-600" : "text-green-700"}`}>
                                                {row.amount.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* SEQUENCE 2: GAP REPORT */}
                    {analysisResult.zeroCostCount > 0 && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-md flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-orange-600 mt-1" />
                            <div>
                                <h4 className="font-bold text-orange-800">Gap Detected: Zero Cost Items</h4>
                                <p className="text-orange-700 text-sm mt-1">
                                    ⚠️ <b>{analysisResult.zeroCostCount} Items</b> have $0.00 cost mapped.
                                    This will skew your COGS lower than actual.
                                </p>
                                {analysisResult.debug?.zeroCostCulprits && (
                                    <div className="mt-2 p-2 bg-orange-100 rounded text-xs font-mono text-orange-900 border border-orange-200">
                                        <p className="font-bold mb-1">Top Culprits (Sample):</p>
                                        <ul className="list-disc pl-4">
                                            {analysisResult.debug.zeroCostCulprits.map((name: string, idx: number) => (
                                                <li key={idx}>{name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {analysisResult.status === 'DUPLICATE' && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
                            <div>
                                <h4 className="font-bold text-red-800">Duplicate Sales Upload</h4>
                                <p className="text-red-700 text-sm mt-1">
                                    These receipts have already been posted to the General Ledger.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SEQUENCE 3: ACTION MENU */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                        <Button
                            onClick={() => handleExecute('POST_ALL')}
                            disabled={!selectedBranch || executing || analysisResult.status === 'DUPLICATE'}
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            [Post Everything]
                        </Button>

                        <Button
                            onClick={() => handleExecute('POST_REVENUE_ONLY')}
                            disabled={!selectedBranch || executing || analysisResult.status === 'DUPLICATE'}
                            variant="outline"
                            className="flex-1 border-blue-200 hover:bg-blue-50 text-blue-800"
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            [Post Revenue Only]
                        </Button>

                        <Button
                            onClick={() => handleExecute('POST_MISSING_COGS')}
                            disabled={!selectedBranch || executing}
                            variant="outline"
                            className="flex-1 border-orange-200 hover:bg-orange-50 text-orange-800"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            [Post Missing COGS]
                        </Button>
                    </div>
                    <p className="text-xs text-center text-slate-400">
                        * Actions will create locked Journal Entries.
                    </p>
                </div>
            )}

            {executionResult && (
                <Card className="border-green-200 bg-green-50 animate-in zoom-in-95 duration-300">
                    <CardHeader>
                        <CardTitle className="text-green-800 flex items-center gap-2">
                            <CheckCircle className="h-6 w-6" />
                            Posting Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-green-700 font-medium">{executionResult.message}</p>
                        <p className="text-sm text-green-600 mt-2">Entries Created: <b>{executionResult.postedCount}</b></p>
                        <Button
                            variant="outline"
                            className="mt-4 bg-white border-green-200 text-green-700 hover:bg-green-100"
                            onClick={() => { setExecutionResult(null); setFile(null); }}
                        >
                            Process Another File
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function ResultCard({ result }: { result: any }) {
    if (result.success) {
        return (
            <div className="bg-green-50 text-green-800 p-4 rounded-md flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <div>
                    <p className="font-bold">Success</p>
                    <p className="text-sm">{result.data.message}</p>
                    {result.data.createdCount && <p className="text-xs">Created: {result.data.createdCount}</p>}
                </div>
            </div>
        )
    }
    return (
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <div>
                <p className="font-bold">Error</p>
                <p className="text-sm">{result.data.error}</p>
                {result.data.details && (
                    <div className="text-xs mt-1 max-h-[100px] overflow-auto">
                        {JSON.stringify(result.data.details)}
                    </div>
                )}
            </div>
        </div>
    )
}

function ChannelPricingTab() {
    const [file, setFile] = useState<File | null>(null);
    const [selectedChannel, setSelectedChannel] = useState("TALABAT");
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setResult(null);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("channel", selectedChannel);

        try {
            const res = await fetch("/api/inventory/channel-pricing", { method: "POST", body: formData });
            const data = await res.json();
            setResult({ success: res.ok, data });
        } catch (e) {
            setResult({ success: false, data: { error: "Upload failed" } });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Channel-Specific Pricing</CardTitle>
                <CardDescription>
                    Upload CSV with <b>POS_String, Price</b> for a specific sales channel (Talabat, Careem, etc.).
                    <br />This allows different selling prices per channel while using the same recipes for COGS.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label>Select Channel</Label>
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select channel..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TALABAT">Talabat</SelectItem>
                            <SelectItem value="CAREEM">Careem</SelectItem>
                            <SelectItem value="DELIVEROO">Deliveroo</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Prices for {selectedChannel} channel. In-House prices are managed in "Price List (POS)" tab.
                    </p>
                </div>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label>CSV File</Label>
                    <Input type="file" accept=".csv, .xlsx, .xls, .xlsm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <p className="text-xs text-muted-foreground">
                        Format: <code>POS_String, Price</code> (e.g., "Zinger Burger, 8.50")
                    </p>
                </div>

                <Button onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? "Importing..." : `Import ${selectedChannel} Prices`}
                </Button>
                {result && <ResultCard result={result} />}
            </CardContent>
        </Card>
    );
}


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
                <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
                    <TabsTrigger value="sales-report">Sales Report</TabsTrigger>
                    <TabsTrigger value="products">Import Products</TabsTrigger>
                    <TabsTrigger value="prices">Price List (POS)</TabsTrigger>
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
                    Upload CSV: <b>Name, SKU, Category, Base_Unit, Purchase_Unit, Conversion_Factor, Initial_Cost</b>
                    <br />Creates products and seeds inventory levels for all active branches.
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
                    <br />Definitions for inventory deduction.
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
    const [selectedBranch, setSelectedBranch] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [executionResult, setExecutionResult] = useState<any>(null);

    useEffect(() => {
        fetch("/api/admin/branches")
            .then((res) => res.json())
            .then((data) => setBranches(data))
            .catch((err) => console.error(err));
    }, []);

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setAnalysisResult(null);
        setExecutionResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("execute", "false");

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

    const handleExecute = async () => {
        if (!file || !selectedBranch) return;
        setExecuting(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("execute", "true");
        formData.append("branchId", selectedBranch);

        try {
            const res = await fetch("/api/inventory/sales-import", { method: "POST", body: formData });
            const data = await res.json();
            setExecutionResult(data);
            setAnalysisResult(null);
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
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger><SelectValue placeholder="Select a branch..." /></SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label>Sales Report CSV</Label>
                        <Input type="file" accept=".csv, .xlsx, .xls, .xlsm, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.ms-excel.sheet.macroEnabled.12" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </div>

                    <div className="flex gap-4">
                        <Button onClick={handleAnalyze} disabled={!file || analyzing || executing} variant="secondary">
                            {analyzing ? "Analyzing..." : "Analyze Report"}
                        </Button>

                        {analysisResult &&
                            (!analysisResult.missingMappings || analysisResult.missingMappings.length === 0) && (
                                <Button onClick={handleExecute} disabled={!selectedBranch || executing}>
                                    {executing ? "Processing..." : "Confirm & Deduct Inventory"}
                                </Button>
                            )}
                    </div>
                </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
                <div className="space-y-4">
                    {/* Financials */}
                    {analysisResult.financials && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Declared Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analysisResult.financials.totalDeclaredRevenue?.toFixed(2)}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Calculated Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analysisResult.financials.totalExpectedRevenue?.toFixed(2)}</div>
                                </CardContent>
                            </Card>
                            <Card className={Math.abs(analysisResult.financials.revenueVariance?.toFixed(2)) > 5 ? "border-red-500" : ""}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Variance</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${analysisResult.financials.revenueVariance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {analysisResult.financials.revenueVariance?.toFixed(2)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Est. COGS</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analysisResult.financials.totalCOGS?.toFixed(2)}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Warnings */}
                    {analysisResult.missingMappings?.length > 0 && (
                        <Card className="border-red-200">
                            <CardHeader className="bg-red-50">
                                <CardTitle className="text-red-700 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    Missing Recipes ({analysisResult.missingMappings.length})
                                </CardTitle>
                                <CardDescription>These items cannot be deducted. Update Recipe Map.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="max-h-[200px] overflow-y-auto">
                                    <ul className="list-disc pl-5">
                                        {analysisResult.missingMappings.map((m: string, i: number) => <li key={i} className="text-sm">{m}</li>)}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {analysisResult.missingPrices?.length > 0 && (
                        <Card className="border-yellow-200">
                            <CardHeader className="bg-yellow-50">
                                <CardTitle className="text-yellow-700 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Missing Prices ({analysisResult.missingPrices.length})
                                </CardTitle>
                                <CardDescription>Revenue calculation may be inaccurate. Update Price List.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="max-h-[200px] overflow-y-auto">
                                    <ul className="list-disc pl-5">
                                        {analysisResult.missingPrices.map((m: string, i: number) => <li key={i} className="text-sm">{m}</li>)}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Audit Report Table */}
                    {analysisResult.auditReport && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Data Validation Audit</CardTitle>
                                <CardDescription>Detailed check for Recipe existence, SKU validity, and Costing.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-[300px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>POS Item</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Cost</TableHead>
                                                <TableHead>Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analysisResult.auditReport.map((item: any, i: number) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-medium">{item.posName}</TableCell>
                                                    <TableCell>
                                                        {item.status === 'OK' && <span className="text-green-600 font-bold">OK</span>}
                                                        {item.status === 'MISSING_RECIPE' && <span className="text-red-600 font-bold">Missing Recipe</span>}
                                                        {item.status === 'SKU_NOT_FOUND' && <span className="text-red-600 font-bold">SKU Not Found</span>}
                                                        {item.status === 'ZERO_COST' && <span className="text-orange-600 font-bold">Zero Cost</span>}
                                                    </TableCell>
                                                    <TableCell>{item.sku || '-'}</TableCell>
                                                    <TableCell>{item.cost !== undefined ? item.cost.toFixed(3) : '-'}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{item.details}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Success State */}
                    {(!analysisResult.missingMappings || analysisResult.missingMappings.length === 0) && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-md">
                            <CheckCircle className="h-5 w-5" />
                            <p className="font-semibold">All Recipes Mapped. Ready to Deduct.</p>
                        </div>
                    )}
                </div>
            )}

            {executionResult && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="text-green-800 flex items-center gap-2">
                            <CheckCircle className="h-6 w-6" />
                            Deduction Complete
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-green-700">{executionResult.message}</p>
                        {executionResult.financials && (
                            <div className="mt-2 text-sm text-green-800">
                                COGS Logged: {executionResult.financials.totalCOGS?.toFixed(2)} | Revenue Logged: {executionResult.financials.totalDeclaredRevenue?.toFixed(2)}
                            </div>
                        )}
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

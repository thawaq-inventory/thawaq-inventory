import * as XLSX from 'xlsx';

export interface ParsedData<T> {
    data: T[];
    errors: string[];
}

/**
 * Normalizes a header string to snake_case.
 * "Initial Cost" -> "initial_cost"
 * "SKU" -> "sku"
 * "Base Unit" -> "base_unit"
 */
function normalizeHeader(header: string): string {
    if (!header) return '';
    return header.toString().trim().toLowerCase().replace(/[\s\W]+/g, '_').replace(/^_|_$/g, '');
}

/**
 * Robustly parses an uploaded file (Excel or CSV) using SheetJS.
 * - Reads as ArrayBuffer (binary safe).
 * - Normalizes all headers (keys) to lowercase_snake_case.
 * - Handles exceptions gracefully.
 */
export async function parseUpload<T = any>(file: File): Promise<ParsedData<T>> {
    try {
        const buffer = await file.arrayBuffer();

        // Read the workbook from binary buffer
        // 'read' handles both XLSX, XLS, and CSV detection automatically
        const workbook = XLSX.read(buffer, { type: 'array' });

        if (workbook.SheetNames.length === 0) {
            return { data: [], errors: ['Workbook is empty'] };
        }

        // Use the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with raw headers first
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

        if (rawData.length === 0) {
            return { data: [], errors: ['Sheet is empty'] };
        }

        // Normalize Keys
        // We map every object: { "Initial Cost": 10 } -> { "initial_cost": 10 }
        const normalizedData = rawData.map((row, index) => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
                const cleanKey = normalizeHeader(key);
                if (cleanKey) {
                    newRow[cleanKey] = row[key];
                }
            });
            return newRow;
        });

        return {
            data: normalizedData as T[],
            errors: []
        };

    } catch (error: any) {
        console.error("Parse Error:", error);
        return {
            data: [],
            errors: [`Failed to parse file: ${error.message}. Please upload a valid Excel or CSV file.`]
        };
    }
}

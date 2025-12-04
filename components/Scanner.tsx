'use client';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';

interface ScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

export const Scanner = ({ onScanSuccess, onScanFailure }: ScannerProps) => {
    const [scanResult, setScanResult] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize scanner only once
        if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            );

            scannerRef.current = scanner;

            scanner.render(
                (decodedText) => {
                    setScanResult(decodedText);
                    onScanSuccess(decodedText);
                    // Optional: Clear scanner after success if needed
                    // scanner.clear();
                },
                (error) => {
                    if (onScanFailure) {
                        onScanFailure(error);
                    }
                }
            );
        }

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="w-full max-w-md mx-auto">
            <div id="reader" className="w-full overflow-hidden rounded-lg border border-slate-200 bg-black"></div>
            {scanResult && (
                <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg text-center">
                    <p className="font-medium">Scanned: {scanResult}</p>
                </div>
            )}
        </div>
    );
};

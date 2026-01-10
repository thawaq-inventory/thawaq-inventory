'use client';

import * as React from 'react';

/**
 * Simple toast notification hook
 * This is a minimal implementation for displaying toast notifications
 */

type ToastVariant = 'default' | 'destructive';

interface ToastOptions {
    title?: string;
    description?: string;
    variant?: ToastVariant;
    duration?: number;
}

export function useToast() {
    const toast = React.useCallback((options: ToastOptions) => {
        // Simple implementation using browser alert for now
        // In production, you would use a proper toast library like sonner or radix-ui toast
        const message = [options.title, options.description].filter(Boolean).join(': ');

        if (typeof window !== 'undefined') {
            // Create a simple toast notification div
            const toastDiv = document.createElement('div');
            toastDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-top ${options.variant === 'destructive'
                    ? 'bg-red-600 text-white'
                    : 'bg-green-600 text-white'
                }`;
            toastDiv.innerHTML = `
        <div class="font-semibold">${options.title || ''}</div>
        ${options.description ? `<div class="text-sm mt-1">${options.description}</div>` : ''}
      `;

            document.body.appendChild(toastDiv);

            // Remove after duration
            setTimeout(() => {
                toastDiv.remove();
            }, options.duration || 5000);
        }
    }, []);

    return { toast };
}

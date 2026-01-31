'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isLoading?: boolean;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    isLoading = false
}: DeleteConfirmationModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
            <DialogContent className="z-[9999] sm:max-w-[425px]" style={{ zIndex: 9999 }}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button variant="outline" onClick={onClose} type="button" disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        type="button"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

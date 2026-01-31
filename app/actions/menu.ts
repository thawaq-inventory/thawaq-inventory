'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getMenuItems() {
    try {
        const items = await prisma.posMenuItem.findMany({
            orderBy: { posString: 'asc' },
        });
        return items;
    } catch (error) {
        console.error('Error fetching menu items:', error);
        throw new Error('Failed to fetch menu items');
    }
}

export async function updateMenuItem(id: string, data: { posString?: string; sellingPrice?: number }) {
    try {
        await prisma.posMenuItem.update({
            where: { id },
            data,
        });
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error) {
        console.error('Error updating menu item:', error);
        return { success: false, error: 'Failed to update item' };
    }
}

export async function deleteMenuItem(id: string) {
    try {
        await prisma.posMenuItem.delete({
            where: { id },
        });
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error) {
        console.error('Error deleting menu item:', error);
        return { success: false, error: 'Failed to delete item' };
    }
}

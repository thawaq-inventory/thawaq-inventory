import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BranchContext {
    isSuperAdmin: boolean;
    branchId: string | null;
    branch?: {
        id: string;
        name: string;
        code: string;
    } | null;
}

/**
 * Get branch context for a user
 * Returns branch information and permissions for data filtering
 */
export async function getBranchContext(userId: string): Promise<BranchContext> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { branch: true },
    });

    if (!user) {
        throw new Error('User not found');
    }

    if (user.isSuperAdmin) {
        // Super admins can access all branches
        return {
            isSuperAdmin: true,
            branchId: null,
            branch: null,
        };
    }

    if (!user.branchId) {
        throw new Error('User is not assigned to a branch');
    }

    return {
        isSuperAdmin: false,
        branchId: user.branchId,
        branch: user.branch,
    };
}

/**
 * Build where clause for branch-filtered queries
 * Returns empty object for super admins, branchId filter for regular users
 */
export function buildBranchWhere(context: BranchContext) {
    if (context.isSuperAdmin) {
        return {}; // No filter for super admins
    }

    return {
        branchId: context.branchId,
    };
}

/**
 * Get current active branch ID from session/cookie
 * For super admins who can switch between branches
 */
export function getActiveBranchId(
    context: BranchContext,
    selectedBranchId?: string | null
): string | null {
    if (context.isSuperAdmin move {
        // Super admin can select which branch to view
        return selectedBranchId || null;
    }

    // Regular users always see their assigned branch
    return context.branchId;
}

export default { getBranchContext, buildBranchWhere, getActiveBranchId };

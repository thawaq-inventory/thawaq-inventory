import { cookies } from 'next/headers';

/**
 * Get selected branch IDs from cookie
 * Returns array of branch IDs or ['all'] for all branches
 */
export async function getSelectedBranches(): Promise<string[]> {
    const cookieStore = await cookies();
    const selectedBranchesCookie = cookieStore.get('selectedBranches');

    if (selectedBranchesCookie) {
        try {
            return JSON.parse(decodeURIComponent(selectedBranchesCookie.value));
        } catch (e) {
            console.error('Error parsing selectedBranches cookie:', e);
        }
    }

    // Default to all branches if no selection
    return ['all'];
}

/**
 * Build Prisma where clause for branch filtering
 * @param selectedBranches - Array of branch IDs from getSelectedBranches()
 * @returns Prisma where clause object
 */
export function buildBranchFilter(selectedBranches: string[]) {
    // If 'all' is selected, don't filter by branch
    if (selectedBranches.includes('all')) {
        return {};
    }

    // If specific branches are selected, filter by those
    if (selectedBranches.length > 0) {
        return {
            branchId: {
                in: selectedBranches
            }
        };
    }

    // Default: no filter
    return {};
}

/**
 * Check if user has access to specific branch
 */
export function hasAccessToBranch(
    userBranchId: string | null,
    isSuperAdmin: boolean,
    selectedBranches: string[]
): boolean {
    // Super admins can access all branches
    if (isSuperAdmin) return true;

    // Regular users can only access their assigned branch
    if (userBranchId && selectedBranches.includes(userBranchId)) {
        return true;
    }

    return false;
}

/**
 * Complete branch filter helper for API routes
 */
export async function getBranchFilterForAPI() {
    const selectedBranches = await getSelectedBranches();
    return buildBranchFilter(selectedBranches);
}

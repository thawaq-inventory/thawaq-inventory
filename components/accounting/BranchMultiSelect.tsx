
'use client';

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function BranchMultiSelect({
    selectedBranches,
    onSelectionChange,
    disabled = false
}: {
    selectedBranches: string[],
    onSelectionChange: (ids: string[]) => void,
    disabled?: boolean
}) {
    const [open, setOpen] = React.useState(false)
    const [branches, setBranches] = React.useState<{ id: string, name: string, type?: string }[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        // Fetch active branches
        const fetchBranches = async () => {
            try {
                // Let's create a quick valid fetch if possible, else mock
                const response = await fetch('/api/accounting/branches');
                if (response.ok) {
                    const data = await response.json();
                    setBranches(data);
                } else {
                    console.warn("Failed to fetch branches, using mocks");
                    setBranches([
                        { id: '1', name: 'Abdoun Label', type: 'BRANCH' },
                    ]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

    const toggleBranch = (id: string) => {
        const current = new Set(selectedBranches);
        if (current.has(id)) {
            current.delete(id);
        } else {
            current.add(id);
        }
        onSelectionChange(Array.from(current));
    }

    // Consolidated Label
    const getLabel = () => {
        if (selectedBranches.length === 0) return "All Branches (Global)";
        if (selectedBranches.length === branches.length) return "All Branches";
        if (selectedBranches.length === 1) return branches.find(b => b.id === selectedBranches[0])?.name || "1 Branch";
        return `${selectedBranches.length} Branches Selected`;
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[250px] justify-between"
                    disabled={disabled}
                >
                    {getLabel()}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
                <Command>
                    <CommandInput placeholder="Search branch..." />
                    <CommandList>
                        <CommandEmpty>No branch found.</CommandEmpty>
                        <CommandGroup>
                            {branches.map((branch) => (
                                <CommandItem
                                    key={branch.id}
                                    value={branch.name}
                                    onSelect={() => toggleBranch(branch.id)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedBranches.includes(branch.id)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col items-start">
                                        <span>{branch.name}</span>
                                        {branch.type && (
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {branch.type.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover >
    )
}

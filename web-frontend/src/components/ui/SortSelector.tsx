import { Button } from "./button";
import { Select } from "./select";

interface SortOption {
    value: string;
    label: string;
}

interface SortSelectorProps {
    sortKey: string;
    sortDirection: "asc" | "desc";
    onSortChange: (key: string, direction: "asc" | "desc") => void;
    options: SortOption[];
    label?: string;
}

export function SortSelector({ sortKey, sortDirection, onSortChange, options, label }: SortSelectorProps) {
    return (
        <div className="flex flex-col gap-1">
            {label && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>}
            <div className="flex items-center gap-1">
                <Select
                    value={sortKey}
                    onChange={(e) => onSortChange(e.target.value, sortDirection)}
                    className="h-7 w-32 text-sm"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSortChange(sortKey, sortDirection === "asc" ? "desc" : "asc")}
                    className="h-7 px-2 text-xs"
                >
                    {sortDirection === "asc" ? "↑" : "↓"}
                </Button>
            </div>
        </div>
    );
}

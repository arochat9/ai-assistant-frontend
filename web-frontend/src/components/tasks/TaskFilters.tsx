import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { TaskStatus, SubType } from "shared";
import type { TaskFilters as TaskFiltersType } from "shared";

interface TaskFiltersProps {
    filters: TaskFiltersType;
    onFilterChange: (key: keyof TaskFiltersType, value: string) => void;
    onClearFilters: () => void;
    sortKey?: string;
    sortDirection?: "asc" | "desc";
    onSortChange?: (key: string, direction: "asc" | "desc") => void;
}

export function TaskFilters({
    filters,
    onFilterChange,
    onClearFilters,
    sortKey = "updatedAt",
    sortDirection = "desc",
    onSortChange,
}: TaskFiltersProps) {
    const statusOptions = [
        { value: "", label: "All" },
        { value: TaskStatus.OPEN, label: "Open" },
        { value: TaskStatus.CLOSED, label: "Closed" },
        { value: TaskStatus.BACKLOGGED, label: "Backlogged" },
    ];

    const subTypeOptions = [
        { value: "", label: "All" },
        { value: SubType.FUN, label: "Fun" },
        { value: SubType.TEXT_RESPONSE, label: "Text" },
        { value: SubType.CHORE, label: "Chore" },
        { value: SubType.ERRAND, label: "Errand" },
    ];

    const sortOptions = [
        { value: "taskName", label: "Name" },
        { value: "status", label: "Status" },
        { value: "subType", label: "Type" },
        { value: "taskDueTime", label: "Due Date" },
        { value: "updatedAt", label: "Last Updated" },
        { value: "createdAt", label: "Created" },
        { value: "plannedFor", label: "Planned For" },
    ];

    return (
        <div className="mb-3 pb-2">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Search</span>
                    <Input
                        placeholder="Search..."
                        value={filters.keyword || ""}
                        onChange={(e) => onFilterChange("keyword", e.target.value)}
                        className="h-7 w-40 text-sm"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</span>
                    <div className="flex items-center gap-0.5 rounded-md border p-0.5">
                        {statusOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant={(filters.status || "") === option.value ? "default" : "ghost"}
                                size="sm"
                                onClick={() => onFilterChange("status", option.value)}
                                className="h-6 px-2 text-xs"
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</span>
                    <div className="flex items-center gap-0.5 rounded-md border p-0.5">
                        {subTypeOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant={(filters.subType || "") === option.value ? "default" : "ghost"}
                                size="sm"
                                onClick={() => onFilterChange("subType", option.value)}
                                className="h-6 px-2 text-xs"
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Updated After</span>
                    <Input
                        type="date"
                        value={filters.updatedAfter ? new Date(filters.updatedAfter).toISOString().split("T")[0] : ""}
                        onChange={(e) => onFilterChange("updatedAfter", e.target.value)}
                        className="h-7 w-36 text-sm"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sort By</span>
                    <div className="flex items-center gap-1">
                        <Select
                            value={sortKey}
                            onChange={(e) => onSortChange?.(e.target.value, sortDirection)}
                            className="h-7 w-32 text-sm"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSortChange?.(sortKey, sortDirection === "asc" ? "desc" : "asc")}
                            className="h-7 px-2 text-xs"
                        >
                            {sortDirection === "asc" ? "↑" : "↓"}
                        </Button>
                    </div>
                </div>

                <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-7 px-2 text-xs ml-auto">
                    Clear All
                </Button>
            </div>
        </div>
    );
}

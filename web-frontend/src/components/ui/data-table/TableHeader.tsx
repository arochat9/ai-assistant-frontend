import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "../button";
import type { ColumnDef } from "./types";

interface TableHeaderProps<T> {
    columns: ColumnDef<T>[];
    sortKey?: string;
    sortDirection: "asc" | "desc";
    onSort: (columnKey: string) => void;
    showDrawerColumn?: boolean;
    drawerColumnWidth?: string;
    hasActionsColumn?: boolean;
    actionsColumnWidth?: string;
}

export function TableHeader<T>({
    columns,
    sortKey,
    sortDirection,
    onSort,
    showDrawerColumn,
    drawerColumnWidth = "60px",
    hasActionsColumn,
    actionsColumnWidth = "60px",
}: TableHeaderProps<T>) {
    const getSortIcon = (columnKey: string) => {
        if (sortKey !== columnKey) {
            return <ArrowUpDown className="ml-2 h-4 w-4" />;
        }
        return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    return (
        <thead>
            <tr className="transition-colors hover:bg-muted/50">
                {columns
                    .filter((col) => !col.hidden)
                    .map((column) => (
                        <th
                            key={column.key}
                            className="sticky top-0 z-10 bg-background h-10 px-1 text-left align-middle font-medium text-muted-foreground"
                            style={{
                                boxShadow: "inset 0 -1px 0 0 hsl(var(--border))",
                                ...(column.width ? { width: column.width } : {}),
                            }}
                        >
                            {column.sortable ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => onSort(column.key)}
                                    className="h-auto p-0 hover:bg-transparent font-semibold"
                                >
                                    {column.header}
                                    {getSortIcon(column.key)}
                                </Button>
                            ) : (
                                <span className="font-semibold">{column.header}</span>
                            )}
                        </th>
                    ))}
                {showDrawerColumn && (
                    <th
                        className="sticky top-0 z-10 bg-background h-10 p-0 text-center align-middle font-medium text-muted-foreground"
                        style={{
                            boxShadow: "inset 0 -1px 0 0 hsl(var(--border))",
                            width: drawerColumnWidth,
                        }}
                    >
                        <span className="font-semibold"></span>
                    </th>
                )}
                {hasActionsColumn && (
                    <th
                        className="sticky top-0 z-10 bg-background h-10 px-2 text-right align-middle font-medium text-muted-foreground"
                        style={{
                            boxShadow: "inset 0 -1px 0 0 hsl(var(--border))",
                            width: actionsColumnWidth,
                        }}
                    >
                        <span className="font-semibold">Actions</span>
                    </th>
                )}
            </tr>
        </thead>
    );
}

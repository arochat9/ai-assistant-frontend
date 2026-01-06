import { useState, useMemo } from "react";
import type { ColumnDef } from "./types";

export function useTableSort<T>(
    data: T[],
    columns: ColumnDef<T>[],
    defaultSortKey?: string,
    defaultSortDirection: "asc" | "desc" = "desc"
) {
    const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">(defaultSortDirection);

    const handleSort = (columnKey: string) => {
        if (sortKey === columnKey) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortKey(columnKey);
            setSortDirection("asc");
        }
    };

    const sortedData = useMemo(() => {
        if (!sortKey) return data;

        const column = columns.find((col) => col.key === sortKey);
        if (!column || !column.sortable) return data;

        return [...data].sort((a, b) => {
            const aValue = column.sortValue ? column.sortValue(a) : column.accessor(a);
            const bValue = column.sortValue ? column.sortValue(b) : column.accessor(b);

            const aVal = aValue ?? "";
            const bVal = bValue ?? "";

            if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
            if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, columns, sortKey, sortDirection]);

    return {
        sortKey,
        sortDirection,
        handleSort,
        sortedData,
    };
}

export function useTableEdit<T>() {
    const [editingCell, setEditingCell] = useState<{ rowKey: string; columnKey: string } | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    const startEdit = (rowKey: string, columnKey: string, currentValue: unknown, column: ColumnDef<T>) => {
        setEditingCell({ rowKey, columnKey });
        const editVal = column.editValue ? column.editValue(currentValue) : String(currentValue ?? "");
        setEditValue(editVal);
    };

    const cancelEdit = () => {
        setEditingCell(null);
        setEditValue("");
    };

    const isEditing = (rowKey: string, columnKey: string) => {
        return editingCell?.rowKey === rowKey && editingCell?.columnKey === columnKey;
    };

    return {
        editingCell,
        editValue,
        setEditValue,
        startEdit,
        cancelEdit,
        isEditing,
    };
}

import { useState } from "react";
import type { ColumnDef } from "./types";

interface TableCellProps<T> {
    row: T;
    rowKey: string;
    column: ColumnDef<T>;
    isEditing: boolean;
    editValue: string;
    onEditValueChange: (value: string) => void;
    onStartEdit: (rowKey: string, columnKey: string, currentValue: unknown, column: ColumnDef<T>) => void;
    onCancelEdit: () => void;
    onRowClick?: (row: T) => void;
    onCellEdit?: (row: T, columnKey: string, newValue: unknown) => void | Promise<void>;
}

export function TableCell<T>({
    row,
    rowKey,
    column,
    isEditing,
    editValue,
    onEditValueChange,
    onStartEdit,
    onCancelEdit,
    onRowClick,
    onCellEdit,
}: TableCellProps<T>) {
    const value = column.accessor(row);
    const originalValue = column.editValue ? column.editValue(value) : String(value ?? "");
    const [pendingValue, setPendingValue] = useState<string | null>(null);

    // Use the pending value if it exists and differs from actual, otherwise use actual
    const displayValue = pendingValue !== null && pendingValue !== originalValue ? pendingValue : value;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (editValue !== originalValue) {
                setPendingValue(editValue);
                const parsedValue = column.parseValue ? column.parseValue(editValue) : editValue;
                onCellEdit?.(row, column.key, parsedValue);
            }
            onCancelEdit();
        } else if (e.key === "Escape") {
            onCancelEdit();
        }
    };

    const handleBlur = () => {
        if (editValue !== originalValue) {
            setPendingValue(editValue);
            const parsedValue = column.parseValue ? column.parseValue(editValue) : editValue;
            onCellEdit?.(row, column.key, parsedValue);
        }
        onCancelEdit();
    };

    const handleClick = (e: React.MouseEvent) => {
        if (column.editable && onCellEdit && !isEditing) {
            e.stopPropagation();
            onStartEdit(rowKey, column.key, value, column);
        } else if (onRowClick && !isEditing) {
            onRowClick(row);
        }
    };

    return (
        <td
            className="px-1 py-3 align-middle"
            onClick={handleClick}
            style={{
                cursor: column.editable && onCellEdit ? "pointer" : undefined,
                ...(column.width ? { width: column.width } : {}),
            }}
        >
            {isEditing ? (
                <input
                    type="text"
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full px-2 py-0 border rounded focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : column.cell ? (
                column.cell(displayValue, row, isEditing, (newVal) => onCellEdit?.(row, column.key, newVal))
            ) : (
                <span>{String(displayValue ?? "")}</span>
            )}
        </td>
    );
}

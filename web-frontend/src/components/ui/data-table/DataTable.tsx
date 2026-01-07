import { ExternalLink } from "lucide-react";
import { Button } from "../button";
import { TableHeader } from "./TableHeader";
import { TableCell } from "./TableCell";
import { SelectCell } from "./SelectCell";
import { CheckboxCell } from "./CheckboxCell";
import { useTableSort, useTableEdit } from "./hooks";
import type { DataTableProps } from "./types";

export function DataTable<T>({
    data,
    columns,
    getRowKey,
    defaultSortKey,
    defaultSortDirection = "desc",
    sortKey: controlledSortKey,
    sortDirection: controlledSortDirection,
    onSortChange,
    onRowClick,
    onCellEdit,
    showDrawerColumn = false,
    drawerColumnWidth = "60px",
    onDrawerClick,
    actionsColumn,
    actionsColumnWidth = "60px",
    groupBy,
    groupHeader,
}: DataTableProps<T>) {
    const { sortKey, sortDirection, handleSort, sortedData } = useTableSort(
        data,
        columns,
        defaultSortKey,
        defaultSortDirection,
        controlledSortKey,
        controlledSortDirection,
        onSortChange
    );

    const { editValue, setEditValue, startEdit, cancelEdit, isEditing } = useTableEdit<T>();

    const groupedData = groupBy
        ? sortedData.reduce((acc, row) => {
              const group = groupBy(row) || "Ungrouped";
              if (!acc[group]) acc[group] = [];
              acc[group].push(row);
              return acc;
          }, {} as Record<string, T[]>)
        : { All: sortedData };

    const totalColumns = columns.length + (showDrawerColumn ? 1 : 0) + (actionsColumn ? 1 : 0);

    return (
        <div className="rounded-lg border h-full overflow-auto">
            <table className="w-full caption-bottom text-sm relative">
                <TableHeader
                    columns={columns}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    showDrawerColumn={showDrawerColumn}
                    drawerColumnWidth={drawerColumnWidth}
                    hasActionsColumn={!!actionsColumn}
                    actionsColumnWidth={actionsColumnWidth}
                />
                <tbody className="[&_tr:last-child]:border-0">
                    {Object.entries(groupedData).map(([groupValue, rows]) => (
                        <>
                            {groupBy && groupHeader && groupValue !== "All" && (
                                <tr key={`group-${groupValue}`}>
                                    <td
                                        colSpan={totalColumns}
                                        className="px-3 py-1.5 bg-muted/50 font-semibold text-xs uppercase tracking-wide text-foreground border-b-2 border-border"
                                    >
                                        {groupHeader(groupValue === "Ungrouped" ? undefined : groupValue)}
                                    </td>
                                </tr>
                            )}
                            {rows.map((row) => {
                                const rowKey = getRowKey(row);
                                const checkboxColumn = columns.find((col) => col.editType === "checkbox");
                                const isRowCompleted = checkboxColumn && checkboxColumn.accessor(row) === "Closed";

                                return (
                                    <tr
                                        key={rowKey}
                                        className={`border-b transition-colors hover:bg-muted/50 ${
                                            isRowCompleted ? "opacity-50" : ""
                                        }`}
                                    >
                                        {columns.map((column) => {
                                            if (column.editType === "checkbox") {
                                                return (
                                                    <td
                                                        key={column.key}
                                                        className="pl-3 pr-2 py-3 align-middle"
                                                        style={column.width ? { width: column.width } : undefined}
                                                    >
                                                        <CheckboxCell
                                                            status={
                                                                column.accessor(row) as "Open" | "Closed" | "Backlogged"
                                                            }
                                                            onToggle={() => {
                                                                const currentStatus = column.accessor(row) as string;
                                                                const newValue =
                                                                    currentStatus === "Open"
                                                                        ? "Closed"
                                                                        : currentStatus === "Closed"
                                                                        ? "Backlogged"
                                                                        : "Open";
                                                                onCellEdit?.(row, column.key, newValue);
                                                            }}
                                                        />
                                                    </td>
                                                );
                                            }

                                            if (column.editType === "select" && column.selectOptions) {
                                                return (
                                                    <SelectCell
                                                        key={column.key}
                                                        row={row}
                                                        column={column}
                                                        onCellEdit={onCellEdit}
                                                        options={column.selectOptions}
                                                    />
                                                );
                                            }

                                            return (
                                                <TableCell
                                                    key={column.key}
                                                    row={row}
                                                    rowKey={rowKey}
                                                    column={column}
                                                    isEditing={isEditing(rowKey, column.key)}
                                                    editValue={editValue}
                                                    onEditValueChange={setEditValue}
                                                    onStartEdit={startEdit}
                                                    onCancelEdit={cancelEdit}
                                                    onRowClick={onRowClick}
                                                    onCellEdit={onCellEdit}
                                                />
                                            );
                                        })}
                                        {showDrawerColumn && (
                                            <td
                                                className="p-0 align-middle text-center"
                                                style={{ width: drawerColumnWidth }}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDrawerClick?.(row);
                                                    }}
                                                    className="h-full w-full p-1"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        )}
                                        {actionsColumn && (
                                            <td
                                                className="p-2 align-middle text-right"
                                                style={{ width: actionsColumnWidth }}
                                            >
                                                {actionsColumn(row)}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

import type { ReactNode } from "react";

export interface ColumnDef<T> {
    key: string;
    header: string;
    sortable?: boolean;
    editable?: boolean;
    editType?: "text" | "select" | "checkbox";
    selectOptions?: string[];
    accessor: (row: T) => unknown;
    cell?: (value: unknown, row: T, isEditing: boolean, onChange: (value: unknown) => void) => ReactNode;
    sortValue?: (row: T) => string | number;
    editValue?: (value: unknown) => string;
    parseValue?: (input: string) => unknown;
}

export interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    getRowKey: (row: T) => string;
    defaultSortKey?: string;
    defaultSortDirection?: "asc" | "desc";
    onRowClick?: (row: T) => void;
    onCellEdit?: (row: T, columnKey: string, newValue: unknown) => void | Promise<void>;
    showDrawerColumn?: boolean;
    onDrawerClick?: (row: T) => void;
    actionsColumn?: (row: T) => ReactNode;
}

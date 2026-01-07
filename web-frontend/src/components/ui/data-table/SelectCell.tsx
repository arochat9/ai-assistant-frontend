import type { ColumnDef } from "./types";

interface SelectCellProps<T> {
    row: T;
    column: ColumnDef<T>;
    onCellEdit?: (row: T, columnKey: string, newValue: unknown) => void | Promise<void>;
    options: string[];
}

export function SelectCell<T>({ row, column, onCellEdit, options }: SelectCellProps<T>) {
    const value = column.accessor(row);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const parsedValue = column.parseValue ? column.parseValue(e.target.value) : e.target.value;
        onCellEdit?.(row, column.key, parsedValue);
    };

    return (
        <td className="p-2 align-middle" style={column.width ? { width: column.width } : undefined}>
            {column.cell ? (
                <div className="relative">
                    <div className="pointer-events-none">{column.cell(value, row, false, () => {})}</div>
                    <select
                        value={String(value ?? "")}
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <select
                    value={String(value ?? "")}
                    onChange={handleChange}
                    className="w-full px-2 py-1 border rounded cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                >
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            )}
        </td>
    );
}

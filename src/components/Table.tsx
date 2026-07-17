import React from 'react';

export interface IColumn<T> {
  header: string;
  accessor: keyof T | string;
  render?: (row: T) => React.ReactNode;
}

export interface ITableProps<T> {
  columns: IColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T>({ columns, data, isLoading, emptyMessage = 'No matching records found.' }: ITableProps<T>) {
  return (
    <div className="w-full overflow-hidden border border-[#E5E7EB] rounded-2xl bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
              {columns.map((column, idx) => (
                <th 
                  key={idx} 
                  className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4B5563]"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {isLoading ? (
              // Loading Skeleton Columns
              Array.from({ length: 3 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-6 py-4.5">
                      <div className="h-4 bg-[#F1F5F9] rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State view
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-[#6B7280]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row, rIdx) => (
                <tr 
                  key={rIdx} 
                  className="hover:bg-[#F9FAFB] transition-colors"
                >
                  {columns.map((column, cIdx) => {
                    const value = column.render 
                      ? column.render(row) 
                      : (row[column.accessor as keyof T] as unknown as React.ReactNode);
                    return (
                      <td key={cIdx} className="px-6 py-4 text-sm font-medium text-[#111827]">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

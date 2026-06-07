interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
}

export function DataTable<T extends object>({ columns, data, keyField }: DataTableProps<T>) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No hay datos</p>;
  }
  return (
    <>
    <div className="space-y-3 md:hidden">
      {data.map((row) => (
        <div key={String(row[keyField])} className="card-ring space-y-2 p-4">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
              <span className="text-xs font-medium text-muted-foreground">{col.header}</span>
              <div className="text-sm">{col.render(row)}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
    <div className="hidden overflow-x-auto rounded-lg border md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left font-medium">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[keyField])} className="border-b last:border-0 hover:bg-muted/30">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">{col.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

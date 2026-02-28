import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function PricingTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-gray-50/50">
            <TableHead className="py-4 px-6 w-[200px]"><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead className="py-4 px-6"><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead className="py-4 px-6"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="py-4 px-6"><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead className="py-4 px-6"><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead className="py-4 px-6"><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead className="py-4 px-6"><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead className="py-4 px-6 text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="px-6 py-4"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="px-6 py-4"><Skeleton className="h-4 w-12" /></TableCell>
              <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="px-6 py-4"><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell className="px-6 py-4"><Skeleton className="h-6 w-16 rounded" /></TableCell>
              <TableCell className="px-6 py-4"><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="px-6 py-4 text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Skeleton that mirrors the Student Fees & Payments page layout so the
 * loading state feels structural rather than a blank placeholder.
 */
export function StudentFeesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>

      {/* Student info card */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-7 w-24 ml-auto" />
              <Skeleton className="h-5 w-20 ml-auto rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session scope row */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-[180px] rounded-md" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-9 w-[180px] rounded-md" />
          </div>
        </div>
        <Skeleton className="h-4 w-52" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center space-y-1">
              <Skeleton className="h-3 w-20 mx-auto" />
              <Skeleton className="h-5 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fee items table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, r) => (
                <TableRow key={r}>
                  {Array.from({ length: 8 }).map((_, c) => (
                    <TableCell key={c}>
                      <Skeleton
                        className={`h-4 ${c === 0 ? "w-40" : c === 7 ? "w-16" : "w-20"}`}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Skeleton that mirrors the Student Profile (details) page layout.
 */
export function StudentProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top bar */}
      <div className="flex flex-col gap-3 mb-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-8 w-28 rounded-md" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Profile header card */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-36 rounded-md" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs list */}
      <div className="overflow-x-auto -mx-1 px-1">
        <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
      </div>

      {/* Tab content grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, r) => (
                <div key={r} className="flex items-center justify-between gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

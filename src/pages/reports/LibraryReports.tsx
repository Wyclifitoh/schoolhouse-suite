import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, BookOpen, AlertCircle, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const LoadingSkeleton = () => <div className="space-y-3 p-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
const EmptyState = ({ message }: { message: string }) => <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>;

const statusColor: Record<string, string> = {
  issued: "bg-info/10 text-info border-0",
  overdue: "bg-destructive/10 text-destructive border-0",
  returned: "bg-success/10 text-success border-0",
  lost: "bg-destructive/10 text-destructive border-0",
};

const LibraryReports = () => {
  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", "library"],
    queryFn: () => api.get<any>("/reports/library").catch(() => ({ books: [], issues: [] })),
  });

  const books = report?.books || [];
  const issues = report?.issues || [];
  const issuedBooks = issues.filter((i: any) => i.status === "issued");
  const overdueBooks = issues.filter((i: any) => i.status === "overdue");

  return (
    <DashboardLayout title="Library Reports" subtitle="Book issue, due and inventory reports">
      <Tabs defaultValue="issue" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="issue">Book Issue</TabsTrigger>
          <TabsTrigger value="due">Due Returns</TabsTrigger>
          <TabsTrigger value="inventory">Book Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="issue" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Issued Books</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : issuedBooks.length === 0 ? <EmptyState message="No issued books" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Book</TableHead><TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Issue Date</TableHead><TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{issuedBooks.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.book_title || "—"}</TableCell>
                    <TableCell>{i.student_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{i.issue_date}</TableCell>
                    <TableCell className="text-muted-foreground">{i.due_date}</TableCell>
                    <TableCell><Badge className={statusColor[i.status] || ""}>{i.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="due" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" />Overdue Books</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : overdueBooks.length === 0 ? <EmptyState message="No overdue books" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Book</TableHead><TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead><TableHead className="font-semibold">Days Overdue</TableHead>
                </TableRow></TableHeader>
                <TableBody>{overdueBooks.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.book_title}</TableCell>
                    <TableCell>{i.student_name}</TableCell>
                    <TableCell className="text-muted-foreground">{i.due_date}</TableCell>
                    <TableCell className="font-bold text-destructive">{i.days_overdue || "—"}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" />Book Inventory</CardTitle>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? <LoadingSkeleton /> : books.length === 0 ? <EmptyState message="No books in library" /> : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Title</TableHead><TableHead className="font-semibold">Author</TableHead>
                  <TableHead className="font-semibold">ISBN</TableHead><TableHead className="font-semibold text-center">Copies</TableHead>
                  <TableHead className="font-semibold text-center">Available</TableHead>
                </TableRow></TableHeader>
                <TableBody>{books.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell className="text-muted-foreground">{b.author}</TableCell>
                    <TableCell className="font-mono text-xs">{b.isbn || "—"}</TableCell>
                    <TableCell className="text-center">{b.total_copies || 0}</TableCell>
                    <TableCell className="text-center font-semibold">{b.available_copies || 0}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default LibraryReports;

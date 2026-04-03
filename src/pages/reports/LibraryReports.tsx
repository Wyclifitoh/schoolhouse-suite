import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const libraryBooks: any[] = [];
const bookIssues: any[] = [];
import { Download, BookOpen, AlertCircle, Package, RotateCcw } from "lucide-react";

const formatKES = (a: number) => `KES ${a.toLocaleString()}`;

const issuedBooks = bookIssues.filter(i => i.status === "issued");
const overdueBooks = bookIssues.filter(i => i.status === "overdue");
const returnedBooks = bookIssues.filter(i => i.status === "returned");

const statusColor: Record<string, string> = {
  issued: "bg-info/10 text-info border-0",
  overdue: "bg-destructive/10 text-destructive border-0",
  returned: "bg-success/10 text-success border-0",
  lost: "bg-destructive/10 text-destructive border-0",
};

const LibraryReports = () => (
  <DashboardLayout title="Library Reports" subtitle="Book issue, due and inventory reports">
    <Tabs defaultValue="issue" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
        <TabsTrigger value="issue">Book Issue</TabsTrigger>
        <TabsTrigger value="due">Book Due</TabsTrigger>
        <TabsTrigger value="inventory">Book Inventory</TabsTrigger>
        <TabsTrigger value="return">Issue Return</TabsTrigger>
      </TabsList>

      {/* BOOK ISSUE */}
      <TabsContent value="issue" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Book Issue Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4 mb-6">
              <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Currently Issued</p><p className="text-xl font-bold text-info">{issuedBooks.length}</p></div>
              <div className="p-3 rounded-lg bg-destructive/10 text-center"><p className="text-xs text-muted-foreground">Overdue</p><p className="text-xl font-bold text-destructive">{overdueBooks.length}</p></div>
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Returned</p><p className="text-xl font-bold text-success">{returnedBooks.length}</p></div>
              <div className="p-3 rounded-lg bg-warning/10 text-center"><p className="text-xs text-muted-foreground">Total Fines</p><p className="text-xl font-bold text-warning">{formatKES(bookIssues.reduce((s, i) => s + i.fine_amount, 0))}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Book</TableHead>
              <TableHead className="font-semibold">Issue Date</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{bookIssues.filter(i => i.status === "issued" || i.status === "overdue").map(i => (
              <TableRow key={i.id}>
                <TableCell><div><p className="font-medium">{i.student_name}</p><p className="text-xs text-muted-foreground">{i.admission_no}</p></div></TableCell>
                <TableCell>{i.book_title}</TableCell>
                <TableCell className="text-muted-foreground">{i.issue_date}</TableCell>
                <TableCell className="text-muted-foreground">{i.due_date}</TableCell>
                <TableCell><Badge className={statusColor[i.status]}>{i.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* BOOK DUE */}
      <TabsContent value="due" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" />Book Due Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Book</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold text-center">Overdue Days</TableHead>
              <TableHead className="font-semibold text-right">Fine</TableHead>
              <TableHead className="font-semibold">Paid</TableHead>
            </TableRow></TableHeader>
            <TableBody>{overdueBooks.map(i => (
              <TableRow key={i.id}>
                <TableCell><div><p className="font-medium">{i.student_name}</p><p className="text-xs text-muted-foreground">{i.class}</p></div></TableCell>
                <TableCell>{i.book_title}</TableCell>
                <TableCell className="text-destructive font-medium">{i.due_date}</TableCell>
                <TableCell className="text-center font-bold text-destructive">{i.overdue_days}</TableCell>
                <TableCell className="text-right font-semibold text-warning">{formatKES(i.fine_amount)}</TableCell>
                <TableCell><Badge className={i.fine_paid ? "bg-success/10 text-success border-0" : "bg-destructive/10 text-destructive border-0"}>{i.fine_paid ? "Yes" : "No"}</Badge></TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* BOOK INVENTORY */}
      <TabsContent value="inventory" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Book Inventory Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="p-3 rounded-lg bg-primary/10 text-center"><p className="text-xs text-muted-foreground">Total Titles</p><p className="text-xl font-bold text-primary">{libraryBooks.length}</p></div>
              <div className="p-3 rounded-lg bg-info/10 text-center"><p className="text-xs text-muted-foreground">Total Copies</p><p className="text-xl font-bold text-info">{libraryBooks.reduce((s, b) => s + b.total_copies, 0)}</p></div>
              <div className="p-3 rounded-lg bg-success/10 text-center"><p className="text-xs text-muted-foreground">Available</p><p className="text-xl font-bold text-success">{libraryBooks.reduce((s, b) => s + b.available_copies, 0)}</p></div>
            </div>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Author</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">ISBN</TableHead>
              <TableHead className="font-semibold text-center">Total</TableHead>
              <TableHead className="font-semibold text-center">Available</TableHead>
              <TableHead className="font-semibold text-center">Issued</TableHead>
            </TableRow></TableHeader>
            <TableBody>{libraryBooks.map(b => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.title}</TableCell>
                <TableCell className="text-muted-foreground">{b.author}</TableCell>
                <TableCell><Badge variant="secondary">{b.category}</Badge></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{b.isbn}</TableCell>
                <TableCell className="text-center font-semibold">{b.total_copies}</TableCell>
                <TableCell className="text-center font-semibold text-success">{b.available_copies}</TableCell>
                <TableCell className="text-center font-semibold text-info">{b.total_copies - b.available_copies}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ISSUE RETURN */}
      <TabsContent value="return" className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><RotateCcw className="h-4 w-4 text-primary" />Book Issue Return Report</CardTitle>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Student</TableHead>
              <TableHead className="font-semibold">Book</TableHead>
              <TableHead className="font-semibold">Issue Date</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold">Return Date</TableHead>
              <TableHead className="font-semibold text-center">Late Days</TableHead>
              <TableHead className="font-semibold text-right">Fine</TableHead>
            </TableRow></TableHeader>
            <TableBody>{returnedBooks.map(i => (
              <TableRow key={i.id}>
                <TableCell><div><p className="font-medium">{i.student_name}</p><p className="text-xs text-muted-foreground">{i.class}</p></div></TableCell>
                <TableCell>{i.book_title}</TableCell>
                <TableCell className="text-muted-foreground">{i.issue_date}</TableCell>
                <TableCell className="text-muted-foreground">{i.due_date}</TableCell>
                <TableCell className="text-success font-medium">{i.return_date}</TableCell>
                <TableCell className="text-center">{i.overdue_days > 0 ? <span className="text-destructive font-bold">{i.overdue_days}</span> : <span className="text-muted-foreground">0</span>}</TableCell>
                <TableCell className="text-right">{i.fine_amount > 0 ? <span className="font-semibold text-warning">{formatKES(i.fine_amount)}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
              </TableRow>
            ))}</TableBody></Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default LibraryReports;

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { libraryBooks, bookIssues } from "@/data/mockData";
import {
  Search, Plus, Download, BookOpen, BookCopy, AlertTriangle, RotateCcw,
  Filter, MoreHorizontal, Clock, CheckCircle, XCircle, Banknote,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

const statusConfig: Record<string, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-success/10 text-success border-0" },
  issued: { label: "Issued", className: "bg-info/10 text-info border-0" },
  reserved: { label: "Reserved", className: "bg-warning/10 text-warning border-0" },
  lost: { label: "Lost", className: "bg-destructive/10 text-destructive border-0" },
  damaged: { label: "Damaged", className: "bg-destructive/10 text-destructive border-0" },
};

const issueStatusConfig: Record<string, { label: string; className: string; icon: any }> = {
  issued: { label: "Issued", className: "bg-info/10 text-info border-0", icon: BookCopy },
  returned: { label: "Returned", className: "bg-success/10 text-success border-0", icon: CheckCircle },
  overdue: { label: "Overdue", className: "bg-destructive/10 text-destructive border-0", icon: AlertTriangle },
  lost: { label: "Lost", className: "bg-destructive/10 text-destructive border-0", icon: XCircle },
};

const Library = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [issueSearch, setIssueSearch] = useState("");
  const [issueStatusFilter, setIssueStatusFilter] = useState("all");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<typeof bookIssues[0] | null>(null);

  const categories: string[] = [...new Set(libraryBooks.map(b => b.category))];

  const filteredBooks = libraryBooks.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || b.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const filteredIssues = bookIssues.filter(i => {
    const matchSearch = i.student_name.toLowerCase().includes(issueSearch.toLowerCase()) ||
      i.book_title.toLowerCase().includes(issueSearch.toLowerCase());
    const matchStatus = issueStatusFilter === "all" || i.status === issueStatusFilter;
    return matchSearch && matchStatus;
  });

  const totalBooks = libraryBooks.reduce((s, b) => s + b.total_copies, 0);
  const availableBooks = libraryBooks.reduce((s, b) => s + b.available_copies, 0);
  const issuedCount = bookIssues.filter(i => i.status === "issued" || i.status === "overdue").length;
  const overdueCount = bookIssues.filter(i => i.status === "overdue").length;
  const totalFines = bookIssues.reduce((s, i) => s + i.fine_amount, 0);

  const handleReturn = (issue: typeof bookIssues[0]) => {
    setSelectedIssue(issue);
    setReturnDialogOpen(true);
  };

  return (
    <DashboardLayout title="Library" subtitle="Manage book catalog, issue/return, and fines">
      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="catalog" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Book Catalog</TabsTrigger>
          <TabsTrigger value="issues" className="gap-1.5"><BookCopy className="h-3.5 w-3.5" />Issue / Return</TabsTrigger>
          <TabsTrigger value="fines" className="gap-1.5"><Banknote className="h-3.5 w-3.5" />Fines</TabsTrigger>
        </TabsList>

        {/* ===== CATALOG TAB ===== */}
        <TabsContent value="catalog" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4 mb-0">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Total Books</p><p className="text-2xl font-bold text-foreground">{totalBooks}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Available</p><p className="text-2xl font-bold text-foreground">{availableBooks}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><BookCopy className="h-5 w-5 text-info" /></div>
              <div><p className="text-sm text-muted-foreground">Currently Issued</p><p className="text-2xl font-bold text-foreground">{issuedCount}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-foreground">{overdueCount}</p></div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Book Catalog</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Book</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader><DialogTitle>Add New Book</DialogTitle></DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>Title *</Label><Input placeholder="Book title" /></div>
                          <div className="space-y-2"><Label>Author *</Label><Input placeholder="Author name" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>ISBN</Label><Input placeholder="978-XXXX" /></div>
                          <div className="space-y-2"><Label>Publisher</Label><Input placeholder="Publisher" /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2"><Label>Category *</Label>
                            <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                          </div>
                          <div className="space-y-2"><Label>Copies *</Label><Input type="number" placeholder="1" /></div>
                          <div className="space-y-2"><Label>Shelf / Location</Label><Input placeholder="e.g. A-12" /></div>
                        </div>
                        <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Brief description" rows={2} /></div>
                        <Button className="w-full mt-2">Add Book</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by title, author, ISBN..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 h-9"><Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Book</TableHead>
                      <TableHead className="font-semibold">ISBN</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Shelf</TableHead>
                      <TableHead className="font-semibold text-center">Total</TableHead>
                      <TableHead className="font-semibold text-center">Available</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.map(b => (
                      <TableRow key={b.id} className="group">
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{b.title}</p>
                            <p className="text-xs text-muted-foreground">{b.author}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{b.isbn}</TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal">{b.category}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{b.shelf_location}</TableCell>
                        <TableCell className="text-center font-medium">{b.total_copies}</TableCell>
                        <TableCell className="text-center font-medium">{b.available_copies}</TableCell>
                        <TableCell>
                          <Badge className={statusConfig[b.available_copies > 0 ? "available" : "issued"]?.className}>
                            {b.available_copies > 0 ? "Available" : "All Issued"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Book</DropdownMenuItem>
                              <DropdownMenuItem>Issue Book</DropdownMenuItem>
                              <DropdownMenuItem>View History</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Showing {filteredBooks.length} of {libraryBooks.length} books</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ISSUE / RETURN TAB ===== */}
        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Issue & Return Tracking</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm"><BookCopy className="h-4 w-4 mr-1.5" />Issue Book</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Issue Book to Student</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Student *</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Search student..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="s1">Amina Wanjiku (ADM-2024-001)</SelectItem>
                          <SelectItem value="s2">Brian Ochieng (ADM-2024-002)</SelectItem>
                          <SelectItem value="s3">Catherine Muthoni (ADM-2024-003)</SelectItem>
                        </SelectContent></Select>
                      </div>
                      <div className="space-y-2"><Label>Book *</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Search book..." /></SelectTrigger>
                        <SelectContent>
                          {libraryBooks.filter(b => b.available_copies > 0).map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.title} ({b.available_copies} avail.)</SelectItem>
                          ))}
                        </SelectContent></Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2"><Label>Issue Date</Label><Input type="date" defaultValue={new Date().toISOString().split('T')[0]} /></div>
                        <div className="space-y-2"><Label>Due Date *</Label><Input type="date" /></div>
                      </div>
                      <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Optional notes" rows={2} /></div>
                      <Button className="w-full mt-2">Issue Book</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search student or book..." className="pl-9 h-9" value={issueSearch} onChange={e => setIssueSearch(e.target.value)} />
                </div>
                <Select value={issueStatusFilter} onValueChange={setIssueStatusFilter}>
                  <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="issued">Issued</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Book</TableHead>
                      <TableHead className="font-semibold">Issue Date</TableHead>
                      <TableHead className="font-semibold">Due Date</TableHead>
                      <TableHead className="font-semibold">Return Date</TableHead>
                      <TableHead className="font-semibold">Fine</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.map(i => {
                      const cfg = issueStatusConfig[i.status];
                      return (
                        <TableRow key={i.id} className="group">
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground text-sm">{i.student_name}</p>
                              <p className="text-xs text-muted-foreground">{i.admission_no} · {i.class}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-foreground">{i.book_title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{i.issue_date}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{i.due_date}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{i.return_date || "—"}</TableCell>
                          <TableCell>
                            {i.fine_amount > 0 ? (
                              <span className="text-sm font-semibold text-destructive">{formatKES(i.fine_amount)}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell><Badge className={cfg?.className}>{cfg?.label}</Badge></TableCell>
                          <TableCell>
                            {(i.status === "issued" || i.status === "overdue") && (
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleReturn(i)}>
                                <RotateCcw className="h-3 w-3 mr-1" />Return
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Return Dialog */}
          <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Return Book</DialogTitle></DialogHeader>
              {selectedIssue && (
                <div className="space-y-4 py-2">
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Student</span>
                      <span className="font-medium text-foreground">{selectedIssue.student_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Book</span>
                      <span className="font-medium text-foreground">{selectedIssue.book_title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due Date</span>
                      <span className="font-medium text-foreground">{selectedIssue.due_date}</span>
                    </div>
                    {selectedIssue.status === "overdue" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Days Overdue</span>
                        <span className="font-semibold text-destructive">{selectedIssue.overdue_days} days</span>
                      </div>
                    )}
                  </div>

                  {selectedIssue.status === "overdue" && (
                    <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                      <p className="text-sm font-semibold text-destructive mb-1">Fine Calculation</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{selectedIssue.overdue_days} days × KES {selectedIssue.fine_per_day}/day</span>
                        <span className="font-bold text-destructive">{formatKES(selectedIssue.fine_amount)}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Book Condition</Label>
                    <Select defaultValue="good">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="good">Good Condition</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="lost">Lost (Replacement Fee)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Any remarks" rows={2} /></div>
                  <Button className="w-full" onClick={() => setReturnDialogOpen(false)}>Confirm Return</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== FINES TAB ===== */}
        <TabsContent value="fines" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3 mb-0">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><Banknote className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-sm text-muted-foreground">Total Fines</p><p className="text-2xl font-bold text-foreground">{formatKES(totalFines)}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">Unpaid Fines</p><p className="text-2xl font-bold text-foreground">
                {formatKES(bookIssues.filter(i => i.fine_amount > 0 && !i.fine_paid).reduce((s, i) => s + i.fine_amount, 0))}
              </p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Collected</p><p className="text-2xl font-bold text-foreground">
                {formatKES(bookIssues.filter(i => i.fine_paid).reduce((s, i) => s + i.fine_amount, 0))}
              </p></div>
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Fine Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Book</TableHead>
                      <TableHead className="font-semibold">Overdue Days</TableHead>
                      <TableHead className="font-semibold">Rate</TableHead>
                      <TableHead className="font-semibold">Fine Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookIssues.filter(i => i.fine_amount > 0).map(i => (
                      <TableRow key={i.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground text-sm">{i.student_name}</p>
                            <p className="text-xs text-muted-foreground">{i.admission_no}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{i.book_title}</TableCell>
                        <TableCell className="text-sm text-destructive font-medium">{i.overdue_days} days</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatKES(i.fine_per_day)}/day</TableCell>
                        <TableCell className="text-sm font-bold text-destructive">{formatKES(i.fine_amount)}</TableCell>
                        <TableCell>
                          <Badge className={i.fine_paid ? "bg-success/10 text-success border-0" : "bg-warning/10 text-warning border-0"}>
                            {i.fine_paid ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!i.fine_paid && <Button variant="outline" size="sm" className="h-7 text-xs">Collect</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {bookIssues.filter(i => i.fine_amount > 0).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No fines recorded</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Library;

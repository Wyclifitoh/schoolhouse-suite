import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  feeTemplates, feeTypes, feeGroups, feeDiscounts, feeAllotments,
  studentFeeCollection, students, ledgerEntries, recentPayments, carryForwards,
} from "@/data/mockData";
import {
  Banknote, Plus, Receipt, FileText, CreditCard, Search, Download,
  Percent, Tags, ListChecks, ArrowUpRight, ArrowDownRight, Wallet, AlertCircle, CheckCircle,
} from "lucide-react";

const formatKES = (amount: number) => `KES ${Math.abs(amount).toLocaleString()}`;

const Finance = () => {
  const [selectedStudent, setSelectedStudent] = useState(students[0]);
  const [collectSearch, setCollectSearch] = useState("");

  const filteredCollection = studentFeeCollection.filter(s =>
    s.student_name.toLowerCase().includes(collectSearch.toLowerCase()) ||
    s.admission_no.toLowerCase().includes(collectSearch.toLowerCase())
  );

  return (
    <DashboardLayout title="Finance" subtitle="Complete fee management, discounts, allotment & collection">
      <Tabs defaultValue="fee-types" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="fee-types" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Fee Types</TabsTrigger>
          <TabsTrigger value="fee-groups" className="gap-1.5"><Tags className="h-3.5 w-3.5" />Fee Groups</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><Receipt className="h-3.5 w-3.5" />Templates & Fines</TabsTrigger>
          <TabsTrigger value="discounts" className="gap-1.5"><Percent className="h-3.5 w-3.5" />Discounts</TabsTrigger>
          <TabsTrigger value="allotment" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" />Allotment</TabsTrigger>
          <TabsTrigger value="collect" className="gap-1.5"><Wallet className="h-3.5 w-3.5" />Collect Fees</TabsTrigger>
          <TabsTrigger value="ledger" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />Student Ledger</TabsTrigger>
          <TabsTrigger value="carry-forward" className="gap-1.5"><ArrowUpRight className="h-3.5 w-3.5" />Carry Forward</TabsTrigger>
        </TabsList>

        {/* Fee Types */}
        <TabsContent value="fee-types" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Types</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Fee Type</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Add Fee Type</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Fee Name</Label><Input placeholder="e.g. Tuition Fee" /></div>
                      <div className="space-y-2"><Label>Fee Code</Label><Input placeholder="e.g. TF" /></div>
                      <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Description" /></div>
                      <Button className="w-full mt-2">Create Fee Type</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Fee Name</TableHead><TableHead className="font-semibold">Code</TableHead><TableHead className="font-semibold">Description</TableHead>
              </TableRow></TableHeader>
              <TableBody>{feeTypes.map(f => (
                <TableRow key={f.id}><TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="font-mono">{f.code}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{f.description}</TableCell></TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Groups */}
        <TabsContent value="fee-groups" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Groups</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Create Group</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Create Fee Group</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Group Name</Label><Input placeholder="e.g. Class 8 Fees" /></div>
                      <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Description" /></div>
                      <div className="space-y-2"><Label>Select Fee Types</Label>
                        <div className="grid grid-cols-2 gap-2">{feeTypes.map(f => (
                          <label key={f.id} className="flex items-center gap-2 text-sm p-2 rounded border cursor-pointer hover:bg-muted/50">
                            <input type="checkbox" className="rounded" />{f.name}
                          </label>
                        ))}</div>
                      </div>
                      <Button className="w-full mt-2">Create Group</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {feeGroups.map(g => (
                  <Card key={g.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{g.name}</h3>
                        <Badge variant="secondary">{g.fee_types.length} fees</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{g.description}</p>
                      <p className="text-lg font-bold text-primary">{formatKES(g.total)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates & Fines */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Fee Templates</p><p className="text-2xl font-bold text-foreground">{feeTemplates.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Banknote className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Total Fees Value</p><p className="text-2xl font-bold text-foreground">{formatKES(feeTemplates.reduce((s, f) => s + f.amount, 0))}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><AlertCircle className="h-5 w-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">With Fines</p><p className="text-2xl font-bold text-foreground">{feeTemplates.filter(f => f.fine_type !== "none").length}</p></div>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Templates & Fine Configuration</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Create Template</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Create Fee Template</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Fee Name</Label><Input placeholder="e.g. Tuition Fee" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Amount (KES)</Label><Input type="number" placeholder="25000" /></div>
                        <div className="space-y-2"><Label>Due Date</Label><Input type="date" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Ledger Type</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                          <SelectContent><SelectItem value="fees">Fees</SelectItem><SelectItem value="transport">Transport</SelectItem><SelectItem value="pos">POS</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>Fine Type</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="none">No Fine</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem><SelectItem value="percentage">Percentage</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Fine Amount / %</Label><Input type="number" placeholder="500" /></div>
                        <div className="space-y-2"><Label>Fine Frequency</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="one_time">One Time</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <Button className="w-full mt-2">Create Template</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Fee Name</TableHead><TableHead className="font-semibold">Ledger</TableHead><TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead><TableHead className="font-semibold">Fine</TableHead><TableHead className="font-semibold">Recurring</TableHead>
              </TableRow></TableHeader>
              <TableBody>{feeTemplates.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{f.ledger_type}</Badge></TableCell>
                  <TableCell className="font-semibold">{formatKES(f.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{f.due_date}</TableCell>
                  <TableCell>{f.fine_type === "none" ? <span className="text-muted-foreground text-sm">—</span> :
                    <Badge className="bg-warning/10 text-warning border-0">{f.fine_type === "percentage" ? `${f.fine_amount}%` : formatKES(f.fine_amount)} / {f.fine_frequency}</Badge>}</TableCell>
                  <TableCell>{f.is_recurring ? <Badge className="bg-success/10 text-success border-0">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discounts */}
        <TabsContent value="discounts" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Percent className="h-5 w-5 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Active Discounts</p><p className="text-2xl font-bold text-foreground">{feeDiscounts.length}</p></div>
            </CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Users className="h-5 w-5 text-success" /></div>
              <div><p className="text-sm text-muted-foreground">Students with Discounts</p><p className="text-2xl font-bold text-foreground">{feeDiscounts.reduce((s, d) => s + d.students_count, 0)}</p></div>
            </CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Fee Discounts</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Discount</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Create Fee Discount</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Discount Name</Label><Input placeholder="e.g. Staff Child Discount" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Discount Code</Label><Input placeholder="e.g. SCD" /></div>
                        <div className="space-y-2"><Label>Type</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount (KES)</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Value</Label><Input type="number" placeholder="50" /></div>
                        <div className="space-y-2"><Label>Applicable To</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="staff_child">Staff Child</SelectItem><SelectItem value="sibling">Sibling</SelectItem><SelectItem value="early_admission">Early Admission</SelectItem><SelectItem value="scholarship">Scholarship</SelectItem><SelectItem value="rte">RTE</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Discount description" /></div>
                      <Button className="w-full mt-2">Create Discount</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Discount</TableHead><TableHead className="font-semibold">Code</TableHead><TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Value</TableHead><TableHead className="font-semibold">Applicable To</TableHead><TableHead className="font-semibold">Students</TableHead>
              </TableRow></TableHeader>
              <TableBody>{feeDiscounts.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="font-mono">{d.code}</Badge></TableCell>
                  <TableCell className="capitalize text-muted-foreground">{d.type}</TableCell>
                  <TableCell className="font-semibold text-success">{d.type === "percentage" ? `${d.value}%` : formatKES(d.value)}</TableCell>
                  <TableCell><Badge variant="secondary">{d.applicable_to}</Badge></TableCell>
                  <TableCell className="font-semibold">{d.students_count}</TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allotment */}
        <TabsContent value="allotment" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><CardTitle className="text-base font-semibold">Fees & Discount Allotment</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Allocate fees on class-section or individual student</p></div>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />New Allotment</Button></DialogTrigger>
                  <DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Allot Fees</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Allotment Type</Label>
                        <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent><SelectItem value="class">Whole Class-Section</SelectItem><SelectItem value="category">Student Category</SelectItem><SelectItem value="gender">By Gender</SelectItem><SelectItem value="rte">RTE Students</SelectItem><SelectItem value="individual">Individual Student</SelectItem></SelectContent></Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Fee Group</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{feeGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>Class</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{["Grade 6","Grade 7","Grade 8"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Apply Discount (Optional)</Label>
                        <Select><SelectTrigger><SelectValue placeholder="No Discount" /></SelectTrigger>
                        <SelectContent><SelectItem value="none">No Discount</SelectItem>{feeDiscounts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <Button className="w-full mt-2">Allot Fees</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Fee Group</TableHead><TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Section</TableHead>
                <TableHead className="font-semibold">Students</TableHead><TableHead className="font-semibold">Total</TableHead><TableHead className="font-semibold">Collected</TableHead><TableHead className="font-semibold">Progress</TableHead>
              </TableRow></TableHeader>
              <TableBody>{feeAllotments.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.fee_group}</TableCell>
                  <TableCell>{a.class}</TableCell><TableCell>{a.section}</TableCell>
                  <TableCell className="font-semibold">{a.students}</TableCell>
                  <TableCell className="font-semibold">{formatKES(a.total_amount)}</TableCell>
                  <TableCell className="font-semibold text-success">{formatKES(a.collected)}</TableCell>
                  <TableCell className="w-40">
                    <div className="flex items-center gap-2">
                      <Progress value={(a.collected / a.total_amount) * 100} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{Math.round((a.collected / a.total_amount) * 100)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collect Fees */}
        <TabsContent value="collect" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Collect Fees</CardTitle>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search student..." className="pl-9 h-9" value={collectSearch} onChange={e => setCollectSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Class</TableHead><TableHead className="font-semibold">Total Fee</TableHead>
                <TableHead className="font-semibold">Discount</TableHead><TableHead className="font-semibold">Fine</TableHead><TableHead className="font-semibold">Paid</TableHead>
                <TableHead className="font-semibold">Balance</TableHead><TableHead className="font-semibold">Status</TableHead><TableHead className="w-24" />
              </TableRow></TableHeader>
              <TableBody>{filteredCollection.map(s => (
                <TableRow key={s.id}>
                  <TableCell><div><p className="font-medium text-foreground">{s.student_name}</p><p className="text-xs text-muted-foreground font-mono">{s.admission_no}</p></div></TableCell>
                  <TableCell className="text-muted-foreground">{s.class}</TableCell>
                  <TableCell className="font-semibold">{formatKES(s.total_fee)}</TableCell>
                  <TableCell className="text-success">{s.discount > 0 ? formatKES(s.discount) : "—"}</TableCell>
                  <TableCell className="text-warning">{s.fine > 0 ? formatKES(s.fine) : "—"}</TableCell>
                  <TableCell className="font-semibold text-success">{formatKES(s.paid)}</TableCell>
                  <TableCell className={`font-semibold ${s.balance > 0 ? "text-destructive" : s.balance < 0 ? "text-success" : "text-muted-foreground"}`}>
                    {s.balance === 0 ? "—" : s.balance < 0 ? `+${formatKES(Math.abs(s.balance))}` : formatKES(s.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      s.status === "paid" ? "bg-success/10 text-success border-0" :
                      s.status === "partial" ? "bg-warning/10 text-warning border-0" :
                      s.status === "overdue" ? "bg-destructive/10 text-destructive border-0" :
                      "bg-info/10 text-info border-0"
                    }>{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog><DialogTrigger asChild><Button size="sm" variant="outline">Collect</Button></DialogTrigger>
                      <DialogContent><DialogHeader><DialogTitle>Collect Fee - {s.student_name}</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Fee</span><span className="font-semibold">{formatKES(s.total_fee)}</span></div>
                            {s.discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="text-success">-{formatKES(s.discount)}</span></div>}
                            {s.fine > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Fine</span><span className="text-warning">+{formatKES(s.fine)}</span></div>}
                            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid</span><span className="text-success">{formatKES(s.paid)}</span></div>
                            <div className="flex justify-between text-sm font-semibold border-t pt-1 mt-1"><span>Balance Due</span><span className="text-destructive">{formatKES(s.balance)}</span></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Amount</Label><Input type="number" placeholder={s.balance.toString()} /></div>
                            <div className="space-y-2"><Label>Payment Mode</Label>
                              <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent><SelectItem value="mpesa">M-Pesa</SelectItem><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="cheque">Cheque</SelectItem></SelectContent></Select>
                            </div>
                          </div>
                          <div className="space-y-2"><Label>Reference / Receipt No.</Label><Input placeholder="Transaction reference" /></div>
                          <div className="space-y-2"><Label>Note</Label><Textarea placeholder="Payment note (optional)" rows={2} /></div>
                          <Button className="w-full"><Wallet className="h-4 w-4 mr-1.5" />Record Payment</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Ledger */}
        <TabsContent value="ledger" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">Student Ledger</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedStudent.id} onValueChange={v => setSelectedStudent(students.find(s => s.id === v) || students[0])}>
                    <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Statement</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {selectedStudent.full_name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div><p className="font-semibold text-foreground">{selectedStudent.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedStudent.admission_no} · {selectedStudent.grade} {selectedStudent.stream}</p></div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center"><p className="text-xs text-muted-foreground">Total Debits</p>
                    <p className="text-lg font-bold text-destructive">{formatKES(ledgerEntries.filter(l => l.type === "debit").reduce((s, l) => s + l.amount, 0))}</p></div>
                  <div className="text-center"><p className="text-xs text-muted-foreground">Total Credits</p>
                    <p className="text-lg font-bold text-success">{formatKES(ledgerEntries.filter(l => l.type === "credit").reduce((s, l) => s + l.amount, 0))}</p></div>
                  <div className="text-center"><p className="text-xs text-muted-foreground">Net Balance</p>
                    <p className={`text-lg font-bold ${selectedStudent.balance < 0 ? "text-destructive" : "text-success"}`}>{selectedStudent.balance < 0 ? "-" : ""}{formatKES(selectedStudent.balance)}</p></div>
                </div>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead><TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold text-right">Debit</TableHead><TableHead className="font-semibold text-right">Credit</TableHead><TableHead className="font-semibold text-right">Balance</TableHead>
                </TableRow></TableHeader>
                <TableBody>{ledgerEntries.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-muted-foreground">{l.date}</TableCell>
                    <TableCell className="font-medium">{l.description}</TableCell>
                    <TableCell className="text-right">{l.type === "debit" ? <span className="text-destructive font-semibold">{formatKES(l.amount)}</span> : "—"}</TableCell>
                    <TableCell className="text-right">{l.type === "credit" ? <span className="text-success font-semibold">{formatKES(l.amount)}</span> : "—"}</TableCell>
                    <TableCell className={`text-right font-semibold ${l.balance < 0 ? "text-destructive" : "text-success"}`}>{l.balance < 0 ? "-" : ""}{formatKES(l.balance)}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carry Forward */}
        <TabsContent value="carry-forward" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Fee Carry Forward & Brought Forward</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">From Term</TableHead><TableHead className="font-semibold">To Term</TableHead>
                <TableHead className="font-semibold">Type</TableHead><TableHead className="font-semibold">Amount</TableHead><TableHead className="font-semibold">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>{carryForwards.map(cf => (
                <TableRow key={cf.id}>
                  <TableCell className="font-medium">{cf.student_name}</TableCell>
                  <TableCell className="text-muted-foreground">{cf.from_term}</TableCell>
                  <TableCell className="text-muted-foreground">{cf.to_term}</TableCell>
                  <TableCell><Badge className={cf.type === "arrears" ? "bg-destructive/10 text-destructive border-0" : "bg-success/10 text-success border-0"}>{cf.type.replace("_", " ")}</Badge></TableCell>
                  <TableCell className={`font-semibold ${cf.type === "arrears" ? "text-destructive" : "text-success"}`}>{formatKES(cf.amount)}</TableCell>
                  <TableCell><Badge className="bg-success/10 text-success border-0">{cf.status}</Badge></TableCell>
                </TableRow>
              ))}</TableBody></Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

// Need Users icon import for discounts
import { Users } from "lucide-react";

export default Finance;

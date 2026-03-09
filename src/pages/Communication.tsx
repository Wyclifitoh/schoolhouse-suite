import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useNotices, useDownloads } from "@/hooks/useCommunication";
import {
  Plus, Bell, Download, Upload, FileText, AlertCircle,
} from "lucide-react";

const Communication = () => {
  const { data: notices = [], isLoading: noticesLoading } = useNotices();
  const { data: downloads = [], isLoading: downloadsLoading } = useDownloads();

  return (
    <DashboardLayout title="Communication" subtitle="Notice board, messaging & download center">
      <Tabs defaultValue="notices" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="notices" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notice Board</TabsTrigger>
          <TabsTrigger value="downloads" className="gap-1.5"><Download className="h-3.5 w-3.5" />Download Center</TabsTrigger>
        </TabsList>

        <TabsContent value="notices" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Notice Board</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Post Notice</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Post Notice</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Title</Label><Input placeholder="Notice title" /></div>
                      <div className="space-y-2"><Label>Message</Label><Textarea placeholder="Notice message..." rows={4} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Audience</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="students">Students</SelectItem><SelectItem value="parents">Parents</SelectItem><SelectItem value="teachers">Teachers</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>Priority</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <Button className="w-full mt-2">Post Notice</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {noticesLoading ? (
                <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
              ) : notices.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No notices posted yet.</p>
              ) : (
                <div className="space-y-4">
                  {notices.map((n: any) => (
                    <div key={n.id} className="p-4 rounded-lg border hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {n.priority === "high" && <AlertCircle className="h-4 w-4 text-destructive" />}
                            <h3 className="font-semibold text-foreground">{n.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{n.message}</p>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">{n.audience}</Badge>
                            <Badge className={n.priority === "high" ? "bg-destructive/10 text-destructive border-0" : "bg-info/10 text-info border-0"}>{n.priority}</Badge>
                            <span className="text-xs text-muted-foreground">by {n.author} · {n.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Download Center</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm"><Upload className="h-4 w-4 mr-1.5" />Upload Content</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Upload Content</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Title</Label><Input placeholder="e.g. Mathematics Syllabus" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Category</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="syllabus">Syllabus</SelectItem><SelectItem value="assignment">Assignment</SelectItem><SelectItem value="exam">Exam</SelectItem><SelectItem value="study_material">Study Material</SelectItem><SelectItem value="general">General</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2"><Label>Audience</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="students">Students</SelectItem><SelectItem value="teachers">Teachers</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                      <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg border-muted-foreground/30 hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="text-center"><Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">Click to upload file</p><p className="text-xs text-muted-foreground">PDF, DOCX, XLSX (Max 10MB)</p></div>
                      </div>
                      <Button className="w-full mt-2">Upload</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {downloadsLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : downloads.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">No downloads available.</p>
              ) : (
                <Table><TableHeader><TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Title</TableHead><TableHead className="font-semibold">Category</TableHead><TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Size</TableHead><TableHead className="font-semibold">Audience</TableHead><TableHead className="font-semibold">Date</TableHead><TableHead className="w-24" />
                </TableRow></TableHeader>
                <TableBody>{downloads.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="font-medium">{d.title}</span></div></TableCell>
                    <TableCell><Badge variant="secondary">{d.category}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{d.file_type}</TableCell>
                    <TableCell className="text-muted-foreground">{d.size}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{d.audience}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{d.date}</TableCell>
                    <TableCell><Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />Download</Button></TableCell>
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

export default Communication;

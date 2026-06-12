import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import {
  Calendar as BigCalendar, dateFnsLocalizer, View, Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  useEvents, useSaveEvent, useDeleteEvent, type CalendarEvent,
} from "@/hooks/useEvents";
import { usePermissions } from "@/hooks/usePermission";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay, locales,
});

type Form = Partial<CalendarEvent> & { starts_at?: string; ends_at?: string };
const toLocal = (d: Date) => {
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60_000).toISOString().slice(0, 16);
};

const AUDIENCE_LABEL: Record<string, string> = {
  all: "Everyone", staff: "Staff", teachers: "Teachers",
  students: "Students", parents: "Parents",
};

export default function Events() {
  const [view, setView] = useState<View>(Views.MONTH);
  const [cursor, setCursor] = useState(new Date());
  const { data: events = [] } = useEvents();
  const save = useSaveEvent();
  const remove = useDeleteEvent();
  const perms = usePermissions(["events:create", "events:update", "events:delete"]);
  const canCreate = perms["events:create"];
  const canUpdate = perms["events:update"];
  const canDelete = perms["events:delete"];

  const [editing, setEditing] = useState<Form | null>(null);

  const mapped = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.starts_at),
        end: new Date(e.ends_at),
        allDay: !!e.all_day,
        resource: e,
      })),
    [events],
  );

  const onSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!canCreate) return;
    setEditing({
      title: "",
      starts_at: toLocal(start),
      ends_at: toLocal(end > start ? end : addHours(start, 1)),
      all_day: false,
      color: "#3b82f6",
      category: "general",
      audience: "all",
      reminder_minutes: 60,
    });
  };

  const onSelectEvent = (ev: any) => {
    const r = ev.resource as CalendarEvent;
    setEditing({
      ...r,
      starts_at: toLocal(new Date(r.starts_at)),
      ends_at: toLocal(new Date(r.ends_at)),
    });
  };

  const close = () => setEditing(null);
  const onSave = async () => {
    if (!editing?.title || !editing.starts_at || !editing.ends_at) return;
    await save.mutateAsync({
      ...(editing as any),
      starts_at: new Date(editing.starts_at).toISOString().slice(0, 19).replace("T", " "),
      ends_at: new Date(editing.ends_at).toISOString().slice(0, 19).replace("T", " "),
    });
    close();
  };

  const onDelete = async () => {
    if (!editing?.id) return;
    await remove.mutateAsync(editing.id);
    close();
  };

  const eventStyle = (ev: any) => ({
    style: {
      backgroundColor: ev.resource?.color || "#3b82f6",
      borderColor: ev.resource?.color || "#3b82f6",
      color: "white",
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-end gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-7 w-7 text-primary" />
              Events Calendar
            </h1>
            <p className="text-muted-foreground">
              Click any time slot to create an event. Reminders are sent automatically.
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setEditing({
              title: "", starts_at: toLocal(new Date()), ends_at: toLocal(addHours(new Date(), 1)),
              color: "#3b82f6", category: "general", audience: "all", reminder_minutes: 60,
            })}>
              <Plus className="h-4 w-4 mr-1" /> New event
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-4">
            <div style={{ height: 680 }}>
              <BigCalendar
                localizer={localizer}
                events={mapped}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={(v) => setView(v)}
                date={cursor}
                onNavigate={(d) => setCursor(d)}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                selectable
                onSelectSlot={onSelectSlot}
                onSelectEvent={onSelectEvent}
                eventPropGetter={eventStyle}
                popup
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Title</label>
                <Input
                  value={editing.title || ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="e.g. Parent–Teacher Meeting"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description</label>
                <Textarea
                  value={editing.description || ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Starts</label>
                  <Input type="datetime-local" value={editing.starts_at || ""}
                    onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ends</label>
                  <Input type="datetime-local" value={editing.ends_at || ""}
                    onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!editing.all_day}
                  onCheckedChange={(v) => setEditing({ ...editing, all_day: v })}
                />
                <span className="text-sm">All-day event</span>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Location</label>
                <Input
                  value={editing.location || ""}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  placeholder="Hall / Online / Address"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Audience</label>
                  <Select
                    value={editing.audience || "all"}
                    onValueChange={(v) => setEditing({ ...editing, audience: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(AUDIENCE_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Remind (min)</label>
                  <Input type="number" min={0} value={editing.reminder_minutes ?? 60}
                    onChange={(e) => setEditing({ ...editing, reminder_minutes: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Color</label>
                  <Input type="color" value={editing.color || "#3b82f6"}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
                </div>
              </div>
              {editing.id && (
                <Badge variant={editing.reminder_sent ? "secondary" : "outline"}>
                  Reminder {editing.reminder_sent ? "sent" : "pending"}
                </Badge>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {editing?.id && canDelete && (
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={close}>Cancel</Button>
            {((editing?.id && canUpdate) || (!editing?.id && canCreate)) && (
              <Button onClick={onSave} disabled={save.isPending}>Save</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Lightweight in-process reminder dispatcher.
// Polls every minute for events whose reminder window opened, then
// inserts an in-app notification per audience and marks the event as sent.
const repo = require("./events.repository");
const notifications = require("../notifications/notifications.repository");

let started = false;

async function tick() {
  try {
    const due = await repo.dueReminders();
    for (const ev of due) {
      const when = new Date(ev.starts_at).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      await notifications.broadcast({
        schoolId: ev.school_id,
        audience: ev.audience || "all",
        type: "event_reminder",
        title: `Upcoming: ${ev.title}`,
        body: `Starts ${when}${ev.location ? ` · ${ev.location}` : ""}`,
        link: `/events`,
        priority: "normal",
        meta: { event_id: ev.id, starts_at: ev.starts_at },
        sourceType: "calendar_event",
        sourceId: ev.id,
      });
      await repo.markReminderSent(ev.id);
    }
  } catch (e) {
    // ETIMEDOUT / ECONNREFUSED happen during transient DB blips; don't spam logs.
    if (
      !["ETIMEDOUT", "ECONNREFUSED", "PROTOCOL_CONNECTION_LOST"].includes(
        e.code,
      )
    ) {
      console.warn("[events.reminder] tick failed:", e.message);
    }
  }
}

function start() {
  if (started) return;
  started = true;
  console.log("[events.reminder] scheduler started (60s interval)");
  setInterval(tick, 60_000);
  // Run once shortly after boot
  setTimeout(tick, 10_000);
}

module.exports = { start, tick };

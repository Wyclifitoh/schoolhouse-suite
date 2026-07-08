// In-process scheduler for communication_scheduled rows.
// Polls every 60s; dispatches due SMS / Email / both.
const hub = require("./hub.repository");
const svc = require("./communication.service");

let started = false;

async function tick() {
  try {
    const due = await hub.dueScheduled();
    for (const row of due) {
      const audience = typeof row.audience === "string" ? JSON.parse(row.audience) : row.audience;
      try {
        let sms = null, email = null;
        if (row.channel === "sms" || row.channel === "both") {
          sms = await svc.sendSmsBatch(row.school_id, { audience, message: row.body }, row.created_by);
        }
        if (row.channel === "email" || row.channel === "both") {
          email = await svc.sendEmailBatch(
            row.school_id,
            { audience, subject: row.subject || "Message", body: row.body },
            row.created_by,
          );
        }
        await hub.updateScheduled(row.school_id, row.id, {
          status: "sent",
          error: null,
          stats: {
            total: (sms?.total || 0) + (email?.total || 0),
            sent: (sms?.sent || 0) + (email?.sent || 0),
            failed: (sms?.failed || 0) + (email?.failed || 0),
          },
        });
      } catch (e) {
        await hub.updateScheduled(row.school_id, row.id, {
          status: "failed", error: e.message,
        });
      }
    }
  } catch (e) {
    console.warn("[comm-scheduler] tick failed:", e.message);
  }
}

function start() {
  if (started) return;
  started = true;
  const interval = Number(process.env.COMM_SCHEDULER_INTERVAL_MS) || 60_000;
  setInterval(tick, interval).unref?.();
  setTimeout(tick, 15_000).unref?.();
  console.log("[comm-scheduler] started");
}

module.exports = { start, tick };
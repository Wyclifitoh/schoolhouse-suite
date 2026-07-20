import { Mail, ToggleRight, Activity } from "lucide-react";
import AdminComingSoon from "./AdminComingSoon";

export const AdminCommunications = () => (
  <AdminComingSoon
    title="Communications"
    subtitle="Unified inbox for outbound email deliverability, bounce reports, and platform-wide notification history."
    icon={Mail}
    features={[
      "Sent, queued and failed emails per school",
      "Bounce & complaint reports",
      "Retry failed emails and inspect provider responses",
      "Search email history with rich filters",
    ]}
  />
);

export const AdminFeatureFlags = () => (
  <AdminComingSoon
    title="Feature Flags"
    subtitle="Toggle modules — Finance, Inventory, HR, Payroll, Library, Hostel, Transport, Communication, Parent & Student portals — for each tenant."
    icon={ToggleRight}
    features={[
      "Per-school module entitlements",
      "Bulk enable/disable across cohorts",
      "Rollout percentages for beta features",
      "Change history with rollback",
    ]}
  />
);

export const AdminPlatformHealth = () => (
  <AdminComingSoon
    title="Platform Health"
    subtitle="Live signals from every layer of CHUO — API, database, queues, SMS provider, email provider — with alerting."
    icon={Activity}
    features={[
      "CPU, RAM, disk and DB status",
      "Redis and background queue backlogs",
      "SMS and email provider status",
      "Failed backup and low disk alerts",
      "Historical incident timeline",
    ]}
  />
);

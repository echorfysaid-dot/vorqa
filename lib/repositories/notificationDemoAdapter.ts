import type { Notification, NotificationFilters, NotificationPreference } from "@/lib/models";
import { buildNotificationSummary, filterNotifications, okAction, paginateNotifications } from "./notificationMapper";

const now = new Date("2026-07-19T09:00:00.000Z");

function daysAgo(days: number, minutes = 0) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
}

export const demoNotifications: Notification[] = [
  {
    id: "NOT-1001",
    organizationId: "atlas",
    projectId: "PRJ-1048",
    title: "Budget overrun risk detected",
    message: "Luxury Villa Casablanca marble procurement is trending 8% above planned budget. Review supplier quotations before approval.",
    type: "Budget",
    module: "Budget",
    priority: "Critical",
    status: "Unread",
    read: false,
    context: "Atlas Construction Group · Luxury Villa Casablanca",
    href: "/projects/PRJ-1048",
    relatedEntityId: "PRJ-1048",
    relatedEntityType: "project",
    source: "vora",
    createdAt: daysAgo(0, 12)
  },
  {
    id: "NOT-1002",
    organizationId: "atlas",
    projectId: "PRJ-1048",
    title: "Milestone delay warning",
    message: "Structural frame inspection is 2 days behind the baseline schedule. VORA recommends escalating the inspection checklist.",
    type: "Milestone",
    module: "Timeline",
    priority: "High",
    status: "Unread",
    read: false,
    context: "Execution phase · Structural inspection",
    href: "/projects/PRJ-1048",
    scheduledFor: "2026-07-20T09:30:00.000Z",
    source: "vora",
    createdAt: daysAgo(0, 28)
  },
  {
    id: "NOT-1003",
    organizationId: "atlas",
    title: "RFQ response received",
    message: "BetonPro Materials submitted a quotation for RFQ-1001 with a 14-day delivery window.",
    type: "RFQ",
    module: "RFQ",
    priority: "High",
    status: "Unread",
    read: false,
    context: "RFQ-1001 · Supplier package",
    href: "/rfq/RFQ-1001",
    relatedEntityId: "RFQ-1001",
    relatedEntityType: "rfq",
    source: "system",
    createdAt: daysAgo(0, 46)
  },
  {
    id: "NOT-1004",
    organizationId: "atlas",
    title: "Contract approval required",
    message: "CON-1001 needs executive approval before the next payment milestone can be released.",
    type: "Contract",
    module: "Contracts",
    priority: "Critical",
    status: "Unread",
    read: false,
    context: "Atlas execution contract",
    href: "/contracts/CON-1001",
    relatedEntityId: "CON-1001",
    relatedEntityType: "contract",
    source: "system",
    createdAt: daysAgo(0, 78)
  },
  {
    id: "NOT-1005",
    organizationId: "atlas",
    projectId: "PRJ-1048",
    title: "Missing safety document",
    message: "The latest site safety method statement is missing from the project knowledge base.",
    type: "Document",
    module: "Documents",
    priority: "High",
    status: "Unread",
    read: false,
    context: "Documents · Safety",
    href: "/projects/PRJ-1048",
    source: "vora",
    createdAt: daysAgo(0, 124)
  },
  {
    id: "NOT-1006",
    organizationId: "atlas",
    title: "Marketplace connection accepted",
    message: "GeoConsult Africa accepted your connection request and is available for geotechnical review.",
    type: "Connection",
    module: "Marketplace",
    priority: "Normal",
    status: "Read",
    read: true,
    context: "Marketplace · Consultants",
    href: "/marketplace/geoconsult-africa",
    source: "system",
    createdAt: daysAgo(1)
  },
  {
    id: "NOT-1007",
    organizationId: "atlas",
    title: "Quotation comparison ready",
    message: "VORA prepared a comparison summary for RFQ-1001 quotations and highlighted the best-value option.",
    type: "Quotation",
    module: "Quotations",
    priority: "Medium",
    status: "Read",
    read: true,
    context: "Quotation evaluation",
    href: "/quotations/compare",
    source: "vora",
    createdAt: daysAgo(1, 60)
  },
  {
    id: "NOT-1008",
    organizationId: "atlas",
    projectId: "PRJ-1048",
    title: "Task workload alert",
    message: "Site engineering workload is above 82%. Consider moving two inspection tasks to the architecture team.",
    type: "Task",
    module: "Tasks",
    priority: "High",
    status: "Unread",
    read: false,
    context: "Team workload · Engineering",
    href: "/projects/PRJ-1048",
    source: "vora",
    createdAt: daysAgo(2)
  },
  {
    id: "NOT-1009",
    organizationId: "atlas",
    title: "Payment reminder",
    message: "Supplier advance payment review is due tomorrow for the steel procurement package.",
    type: "Payment",
    module: "Budget",
    priority: "Medium",
    status: "Unread",
    read: false,
    context: "Finance · Procurement",
    href: "/projects/PRJ-1048",
    scheduledFor: "2026-07-20T12:00:00.000Z",
    source: "system",
    createdAt: daysAgo(2, 30)
  },
  {
    id: "NOT-1010",
    organizationId: "atlas",
    title: "System maintenance window",
    message: "Vorqa demo services are prepared for a short maintenance window. No user action is required.",
    type: "System",
    module: "System",
    priority: "Low",
    status: "Archived",
    read: true,
    context: "System",
    href: "/settings",
    source: "system",
    createdAt: daysAgo(4)
  }
];

const demoPreference: NotificationPreference = {
  id: "NPR-1001",
  profileId: "demo-user",
  organizationId: "atlas",
  inAppEnabled: true,
  emailEnabled: true,
  pushEnabled: false,
  smsEnabled: false,
  mutedModules: [],
  minimumPriority: "Low",
  createdAt: daysAgo(8),
  updatedAt: daysAgo(1)
};

export const notificationDemoAdapter = {
  getNotifications(filters: NotificationFilters = {}) {
    const filtered = filterNotifications(demoNotifications, filters);
    return { data: paginateNotifications(filtered, filters), source: "demo" as const, isFallback: false };
  },

  getNotification(id: string) {
    return { data: demoNotifications.find((item) => item.id === id), source: "demo" as const, isFallback: false };
  },

  getSummary() {
    return { data: buildNotificationSummary(demoNotifications), source: "demo" as const, isFallback: false };
  },

  markAsRead(id: string) {
    return { data: okAction(id), source: "demo" as const, isFallback: false };
  },

  markAllAsRead() {
    return { data: okAction(), source: "demo" as const, isFallback: false };
  },

  archiveNotification(id: string) {
    return { data: okAction(id), source: "demo" as const, isFallback: false };
  },

  deleteNotification(id: string) {
    return { data: okAction(id), source: "demo" as const, isFallback: false };
  },

  getPreferences() {
    return { data: demoPreference, source: "demo" as const, isFallback: false };
  },

  updatePreferences(input: Partial<NotificationPreference>) {
    return { data: { ...demoPreference, ...input, updatedAt: new Date().toISOString() }, source: "demo" as const, isFallback: false };
  }
};

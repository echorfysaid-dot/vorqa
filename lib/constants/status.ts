export const projectStatuses = ["Planning", "Design Review", "Procurement", "Execution", "Completed", "On Hold", "At Risk"] as const;
export const rfqStatuses = ["Draft", "Open", "Closed", "Awarded"] as const;
export const contractStates = ["Draft", "Active", "Expiring", "Completed", "Archived"] as const;
export const employeeStatuses = ["Active", "Away", "Pending", "Inactive"] as const;
export const notificationPriorities = ["Low", "Normal", "High", "Critical"] as const;

export const statusToneMap = {
  Active: "success",
  Verified: "success",
  Execution: "gold",
  Procurement: "blue",
  Planning: "blue",
  Draft: "default",
  Open: "blue",
  Closed: "default",
  Awarded: "success",
  Expiring: "warning",
  Completed: "success",
  Archived: "default",
  "At Risk": "danger",
  "On Hold": "warning",
  "Pending invitation": "warning",
  "Suspended organization": "danger"
} as const;

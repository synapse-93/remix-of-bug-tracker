/** UI-facing domain models. Kept backend-agnostic so pages never import backend types. */
export type BugStatus = "new" | "assigned" | "in_progress" | "testing" | "resolved" | "closed";
export type BugSeverity = "critical" | "high" | "medium" | "low";

export interface Bug {
  id: string;
  trackingId: string;
  title: string;
  description: string | null;
  status: BugStatus;
  severity: BugSeverity;
  environment: string | null;
  assignee: string | null;
  reporter: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BugComment {
  id: string;
  bugId: string;
  author: string | null;
  body: string;
  createdAt: string;
}

export interface BugFilters {
  search?: string;
  status?: BugStatus | "all";
  severity?: BugSeverity | "all";
}

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string | null;
}

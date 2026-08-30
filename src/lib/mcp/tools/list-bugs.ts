import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const STATUSES = ["new", "assigned", "in_progress", "testing", "resolved", "closed"] as const;
const SEVERITIES = ["critical", "high", "medium", "low"] as const;

export default defineTool({
  name: "list_bugs",
  title: "List bugs",
  description: "List bug reports in Triage, optionally filtered by status, severity, or a text search.",
  inputSchema: {
    status: z.enum(STATUSES).optional().describe("Filter by bug status."),
    severity: z.enum(SEVERITIES).optional().describe("Filter by bug severity."),
    search: z.string().trim().min(1).optional().describe("Case-insensitive match on the bug title."),
    limit: z.number().int().min(1).max(100).optional().describe("Max number of bugs to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, severity, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("bugs")
      .select("id, tracking_id, title, status, severity, assignee_id, reporter_id, created_at, updated_at, sla_deadline")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (status) query = query.eq("status", status);
    if (severity) query = query.eq("severity", severity);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { bugs: data ?? [] },
    };
  },
});

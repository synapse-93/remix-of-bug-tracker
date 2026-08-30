import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const STATUSES = ["new", "assigned", "in_progress", "testing", "resolved", "closed"] as const;
const SEVERITIES = ["critical", "high", "medium", "low"] as const;

export default defineTool({
  name: "update_bug",
  title: "Update bug",
  description: "Update the status, severity, or assignee of an existing bug in Triage.",
  inputSchema: {
    bug: z.string().trim().min(1).describe("Tracking ID or UUID of the bug."),
    status: z.enum(STATUSES).optional(),
    severity: z.enum(SEVERITIES).optional(),
    assignee_id: z.string().uuid().nullable().optional().describe("User id to assign, or null to unassign."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ bug, status, severity, assignee_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const patch: Record<string, unknown> = {};
    if (status !== undefined) patch.status = status;
    if (severity !== undefined) patch.severity = severity;
    if (assignee_id !== undefined) patch.assignee_id = assignee_id;
    if (Object.keys(patch).length === 0) {
      return { content: [{ type: "text", text: "Nothing to update." }], isError: true };
    }

    const supabase = supabaseForUser(ctx);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bug);
    const { data, error } = await supabase
      .from("bugs")
      .update(patch)
      .eq(isUuid ? "id" : "tracking_id", bug)
      .select("id, tracking_id, title, status, severity, assignee_id")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No bug found for "${bug}"` }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { bug: data },
    };
  },
});

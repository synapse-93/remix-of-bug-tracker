import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const SEVERITIES = ["critical", "high", "medium", "low"] as const;

export default defineTool({
  name: "create_bug",
  title: "Create bug",
  description: "File a new bug report in Triage as the signed-in user.",
  inputSchema: {
    title: z.string().trim().min(1).max(200).describe("Short summary of the bug."),
    description: z.string().trim().min(1).max(5000).describe("Detailed description of the issue."),
    severity: z.enum(SEVERITIES).optional().describe("Severity (defaults to medium)."),
    steps_to_reproduce: z.string().trim().max(5000).optional(),
    expected_behavior: z.string().trim().max(2000).optional(),
    actual_behavior: z.string().trim().max(2000).optional(),
    environment: z.string().trim().max(200).optional().describe("e.g. Chrome 120, macOS 14"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("bugs")
      .insert({
        title: input.title,
        description: input.description,
        severity: input.severity ?? "medium",
        steps_to_reproduce: input.steps_to_reproduce ?? null,
        expected_behavior: input.expected_behavior ?? null,
        actual_behavior: input.actual_behavior ?? null,
        environment: input.environment ?? null,
        reporter_id: ctx.getUserId(),
      })
      .select("id, tracking_id, title, status, severity")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created ${data.tracking_id}: ${data.title}` }],
      structuredContent: { bug: data },
    };
  },
});

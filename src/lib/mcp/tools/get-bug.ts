import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_bug",
  title: "Get bug",
  description: "Fetch one bug by tracking ID (e.g. BUG-1234) or UUID, including its comments.",
  inputSchema: {
    bug: z.string().trim().min(1).describe("Tracking ID or UUID of the bug."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ bug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bug);
    const { data, error } = await supabase
      .from("bugs")
      .select("*")
      .eq(isUuid ? "id" : "tracking_id", bug)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No bug found for "${bug}"` }], isError: true };

    const { data: comments } = await supabase
      .from("comments")
      .select("id, content, user_id, created_at")
      .eq("bug_id", data.id)
      .order("created_at", { ascending: true });

    const result = { ...data, comments: comments ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: { bug: result },
    };
  },
});

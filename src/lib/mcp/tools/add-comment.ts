import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_comment",
  title: "Add comment",
  description: "Add a comment to a bug in Triage as the signed-in user.",
  inputSchema: {
    bug: z.string().trim().min(1).describe("Tracking ID or UUID of the bug."),
    content: z.string().trim().min(1).max(5000).describe("Comment text."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ bug, content }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bug);
    const { data: target, error: lookupError } = await supabase
      .from("bugs")
      .select("id, tracking_id")
      .eq(isUuid ? "id" : "tracking_id", bug)
      .maybeSingle();
    if (lookupError) return { content: [{ type: "text", text: lookupError.message }], isError: true };
    if (!target) return { content: [{ type: "text", text: `No bug found for "${bug}"` }], isError: true };

    const { data, error } = await supabase
      .from("comments")
      .insert({ bug_id: target.id, content, user_id: ctx.getUserId() })
      .select("id, content, created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Comment added to ${target.tracking_id}` }],
      structuredContent: { comment: data },
    };
  },
});

import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listBugsTool from "./tools/list-bugs";
import getBugTool from "./tools/get-bug";
import createBugTool from "./tools/create-bug";
import updateBugTool from "./tools/update-bug";
import addCommentTool from "./tools/add-comment";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "triage",
  title: "Triage",
  version: "0.1.0",
  instructions:
    "Tools for Triage, a team bug tracker. Use `list_bugs` to browse or search bugs, `get_bug` for full detail plus comments, `create_bug` to file a report, `update_bug` to change status/severity/assignee, and `add_comment` to discuss a bug. Bugs are referenced by tracking ID (e.g. BUG-1234) or UUID.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listBugsTool, getBugTool, createBugTool, updateBugTool, addCommentTool],
});

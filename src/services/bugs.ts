import { apiRequest } from "./http";
import type { Bug, BugComment, BugFilters } from "./types";

/**
 * Bug data access for the Bugzilla backend.
 * Endpoint paths and payload mapping will be finalised during API integration;
 * pages should depend on this module rather than on any backend SDK.
 */
export const bugsService = {
  list: (filters: BugFilters = {}) =>
    apiRequest<Bug[]>("/bugs", {
      query: {
        search: filters.search || undefined,
        status: filters.status && filters.status !== "all" ? filters.status : undefined,
        severity: filters.severity && filters.severity !== "all" ? filters.severity : undefined,
      },
    }),

  get: (id: string) => apiRequest<Bug>(`/bugs/${id}`),

  create: (input: Partial<Bug>) => apiRequest<Bug>("/bugs", { method: "POST", body: input }),

  update: (id: string, input: Partial<Bug>) =>
    apiRequest<Bug>(`/bugs/${id}`, { method: "PUT", body: input }),

  comments: (id: string) => apiRequest<BugComment[]>(`/bugs/${id}/comments`),

  addComment: (id: string, body: string) =>
    apiRequest<BugComment>(`/bugs/${id}/comments`, { method: "POST", body: { body } }),
};

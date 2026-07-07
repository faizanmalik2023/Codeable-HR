// Thin client for the Codeable Ticketing backend (Express, /api/v1/*).
// Direct browser calls: the backend allows cross-origin requests and
// authenticates each call with the stored Personal Access Token.

const BASE_URL =
  process.env.NEXT_PUBLIC_TICKETING_API_URL || "http://localhost:3000";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export class TicketingApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "TicketingApiError";
  }
}

async function request<T>(
  pat: string,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: Envelope<T> | undefined;
  const text = await res.text();
  try {
    payload = text ? (JSON.parse(text) as Envelope<T>) : undefined;
  } catch {
    // non-JSON error page
  }

  if (!res.ok || (payload && payload.success === false)) {
    throw new TicketingApiError(
      payload?.message || `Request failed (${res.status})`,
      res.status
    );
  }
  return (payload ? payload.data : undefined) as T;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
};

// ---- identity & features ----

export const getMe = (pat: string) =>
  request<{ uid: string; name?: string; email?: string }>(
    pat,
    "GET",
    "/api/v1/users/me"
  );

export const getMyFeatures = (pat: string) =>
  request<{ email: string; features: string[]; isFeatureAdmin: boolean }>(
    pat,
    "GET",
    "/api/v1/features/me"
  );

export const getGrants = (pat: string) =>
  request<{
    admins: string[];
    grants: {
      id: string;
      email: string;
      feature: string;
      grantedBy: string;
      grantedAt: string;
      user: { uid: string; name: string; avatar?: string } | null;
    }[];
  }>(pat, "GET", "/api/v1/features/grants");

export const grantAccess = (pat: string, email: string) =>
  request(pat, "POST", "/api/v1/features/grants", { email });

export const revokeAccess = (pat: string, id: string) =>
  request(pat, "DELETE", `/api/v1/features/grants/${id}`);

// ---- projects ----

export const getMyProjects = async (pat: string) => {
  const me = await getMe(pat);
  return request<{ _id: string; title: string }[]>(
    pat,
    "GET",
    `/api/v1/projects/user/${encodeURIComponent(me.uid)}`
  );
};

// ---- SRS generation ----

export interface SrsProposedTicket {
  title: string;
  description: string;
  type: "task" | "bug" | "story" | "epic";
  priority: "highest" | "high" | "medium" | "low" | "lowest";
  difficulty: "trivial" | "easy" | "medium" | "hard" | "expert";
  storyPoints: number;
  suggestedRole: string;
  rationale: string;
  suggestedAssignee?: { uid: string; name: string } | null;
}

export const srsPreview = (
  pat: string,
  body: {
    projectId: string;
    text?: string;
    pdfBase64?: string;
    instructions?: string;
  }
) =>
  request<{
    summary: string;
    tickets: SrsProposedTicket[];
    team: { uid: string; name: string; role: string; openIssueCount: number }[];
  }>(pat, "POST", "/api/v1/srs/preview", body);

export const srsGenerate = (
  pat: string,
  body: { projectId: string; tickets: Record<string, unknown>[] }
) =>
  request<{
    created: { id: string; code: string; title: string }[];
    failed: { title: string; error: string }[];
    workflowStatus: { id: string; name: string };
  }>(pat, "POST", "/api/v1/srs/generate", body);

// ---- velocity analytics ----

export const getVelocity = (
  pat: string,
  projectId: string,
  params: { from?: string; interval?: string } = {}
) =>
  request<any>(
    pat,
    "GET",
    `/api/v1/analytics/project/${projectId}/velocity${qs(params)}`
  );

export const getFlow = (
  pat: string,
  projectId: string,
  params: { from?: string } = {}
) =>
  request<any>(
    pat,
    "GET",
    `/api/v1/analytics/project/${projectId}/flow${qs(params)}`
  );

export const getReliability = (
  pat: string,
  projectId: string,
  params: { from?: string } = {}
) =>
  request<any>(
    pat,
    "GET",
    `/api/v1/analytics/project/${projectId}/reliability${qs(params)}`
  );

export const getTeamScorecards = (
  pat: string,
  projectId: string,
  params: { from?: string } = {}
) =>
  request<any>(
    pat,
    "GET",
    `/api/v1/analytics/project/${projectId}/team${qs(params)}`
  );

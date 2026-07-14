/** Central query-key factory — keeps cache keys consistent across hooks. */
export const qk = {
  enums: ["enums"] as const,
  dashboard: ["dashboard"] as const,

  leaves: {
    quota: ["leaves", "quota"] as const,
    types: ["leaves", "types"] as const,
    history: (status: string, page: number) => ["leaves", "history", status, page] as const,
    team: ["leaves", "team"] as const,
    teamMember: (id: string) => ["leaves", "team", id] as const,
    requests: (status: string, page: number) => ["leaves", "requests", status, page] as const,
    onLeaveToday: ["leaves", "on-leave-today"] as const,
  },

  eods: {
    list: (status: string, page: number) => ["eods", "list", status, page] as const,
    detail: (id: string) => ["eods", "detail", id] as const,
    team: ["eods", "team"] as const,
    teamMember: (id: string) => ["eods", "team", id] as const,
    isManager: ["eods", "team", "is-manager"] as const,
  },

  attendance: {
    logs: (month: number, year: number) => ["attendance", "logs", month, year] as const,
  },

  insuranceClaims: (status: string, page: number) => ["insurance-claims", status, page] as const,
  expenseClaims: (status: string, page: number) => ["expense-claims", status, page] as const,

  tickets: {
    list: (status: string, page: number) => ["tickets", status, page] as const,
    detail: (id: string) => ["tickets", "detail", id] as const,
  },

  salary: {
    breakdown: ["salary", "breakdown"] as const,
    revisions: ["salary", "revisions"] as const,
    slips: ["salary", "slips"] as const,
  },

  policies: ["policies"] as const,
  policy: (id: string) => ["policies", id] as const,

  notifications: (filter: string, page: number) => ["notifications", filter, page] as const,
  notificationsUnread: ["notifications", "unread-count"] as const,
  activity: (filter: string) => ["activity", filter] as const,

  profile: ["profile"] as const,
  preferences: ["profile", "preferences"] as const,

  projectOptions: ["projects", "options"] as const,
  holidays: ["holidays"] as const,
};

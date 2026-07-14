import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { qk } from "@/lib/query/keys";

/** Raw `GET /enums` payload — string arrays keyed by enum name. */
export type EnumsPayload = Record<string, string[]>;

export function useEnums() {
  return useQuery({
    queryKey: qk.enums,
    queryFn: () => api.get<EnumsPayload>("/enums"),
    staleTime: 60 * 60 * 1000, // enums rarely change
  });
}

/** Turn a server enum list into `{ value, label }` options, with a fallback label map. */
export function toOptions(values: string[] | undefined, labels?: Record<string, string>) {
  return (values ?? []).map((value) => ({ value, label: labels?.[value] ?? value }));
}

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { employeesApi, type EmployeeListItem } from "@/lib/api/employees";

/** Local query keys — `lib/query/keys.ts` is off-limits for this feature. */
const peopleKeys = {
  list: ["employees", "list"] as const,
  departments: ["employees", "departments"] as const,
};

export interface DepartmentChip {
  id: string;
  name: string;
  count: number;
}

/**
 * People directory hook — loads the full employee list plus departments, then
 * applies client-side search + department filtering over the loaded rows.
 */
export function usePeople() {
  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState("all");

  const query = useQuery({
    queryKey: peopleKeys.list,
    queryFn: () => employeesApi.list({ limit: 100 }),
  });

  const departmentsQuery = useQuery({
    queryKey: peopleKeys.departments,
    queryFn: () => employeesApi.departments(),
    staleTime: 5 * 60 * 1000,
  });

  const items: EmployeeListItem[] = query.data?.items ?? [];

  // Department chips: prefer the /departments list, else derive from rows.
  const departmentChips = React.useMemo<DepartmentChip[]>(() => {
    const counts = new Map<string, number>();
    for (const e of items) {
      const name = e.department?.name;
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    if (departmentsQuery.data && departmentsQuery.data.length > 0) {
      return departmentsQuery.data.map((d) => ({
        id: d.name,
        name: d.name,
        count: d.employee_count ?? counts.get(d.name) ?? 0,
      }));
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ id: name, name, count }));
  }, [items, departmentsQuery.data]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((e) => {
      const matchesDept = department === "all" || e.department?.name === department;
      if (!matchesDept) return false;
      if (!q) return true;
      return (
        e.full_name?.toLowerCase().includes(q) ||
        e.employee_code?.toLowerCase().includes(q) ||
        e.designation?.name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
      );
    });
  }, [items, search, department]);

  return {
    query,
    items,
    filtered,
    total: items.length,
    departmentChips,
    search,
    setSearch,
    department,
    setDepartment,
  };
}

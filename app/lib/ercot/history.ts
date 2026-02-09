import { fetchSppNodeZoneHub } from "@/app/lib/ercot/client";
import type { ErcotSppRow } from "@/app/lib/ercot/types";

export async function fetchSppRange(params: {
  deliveryDateFrom: string;
  deliveryDateTo: string;
  settlementPoint: string;
}): Promise<ErcotSppRow[]> {
  const allRows: ErcotSppRow[] = [];

  const first = await fetchSppNodeZoneHub({ ...params, page: 1 });
  allRows.push(...first.rows);

  const totalPages = first.meta.totalPages ?? 1;
  for (let page = 2; page <= totalPages; page++) {
    const next = await fetchSppNodeZoneHub({ ...params, page });
    allRows.push(...next.rows);
  }

  return allRows;
}

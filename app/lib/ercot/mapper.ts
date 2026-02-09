import type { ErcotSppRow } from "@/app/lib/ercot/types";

export function mapErcotData(fields: { name: string }[], data: unknown[][]): ErcotSppRow[] {
  const idx: Record<string, number> = {};
  fields.forEach((f, i) => {
    idx[f.name] = i;
  });

  const required = [
    "deliveryDate",
    "deliveryHour",
    "deliveryInterval",
    "settlementPoint",
    "settlementPointType",
    "settlementPointPrice",
    "DSTFlag",
  ];
  for (const key of required) {
    if (idx[key] === undefined) throw new Error(`Missing field in response: ${key}`);
  }

  return data.map((row) => ({
    deliveryDate: String(row[idx.deliveryDate]),
    deliveryHour: Number(row[idx.deliveryHour]),
    deliveryInterval: Number(row[idx.deliveryInterval]),
    settlementPoint: String(row[idx.settlementPoint]),
    settlementPointType: String(row[idx.settlementPointType]),
    settlementPointPrice: Number(row[idx.settlementPointPrice]),
    DSTFlag: Boolean(row[idx.DSTFlag]),
  }));
}

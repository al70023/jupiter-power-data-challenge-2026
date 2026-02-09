export type ErcotSppRow = {
  deliveryDate: string;
  deliveryHour: number;
  deliveryInterval: number;
  settlementPoint: string;
  settlementPointType: string;
  settlementPointPrice: number;
  DSTFlag: boolean;
};

export type ErcotMeta = {
  totalRecords: number;
  totalPages?: number;
  currentPage: number;
  query?: unknown;
};

export type ErcotRawResponse = {
  _meta: ErcotMeta;
  fields: { name: string }[];
  data: unknown[][];
};

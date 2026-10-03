import type {
  AppState,
  DemandHistory,
  InventoryRecord,
  Policy,
  Product,
  Supplier,
  SupplierProduct,
  User,
  Warehouse,
} from "@/types";

// Fully deterministic seed: no Math.random, no Date.now in data values.
export const SEED_EPOCH = "2026-10-01T00:00:00.000Z";

export const seedUsers: User[] = [
  { id: "usr_101", name: "Marcus Vance", role: "INVENTORY_OPERATOR", title: "Inventory Operator" },
  { id: "usr_987", name: "Elena Rostova", role: "SUPPLY_CHAIN_MANAGER", title: "Supply Chain Manager" },
  { id: "usr_455", name: "Sarah Chen", role: "PROCUREMENT_OFFICER", title: "Procurement Officer" },
  { id: "usr_001", name: "Alex Mercer", role: "ADMINISTRATOR", title: "Administrator" },
];

interface ProductSeed extends Product {
  baseDaily: number;
  trend: number;
}

const productSeeds: ProductSeed[] = [
  { id: "P01", sku: "PKG-BOX-1812", name: "Corrugated Shipping Box 18x12", category: "Packaging", unit: "ea", baseDaily: 20, trend: 0.08 },
  { id: "P02", sku: "PKG-WRP-500", name: "Stretch Wrap Film 500mm", category: "Packaging", unit: "roll", baseDaily: 15, trend: 0.15 },
  { id: "P03", sku: "CMP-SRV-750", name: "Industrial Servo Motor 750W", category: "Components", unit: "ea", baseDaily: 2, trend: 0 },
  { id: "P04", sku: "SAF-GLV-NIT", name: "Nitrile Gloves (Box/100)", category: "Safety", unit: "box", baseDaily: 25, trend: -0.1 },
  { id: "P05", sku: "CMP-HYD-HOSE", name: "Hydraulic Hose Assembly", category: "Components", unit: "ea", baseDaily: 6, trend: 0.05 },
  { id: "P06", sku: "ELC-BAT-48V", name: "Lithium Battery Pack 48V", category: "Electronics", unit: "ea", baseDaily: 8, trend: 0.2 },
  { id: "P07", sku: "ELC-PLC-X2", name: "PLC Controller Module X2", category: "Electronics", unit: "ea", baseDaily: 3, trend: 0 },
  { id: "P08", sku: "CON-LBL-PAL", name: "Pallet Label Roll", category: "Consumables", unit: "roll", baseDaily: 12, trend: -0.15 },
  { id: "P09", sku: "SAF-HLM-CE", name: "Safety Helmet Class E", category: "Safety", unit: "ea", baseDaily: 10, trend: 0.02 },
  { id: "P10", sku: "ELC-PRN-HEAD", name: "Thermal Barcode Printer Head", category: "Electronics", unit: "ea", baseDaily: 2, trend: 0 },
];

export const seedProducts: Product[] = productSeeds.map(({ baseDaily: _b, trend: _t, ...p }) => p);

export const seedWarehouses: Warehouse[] = [
  { id: "W01", name: "Chicago DC", region: "US-Central" },
  { id: "W02", name: "Rotterdam Hub", region: "EU-West" },
  { id: "W03", name: "Singapore DC", region: "APAC" },
  { id: "W04", name: "Dallas Cross-Dock", region: "US-South" },
  { id: "W05", name: "Pune Plant Store", region: "IN-West" },
];
const warehouseFactor = [1, 0.9, 1.2, 0.7, 0.8];

export const seedSuppliers: Supplier[] = [
  { id: "S1", name: "Northwind Packaging", country: "US", reliability: 96, leadTimeDays: 5, capacity: 5000, active: true, blacklisted: false },
  { id: "S2", name: "Voltara Energy GmbH", country: "DE", reliability: 92, leadTimeDays: 7, capacity: 300, active: true, blacklisted: false },
  { id: "S3", name: "Meridian Industrial", country: "JP", reliability: 94, leadTimeDays: 12, capacity: 2000, active: true, blacklisted: false },
  { id: "S4", name: "Keystone Components", country: "US", reliability: 89, leadTimeDays: 9, capacity: 1500, active: true, blacklisted: false },
  { id: "S5", name: "Apex Discount Trading", country: "—", reliability: 71, leadTimeDays: 20, capacity: 1000, active: true, blacklisted: true },
  { id: "S6", name: "Pacific Safety Supply", country: "MY", reliability: 78, leadTimeDays: 4, capacity: 4000, active: true, blacklisted: false },
];

export const seedSupplierProducts: SupplierProduct[] = [
  { productId: "P01", supplierId: "S1", unitPrice: 2.4 },
  { productId: "P01", supplierId: "S4", unitPrice: 2.65 },
  { productId: "P02", supplierId: "S1", unitPrice: 7.9 },
  { productId: "P02", supplierId: "S4", unitPrice: 8.3 },
  { productId: "P03", supplierId: "S3", unitPrice: 1250 },
  { productId: "P03", supplierId: "S4", unitPrice: 1310 },
  { productId: "P04", supplierId: "S6", unitPrice: 6.2 },
  { productId: "P05", supplierId: "S3", unitPrice: 185 },
  { productId: "P05", supplierId: "S4", unitPrice: 172 },
  { productId: "P06", supplierId: "S2", unitPrice: 410 },
  { productId: "P06", supplierId: "S3", unitPrice: 455 },
  { productId: "P07", supplierId: "S3", unitPrice: 2100 },
  { productId: "P07", supplierId: "S4", unitPrice: 2180 },
  { productId: "P08", supplierId: "S1", unitPrice: 14 },
  { productId: "P08", supplierId: "S5", unitPrice: 9.5 },
  { productId: "P09", supplierId: "S6", unitPrice: 22 },
  { productId: "P09", supplierId: "S4", unitPrice: 24.5 },
  { productId: "P10", supplierId: "S5", unitPrice: 340 },
];

function buildDemand(): DemandHistory[] {
  const out: DemandHistory[] = [];
  productSeeds.forEach((p, pi) => {
    seedWarehouses.forEach((w, wi) => {
      const base = p.baseDaily * warehouseFactor[wi];
      const daily = Array.from({ length: 90 }, (_, d) => {
        const wave = 1 + 0.12 * Math.sin((d + pi * 3 + wi) / 4);
        const drift = 1 + (p.trend * (d - 45)) / 90;
        return Math.max(0, Math.round(base * wave * drift));
      });
      out.push({ productId: p.id, warehouseId: w.id, daily });
    });
  });
  return out;
}

// Explicit inventory rows that drive the deterministic demo scenarios.
const scenarioRows: Record<string, Pick<InventoryRecord, "onHand" | "safetyStock" | "inTransit">> = {
  "P01-W01": { onHand: 900, safetyStock: 300, inTransit: 0 },
  "P02-W02": { onHand: 200, safetyStock: 250, inTransit: 0 },
  "P03-W01": { onHand: 60, safetyStock: 10, inTransit: 0 },
  "P04-W03": { onHand: 1200, safetyStock: 300, inTransit: 0 },
  "P05-W01": { onHand: 300, safetyStock: 60, inTransit: 0 },
  "P06-W02": { onHand: 400, safetyStock: 80, inTransit: 0 },
  "P07-W01": { onHand: 90, safetyStock: 20, inTransit: 0 },
  "P10-W04": { onHand: 12, safetyStock: 10, inTransit: 0 },
};

function buildInventory(): InventoryRecord[] {
  const rows: InventoryRecord[] = [];
  productSeeds.forEach((p, pi) => {
    seedWarehouses.forEach((w, wi) => {
      const base = p.baseDaily * warehouseFactor[wi];
      const idx = pi * 5 + wi;
      const key = `${p.id}-${w.id}`;
      const fixed = scenarioRows[key];
      const safetyStock = fixed?.safetyStock ?? Math.round(base * 7);
      rows.push({
        id: `INV-${key}`,
        productId: p.id,
        warehouseId: w.id,
        onHand: fixed?.onHand ?? Math.round(base * 14 * (0.6 + ((idx * 37) % 17) / 10)),
        safetyStock,
        reorderPoint: safetyStock * 2,
        inTransit: fixed?.inTransit ?? (idx % 4 === 0 ? Math.round(base * 5) : 0),
        updatedAt: SEED_EPOCH,
      });
    });
  });
  return rows;
}

export const defaultPolicy: Policy = {
  spendingLimit: 10000,
  hardSpendCeiling: 250000,
  minReliability: 85,
  retryLimit: 3,
  approvalSlaMinutes: 30,
  planningHorizonDays: 14,
  weights: { price: 0.35, lead: 0.3, reliability: 0.35 },
  seasonalFactors: { Packaging: 1.0, Components: 1.1, Electronics: 1.15, Consumables: 1.05, Safety: 1.0 },
  updatedAt: SEED_EPOCH,
  updatedBy: "SYSTEM",
};

export const STATE_VERSION = 1;

export function createSeedState(): AppState {
  return {
    version: STATE_VERSION,
    sessionUserId: "usr_001",
    users: seedUsers,
    products: seedProducts,
    warehouses: seedWarehouses,
    inventory: buildInventory(),
    suppliers: seedSuppliers,
    supplierProducts: seedSupplierProducts,
    demandHistory: buildDemand(),
    policy: defaultPolicy,
    requests: [],
    workflows: [],
    agentExecutions: [],
    purchaseOrders: [],
    approvals: [],
    auditLogs: [],
    notifications: [],
    telemetry: [],
    counters: { workflow: 1040, po: 5000, audit: 0, id: 0 },
  };
}

export type RateCard = { orderType: 'B2B'|'B2C'; zoneRel: 'INTRA'|'INTER'; rate: number };
export type CodConfig = { orderType: 'B2B'|'B2C'; surchargeType: 'FLAT'|'PERCENT'; value: number };
export type RateInput = {
  pickupZone: string | null;
  dropZone: string | null;
  l: number; b: number; h: number;
  actualWeight: number;
  orderType: 'B2B'|'B2C';
  paymentType: 'PREPAID'|'COD';
  rateCards: RateCard[];
  codConfigs: CodConfig[];
};
export type RateBreakdown = {
  pickupZone: string;
  dropZone: string;
  actualWeight: number;
  volumetricWeight: number;
  billableWeight: number;
  zoneRel: 'INTRA'|'INTER';
  rateApplied: number;
  baseCharge: number;
  codSurcharge: number;
  total: number;
};

export function resolveZone(area: string, zoneAreas: { area: string; zoneId: string; zoneName?: string }[]): string {
  const found = zoneAreas.find(z => z.area.toLowerCase().trim() === area.toLowerCase().trim());
  if (!found) throw Object.assign(new Error(`Area not mapped to any zone: ${area}`), { status: 400, code: 'ZONE_NOT_FOUND' });
  return found.zoneId;
}

export function calculateRate(input: RateInput): RateBreakdown {
  const { pickupZone, dropZone, l, b, h, actualWeight, orderType, paymentType, rateCards, codConfigs } = input;
  if (!pickupZone) throw Object.assign(new Error('Pickup zone is required (unmapped area)'), { status: 400 });
  if (!dropZone) throw Object.assign(new Error('Drop zone is required (unmapped area)'), { status: 400 });
  if (l<=0 || b<=0 || h<=0) throw Object.assign(new Error('Dimensions must be positive'), { status: 400 });
  if (actualWeight<=0) throw Object.assign(new Error('Actual weight must be positive'), { status: 400 });

  const volumetricWeight = (l * b * h) / 5000;
  const billableWeight = Math.max(actualWeight, volumetricWeight);
  const zoneRel: 'INTRA'|'INTER' = pickupZone === dropZone ? 'INTRA' : 'INTER';
  const card = rateCards.find(r => r.orderType === orderType && r.zoneRel === zoneRel);
  if (!card) throw Object.assign(new Error(`Rate card not configured for ${orderType} ${zoneRel}`), { status: 400 });
  const rateApplied = card.rate;
  const baseCharge = parseFloat((billableWeight * rateApplied).toFixed(2));
  let codSurcharge = 0;
  if (paymentType === 'COD') {
    const cod = codConfigs.find(c => c.orderType === orderType);
    if (cod) {
      if (cod.surchargeType === 'FLAT') codSurcharge = cod.value;
      else codSurcharge = parseFloat((baseCharge * cod.value / 100).toFixed(2));
    }
  }
  const total = parseFloat((baseCharge + codSurcharge).toFixed(2));
  return {
    pickupZone, dropZone,
    actualWeight: parseFloat(actualWeight.toFixed(2)),
    volumetricWeight: parseFloat(volumetricWeight.toFixed(2)),
    billableWeight: parseFloat(billableWeight.toFixed(2)),
    zoneRel, rateApplied, baseCharge, codSurcharge, total
  };
}

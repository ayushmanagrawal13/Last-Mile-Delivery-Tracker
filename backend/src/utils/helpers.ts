export const validStatuses = ['CREATED','CONFIRMED','ASSIGNED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RESCHEDULED'] as const;
export const allowedTransitions: Record<string, string[]> = {
  'CREATED': ['CONFIRMED'],
  'CONFIRMED': ['ASSIGNED'],
  'ASSIGNED': ['PICKED_UP','FAILED'],
  'PICKED_UP': ['IN_TRANSIT','FAILED'],
  'IN_TRANSIT': ['OUT_FOR_DELIVERY','FAILED'],
  'OUT_FOR_DELIVERY': ['DELIVERED','FAILED'],
  'FAILED': ['RESCHEDULED'],
  'RESCHEDULED': ['ASSIGNED'],
  'DELIVERED': [], // no further except admin override
};
export function canTransition(from:string, to:string, isOverride=false){
  if(isOverride) return true;
  const allowed = allowedTransitions[from] || [];
  return allowed.includes(to);
}

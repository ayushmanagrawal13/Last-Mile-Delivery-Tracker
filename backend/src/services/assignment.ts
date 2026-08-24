export type Agent = { id: string; status: 'AVAILABLE'|'UNAVAILABLE'|'ON_DELIVERY'; currentZoneId: string | null; activeOrderCount: number };
export type AssignmentInput = { pickupZoneId: string; agents: Agent[] };

export function autoAssign(input: AssignmentInput): { assignedAgentId: string | null; reason: string } {
  const { pickupZoneId, agents } = input;
  const available = agents.filter(a => a.status === 'AVAILABLE');
  if (available.length === 0) return { assignedAgentId: null, reason: 'No available agents — needs manual admin assignment' };
  const inZone = available.filter(a => a.currentZoneId === pickupZoneId);
  const candidates = inZone.length > 0 ? inZone : [];
  if (candidates.length === 0) {
    // fallback: no agent in pickup zone, leave unassigned for manual
    return { assignedAgentId: null, reason: `No available agents in pickup zone ${pickupZoneId} — unassigned for manual` };
  }
  // load-balanced: lowest activeOrderCount, tie by first
  candidates.sort((a,b) => a.activeOrderCount - b.activeOrderCount || a.id.localeCompare(b.id));
  return { assignedAgentId: candidates[0].id, reason: `Assigned to agent ${candidates[0].id} in zone ${pickupZoneId} (load ${candidates[0].activeOrderCount})` };
}

import { Room, ParsedRequirements, AgentStepLog } from '../types';

export class ResourceAgent {
  public static search(requirements: ParsedRequirements, rooms: Room[]): {
    candidateRooms: Room[];
    overflowCapacity: boolean;
    maxCapacity: number;
    log: AgentStepLog;
  } {
    const startTime = performance.now();
    const maxCapacity = Math.max(...rooms.map((r) => r.capacity));
    
    // Check if capacity exceeds facility physical limits
    if (requirements.capacityNeeded > maxCapacity) {
      const durationMs = Math.round(performance.now() - startTime + 30);
      const log: AgentStepLog = {
        agentName: 'Resource Agent',
        stepNumber: 2,
        status: 'failed',
        title: 'Inventory Search (Capacity Overflow)',
        details: `Requested ${requirements.capacityNeeded} attendees exceeds highest facility capacity (${maxCapacity} in Conference Hall).`,
        durationMs,
        data: { maxCapacity, requested: requirements.capacityNeeded, roomsScanned: rooms.length },
        timestamp: new Date().toISOString()
      };
      return {
        candidateRooms: [],
        overflowCapacity: true,
        maxCapacity,
        log
      };
    }

    // Filter candidate rooms
    let candidateRooms: Room[] = [];

    if (requirements.preferredRoom) {
      const preferred = rooms.filter(
        (r) => r.name.toLowerCase() === requirements.preferredRoom?.toLowerCase()
      );
      if (preferred.length > 0) {
        candidateRooms = preferred;
      }
    }

    // If no specific room preferred or to provide full candidate pool
    if (candidateRooms.length === 0) {
      candidateRooms = rooms.filter((room) => {
        // Must accommodate capacity
        const capacityMatch = room.capacity >= requirements.capacityNeeded;
        return capacityMatch;
      });
    }

    // If still empty (e.g. specific room requested didn't match), fall back to all rooms with capacity
    if (candidateRooms.length === 0) {
      candidateRooms = rooms.filter((r) => r.capacity >= requirements.capacityNeeded);
    }

    const durationMs = Math.round(performance.now() - startTime + 35);
    const log: AgentStepLog = {
      agentName: 'Resource Agent',
      stepNumber: 2,
      status: 'completed',
      title: 'Workplace Inventory Filter',
      details: `Discovered ${candidateRooms.length} matching candidate space(s): ${candidateRooms.map((r) => `${r.name} (Cap: ${r.capacity})`).join(', ')}.`,
      durationMs,
      data: {
        candidateCount: candidateRooms.length,
        candidateNames: candidateRooms.map((r) => r.name),
        equipmentRequirements: requirements.requiredEquipment
      },
      timestamp: new Date().toISOString()
    };

    return {
      candidateRooms,
      overflowCapacity: false,
      maxCapacity,
      log
    };
  }
}

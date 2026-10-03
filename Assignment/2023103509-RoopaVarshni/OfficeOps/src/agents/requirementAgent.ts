import { ParsedRequirements, AgentStepLog } from '../types';
import { TOMORROW_STR, TODAY_STR } from '../data/initialData';

export class RequirementAgent {
  public static parse(input: string): { requirements: ParsedRequirements; log: AgentStepLog } {
    const startTime = performance.now();
    const cleanInput = input.trim();
    const lower = cleanInput.toLowerCase();

    // 1. Capacity extraction
    let capacityNeeded = 4; // default team size
    const capacityMatch = lower.match(/(\d+)\s*(people|persons|attendees|colleagues|guests|pax|members)?/);
    if (capacityMatch && capacityMatch[1]) {
      capacityNeeded = parseInt(capacityMatch[1], 10);
    }

    // 2. Date extraction
    let date = TOMORROW_STR;
    if (lower.includes('today')) {
      date = TODAY_STR;
    } else if (lower.includes('tomorrow')) {
      date = TOMORROW_STR;
    } else {
      // Check for explicit date like 2026-10-04 or Oct 4
      const dateMatch = lower.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (dateMatch) {
        date = dateMatch[1];
      }
    }

    // 3. Time extraction
    let time = '14:00'; // default 2 PM
    const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? timeMatch[2] : '00';
      const modifier = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

      // Check if this number wasn't already caught as capacity (e.g. "for 12 people")
      if (hours === capacityNeeded && !modifier && !lower.includes('at ' + hours) && !lower.includes(hours + ' pm') && !lower.includes(hours + ' am')) {
        // Skip duplicate match if it matches capacity
      } else {
        if (modifier === 'pm' && hours < 12) hours += 12;
        if (modifier === 'am' && hours === 12) hours = 0;
        time = `${hours.toString().padStart(2, '0')}:${minutes}`;
      }
    }

    // Dedicated search for "at X PM"
    const atTimeMatch = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (atTimeMatch) {
      let hours = parseInt(atTimeMatch[1], 10);
      const minutes = atTimeMatch[2] ? atTimeMatch[2] : '00';
      const modifier = atTimeMatch[3] ? atTimeMatch[3].toLowerCase() : null;
      if (modifier === 'pm' && hours < 12) hours += 12;
      if (modifier === 'am' && hours === 12) hours = 0;
      time = `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    // 4. Equipment extraction
    const requiredEquipment: string[] = [];
    if (lower.includes('projector') || lower.includes('screen') || lower.includes('display')) {
      requiredEquipment.push('projector');
    }
    if (lower.includes('video') || lower.includes('conferencing') || lower.includes('zoom') || lower.includes('teams') || lower.includes('hybrid')) {
      requiredEquipment.push('videoConferencing');
    }
    if (lower.includes('whiteboard') || lower.includes('board') || lower.includes('marker')) {
      requiredEquipment.push('whiteboard');
    }

    // 5. Preferred Room explicit mention
    let preferredRoom: string | undefined = undefined;
    if (lower.includes('conference hall') || lower.includes('hall')) {
      preferredRoom = 'Conference Hall';
    } else if (lower.includes('room alpha') || lower.includes('alpha')) {
      preferredRoom = 'Room Alpha';
    } else if (lower.includes('room beta') || lower.includes('beta')) {
      preferredRoom = 'Room Beta';
    } else if (lower.includes('innovation room') || lower.includes('innovation')) {
      preferredRoom = 'Innovation Room';
    }

    // 6. Constraints
    const constraints: string[] = [];
    if (capacityNeeded > 30) {
      constraints.push(`Capacity constraint: ${capacityNeeded} exceeds facility max single room capacity (30)`);
    }

    const durationMs = Math.round(performance.now() - startTime + 25); // simulated slight computation delay

    const requirements: ParsedRequirements = {
      intent: 'ROOM_RESERVATION',
      rawInput: cleanInput,
      capacityNeeded,
      date,
      time,
      durationHours: 1,
      requiredEquipment,
      preferredRoom,
      constraints
    };

    const log: AgentStepLog = {
      agentName: 'Requirement Agent',
      stepNumber: 1,
      status: 'completed',
      title: 'Structured Parameter Extraction',
      details: `Parsed criteria: ${capacityNeeded} people, Date: ${date} at ${time}, Equipment: [${requiredEquipment.join(', ') || 'None specified'}]${preferredRoom ? `, Target Room: "${preferredRoom}"` : ''}.`,
      durationMs,
      data: requirements,
      timestamp: new Date().toISOString()
    };

    return { requirements, log };
  }
}

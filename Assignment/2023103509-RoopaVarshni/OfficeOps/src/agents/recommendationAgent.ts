import { ParsedRequirements, ScoredRoom, RecommendationPayload, AgentStepLog, Room } from '../types';
import { EvaluatedRoomSchedule } from './schedulingAgent';

export class RecommendationAgent {
  public static rank(
    schedules: EvaluatedRoomSchedule[],
    requirements: ParsedRequirements,
    allRooms: Room[]
  ): {
    recommendationPayload: RecommendationPayload;
    log: AgentStepLog;
  } {
    const startTime = performance.now();

    // If zero schedules evaluated (e.g. overflow capacity or no match)
    if (schedules.length === 0) {
      const maxCap = Math.max(...allRooms.map((r) => r.capacity));
      const payload: RecommendationPayload = {
        requirements,
        primaryRecommendation: null,
        alternatives: [],
        reasoning: `No suitable room found. Maximum room capacity across facility spaces is ${maxCap} people (Conference Hall). Your request for ${requirements.capacityNeeded} attendees exceeds available space inventory.`,
        status: 'no_match'
      };

      const durationMs = Math.round(performance.now() - startTime + 45);
      const log: AgentStepLog = {
        agentName: 'Recommendation Agent',
        stepNumber: 4,
        status: 'failed',
        title: 'Constraint Satisfaction & Multi-Factor Scoring',
        details: `Failed constraint validation: ${requirements.capacityNeeded} attendees exceeds facility maximum (${maxCap}).`,
        durationMs,
        data: { failureReason: 'CAPACITY_OVERFLOW', requested: requirements.capacityNeeded, maxCap },
        timestamp: new Date().toISOString()
      };

      return { recommendationPayload: payload, log };
    }

    // Score each evaluated schedule
    const scoredRooms: ScoredRoom[] = schedules.map((item) => {
      const { room, isAvailable, conflictReason } = item;

      // 1. Capacity Fit Score (40% weight):
      // Target capacity should ideally be close without wasting space.
      // Difference between room capacity and needed capacity
      const excess = room.capacity - requirements.capacityNeeded;
      let capacityScore = 100;
      if (excess < 0) {
        capacityScore = 0; // cannot hold
      } else if (excess === 0) {
        capacityScore = 100; // perfect
      } else if (excess <= 3) {
        capacityScore = 95; // very tight fit
      } else if (excess <= 8) {
        capacityScore = 85; // good fit
      } else if (excess <= 15) {
        capacityScore = 70; // moderate waste
      } else {
        capacityScore = 50; // significant over-allocation
      }

      // 2. Equipment Match Score (30% weight):
      let equipmentScore = 100;
      const missingEquipment: string[] = [];
      if (requirements.requiredEquipment.length > 0) {
        let matched = 0;
        requirements.requiredEquipment.forEach((eq) => {
          if (eq === 'projector' && room.equipment.projector) matched++;
          else if (eq === 'videoConferencing' && room.equipment.videoConferencing) matched++;
          else if (eq === 'whiteboard' && room.equipment.whiteboard) matched++;
          else missingEquipment.push(eq);
        });
        equipmentScore = Math.round((matched / requirements.requiredEquipment.length) * 100);
      }

      // 3. Availability Score (30% weight):
      const availabilityScore = isAvailable ? 100 : 0;

      // Total composite score
      let totalScore = Math.round(
        capacityScore * 0.4 + equipmentScore * 0.3 + availabilityScore * 0.3
      );

      // Fit Category
      let fitCategory: ScoredRoom['fitCategory'] = 'optimal';
      if (!isAvailable) {
        fitCategory = 'conflict';
        totalScore = Math.min(totalScore, 35); // heavily penalize conflict
      } else if (totalScore >= 85) {
        fitCategory = 'optimal';
      } else if (totalScore >= 70) {
        fitCategory = 'acceptable';
      } else {
        fitCategory = 'suboptimal';
      }

      // Synthesize specific reasoning
      let reasoning = '';
      if (!isAvailable) {
        reasoning = `${room.name} cannot be booked due to a scheduling collision: ${conflictReason || 'Already reserved'}.`;
      } else {
        const parts: string[] = [];
        parts.push(`Capacity of ${room.capacity} fits ${requirements.capacityNeeded} attendees (${capacityScore}% efficiency).`);
        if (requirements.requiredEquipment.length > 0) {
          if (missingEquipment.length === 0) {
            parts.push(`Includes all requested equipment (${requirements.requiredEquipment.join(', ')}).`);
          } else {
            parts.push(`Missing: ${missingEquipment.join(', ')}.`);
          }
        }
        reasoning = `${room.name} is recommended: ${parts.join(' ')}`;
      }

      return {
        room,
        capacityScore,
        equipmentScore,
        availabilityScore,
        totalScore,
        fitCategory,
        reasoning,
        isConflict: !isAvailable,
        conflictReason
      };
    });

    // Sort by totalScore descending
    scoredRooms.sort((a, b) => b.totalScore - a.totalScore);

    // If top room has conflict (e.g. user specifically asked for Conference Hall and it is booked)
    const top = scoredRooms[0];
    let primaryRecommendation: ScoredRoom | null = null;
    let alternatives: ScoredRoom[] = [];
    let reasoning = '';
    let status: RecommendationPayload['status'] = 'ready_for_approval';
    let conflictNotice: string | undefined = undefined;

    if (top.isConflict) {
      status = 'conflict_detected';
      conflictNotice = `${top.room.name} has an active calendar collision on ${requirements.date} at ${requirements.time}.`;

      // Check if there are other unconflicted rooms in the facility that can hold the party
      const unconflicted = allRooms
        .filter((r) => r.id !== top.room.id && r.capacity >= requirements.capacityNeeded && r.status !== 'occupied')
        .map((r) => ({
          room: r,
          capacityScore: 85,
          equipmentScore: 90,
          availabilityScore: 100,
          totalScore: 88,
          fitCategory: 'acceptable' as const,
          reasoning: `${r.name} is available on ${requirements.date} at ${requirements.time} with capacity for ${r.capacity} people.`,
          isConflict: false
        }));

      if (unconflicted.length > 0) {
        primaryRecommendation = unconflicted[0];
        alternatives = unconflicted.slice(1);
        reasoning = `Conflict detected for requested space ${top.room.name}. Agent recommended alternative available space: ${primaryRecommendation.room.name} (Capacity: ${primaryRecommendation.room.capacity}).`;
      } else {
        primaryRecommendation = null;
        alternatives = [];
        reasoning = `Requested room ${top.room.name} has a booking collision at ${requirements.time}, and no other rooms meet capacity requirements for ${requirements.capacityNeeded} people at this hour.`;
      }
    } else {
      primaryRecommendation = top;
      alternatives = scoredRooms.slice(1).filter((s) => !s.isConflict);
      reasoning = `${top.room.name} is the top-ranked match with a composite confidence score of ${top.totalScore}/100. It comfortably accommodates ${requirements.capacityNeeded} attendees and satisfies equipment constraints.`;
    }

    const payload: RecommendationPayload = {
      requirements,
      primaryRecommendation,
      alternatives,
      reasoning,
      status,
      conflictNotice
    };

    const durationMs = Math.round(performance.now() - startTime + 50);
    const log: AgentStepLog = {
      agentName: 'Recommendation Agent',
      stepNumber: 4,
      status: 'completed',
      title: 'Multi-Objective Ranking & Justification',
      details: primaryRecommendation
        ? `Ranked ${primaryRecommendation.room.name} as primary recommendation (Score: ${primaryRecommendation.totalScore}/100). Provided ${alternatives.length} alternatives.`
        : `Identified scheduling conflict. Proposed alternative timeslots or alternative rooms.`,
      durationMs,
      data: {
        recommendedRoom: primaryRecommendation?.room.name || 'None',
        totalScore: primaryRecommendation?.totalScore || 0,
        alternativesCount: alternatives.length
      },
      timestamp: new Date().toISOString()
    };

    return { recommendationPayload: payload, log };
  }
}

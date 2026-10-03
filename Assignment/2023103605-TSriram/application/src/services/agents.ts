import {
  Asset,
  AssetRequest,
  RequestInput,
  RiskLevel,
  Profile,
} from '../types';
import { StorageService } from './storage';

// -------------------------------------------------------------
// SIMULATED TOOLS
// -------------------------------------------------------------
export class AssetTools {
  public static searchAssets(input: RequestInput): Asset[] {
    const data = StorageService.getData();
    return data.assets.filter((a) => {
      if (a.status !== 'AVAILABLE') return false;
      if (a.type.toLowerCase() !== input.assetType.toLowerCase()) return false;
      if (input.minRam && a.ram < input.minRam) return false;
      if (input.minStorage && a.storage < input.minStorage) return false;
      return true;
    });
  }

  public static getAssetDetails(assetId: string): Asset | undefined {
    const data = StorageService.getData();
    return data.assets.find((a) => a.id === assetId);
  }

  public static checkPolicy(input: RequestInput): {
    compliant: boolean;
    restricted: boolean;
    aboveStandard: boolean;
    notes: string;
  } {
    const restrictedKeywords = /restricted|unapproved|personal use|bypass|crypto|gaming/i;
    const restricted = restrictedKeywords.test(input.justification) || Number(input.minRam) >= 128;
    const aboveStandard =
      Number(input.minRam) > 16 ||
      Number(input.minStorage) > 512 ||
      /i9|xeon|ultra|m2 max|m3 max|rtx/i.test(input.cpu);

    let notes = 'Standard asset policy matched';
    if (restricted) {
      notes = 'Restricted requirement flagged for review: exceeds allowable memory quota or prohibited justification';
    } else if (aboveStandard) {
      notes = 'Above-standard specification requires review (RAM > 16GB or Storage > 512GB or High-tier CPU)';
    }

    return {
      compliant: !restricted,
      restricted,
      aboveStandard,
      notes,
    };
  }

  public static evaluateRisk(
    policyResult: { restricted: boolean; aboveStandard: boolean },
    matchedAsset?: Asset
  ): { risk: RiskLevel; reason: string } {
    if (policyResult.restricted) {
      return {
        risk: 'HIGH',
        reason: 'Policy violation or restricted requirement (requires Manager + Asset Admin review)',
      };
    }

    const highValue = matchedAsset ? matchedAsset.value >= 50000 : false;
    if (policyResult.aboveStandard || highValue) {
      return {
        risk: 'MEDIUM',
        reason: highValue
          ? `High-value asset (>= ₹50,000 threshold requires Manager approval)`
          : 'Above-standard hardware specification requires Manager approval',
      };
    }

    return {
      risk: 'LOW',
      reason: 'Standard policy compliant request under ₹50,000 threshold',
    };
  }

  public static rankAsset(a: Asset, input: RequestInput): number {
    const ramScore = Math.min(100, ((a.ram || 0) / Math.max(input.minRam || 1, 1)) * 85);
    const storageScore = Math.min(100, ((a.storage || 0) / Math.max(input.minStorage || 1, 1)) * 85);
    const cpuScore =
      !input.cpu || input.cpu === 'Any' || (a.cpu || '').toLowerCase().includes(input.cpu.toLowerCase())
        ? 100
        : 50;
    const ageScore = Math.max(0, 100 - (Number(a.age_years) || 0) * 15);
    const locationScore = a.location.toLowerCase() === input.location.toLowerCase() ? 100 : 35;

    // Formula: RAM 30%, Storage 20%, CPU 25%, Age 15%, Location 10%
    return Math.round(
      ramScore * 0.3 +
      storageScore * 0.2 +
      cpuScore * 0.25 +
      ageScore * 0.15 +
      locationScore * 0.1
    );
  }

  public static analyzeLifecycle(asset: Asset): {
    score: number;
    category: 'Healthy' | 'Monitor' | 'Replacement Recommended';
    recurringIssues: boolean;
    issueDetails?: string;
  } {
    const data = StorageService.getData();
    const assetRepairs = data.repairs.filter((r) => r.asset_id === asset.id);

    // Rule: Same asset + same issue occurring at least 3 times -> Recurring Issue
    const issueCounts: Record<string, number> = {};
    let recurring = false;
    let recurringIssueName = '';
    for (const r of assetRepairs) {
      issueCounts[r.issue] = (issueCounts[r.issue] || 0) + 1;
      if (issueCounts[r.issue] >= 3) {
        recurring = true;
        recurringIssueName = `${r.issue} (${issueCounts[r.issue]} occurrences)`;
      }
    }

    let category: 'Healthy' | 'Monitor' | 'Replacement Recommended' = 'Healthy';
    if (asset.replacement_score >= 70 || recurring) {
      category = 'Replacement Recommended';
    } else if (asset.replacement_score >= 40) {
      category = 'Monitor';
    }

    return {
      score: asset.replacement_score,
      category,
      recurringIssues: recurring,
      issueDetails: recurringIssueName,
    };
  }

  public static recordAudit(
    actor: Profile,
    action: string,
    resource: string,
    resourceId: string,
    details: string,
    agent = ''
  ): void {
    StorageService.addAuditLog({
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actor_id: actor.id,
      actor: actor.name,
      role: actor.role,
      agent,
      action,
      resource,
      resource_id: resourceId,
      details,
      created_at: new Date().toISOString(),
    });
  }

  public static recordEvent(
    requestId: string,
    agent: string,
    tool: string,
    stage: string,
    result: string,
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REJECTED' = 'SUCCESS'
  ): void {
    StorageService.addAgentEvent({
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      request_id: requestId,
      agent,
      tool,
      stage,
      status,
      result,
      duration: 75 + Math.floor(Math.random() * 160),
      created_at: new Date().toISOString(),
    });
  }
}

// -------------------------------------------------------------
// WORKFLOW & AGENT ENGINE
// -------------------------------------------------------------
export class AgentOrchestrator {
  public static async executeRequestWorkflow(
    request: AssetRequest,
    actor: Profile
  ): Promise<void> {
    const input: RequestInput = {
      assetType: request.asset_type,
      purpose: request.purpose,
      department: request.department,
      duration: request.duration,
      minRam: request.min_ram,
      minStorage: request.min_storage,
      cpu: request.cpu_requirement,
      location: request.preferred_location,
      justification: request.justification,
    };

    try {
      // 1. Orchestrator Triage
      StorageService.updateRequest(request.id, { status: 'ANALYZING' });
      AssetTools.recordEvent(
        request.id,
        'Orchestrator Agent',
        'Request Triage',
        'Request',
        'Request received, validated, and routed to Policy Agent'
      );
      AssetTools.recordEvent(
        request.id,
        'Orchestrator Agent',
        'Request Triage',
        'Triage',
        `${request.asset_type} request categorized for ${request.purpose}`
      );

      // 2. Policy Agent
      StorageService.updateRequest(request.id, { status: 'POLICY_CHECK' });
      const policy = AssetTools.checkPolicy(input);
      AssetTools.recordEvent(
        request.id,
        'Policy Agent',
        'Policy Check',
        'Policy',
        policy.notes
      );

      // 3. Inventory Agent
      StorageService.updateRequest(request.id, { status: 'INVENTORY_MATCHING' });
      const compatibleAssets = AssetTools.searchAssets(input);
      const rankedMatches = compatibleAssets
        .map((a) => ({ asset: a, score: AssetTools.rankAsset(a, input) }))
        .sort((a, b) => b.score - a.score);

      const bestMatch = rankedMatches[0]?.asset;
      const bestScore = rankedMatches[0]?.score;

      AssetTools.recordEvent(
        request.id,
        'Inventory Agent',
        'Asset Search',
        'Inventory',
        rankedMatches.length > 0
          ? `${rankedMatches.length} compatible assets found; ${bestMatch.tag} (${bestMatch.brand} ${bestMatch.model}) ranked highest with ${bestScore}% compatibility score`
          : 'No compatible assets found in current active inventory'
      );

      // 4. Risk Agent
      StorageService.updateRequest(request.id, {
        status: 'RISK_EVALUATION',
        recommended_asset_id: bestMatch?.id || null,
      });
      const riskEvaluation = AssetTools.evaluateRisk(policy, bestMatch);
      AssetTools.recordEvent(
        request.id,
        'Risk Agent',
        'Risk Evaluation',
        'Risk',
        `${riskEvaluation.risk} risk — ${riskEvaluation.reason}`
      );

      // 5. Lifecycle Agent
      if (bestMatch) {
        const lifecycle = AssetTools.analyzeLifecycle(bestMatch);
        AssetTools.recordEvent(
          request.id,
          'Lifecycle Agent',
          'Lifecycle Analysis',
          'Risk',
          `${bestMatch.tag}: health ${bestMatch.health}%, replacement score ${lifecycle.score}/100 (${lifecycle.category})`
        );
      } else {
        AssetTools.recordEvent(
          request.id,
          'Lifecycle Agent',
          'Lifecycle Analysis',
          'Risk',
          'No candidate asset to evaluate for lifecycle health'
        );
      }

      // Check if inventory has no match
      if (!bestMatch) {
        StorageService.updateRequest(request.id, {
          status: 'FAILED',
          risk: riskEvaluation.risk,
          reason: 'No compatible asset available in inventory; Asset Admin retry available upon restocking.',
        });
        AssetTools.recordEvent(
          request.id,
          'Inventory Agent',
          'Asset Search',
          'Inventory',
          'No compatible asset available. Admin retry available.',
          'FAILED'
        );
        return;
      }

      // 6. Approval / Auto-Approval Decision
      if (riskEvaluation.risk === 'LOW') {
        // Auto-approve
        StorageService.updateRequest(request.id, {
          status: 'APPROVED',
          risk: 'LOW',
          reason: 'Auto-approved by policy',
          auto_approved: true,
        });

        AssetTools.recordEvent(
          request.id,
          'Policy Agent',
          'Approval Decision',
          'Approval',
          'Auto-approved by policy (Standard specification under ₹50,000 threshold)'
        );

        AssetTools.recordAudit(
          actor,
          'AUTO_APPROVED',
          'request',
          request.code,
          'LOW risk standard request auto-approved by Policy Agent',
          'Policy Agent'
        );

        // 7. Assignment Agent
        await this.assignAsset(request, bestMatch, actor);
      } else {
        // Human Approval Required
        StorageService.updateRequest(request.id, {
          status: 'APPROVAL_REQUIRED',
          risk: riskEvaluation.risk,
          reason: riskEvaluation.reason,
          auto_approved: false,
        });

        StorageService.addApproval({
          id: `appr-${Date.now()}`,
          request_id: request.id,
          approver_id: null,
          status: 'PENDING',
          reason: riskEvaluation.reason,
          created_at: new Date().toISOString(),
        });

        const reviewMessage =
          riskEvaluation.risk === 'HIGH'
            ? 'Manager + Asset Admin review required (Restricted / Policy Violation)'
            : 'Manager approval required (High-value or above-standard specification)';

        AssetTools.recordEvent(
          request.id,
          'Orchestrator Agent',
          'Approval Decision',
          'Approval',
          reviewMessage,
          'PENDING'
        );

        AssetTools.recordAudit(
          actor,
          'APPROVAL_REQUIRED',
          'request',
          request.code,
          riskEvaluation.reason,
          'Risk Agent'
        );
      }
    } catch (e: any) {
      StorageService.updateRequest(request.id, {
        status: 'FAILED',
        reason: `Workflow paused: ${e?.message || 'Error occurred'}. Admin retry available.`,
      });
      AssetTools.recordEvent(
        request.id,
        'Orchestrator Agent',
        'Workflow Execution',
        'Completed',
        `Workflow paused: ${e?.message || 'Error'}. Admin retry available.`,
        'FAILED'
      );
    }
  }

  public static async assignAsset(
    request: AssetRequest,
    asset: Asset,
    actor: Profile
  ): Promise<void> {
    StorageService.updateRequest(request.id, { status: 'ASSIGNING' });

    AssetTools.recordEvent(
      request.id,
      'Assignment Agent',
      'Asset Assignment',
      'Assignment',
      `${asset.tag} (${asset.brand} ${asset.model}) reserved and assigned to requester`
    );

    // Update Asset status to IN_USE and set owner
    StorageService.updateAsset(asset.id, {
      status: 'IN_USE',
      owner_id: request.requester_id,
      department: request.department,
    });

    // Record Assignment
    StorageService.addAssignment({
      id: `asgn-${Date.now()}`,
      asset_id: asset.id,
      user_id: request.requester_id,
      request_id: request.id,
      assigned_at: new Date().toISOString(),
    });

    // Mark Request as COMPLETED
    StorageService.updateRequest(request.id, {
      status: 'COMPLETED',
      recommended_asset_id: asset.id,
    });

    AssetTools.recordEvent(
      request.id,
      'Orchestrator Agent',
      'Audit Logging',
      'Completed',
      'Workflow completed successfully and asset assigned'
    );

    AssetTools.recordAudit(
      actor,
      'ASSET_ASSIGNED',
      'asset',
      asset.tag,
      `${asset.tag} assigned to requester for ${request.code}`,
      'Assignment Agent'
    );
  }

  public static async approveRequest(
    requestId: string,
    approver: Profile,
    reason?: string
  ): Promise<void> {
    const data = StorageService.getData();
    const request = data.asset_requests.find((r) => r.id === requestId);
    if (!request) throw new Error('Request not found');

    if (request.risk === 'HIGH' && approver.role !== 'admin') {
      throw new Error('High-risk requests require Asset Admin review.');
    }

    StorageService.updateApproval(requestId, {
      status: 'APPROVED',
      approver_id: approver.id,
      reason: reason || 'Approved by reviewer',
    });

    StorageService.updateRequest(requestId, {
      status: 'APPROVED',
      reason: reason || request.reason,
    });

    AssetTools.recordEvent(
      requestId,
      'Orchestrator Agent',
      'Approval Decision',
      'Approval',
      `Approved by ${approver.name} (${approver.role})`,
      'SUCCESS'
    );

    AssetTools.recordAudit(
      approver,
      'REQUEST_APPROVED',
      'request',
      request.code,
      reason || 'Request approved by reviewer'
    );

    // If an asset was recommended, assign it immediately!
    if (request.recommended_asset_id) {
      const asset = data.assets.find((a) => a.id === request.recommended_asset_id);
      if (asset && asset.status === 'AVAILABLE') {
        await this.assignAsset(request, asset, approver);
      } else {
        // Fallback: search available candidate
        const available = data.assets.find(
          (a) => a.status === 'AVAILABLE' && a.type.toLowerCase() === request.asset_type.toLowerCase()
        );
        if (available) {
          await this.assignAsset(request, available, approver);
        } else {
          StorageService.updateRequest(requestId, {
            status: 'FAILED',
            reason: 'Recommended asset no longer available. Asset Admin retry available.',
          });
        }
      }
    }
  }

  public static async rejectRequest(
    requestId: string,
    approver: Profile,
    reason?: string
  ): Promise<void> {
    const data = StorageService.getData();
    const request = data.asset_requests.find((r) => r.id === requestId);
    if (!request) throw new Error('Request not found');

    StorageService.updateApproval(requestId, {
      status: 'REJECTED',
      approver_id: approver.id,
      reason: reason || 'Rejected by reviewer',
    });

    StorageService.updateRequest(requestId, {
      status: 'REJECTED',
      reason: reason || 'Rejected by reviewer',
    });

    AssetTools.recordEvent(
      requestId,
      'Orchestrator Agent',
      'Approval Decision',
      'Approval',
      `Rejected by ${approver.name} (${approver.role}): ${reason || 'Does not meet policy guidelines'}`,
      'REJECTED'
    );

    AssetTools.recordAudit(
      approver,
      'REQUEST_REJECTED',
      'request',
      request.code,
      reason || 'Request rejected by reviewer'
    );
  }

  public static async retryWorkflow(requestId: string, actor: Profile): Promise<void> {
    const data = StorageService.getData();
    const request = data.asset_requests.find((r) => r.id === requestId);
    if (!request) throw new Error('Request not found');

    AssetTools.recordAudit(
      actor,
      'WORKFLOW_RETRIED',
      'request',
      request.code,
      'Asset Admin manually triggered retry for failed workflow',
      'Orchestrator Agent'
    );

    await this.executeRequestWorkflow(request, actor);
  }
}

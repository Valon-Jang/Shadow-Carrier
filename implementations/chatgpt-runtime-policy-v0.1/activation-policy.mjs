const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const nn = (value) => Math.max(0, Number(value) || 0);

export const DEFAULT_POLICY = Object.freeze({
  minPLowerRemote: 0.55,
  minPLowerCpuHeavy: 0.70,
  minHideableMs: 250,
  minExpectedGainMsRemote: 100,
  minExpectedGainMsCpuHeavy: 750,
  minGainRatioRemote: 0.03,
  minGainRatioCpuHeavy: 0.15,
  highCpuPressure: 0.65,
  maxWorkers: 1,
  allowStandalone: false,
});

export function evaluateShadowActivation(input, overrides = {}) {
  const policy = { ...DEFAULT_POLICY, ...overrides };
  const pLower = clamp01(input.pLower);
  const workerCompletionMs = nn(input.workerCompletionMs);
  const hideableForegroundMs = nn(input.hideableForegroundMs);
  const dispatchOrchestrationMs = nn(input.dispatchOrchestrationMs);
  const missWasteMs = nn(input.missWasteMs);
  const contentionPenaltyMs = nn(input.contentionPenaltyMs);
  const foregroundLocalCpuPressure = clamp01(input.foregroundLocalCpuPressure);
  const topology = input.dispatchTopology ?? "standalone";
  const deterministic = input.taskDeterministic === true;
  const likelyConsumed = input.resultLikelyConsumed === true;
  const requiresWorkerExternalIO = input.requiresWorkerExternalIO === true;

  const off = (reason, details = {}) => ({
    activate: false,
    workers: 0,
    reason,
    expectedGainMs: 0,
    ...details,
  });

  if (!deterministic) return off("NON_DETERMINISTIC_TASK");
  if (!likelyConsumed) return off("LOW_CONSUMPTION_CONFIDENCE");
  if (requiresWorkerExternalIO) return off("WORKER_EXTERNAL_IO_UNAVAILABLE");
  if (topology === "standalone" && !policy.allowStandalone) {
    return off("STANDALONE_DISPATCH_BLOCKED");
  }
  if (workerCompletionMs <= 0) return off("NO_WORKER_WORK");

  const hideableMs = Math.min(workerCompletionMs, hideableForegroundMs);
  if (hideableMs < policy.minHideableMs) {
    return off("HIDEABLE_WINDOW_TOO_SMALL", { hideableMs });
  }

  const cpuHeavy = foregroundLocalCpuPressure >= policy.highCpuPressure;
  const minPLower = cpuHeavy ? policy.minPLowerCpuHeavy : policy.minPLowerRemote;
  if (pLower < minPLower) {
    return off("P_LOWER_TOO_LOW", { pLower, minPLower, cpuHeavy });
  }

  const grossGainMs = pLower * hideableMs;
  const expectedGainMs = grossGainMs
    - dispatchOrchestrationMs
    - missWasteMs
    - contentionPenaltyMs;
  const gainRatio = expectedGainMs / workerCompletionMs;
  const minExpectedGainMs = cpuHeavy
    ? policy.minExpectedGainMsCpuHeavy
    : policy.minExpectedGainMsRemote;
  const minGainRatio = cpuHeavy
    ? policy.minGainRatioCpuHeavy
    : policy.minGainRatioRemote;

  if (expectedGainMs < minExpectedGainMs) {
    return off("EXPECTED_GAIN_TOO_SMALL", {
      expectedGainMs,
      grossGainMs,
      hideableMs,
      gainRatio,
      cpuHeavy,
    });
  }
  if (gainRatio < minGainRatio) {
    return off("GAIN_RATIO_TOO_SMALL", {
      expectedGainMs,
      grossGainMs,
      hideableMs,
      gainRatio,
      cpuHeavy,
    });
  }

  return {
    activate: true,
    workers: Math.min(1, policy.maxWorkers),
    reason: cpuHeavy ? "POSITIVE_EV_CPU_HEAVY" : "POSITIVE_EV_REMOTE_WAIT",
    expectedGainMs,
    grossGainMs,
    hideableMs,
    gainRatio,
    cpuHeavy,
  };
}

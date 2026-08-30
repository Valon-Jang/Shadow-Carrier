import test from "node:test";
import assert from "node:assert/strict";
import { evaluateShadowActivation } from "../activation-policy.mjs";

const base = {
  pLower: 0.8,
  workerCompletionMs: 12000,
  hideableForegroundMs: 9000,
  dispatchOrchestrationMs: 5,
  missWasteMs: 400,
  contentionPenaltyMs: 100,
  foregroundLocalCpuPressure: 0.1,
  dispatchTopology: "piggyback",
  taskDeterministic: true,
  resultLikelyConsumed: true,
  requiresWorkerExternalIO: false,
};

test("activates one worker for positive-EV piggyback work during remote wait", () => {
  const d = evaluateShadowActivation(base);
  assert.equal(d.activate, true);
  assert.equal(d.workers, 1);
  assert.equal(d.reason, "POSITIVE_EV_REMOTE_WAIT");
  assert.ok(d.expectedGainMs > 0);
});

test("keeps naive short local parsing off", () => {
  const d = evaluateShadowActivation({
    ...base,
    pLower: 0.77,
    workerCompletionMs: 22,
    hideableForegroundMs: 22,
    dispatchOrchestrationMs: 4,
    missWasteMs: 5,
    contentionPenaltyMs: 2,
  });
  assert.equal(d.activate, false);
  assert.equal(d.reason, "HIDEABLE_WINDOW_TOO_SMALL");
});

test("blocks standalone dispatch by default even when raw EV looks high", () => {
  const d = evaluateShadowActivation({ ...base, dispatchTopology: "standalone" });
  assert.equal(d.activate, false);
  assert.equal(d.reason, "STANDALONE_DISPATCH_BLOCKED");
});

test("blocks worker-owned external I/O", () => {
  const d = evaluateShadowActivation({ ...base, requiresWorkerExternalIO: true });
  assert.equal(d.activate, false);
  assert.equal(d.reason, "WORKER_EXTERNAL_IO_UNAVAILABLE");
});

test("suppresses CPU-heavy overlap when contention erases margin", () => {
  const d = evaluateShadowActivation({
    ...base,
    pLower: 0.85,
    hideableForegroundMs: 3000,
    foregroundLocalCpuPressure: 0.9,
    missWasteMs: 300,
    contentionPenaltyMs: 2500,
  });
  assert.equal(d.activate, false);
  assert.equal(d.reason, "EXPECTED_GAIN_TOO_SMALL");
});

test("allows CPU-heavy overlap only with strong conservative margin", () => {
  const d = evaluateShadowActivation({
    ...base,
    pLower: 0.95,
    workerCompletionMs: 8000,
    hideableForegroundMs: 8000,
    foregroundLocalCpuPressure: 0.8,
    missWasteMs: 100,
    contentionPenaltyMs: 1000,
  });
  assert.equal(d.activate, true);
  assert.equal(d.reason, "POSITIVE_EV_CPU_HEAVY");
});

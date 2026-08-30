import test from "node:test";
import assert from "node:assert/strict";
import { evaluateShadowActivation, POLICY_VERSION } from "../activation-policy.mjs";

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
  sideEffectFree: true,
  authoritySafeBeforeResolution: true,
};

test("version is frozen", () => assert.equal(POLICY_VERSION, "0.1.1-experimental"));
test("positive remote-wait candidate opens exactly one worker", () => {
  const d = evaluateShadowActivation(base);
  assert.equal(d.activate, true); assert.equal(d.workers, 1);
  assert.equal(d.reason, "POSITIVE_EV_REMOTE_WAIT");
});
test("short local parse remains off", () => {
  const d = evaluateShadowActivation({...base, workerCompletionMs:22, hideableForegroundMs:22});
  assert.equal(d.activate, false); assert.equal(d.reason, "HIDEABLE_WINDOW_TOO_SMALL");
});
test("standalone dispatch remains blocked", () => {
  const d = evaluateShadowActivation({...base, dispatchTopology:"standalone"});
  assert.equal(d.activate, false); assert.equal(d.reason, "STANDALONE_DISPATCH_BLOCKED");
});
test("external worker I/O remains blocked", () => {
  const d = evaluateShadowActivation({...base, requiresWorkerExternalIO:true});
  assert.equal(d.activate, false); assert.equal(d.reason, "WORKER_EXTERNAL_IO_UNAVAILABLE");
});
test("mutating speculation is blocked", () => {
  const d = evaluateShadowActivation({...base, sideEffectFree:false});
  assert.equal(d.activate, false); assert.equal(d.reason, "SIDE_EFFECTFUL_SPECULATION_BLOCKED");
});
test("authority-dependent speculation is blocked before resolution", () => {
  const d = evaluateShadowActivation({...base, authoritySafeBeforeResolution:false});
  assert.equal(d.activate, false); assert.equal(d.reason, "AUTHORITY_DEPENDENT_SPECULATION_BLOCKED");
});
test("CPU-heavy overlap needs large margin", () => {
  const d = evaluateShadowActivation({...base, pLower:0.85, hideableForegroundMs:3000, foregroundLocalCpuPressure:0.9, missWasteMs:300, contentionPenaltyMs:2500});
  assert.equal(d.activate, false); assert.equal(d.reason, "EXPECTED_GAIN_TOO_SMALL");
});
test("CPU-heavy overlap may open only on strong margin", () => {
  const d = evaluateShadowActivation({...base, pLower:0.95, workerCompletionMs:8000, hideableForegroundMs:8000, foregroundLocalCpuPressure:0.8, missWasteMs:100, contentionPenaltyMs:1000});
  assert.equal(d.activate, true); assert.equal(d.reason, "POSITIVE_EV_CPU_HEAVY"); assert.equal(d.workers, 1);
});

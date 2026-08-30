# ChatGPT Shadow Interceptor Persistent Worker Probe — 2026-08-30

Status: **EXPERIMENTAL / LOCAL-ONLY / NOT A SPEED PROMOTION BENCHMARK**

This probe follows the real local-overlap finding in `CHATGPT_SHADOW_INTERCEPTOR_RUNTIME_OVERLAP_PROBE_2026-08-30.md`. The objective was to identify what actually dominates local Shadow dispatch cost and whether a temporary persistent deterministic worker can reduce it safely.

Global ChatGPT Shadow Interceptor status remains **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**.

## 1. Fresh-process cost decomposition

A fresh Python child was repeatedly launched to perform a tiny deterministic task.

Measured separately:

- non-blocking `Popen()` return: median about **0.332 ms**, mean about **0.402 ms**, p95 about **0.580 ms**;
- child completion for the tiny task: median about **682 ms**, mean about **685 ms**, p95 about **794 ms**.

Interpretation:

The dominant cost is not the parent-side `Popen()` call. It is **fresh Python process cold-start / sandbox startup plus completion handoff**.

Therefore the EV model must not use pure parser/compute time as the hideable latency. Use:

```text
worker_completion_latency
= cold_start + compute + result_handoff
```

## 2. First persistent-worker attempt: polling files

A persistent worker polled a task file every 2 ms.

Small-task round-trip over 60 requests:

- median: about **2.14 ms**
- mean: about **2.16 ms**
- p95: about **2.63 ms**

The same 500,000-row deterministic JSONL parse ran with warm-worker round-trip median about **0.902 s**, with exact output matching the previous parser invariant.

However the polling design consumed measurable idle CPU. A direct idle interval measured roughly **3% of one core** even after active parse work had ended.

Decision: **reject polling as the preferred persistent-worker transport**. Low dispatch latency is not worth background contention when blocking IPC is available.

## 3. Interactive-session attempt

A persistent interactive execution session was attempted so tasks could be submitted through an already-running process without polling or process launch.

The current container runtime returned a streaming-session capability error (`StreamingExecNotEnabledContainerError`).

Decision: **interactive streaming worker is not available in the current runtime**. Do not assume it exists.

## 4. Blocking FIFO worker

A local Python worker was launched once and blocked on a named FIFO while idle. Results were written atomically to per-task files.

Measured idle and dispatch behavior:

- idle CPU over a direct interval: **0.0% of one core** at the measurement resolution;
- shell/FIFO task-submit median over 30 small tasks: about **3.41 ms**;
- mean submit: about **3.47 ms**;
- p95 submit: about **3.79 ms**.

Warm 500,000-row parser behavior remained about **0.9 s** per parse, with exact invariant output.

This transport removes the ~682 ms fresh-Python cold-start from each subsequent task while avoiding the polling worker's idle CPU cost.

## 5. FIFO worker overlap check

Three deterministic parse jobs were submitted to the persistent FIFO worker before a Google Drive connector read.

Dispatch start timestamp was approximately:

- `1788072614.630`

Worker completions:

- task A: `1788072615.823` (~0.917 s compute)
- task B: `1788072616.783` (~0.959 s compute)
- task C: `1788072617.691` (~0.908 s compute)

The Drive operation completed later and returned successfully while the local worker had already completed all three jobs.

This reinforces the earlier runtime result: a persistent detached local worker can make progress while ChatGPT continues connector/tool/model processing.

It still does **not** prove worker-owned external I/O prefetch.

## 6. Important fairness correction

The earlier six-pair forced-hit overlap surface probe used dummy timing/code calls in Normal so both experimental paths had the same number of model-triggered tool calls.

That was useful for isolating the existence of local process overlap, but it is **not a natural E2E baseline**.

In a real workflow:

- Normal may require `remote tool -> local parse`;
- standalone Shadow may require `extra code dispatch -> remote tool -> result collect`.

The extra model/tool transition can be large in the current ChatGPT orchestration surface and was not fairly priced by the artificial equal-call harness.

Therefore the apparent six-pair ~21.3% direction must remain **surface evidence only** and cannot support a latency claim.

## 7. New dispatch-class split

### Standalone dispatch

A new model-triggered code call is required solely to start/submit speculative work.

Policy: **DEFAULT OFF / high orchestration-cost penalty** until natural E2E experiments show positive net value.

### Piggyback dispatch

Worker start or task submission can be included inside a code action that Normal already needed, so there is little or no additional model/tool transition.

Policy: **preferred experimental class** when the next local action is predictable and conservative EV is positive.

This distinction is now more important than raw local process-launch cost.

## 8. Persistent-worker lifecycle policy

A persistent local worker is only an experimental optimization, not a default daemon.

Use it only when all are true:

1. Shadow activation already passed a conservative EV gate;
2. a multi-step workflow is likely to reuse local deterministic execution;
3. IPC is blocking/near-zero-idle rather than active polling;
4. worker TTL is short and bounded;
5. no external network capability is assumed;
6. state is local and non-sensitive beyond the active task boundary;
7. worker is explicitly terminated and checked for orphan processes when the experiment/workflow ends.

The FIFO worker used in this probe was terminated after testing and the PID check reported clean shutdown.

## 9. Revised EV accounting

For local-worker candidates, use:

```text
expected_gain
= p_lower * min(worker_completion_latency, hideable_foreground_window)
- incremental_dispatch_orchestration_cost
- miss_waste
- contention_penalty
```

where:

```text
worker_completion_latency = cold_start + compute + handoff
```

If a persistent worker is already warm, cold-start can be amortized toward zero for subsequent tasks, but the cost of creating/keeping that worker must still be allocated across the workflow.

Standalone dispatch must include the cost of the extra model/tool transition. Piggyback dispatch should include only the incremental work added to an already-required code action.

## 10. Current conclusion

Promising:

- real local overlap exists;
- a blocking persistent worker can nearly eliminate repeated Python cold-start while idling at effectively zero measured CPU;
- piggyback + short-TTL persistent local execution is now the most promising model-external deterministic-worker design in the current runtime.

Still unproven:

- natural end-to-end speedup after model/tool orchestration cost;
- activation hit probability on real workflows;
- optimal TTL;
- real miss/contention cost at scale;
- benefit of 2–3 workers;
- worker-owned external I/O.

Global decision remains **DEFAULT OFF**. The next fair experiment should use a natural workflow and compare actual tool-call topology, not artificially equalize it with dummy calls.
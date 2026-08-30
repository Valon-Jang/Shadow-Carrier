# ChatGPT Shadow Interceptor Runtime Policy Delta — 2026-08-30

Status: **EXPERIMENTAL OVERRIDE / DEFAULT OFF**

This document is a temporary ChatGPT-runtime-specific override to `docs/SHADOW_CARRIER_OPERATING_PROTOCOL.md`. When older protocol text conflicts with this file or `research/CHATGPT_SHADOW_INTERCEPTOR_CHECKPOINT_2026-08-30.md`, use the newer checkpoint/delta until the main protocol is consolidated.

## Runtime split

### A. Worker-owned external async I/O

Current state: **OFF / unavailable or unverified**.

The coding execution environment has no direct Internet egress, and no current built-in surface has been verified that lets a detached worker independently prefetch Web/Drive/API data while the Carrier continues.

### B. Local deterministic work during required ChatGPT processing

Current state: **experimentally available, DEFAULT OFF**.

A detached local deterministic process was directly observed continuing while ChatGPT executed connector/tool/model processing. This permits a narrow local-only latency-hiding experiment over data/artifacts already present in the execution environment.

Naive CPU/local parsing remains a DON'T-USE condition when it is speculated without a positive task-specific EV.

## Cost model

Do not use pure parser/compute time as the hideable-work estimate.

```text
worker_completion_latency
= cold_start + compute + handoff

EV
= p_lower * min(worker_completion_latency, estimated_hideable_foreground_window)
- incremental_dispatch_orchestration_cost
- miss_waste
- contention_penalty
```

Run Shadow only if conservative `EV > 0`.

Observed local substrate costs in the current runtime:

- fresh Python child tiny-task completion median: ~682 ms;
- parent-side non-blocking `Popen()` return median: ~0.332 ms;
- blocking-FIFO warm task submit median: ~3.41 ms;
- blocking-FIFO measured idle CPU: 0.0% of one core at measurement resolution;
- warm 500k-row deterministic parse: ~0.902 s median.

Cold-start can be amortized only if a persistent worker is actually reused. Worker startup/TTL/cleanup cost still belongs to the workflow.

## Dispatch topology

### Standalone dispatch

An extra model-triggered code call is required solely to start or submit Shadow work.

Policy: **DEFAULT OFF / high orchestration penalty** until natural E2E evidence proves positive net value.

The current ChatGPT tool-transition cost can dominate local process-launch cost, so a ~3 ms local task submit does not imply a ~3 ms user-visible dispatch.

### Piggyback dispatch

Worker start/submit is included inside a code action Normal already needed.

Policy: **preferred experimental class** when the predicted next local action is compatible and conservative EV is positive.

Do not add dummy tool calls to Normal merely to equalize experimental call count. Natural baseline topology must be preserved.

## Persistent worker

Persistent execution is an optimization candidate, not a default daemon.

Preferred experimental transport: short-TTL **blocking** IPC such as a FIFO/socket-like design with near-zero idle cost.

Rejected/unsupported observations:

- active file polling reached low round-trip latency but consumed ~3% of one core idle -> reject as preferred transport;
- interactive streaming execution session was unavailable in the current runtime -> do not assume it exists.

Persistent-worker requirements:

- activate only after EV gate opens;
- bounded TTL;
- local deterministic work only;
- no assumed external egress;
- explicit cleanup;
- verify no orphan process after experiment/workflow end.

## Activation conditions

Start from `0 workers`.

Consider one local worker only when all are true:

- foreground ChatGPT operation is already required by Normal;
- actual next action is plausibly deterministic local work over already-present data/artifacts;
- early preparation preserves authority, scope, freshness, and compatibility;
- external speculative request count does not increase;
- dispatch topology is costed correctly;
- conservative EV is positive.

Worker count:

- `0`: default and correct when EV is non-positive/uncertain;
- `1`: first experimental choice for one dominant compatible local path;
- `2–3`: only after real trajectories show multiple distinct branches with positive marginal EV;
- do not use `4–5` merely for coverage/hit-rate inflation.

## Negative learning

Suppress activation for:

- short work with no meaningful hideable window,
- standalone dispatch with large extra tool-transition cost,
- CPU contention,
- repeated prediction misses,
- unused/dead-end preprocessing,
- freshness/authority incompatibility,
- mutation requirements,
- external request/rate-limit amplification,
- worker lifecycle/cleanup failures.

Unused work is not free. The first two miss probes were noisy and averaged about 2% slower with unused work, so miss waste remains explicit.

## Evidence boundary

A six-pair forced-hit surface probe produced an apparent mean direction of ~21.3% faster, but it used `p=1`, artificial task composition, high variance, and dummy Normal calls to equalize experimental tool count.

It proves **local overlap exists**. It does **not** establish a natural end-to-end speedup.

## Learning procedure

```text
Observe Normal trajectory
-> label actual next action
-> estimate p_lower
-> measure worker_completion_latency
-> measure foreground hideable window
-> classify standalone vs piggyback dispatch
-> calculate conservative EV
-> choose 0 or 1 worker initially
-> measure hit/miss/quality/E2E/compute/lifecycle
-> negative-learn losses
-> counterfactual replay 0-N / TTL / cache policies
-> retain only reproducible natural-workflow wins
-> compile stable wins into deterministic Skill/meta-tool
```

## Promotion boundary

Keep global ChatGPT Shadow Interceptor **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF** until a natural workload repeatedly satisfies all of:

- quality >= Normal,
- Hard Failure = 0,
- same underlying capabilities for Normal and Shadow,
- natural tool-call topology is preserved and priced,
- speculative result is actually consumed,
- startup/dispatch/TTL/miss/contention/cleanup cost is included,
- positive end-to-end net value repeats across repeated or held-out tasks.

The desired endpoint is not maximum raw gain. Prefer approximately 95% or more of the best validated gain with the fewest workers, extra tool calls, requests, bytes, waste, and rate-limit pressure.
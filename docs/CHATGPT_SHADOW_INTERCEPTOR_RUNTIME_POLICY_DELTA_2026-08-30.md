# ChatGPT Shadow Interceptor Runtime Policy Delta — 2026-08-30

Status: **EXPERIMENTAL OVERRIDE / DEFAULT OFF**

This document is a temporary ChatGPT-runtime-specific override to `docs/SHADOW_CARRIER_OPERATING_PROTOCOL.md`. When older protocol text conflicts with this file or `research/CHATGPT_SHADOW_INTERCEPTOR_CHECKPOINT_2026-08-30.md`, use the newer checkpoint/delta until the main protocol is consolidated.

## Runtime split

Treat these as different capabilities:

### A. Worker-owned external async I/O

Current state: **OFF / unavailable or unverified**.

The coding execution environment has no direct Internet egress, and no current built-in surface has been verified that lets a detached worker independently prefetch Web/Drive/API data while the Carrier continues.

Do not claim external speculative prefetch latency hiding from the coding worker.

### B. Local deterministic work during required ChatGPT processing

Current state: **experimentally available, DEFAULT OFF**.

A detached local deterministic process was directly observed continuing while ChatGPT executed connector/tool/model processing. This allows a narrow experiment: start a likely real local next step early while an already-required foreground operation is in progress.

This does not make naive local speculation generally good. Prior fair tests still found CPU/local parser speculation slower when used naively.

## Activation gate

Start from `0 workers`.

For a candidate local action, estimate conservatively:

```text
EV = p_lower * min(local_work_latency, estimated_hideable_foreground_window)
     - dispatch_cost
     - miss_waste
     - contention_penalty
```

Run Shadow only if `EV > 0`.

Required candidate conditions:

- foreground ChatGPT operation is already required by Normal;
- predicted next action is deterministic local work over already-present data/artifacts;
- no extra speculative external request is added;
- early preparation preserves authority, scope, freshness, and compatibility;
- quality contract remains unchanged.

## Worker count

- `0`: default; correct whenever EV is non-positive or uncertain.
- `1`: preferred first experiment for one dominant compatible local next action.
- `2–3`: consider only after real trajectories show multiple distinct branches with positive marginal EV.
- Do not use `4–5` merely to increase coverage or hit rate.

Worker count is not proficiency. Minimal resource use at the Pareto operating point is the goal.

## Negative learning

Suppress activation when traces show:

- short local work that cannot hide meaningful time,
- CPU contention,
- repeated prediction misses,
- unused/dead-end preprocessing,
- freshness/authority incompatibility,
- mutation requirements,
- external request/rate-limit amplification.

Unused local work is not assumed free. The first two miss probes were noisy and averaged about 2% slower with unused work, so miss waste and contention remain explicit penalties.

## Evidence boundary

A six-pair forced-hit surface probe produced an apparent mean direction of about 21.3% faster for overlapped local work, but it used `p=1`, artificial task composition, and showed high variance. It proves the overlap surface exists; it does **not** establish a production speedup or promotion gate.

Naive CPU/local parsing remains a DON'T-USE condition unless a natural task-specific EV gate opens.

## Learning procedure

```text
Observe Normal trajectory
-> label actual next action
-> estimate p_lower
-> measure local work latency
-> estimate foreground hideable window
-> calculate conservative EV
-> choose 0 or 1 worker initially
-> measure hit/miss/quality/latency/compute
-> negative-learn losses
-> counterfactual replay 0-N / TTL / cache policies
-> retain only reproducible natural-workflow wins
-> compile stable wins into deterministic Skill/meta-tool
```

## Promotion boundary

Keep global ChatGPT Shadow Interceptor **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF** until a natural workload repeatedly satisfies all of:

- quality >= Normal,
- Hard Failure = 0,
- same baseline capabilities for Normal and Shadow,
- speculative result actually consumed,
- positive end-to-end net value after dispatch/miss/contention cost,
- reproducibility across repeated or held-out tasks.

The desired endpoint is not maximum raw gain. Prefer approximately 95% or more of the best validated gain with the fewest workers, requests, bytes, waste, and rate-limit pressure.
# ChatGPT Shadow Interceptor Checkpoint — 2026-08-30

Status: **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**

This checkpoint records the latest validated ChatGPT-specific Shadow Carrier state. A later session should read this file before experimenting and must not reuse invalidated benchmark claims.

## Prior art and positioning

The closest known public prior implementation is [ToolAhead](https://github.com/michael-ra/toolahead). Shadow Carrier does not claim first invention of speculative tool execution. The goal is to learn, optimize, and benchmark a ChatGPT-oriented activation policy and eventually compile repeatedly stable wins into deterministic Skills/meta-tools.

## Runtime model

The ChatGPT coding execution environment is treated as a model-external deterministic worker. No separate predictor LLM or additional speculative-model token stream is used by default.

Two runtime capabilities must be distinguished:

1. **worker-owned external async I/O** — still unavailable / unverified. The coding environment has no direct Internet egress, and no current built-in surface was found that lets the detached worker independently launch hidden Web/Drive/API prefetch.
2. **local deterministic work during required ChatGPT processing** — real overlap is verified. A detached local process continued making progress while ChatGPT performed connector/tool/model work in the same turn.

This second result is narrower than true speculative external I/O prefetch and must not be described as such.

## Invalidated benchmark

An earlier benchmark reported approximately:

- 29.2% latency reduction,
- 99.5% reduction in model-visible input.

These results are **invalid as Shadow Carrier performance evidence** because latency used simulated overlap and the context comparison denied Normal the parser that Shadow received.

A fair Normal baseline must have the same parser/code/cache/data-access capabilities as Shadow. Shadow-specific value must come only from prediction, pre-execution, routing, caching, or learned activation policy layered on top of those equal capabilities.

## Fair retest — naive local parsing

Fair comparison conditions:

- same coding tool,
- same parser,
- same data access,
- same actual outputs,
- Shadow alone receives next-action speculative pre-execution.

Results:

- Normal mean: **1.108 s**
- Shadow with OS process overlap: **1.162 s**
- Shadow: approximately **4.9% slower**
- held-out next-action prediction: **77.2% (61/79)**
- model-visible output difference: **0%**
- exact parse outputs matched for all 79 actual parses

Parser-load crossover:

- ~1.37 ms: Shadow **-2.5%**
- ~5.92 ms: Shadow **-1.4%**
- ~22.45 ms: Shadow **-7.3%**

Conclusion: naive speculative CPU/local parsing remains a **DON'T-USE** condition. CPU contention, dispatch/IPC overhead, and miss waste can erase or reverse benefit.

## Real runtime overlap probe

A detached Python worker wrote timestamped ticks every 0.1 s while ChatGPT executed a Google Drive connector operation. The tick stream continued uninterrupted through the remote/model/tool processing window.

Validated conclusion:

> A detached deterministic local process can run concurrently with ongoing ChatGPT connector/tool/model processing in the current runtime.

Not validated:

> The local worker can independently prefetch external Web/Drive/API data.

It cannot currently do so because direct Internet egress is unavailable and no worker-owned connector dispatch surface was found.

Detailed record: `research/CHATGPT_SHADOW_INTERCEPTOR_RUNTIME_OVERLAP_PROBE_2026-08-30.md`.

## Forced-hit overlap surface probe

A deterministic parser over a local ~35 MB / 500,000-row JSONL artifact was tested with the same parser/data capability in Normal and Shadow.

Six paired observations produced:

- Normal mean: approximately **10.082 s**
- Shadow mean: approximately **7.939 s**
- apparent mean direction: approximately **21.3% faster**
- pair-level apparent gains: roughly **1.0% to 40.3%**
- parser output identical; parser Hard Failure = 0

This remains **surface evidence only**, not a valid natural E2E benchmark.

Two reasons:

1. it was a forced hit (`p=1`) artificial composition with high model/connector/orchestration variance;
2. the harness gave Normal dummy timing/code calls to equalize model-triggered tool-call count. That helps isolate process overlap but does not price the extra standalone Shadow dispatch call that a natural workflow may require.

Therefore the 21.3% figure must not support promotion or public speed claims.

## Miss / unused-work probe

Two counterbalanced pairs ran an unused local worker while the foreground action did not consume the result.

- one pair appeared ~5.2% faster with unused work,
- one appeared ~9.7% slower,
- mean direction was approximately **2.0% slower** with the unused worker.

The sample is too small and noisy for a stable contention estimate. It is enough to reject the assumption that misses are free. Dispatch cost, miss waste, and CPU contention remain explicit negative terms.

## Persistent-worker probe

Fresh-process cost was decomposed:

- non-blocking `Popen()` return median: about **0.332 ms**;
- tiny fresh Python child completion median: about **682 ms**.

The dominant per-task cost was therefore fresh Python/sandbox startup and handoff, not parent-side `Popen()`.

A warm persistent worker was then tested.

Polling transport:

- small-task round-trip median: about **2.14 ms**;
- warm 500k-row parse median: about **0.902 s**;
- but idle polling consumed about **3% of one core** -> reject as preferred transport.

Interactive streaming session:

- unavailable in the current runtime (`StreamingExecNotEnabledContainerError`) -> do not assume it exists.

Blocking FIFO transport:

- task-submit median: about **3.41 ms**;
- p95: about **3.79 ms**;
- measured idle CPU: **0.0% of one core** at measurement resolution;
- warm parser retained the ~0.9 s compute time and exact output;
- three sequential parse jobs completed while a Drive connector/model/tool sequence continued;
- worker was explicitly terminated after the probe and orphan check passed.

Detailed record: `research/CHATGPT_SHADOW_INTERCEPTOR_PERSISTENT_WORKER_PROBE_2026-08-30.md`.

Interpretation: a short-TTL blocking persistent local worker can remove repeated Python cold-start without polling contention. This is a promising local execution substrate, not yet a proven end-to-end speedup.

## Dispatch topology split

### Standalone dispatch

Shadow requires an additional model-triggered code call solely to start or submit speculative work.

Current policy: **DEFAULT OFF / high orchestration-cost penalty** until natural E2E measurements show positive net value.

### Piggyback dispatch

Worker start/submit can be included inside a code action that Normal already needed, so the incremental model/tool transition is small or zero.

Current policy: **preferred experimental dispatch class** when the next local action is predictable and conservative EV is positive.

This distinction is more important than raw local `Popen()` latency.

## Current operating stance

Global latency-hiding dispatch default: **0 workers**.

The prior CPU/local parsing DON'T-USE rule remains in force. The new overlap finding creates only a narrow experimental class:

`local_deterministic_during_required_foreground_chatgpt_processing`

Candidate conditions:

1. the foreground connector/tool/model operation is already required by Normal;
2. the likely actual next action is deterministic local work over data/artifacts already present locally;
3. no speculative external network request is added;
4. preparing early does not weaken source/authority/freshness semantics;
5. dispatch topology and worker lifecycle are included in cost;
6. conservative expected value is positive.

Revised working gate:

```text
worker_completion_latency
= cold_start + compute + handoff

expected_gain
= p_lower * min(worker_completion_latency, estimated_hideable_foreground_window)
- incremental_dispatch_orchestration_cost
- miss_waste
- contention_penalty
```

If a persistent worker is already warm, cold-start may be amortized toward zero for later tasks, but startup/TTL cost must still be allocated across the workflow.

Worker policy:

- `0`: default and often optimal;
- `1`: one dominant compatible local next action and positive conservative EV;
- `2–3`: only after real trajectories show multiple distinct branches with positive marginal EV;
- do not treat `4–5` workers as a default training range.

Persistent workers are experimental and must use near-zero-idle blocking IPC, bounded TTL, and explicit cleanup.

## Learning objective

The main objective is **not next-action hit rate**. Learn when speculation is worth doing.

Continue learning from Normal trajectories even while Shadow is OFF. For each task class/state collect or estimate:

- actual next action,
- conservative hit probability / `p_lower`,
- normal tool and end-to-end latency distributions,
- hideable foreground window,
- worker completion latency (`cold-start + compute + handoff`),
- standalone vs piggyback dispatch topology,
- incremental model/tool orchestration cost,
- CPU vs I/O character,
- miss waste,
- contention cost,
- rate-limit/request-budget risk where relevant,
- source/authority/freshness/cache compatibility,
- persistent-worker reuse count / TTL / cleanup outcome when used.

## Learning loop

```text
Observe Normal
-> Predict next action
-> Predict whether speculation is worth doing
-> Choose 0-N workers / dispatch topology / TTL
-> Measure actual result
-> Negative-learn losses
-> Counterfactual replay alternative policies
-> Retain only reproducible wins
-> Compile repeatedly stable wins into deterministic Skill/meta-tool
```

## Optimization target

Prefer the Pareto operating point that preserves roughly **95% or more of the best validated gain** while minimizing workers, extra tool calls, requests, bytes, waste, cache mismatch, and rate-limit pressure.

A third worker is allowed only when its marginal EV remains positive after resource penalties. Fixed worker counts and hit-rate-only targets are not the objective.

## Fair benchmark contract

Every future comparison must allow Normal the same parser/code/cache/data access **and preserve the natural tool-call topology of each path**.

Recognize a Shadow improvement only after:

1. quality >= Normal,
2. Hard Failure = 0,
3. same required evidence/output semantics,
4. real end-to-end wall-clock measurement,
5. extra model/tool transitions, worker startup/TTL, compute, miss waste, and cleanup included,
6. positive net value reproduced across repeated or held-out natural tasks.

Do not artificially burden Normal with dummy tool calls merely to equalize call count. Simulation and forced-hit surface probes may inform design but must not be presented as actual ChatGPT performance.

## Next-session priority

1. Read this checkpoint and current project state first.
2. Keep worker-owned external I/O speculation OFF unless a real built-in execution surface is discovered.
3. Collect natural Normal trajectories from Drive/Web/read/fetch workflows where the actual next step may be local deterministic parse/hash/dedup/cache/index/validation/replay over already-present data.
4. Measure `worker_completion_latency`, foreground hideable window, and natural tool-call topology.
5. Separate **standalone extra-tool-call dispatch** from **piggyback dispatch** in all traces and A/B tests.
6. Prefer 0 workers when standalone orchestration cost makes conservative EV non-positive.
7. If a workflow already contains a required code action, test whether a 1-worker start/submit can be piggybacked without changing Normal's tool-call topology.
8. Test short-TTL blocking persistent workers only where repeated local actions are likely; measure reuse count, TTL, idle cost, cleanup, and orphan state.
9. After enough real traces, compare dynamic 0-N worker, TTL, negative-cache, and compatibility policies by counterfactual replay.
10. Require quality >= Normal and Hard Failure = 0 before any efficiency claim.
11. Keep DEFAULT OFF until natural end-to-end positive net value repeats.
12. Compile only repeatedly validated stable trajectories into deterministic Skills/meta-tools.

## Current success criterion

The next meaningful milestone is not high prediction accuracy and not the forced-hit ~21.3% surface signal.

It is a **natural real workload** where Shadow correctly chooses to activate, preserves the natural Normal baseline, uses a justified dispatch topology, the speculative local result is actually consumed, Normal-quality output is preserved with Hard Failure = 0, lifecycle cost is acceptable, and positive end-to-end net value repeats. Until then ChatGPT Shadow Interceptor remains incomplete and default off.

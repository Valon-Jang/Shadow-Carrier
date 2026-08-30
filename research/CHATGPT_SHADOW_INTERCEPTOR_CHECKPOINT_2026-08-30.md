# ChatGPT Shadow Interceptor Checkpoint — 2026-08-30

Status: **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**

This checkpoint records the latest validated ChatGPT-specific Shadow Carrier state. A later session should read this file before experimenting and must not reuse invalidated benchmark claims.

## Prior art and positioning

The closest known public prior implementation is [ToolAhead](https://github.com/michael-ra/toolahead). Shadow Carrier does not claim first invention of speculative tool execution. The goal is to learn, optimize, and benchmark a ChatGPT-oriented activation policy and eventually compile repeatedly stable wins into deterministic Skills/meta-tools.

## Runtime model

The ChatGPT coding execution environment is treated as a model-external deterministic worker. No separate predictor LLM or additional speculative-model token stream is used by default.

Two runtime capabilities must now be distinguished:

1. **worker-owned external async I/O** — still unavailable / unverified. The coding environment has no direct Internet egress, and no current built-in surface was found that lets the detached worker independently launch hidden Web/Drive/API prefetch.
2. **local deterministic work during required ChatGPT processing** — real overlap is now verified. A detached local process continued making progress while ChatGPT performed connector/tool/model work in the same turn.

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

## New real runtime overlap probe

A detached Python worker wrote timestamped ticks every 0.1 s while ChatGPT executed a Google Drive connector operation. The tick stream continued uninterrupted through the remote/model/tool processing window.

Validated conclusion:

> A detached deterministic local process can run concurrently with ongoing ChatGPT connector/tool/model processing in the current runtime.

Not validated:

> The local worker can independently prefetch external Web/Drive/API data.

It cannot currently do so because direct Internet egress is unavailable and no worker-owned connector dispatch surface was found.

Detailed record: `research/CHATGPT_SHADOW_INTERCEPTOR_RUNTIME_OVERLAP_PROBE_2026-08-30.md`.

## Forced-hit overlap surface probe

To isolate whether useful local work can be hidden, a deterministic parser over a local ~35 MB / 500,000-row JSONL artifact was tested with exactly the same parser/data capability in Normal and Shadow.

Normal:

`required foreground remote operation -> local parse`

Shadow probe:

`start detached local parse -> same required foreground remote operation -> collect parse result`

Six paired observations produced:

- Normal mean: approximately **10.082 s**
- Shadow mean: approximately **7.939 s**
- apparent mean direction: approximately **21.3% faster**
- pair-level apparent gains ranged roughly **1.0% to 40.3%**
- parser output was identical; parser Hard Failure = 0

This was a **forced hit (`p=1`) artificial surface probe**, with high model/connector/orchestration variance. The 21.3% number is **not validated Shadow Carrier performance** and must not be used for promotion or public speed claims. Its valid use is only to confirm that nontrivial local deterministic work can finish under ongoing ChatGPT processing.

## Miss / unused-work probe

Two counterbalanced pairs ran an unused local worker while the actual foreground action did not consume the result.

- one pair appeared ~5.2% faster with unused work,
- one appeared ~9.7% slower,
- mean direction was approximately **2.0% slower** with the unused worker.

The sample is too small and noisy for a stable contention estimate. It is enough to reject the assumption that misses are free. Dispatch cost, miss waste, and CPU contention remain explicit negative terms.

## Current operating stance

Global latency-hiding dispatch default: **0 workers**.

The prior CPU/local parsing DON'T-USE rule remains in force. The new overlap finding creates only one narrow experimental task class:

`local_deterministic_during_required_foreground_chatgpt_processing`

Consider it only when:

1. the foreground connector/tool/model operation is already required by Normal;
2. the likely actual next action is deterministic local work over data/artifacts already present locally;
3. no speculative external network request is added;
4. preparing early does not weaken source/authority/freshness semantics;
5. conservative expected value is positive.

Working gate:

```text
expected gain
= p_lower * min(local_work_latency, estimated_hideable_foreground_window)
- dispatch_cost
- miss_waste
- contention_penalty
```

Dispatch only if positive.

Worker policy:

- `0`: default and often optimal;
- `1`: one dominant compatible local next action and positive conservative EV;
- `2–3`: only after real trajectories show multiple distinct branches with positive marginal EV;
- do not treat `4–5` workers as a default training range.

For a purely local worker, added remote rate-limit pressure can be near zero, but CPU contention and miss compute remain.

## Learning objective

The main objective is **not next-action hit rate**. Learn when speculation is worth doing.

Continue learning from Normal trajectories even while Shadow remains OFF. For each task class/state collect or estimate:

- actual next action,
- conservative hit probability / `p_lower`,
- normal tool and end-to-end latency distributions,
- hideable foreground window,
- local-work latency,
- CPU vs I/O character,
- dispatch overhead,
- miss waste,
- contention cost,
- rate-limit/request-budget risk where relevant,
- source/authority/freshness/cache compatibility.

## Learning loop

```text
Observe Normal
-> Predict next action
-> Predict whether speculation is worth doing
-> Choose 0-N workers / threshold / TTL
-> Measure actual result
-> Negative-learn losses
-> Counterfactual replay alternative policies
-> Retain only reproducible wins
-> Compile repeatedly stable wins into deterministic Skill/meta-tool
```

## Optimization target

Prefer the Pareto operating point that preserves roughly **95% or more of the best validated gain** while minimizing workers, requests, bytes, waste, cache mismatch, and rate-limit pressure.

A third worker is allowed only when its marginal EV remains positive after resource penalties. Fixed worker counts and hit-rate-only targets are not the objective.

## Fair benchmark contract

Every future comparison must allow Normal the same parser/code/cache/data access.

Recognize a Shadow improvement only after:

1. quality >= Normal,
2. Hard Failure = 0,
3. same required evidence/output semantics,
4. real end-to-end wall-clock measurement,
5. speculative requests/compute/waste included,
6. positive net value reproduced across repeated or held-out natural tasks.

Simulation and forced-hit surface probes may inform design but must not be presented as actual ChatGPT performance.

## Next-session priority

1. Read this checkpoint and current project state first.
2. Keep worker-owned external I/O speculation OFF unless a real built-in execution surface is discovered.
3. Collect natural Normal trajectories from Drive/Web/read/fetch workflows where the actual next step may be local deterministic parse/hash/dedup/cache/index/validation/replay over already-present data.
4. Measure local-work duration and the real foreground hideable window; separate provider/tool latency from full turn orchestration where possible.
5. Estimate `p_lower`, dispatch overhead, miss waste, and CPU contention per task class.
6. Run a 1-worker fair A/B only when conservative EV is positive. If the gate stays closed, record `0 workers` as the correct policy and keep learning from Normal.
7. After enough real traces, compare dynamic 0–N worker, TTL, negative-cache, and compatibility policies by counterfactual replay.
8. Require quality >= Normal and Hard Failure = 0 before any efficiency claim.
9. Keep DEFAULT OFF until natural end-to-end positive net value repeats.
10. Compile only repeatedly validated stable trajectories into deterministic Skills/meta-tools.

## Current success criterion

The next meaningful milestone is not high prediction accuracy and not the forced-hit ~21.3% surface signal.

It is a **natural real workload** where Shadow correctly chooses to activate, the speculative local result is actually consumed, Normal-quality output is preserved with Hard Failure = 0, speculative cost remains acceptable, and positive end-to-end net value repeats. Until then ChatGPT Shadow Interceptor remains incomplete and default off.

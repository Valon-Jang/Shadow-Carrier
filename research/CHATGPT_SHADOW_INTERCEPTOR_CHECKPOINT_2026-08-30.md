# ChatGPT Shadow Interceptor Checkpoint — 2026-08-30

Status: **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**

This checkpoint records the current ChatGPT-specific Shadow Carrier experiment so a later session can continue from the latest validated state without reusing invalid results.

## Prior art and positioning

The closest known public prior implementation is [ToolAhead](https://github.com/michael-ra/toolahead). Shadow Carrier does not claim first invention of speculative tool execution. The current goal is to learn, optimize, and benchmark a ChatGPT-oriented operating policy, while citing prior art explicitly.

## Current ChatGPT experiment

The ChatGPT coding execution environment is treated as a candidate model-external deterministic processor / Interceptor. It may be useful for parsing, computation, caching, replay, and other machine work that does not require additional predictor-LLM calls.

Important runtime boundary: the currently available coding execution path has **not** been proven to execute as a true background Interceptor concurrently with ChatGPT reasoning, and its Python environment does not have direct internet egress. Therefore current ChatGPT experiments must not claim real reasoning-time web prefetch latency hiding.

## Invalidated benchmark

An earlier benchmark reported approximately:

- 29.2% latency reduction,
- 99.5% reduction in model-visible input.

These results are **invalid as Shadow Carrier performance evidence**.

Why:

1. the latency test assumed synthetic tool/reasoning delays and simulated overlap rather than measuring real ChatGPT end-to-end concurrency;
2. the context test allowed Shadow to use a deterministic parser while the Normal baseline was forced to receive the full payload.

A fair Normal baseline must have the same parser/code/cache capabilities as Shadow. Shadow's unique value must be measured only from additional prediction, pre-execution, routing, learning, or caching policy.

## Fair retest

Fair comparison conditions:

- same coding tool,
- same parser,
- same data access,
- same actual outputs,
- Shadow alone receives next-action speculative pre-execution.

Results:

- Normal mean: **1.108 s**
- Shadow with real OS process overlap: **1.162 s**
- Shadow result: approximately **4.9% slower**
- held-out next-action prediction: **77.2% (61/79)**
- model-visible output: identical, therefore **0% context advantage** in this fair test
- actual parse outputs: exact match for all 79 actual parses

Additional parser-load crossover tests:

- ~1.37 ms parse cost: Shadow **-2.5%**
- ~5.92 ms parse cost: Shadow **-1.4%**
- ~22.45 ms parse cost: Shadow **-7.3%**

Conclusion: naive speculative CPU/local parsing is currently a **DON'T-USE** condition. CPU contention, dispatch/IPC overhead, and miss waste can erase or reverse any benefit.

## Operating stance

Current ChatGPT latency-hiding dispatch default: **0 workers**.

Do not turn Shadow on merely because prediction confidence is high. Prediction accuracy is not the primary objective. The primary objective is to learn **when speculation has positive net value**.

CPU/local parsing Shadow stays OFF unless later evidence overturns this result. Priority should shift toward read/fetch/API/Drive/Web or other I/O-bound tasks where real asynchronous waiting can potentially be overlapped.

## Learning objective

Learn both:

1. the likely next action;
2. whether speculating that action is worth doing at all.

The scheduler should learn from ordinary Normal trajectories even when Shadow is OFF.

For each task class/state, collect or estimate:

- actual next action,
- hit probability,
- normal tool latency distribution,
- hideable overlap window,
- CPU vs I/O character,
- dispatch overhead,
- miss waste,
- contention cost,
- rate-limit / request-budget risk,
- cache compatibility and freshness requirements.

## Dispatch policy

Working expected-value rule:

```text
expected gain
= hit probability × hideable latency
- dispatch cost
- miss waste
- contention / rate-limit penalty
```

Dispatch only when expected value is positive under a conservative estimate.

Important principles:

- **0 workers is a valid and often optimal decision.**
- use the smallest sufficient worker set;
- one dominant branch -> usually 1 worker;
- 2–3 workers only when realistic branches and positive marginal EV justify them;
- do not use a fixed worker count;
- do not optimize hit rate in isolation;
- use a conservative lower bound on hit probability while trace counts are small;
- negative learning should suppress repeated misses, dead ends, short tasks, and resource-heavy losing patterns.

## Optimization target

Do not optimize for raw maximum latency gain alone.

Prefer a Pareto operating point that preserves roughly **95% or more of the best validated gain** while minimizing:

- speculative workers,
- requests,
- bytes,
- rate-limit pressure,
- waste,
- cache mismatches.

A third worker should be added only when its marginal EV remains positive after resource and rate-limit penalties.

Synthetic counterfactual policy replay suggested dynamic EV-based dispatch can outperform fixed-k policies in the simulated objective, but this is **scheduler-design evidence only**, not real ChatGPT speed evidence.

## Learning loop

```text
Observe Normal
-> Predict next action
-> Predict whether speculation is worth doing
-> Choose 0-N workers / thresholds / TTL
-> Measure real outcome
-> Negative-learn losses and dead ends
-> Counterfactual replay alternative policies
-> Retain only fair, reproducible wins
-> Compile repeatedly stable wins into deterministic Skills/meta-tools
```

## Fair benchmark contract

Every future comparison must allow Normal the same underlying parser/code/cache/data access capabilities.

A Shadow improvement is recognized only after:

1. quality >= Normal,
2. Hard Failure = 0,
3. same required evidence/output semantics,
4. real end-to-end wall-clock measurement,
5. speculative requests/cost/waste included,
6. positive net value reproduced across repeated runs or held-out tasks.

Do not cite invalidated synthetic results as performance evidence.

## Next-session priority

1. Read this checkpoint and the current project state before experimenting.
2. Search for an execution surface that can provide **real asynchronous I/O overlap** in the active ChatGPT runtime without adding predictor-LLM tokens.
3. Collect real Normal trajectories from I/O-bound read/search/fetch/API/Drive/Web workloads.
4. Measure per-task-class latency, next-action distributions, and failure/dead-end patterns.
5. Implement or simulate conservative lower-bound EV gating from real traces.
6. Compare dynamic 0-N dispatch, compatibility checks, TTL, and negative-cache policies through counterfactual replay.
7. Run fair Normal vs Shadow A/B only where true overlap is possible.
8. Keep DEFAULT OFF until a workload produces reproducible positive net value.
9. Compile only repeatedly validated stable trajectories.

## Current success criterion

The next meaningful milestone is **not a high prediction hit rate**.

It is a real workload where Shadow correctly chooses to activate, preserves Normal-quality output, incurs acceptable speculative cost, and produces a reproducible positive end-to-end gain. Until then this remains an incomplete experimental skill.

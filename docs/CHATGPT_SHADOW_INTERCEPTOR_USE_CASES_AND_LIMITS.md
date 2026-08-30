# ChatGPT Shadow Interceptor — Use Cases and Limits

Status: **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**

Frozen runtime policy: **v0.1.1-experimental**

This document states where the current ChatGPT-oriented Shadow Interceptor may be useful and where it must remain disabled. It is intentionally conservative.

## Current meaning of Shadow in ChatGPT

In the tested ChatGPT runtime, the useful surface is narrow:

> Run one deterministic local, read-only, authority-safe support task while ChatGPT is already occupied with a required model/tool/connector step.

The primary model remains authoritative. Shadow prepares support work; it does not decide the answer and does not pre-commit a patch or action.

Global default: **0 workers**.

## Good candidate conditions

Shadow is a candidate only when all of these hold:

1. Normal already needs the foreground step; Shadow does not invent an extra wait merely to create overlap.
2. The likely next support task is deterministic local work over data/code already available locally.
3. The speculative work is side-effect-free and reversible/read-only.
4. Running it early is safe even if later authoritative evidence changes the final decision.
5. The result has a high conservative probability of being consumed.
6. Dispatch can be piggybacked inside an already-required local/code action, avoiding a standalone extra model/tool transition.
7. The estimated hidden time exceeds dispatch, miss, lifecycle, and contention costs.
8. Quality semantics remain identical to Normal.

## Practical candidate examples

### Large coding / debugging support

Promising:

- repository-wide AST, symbol, or reference indexing while ChatGPT reads a remote issue/PR/spec;
- dependency or impact mapping during required remote/model/tool wait;
- deterministic stack-trace indexing and log clustering;
- relevant-test selection or test-impact preparation when foreground CPU pressure is low;
- local code inventory, duplicate detection, hash/index/cache preparation;
- deterministic reconciliation of already-present local artifacts after an authoritative remote read has been initiated.

The important distinction is **support analysis**, not speculative code modification.

### Large local data/artifact workflows

Promising:

- hash/dedup/index generation over files already present locally;
- deterministic parse/validation that is long enough to hide and is likely to be used;
- cache preparation or local replay whose inputs and semantics are already fixed.

## Explicit do-not-use cases

### 1. Worker-owned external Web / Drive / API prefetch

**OFF.** Direct Internet egress from the tested coding worker is unavailable, and no built-in surface was verified that lets the detached worker independently launch hidden ChatGPT connector requests.

Do not describe the current implementation as speculative Web/Drive/API prefetch.

### 2. Automatic interception of ChatGPT built-in tools

**Not available.** The frozen package is an activation-policy reference implementation. Installing it does not transparently intercept ChatGPT Web, Drive, GitHub, or other built-in tools.

Integration requires an execution surface that explicitly supplies the policy inputs and launches/collects the local support worker.

### 3. Speculative edits or side effects

**Blocked.** Do not pre-run:

- code patches,
- file writes,
- sends,
- deletes,
- repository mutations,
- permission changes,
- other irreversible or externally visible actions.

### 4. Authority-dependent decisions before evidence resolves

**Blocked.** If a remote issue, maintainer decision, policy, current source, permission, or authoritative document can change whether a patch/action is correct, Shadow may prepare neutral local analysis but must not commit the decision early.

A real Xarray case demonstrated the failure mode: a technically plausible one-line patch existed, but the maintainer explicitly rejected that behavior change as contrary to intended semantics. Faster premature patching would have reduced quality.

### 5. Standalone extra Shadow dispatch

**DEFAULT OFF.** A separate model-triggered code/tool call solely to start Shadow can cost far more than the local process-submit time. Current evidence favors piggyback dispatch only.

### 6. Short local parsing

**DON'T USE.** In the fair parser crossover, millisecond-scale local speculative parsing remained slower than Normal. The earlier naive local parsing retest was about 4.9% slower overall, with additional tested parser loads also negative.

### 7. Heavy CPU overlap without strong margin

**Strongly penalized.** A real debugging-support probe showed the foreground test itself became about 14.5% slower under overlap. Total phase time may still improve when enough support work is hidden, but contention is real and must be priced.

### 8. Multiple workers by default

**Not supported by current evidence.** Frozen policy v0.1.1 permits at most one worker. There is insufficient natural-workload evidence to promote routine 2–3 worker speculation.

## Quality boundary

A Shadow result is not a win unless:

- quality >= Normal,
- Hard Failure = 0,
- evidence/authority/freshness semantics are unchanged,
- natural tool-call topology is preserved,
- lifecycle and cleanup are included,
- miss waste and contention are included.

Observed controlled coding/debugging probes preserved equal test outcomes and patch bytes, but that does **not** yet prove autonomous AI patch-reasoning quality parity across held-out tasks.

## Performance evidence boundary

The following are useful research observations, not universal speed claims:

- naive fair local parsing: Shadow about **4.9% slower** than Normal;
- debugging-support phase with repo-wide analysis: observed mean direction about **17.0% shorter**, while foreground test itself slowed about **14.5%** from contention;
- remote/model/tool-wait coding exploration with repo-wide index: observed phase direction about **36.5% shorter** across three pairs;
- controlled hard multi-file Xarray workflow with identical patch procedure: observed mean direction about **21.7% shorter** across two pairs with equal final patch/test quality;
- authority-safe held-out Xarray probe: one counterbalanced pair observed about **13.6% shorter** with the same correct no-patch conclusion.

These values depend on workload, runtime, connector/model/tool latency, ordering, cache state, and worker size. They must not be advertised as general ChatGPT coding speedups.

## Frozen activation gate

```text
hideable_ms = min(worker_completion_ms, hideable_foreground_ms)

gross_gain_ms = p_lower * hideable_ms

expected_gain_ms = gross_gain_ms
  - dispatch_orchestration_ms
  - miss_waste_ms
  - contention_penalty_ms
```

Additional hard gates require:

- deterministic local task,
- side-effect-free work,
- authority-safe-before-resolution,
- likely result consumption,
- no worker-owned external I/O,
- piggyback topology by default,
- minimum hideable window,
- stronger thresholds when local CPU pressure is high.

## Distribution

Frozen implementation:

`implementations/chatgpt-runtime-policy-v0.1.1/`

Self-contained Windows installer:

`installers/ShadowCarrier-ChatGPT-RuntimePolicy-v0.1.1.ps1`

Installer SHA-256:

`c8f61b7145df5a9197cd96ad79215a2ca3b807a41e4670b63ddd2c513b100323`

The installer writes the policy package locally and runs the included self-test when Node.js 20+ is available. It does **not** install a transparent ChatGPT interceptor.

# ChatGPT Shadow Interceptor — Research Freeze — 2026-08-30

Status: **RESEARCH PAUSED / INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**

This file freezes the current ChatGPT-oriented Shadow Interceptor research state. It is a checkpoint, not a production release claim.

## Frozen conclusion

The current ChatGPT runtime supports a narrow but real latency-hiding surface:

> A detached deterministic local process can make progress while ChatGPT continues required model/tool/connector processing.

The useful candidate is **not** generic speculative external I/O. The tested worker cannot directly own Web/Drive/API prefetch. The strongest current candidate is one local side-effect-free support worker, piggyback-dispatched during an already-required foreground model/tool/connector window.

Global default remains **0 workers**.

## What was invalidated

Do not reuse these earlier claims as Shadow performance evidence:

- ~29.2% latency reduction from simulated overlap;
- ~99.5% model-visible input reduction from an unfair parser capability comparison.

Normal must always receive the same parser/code/cache/data-access capability as Shadow.

## Negative evidence retained

Fair naive local parsing remained a loss:

- Normal mean ~1.108 s;
- Shadow process overlap ~1.162 s;
- direction ~4.9% slower;
- held-out next-action prediction 77.2% (61/79);
- model-visible output difference 0%;
- parser crossover at ~1.37 ms / 5.92 ms / 22.45 ms remained negative.

Conclusion: short/local parsing speculation remains **DON'T USE**.

## Runtime substrate findings

- detached local process overlap with ChatGPT processing: verified;
- worker-owned external Internet/connector I/O: unavailable/unverified;
- fresh Python child tiny-task completion median: ~682 ms;
- warm blocking FIFO submit median: ~3.4 ms;
- blocking FIFO idle CPU: 0.0% at measurement resolution;
- warm 500k-row parser round-trip median: ~0.902 s;
- polling worker rejected because idle polling consumed CPU;
- interactive streaming exec unavailable in the tested runtime.

Preferred substrate hypothesis: short-TTL blocking persistent local worker, one worker first, explicit cleanup.

## Coding/debugging evidence

### Real historical SymPy bug substrate

A historical `autowrap` unused-array regression was reintroduced into a temporary SymPy copy. The real regression test failed as expected (`double *x` expected vs `double x` generated), providing a non-toy debugging substrate.

### Debugging-support overlap

Required test + repo-wide AST/reference index:

- three paired observations;
- Normal mean ~15.08 s;
- Shadow mean ~12.51 s;
- observed support-phase direction ~17.0% shorter;
- foreground test itself ~14.5% slower under Shadow from CPU contention.

Interpretation: support work can be hidden, but CPU contention is real. This is not a general debugging speedup claim.

### Large coding exploration

Required local inspection + remote GitHub issue/PR work + repo-wide index:

- three paired observations;
- Normal mean ~21.07 s;
- Shadow mean ~13.38 s;
- observed phase direction ~36.5% shorter.

Interpretation: remote/model/tool wait with relatively idle local CPU is the strongest current activation surface. This is not an overall coding speedup claim.

### Controlled hard multi-file Xarray workflow

A hard multi-file Xarray regression family was reproduced locally with identical Normal/Shadow fix procedure.

Quality parity in the controlled workflow:

- same discovery failure signature;
- same final patch bytes / SHA-256;
- same post-fix tests;
- Hard Failure = 0.

Two observed pairs were ~26.6% and ~16.7% shorter with Shadow; mean direction ~21.7% shorter.

Boundary: this proves controlled workflow quality parity can coexist with overlap. It does not prove autonomous AI patch-reasoning quality parity.

## Authority-safety finding

A later Xarray issue/PR provided an important negative-quality example. A technically plausible one-line patch existed, but maintainers explicitly rejected the behavioral change as contrary to intended semantics.

Therefore the activation policy was patched with hard gates:

- speculative work must be side-effect-free;
- speculative work must be safe before authority/evidence resolves;
- patching/writes/decisions are not prefetched;
- neutral local analysis may still run while authoritative remote evidence is being read.

This is a key quality-preservation rule.

## Frozen activation policy v0.1.1-experimental

Hard defaults:

- DEFAULT OFF;
- 0 workers globally;
- maximum 1 worker when gate opens;
- standalone dispatch blocked by default;
- worker-owned external I/O blocked;
- side-effectful speculation blocked;
- authority-dependent speculation blocked before evidence resolution;
- short local parsing blocked by minimum hideable window;
- CPU-heavy foreground requires much stronger margin.

Working EV:

```text
hideable_ms = min(worker_completion_ms, hideable_foreground_ms)

gross_gain_ms = p_lower * hideable_ms

expected_gain_ms = gross_gain_ms
  - dispatch_orchestration_ms
  - miss_waste_ms
  - contention_penalty_ms
```

The implementation uses conservative probability, absolute-gain and gain-ratio thresholds. These thresholds remain provisional training defaults, not universal constants.

## Distribution frozen with this checkpoint

Implementation:

`implementations/chatgpt-runtime-policy-v0.1.1/`

Windows self-contained installer:

`installers/ShadowCarrier-ChatGPT-RuntimePolicy-v0.1.1.ps1`

Installer SHA-256:

`c8f61b7145df5a9197cd96ad79215a2ca3b807a41e4670b63ddd2c513b100323`

Local package self-test: **9/9 passed** before publication.

## Explicit limitations

1. This is not a transparent ChatGPT plugin/interceptor.
2. Installing the package does not automatically intercept built-in Web, Drive, GitHub, or other tools.
3. The coding worker cannot directly perform hidden external speculative I/O in the tested runtime.
4. Full autonomous AI patch-reasoning quality parity has not been established across held-out tasks.
5. No universal latency improvement percentage is validated.
6. No context-token benefit is currently validated from Shadow-specific pre-execution when Normal has equal parser capabilities.
7. Multiple-worker benefits are not established; frozen policy caps at one worker.
8. CPU-heavy overlap can slow the foreground and must be penalized.
9. External authority/freshness/permission semantics can invalidate premature decisions, so only authority-safe support work may run early.
10. The project remains prior-art-aware; ToolAhead is retained as the closest known public implementation and no first-invention claim is made.

## When research resumes

Do not restart from broad architecture speculation. Start from this frozen state and use held-out natural workloads. The next meaningful milestone would be repeated autonomous end-to-end solves showing quality >= Normal, Hard Failure=0, authority fidelity, and positive net wall-clock value under the same frozen safety/activation rules.

Until that evidence exists:

**INCOMPLETE / EXPERIMENTAL / DEFAULT OFF / 0 workers globally**

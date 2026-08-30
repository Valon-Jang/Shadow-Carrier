# Shadow Carrier ChatGPT Runtime Policy v0.1.1-experimental

Status: **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**

This is the frozen ChatGPT-runtime activation policy produced by the 2026-08-30 research checkpoint.

## What it is

A deterministic gate that decides whether **one local side-effect-free worker** may be worth running during foreground ChatGPT processing.

It does not use a predictor LLM. It does not alter the primary model's reasoning. It does not automatically hook into ChatGPT built-in Web, Drive, GitHub, or other tools.

Global default remains **0 workers**.

## Supported / promising use cases

Use only when all of the following are true:

- Normal already has a required foreground model/tool/connector step.
- A likely next action is deterministic local work over data/code already available locally.
- The work is read-only / side-effect-free.
- Doing it before the foreground authority/evidence resolves cannot bias or invalidate the later decision.
- The result has a high conservative probability of being consumed.
- It can be piggyback-dispatched without adding a separate model-triggered tool transition.
- Conservative expected value remains positive after miss waste and contention.

Good candidate examples:

- repository-wide AST / symbol / reference index while reading a remote issue, PR, or spec;
- dependency / impact map while waiting on required authoritative tool results;
- deterministic log clustering / trace indexing during remote/model/tool wait;
- test-selection preparation during non-CPU-heavy foreground work;
- hash / dedup / cache / local validation over already-present artifacts.

## Explicit limitations / do-not-use cases

Do not treat this as a general ChatGPT accelerator.

- **No worker-owned external Web/Drive/API prefetch.** Direct worker Internet egress is not available in the tested runtime.
- **No automatic interception of ChatGPT built-in tools.** The package is an activation-policy reference implementation, not a transparent ChatGPT plugin.
- **No speculative code edits, patches, writes, sends, deletes, or irreversible actions.** Side-effectful speculation is blocked.
- **No authority-dependent speculative decisions before the relevant evidence resolves.** A real Xarray case showed a plausible patch that was later rejected by maintainers as changing intentional behavior.
- **No standalone Shadow dispatch by default.** An extra model/tool transition can dominate local dispatch savings.
- **No short local parsing speculation.** Prior fair tests showed losses at millisecond-scale parser workloads.
- **CPU-heavy foreground is penalized.** A real debugging probe measured about 14.5% foreground test slowdown from contention even when the combined phase still finished sooner.
- **One worker maximum in this frozen policy.** There is not enough evidence to promote routine 2–3 worker use.
- **No universal speedup claim.** Observed positive results are workload- and runtime-specific and include tool/model/connector variance.
- **Not production-ready and not default-on.** Full autonomous patch-reasoning quality parity has not been established across held-out tasks.

## Quality gate

A latency win counts only when:

1. quality >= Normal,
2. Hard Failure = 0,
3. required evidence / authority semantics are unchanged,
4. natural tool-call topology is preserved,
5. lifecycle / miss / contention costs are included.

## Working EV gate

```text
hideable_ms = min(worker_completion_ms, hideable_foreground_ms)

gross_gain_ms = p_lower * hideable_ms

expected_gain_ms = gross_gain_ms
  - dispatch_orchestration_ms
  - miss_waste_ms
  - contention_penalty_ms
```

The policy also requires task determinism, side-effect freedom, authority safety, likely consumption, piggyback topology, minimum hideable window, and stronger thresholds under CPU pressure.

## Install

Windows PowerShell installer:

`installers/ShadowCarrier-ChatGPT-RuntimePolicy-v0.1.1.ps1`

Default destination:

`%LOCALAPPDATA%\ShadowCarrier\chatgpt-runtime-policy-v0.1.1`

The installer is self-contained: after downloading the installer itself, it does not need GitHub/network access to write the policy package. If Node.js 20+ is available it also runs the included self-test.

## Validation

Frozen package self-test: **9/9 passed** on 2026-08-30.

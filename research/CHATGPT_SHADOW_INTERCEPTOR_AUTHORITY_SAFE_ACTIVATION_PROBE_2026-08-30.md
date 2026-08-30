# ChatGPT Shadow Interceptor — Authority-Safe Activation Probe — 2026-08-30

Status: **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**

This probe follows the coding/debugging overlap experiments and tests a quality failure mode: a locally plausible patch can be invalidated by authoritative project intent.

## Policy patch

Added a deterministic runtime policy prototype under:

`implementations/chatgpt-runtime-policy-v0.1/`

Current default gates:

- global default 0 workers;
- at most 1 worker;
- piggyback preferred;
- standalone extra model/tool dispatch blocked by default;
- worker-owned external I/O blocked;
- short local parsing blocked by minimum hideable-window threshold;
- CPU-heavy foreground work requires a much stronger conservative EV margin;
- speculative work must be side-effect-free;
- speculative work must be safe before unresolved source/authority/freshness evidence is resolved.

The last two gates were added after the held-out quality trap below.

Unit tests: **8 passed / 0 failed**.

## Held-out public task: pydata/xarray #11417

Environment:

- installed xarray: `2026.4.0`;
- issue reproduction succeeds: `Dataset.sum('index')` with a scalar string data variable raises the reported `TypeError`;
- local source makes a one-line `Dataset.reduce()` change look plausible.

A public PR (#11442) proposed exactly that one-line change and added regression tests.

However, the PR was **closed unmerged**. A maintainer explicitly stated the behavior was intentional: xarray applies operations to data variables without filtering by dtype, and suggested making the string variable a coordinate (or dropping it) when it should be skipped.

This is a high-value quality trap: source-local reasoning alone points toward a plausible patch, while authoritative project intent says not to patch.

## Correct Shadow behavior

Allowed speculative support work:

- repository-wide AST/reference index;
- symbol and test-location ranking;
- other read-only deterministic support work whose validity does not depend on the unresolved maintainer decision.

Blocked speculative work:

- applying the plausible one-line code patch before the authority check;
- any side-effectful mutation whose correctness depends on unresolved issue/PR intent.

For the xarray task, the patched policy therefore returns:

- repo index: **ON, 1 worker**;
- speculative code mutation: **OFF, 0 workers**.

## Natural matched topology test

Both Normal and Shadow used the same three-stage shape:

1. local reproduction + code inspection;
2. required GitHub authority read;
3. repository-wide deterministic index + final validation.

Shadow only changed stage 1 by piggyback-starting the read-only index, then collected it after the same GitHub authority read.

Quality outcome for all recorded runs:

- current intentional behavior preserved;
- no xarray patch applied;
- maintainer-recommended coordinate workaround verified;
- Hard Failure = 0;
- worker cleanup passed; no orphan remained.

### Same-endpoint matched pair A — PR #11442

Shadow ran first, so any cache-order advantage favored the later Normal run.

- Shadow: **12.760 s**
- Normal: **14.771 s**
- apparent pair direction: Shadow about **13.6% shorter**

### Same-endpoint matched pair B — issue #11417 comments

Normal ran first, so cache/order effects may favor the later Shadow run.

- Normal: **22.736 s**
- Shadow: **10.763 s**
- apparent pair direction: Shadow about **52.7% shorter**

The second pair is strongly confounded by connector/cache/model/tool variance and must not be used as a speed claim. Even the first pair is a single matched observation.

## Main learning

The important result is not the apparent latency magnitude.

The main learning is:

> Shadow can safely overlap read-only repository support work while authoritative remote evidence is pending, but it must not pre-commit to a patch or mutation that the authority result can invalidate.

This adds a new compatibility gate to the EV policy:

```text
activate only if
  deterministic
  AND side_effect_free
  AND authority_safe_before_resolution
  AND worker_external_io_not_required
  AND topology/cost/EV gates pass
```

This is necessary for quality parity, not merely latency optimization.

## Current state

Still:

**INCOMPLETE / EXPERIMENTAL / DEFAULT OFF / 0 workers globally**

No overall coding-speed claim is supported yet. Continue held-out natural tasks and prioritize tasks where a read-only support result can be consumed after an authoritative remote/tool wait without changing source/authority semantics.

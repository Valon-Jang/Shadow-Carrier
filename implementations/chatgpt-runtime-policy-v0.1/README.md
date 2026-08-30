# ChatGPT Runtime Activation Policy v0.1

Status: **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**

This is a deterministic activation-policy prototype for the ChatGPT runtime experiments. It is **not** a new MCP server and does not perform external speculative I/O.

The policy decides only whether one local deterministic worker is worth starting during foreground ChatGPT processing.

## Default behavior

- 0 workers globally.
- At most 1 worker when the gate opens.
- Worker-owned external Web/Drive/API I/O remains blocked.
- Standalone extra model/tool dispatch remains blocked by default.
- Piggyback dispatch is the preferred topology.
- Short local parsing stays off.
- CPU-heavy foreground work requires a much stronger conservative margin because contention is measurable.

## Gate

```text
hideable_ms = min(worker_completion_ms, hideable_foreground_ms)

gross_gain_ms = p_lower * hideable_ms

expected_gain_ms = gross_gain_ms
  - dispatch_orchestration_ms
  - miss_waste_ms
  - contention_penalty_ms
```

The gate then applies task compatibility, conservative probability, minimum hideable-window, minimum absolute-gain, and minimum gain-ratio thresholds.

## Why this exists

Live 2026-08-30 experiments found two materially different surfaces:

1. remote/model/tool foreground wait with idle local CPU: strong candidate for one piggyback worker;
2. local CPU-heavy foreground tests/builds: measurable contention, so activation must require a larger margin or remain off.

The thresholds are provisional training defaults, not validated universal constants. They must be recalibrated from held-out natural traces.

## Run tests

```bash
node --test test/activation-policy.test.mjs
```

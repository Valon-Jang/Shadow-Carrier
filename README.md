# Shadow Carrier

> **Hit -> faster. Miss -> Normal fallback. Never trade answer quality for speculative speed.**

Shadow Carrier is an experimental optimization project for moving predictable machine work off an AI workflow's critical path while keeping the primary model's reasoning authoritative.

The project is currently **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**.

The ChatGPT-specific research track was frozen on **2026-08-30** at runtime policy **v0.1.1-experimental**. The global default remains **0 workers**.

Shadow Carrier is an independent research project. It is not a component or sub-project of Root Engineering.

## Origin — from Burst Fleet to Shadow Carrier

Shadow Carrier started from a much more aggressive idea called **Burst Fleet**.

The original concept was to let one AI rapidly split into multiple workers when useful, then merge them back down through a prepared execution path such as `N -> N/2 -> ... -> 1`. A prototype was built, but the result was much easier to verify as a way to burn tokens than as a reliable speedup. Image-editing work looked somewhat faster in practice; for the broader idea, there was no trustworthy benchmark proving that it was genuinely faster, and the quality of that early implementation was not established well enough to make a strong claim.

Later experiments showed that the AI-side workspace could be used almost like a small text-based execution layer for scripts and tools. That was interesting, but much of the useful behavior turned out not to be fundamentally different from giving the AI better reusable coding Skills. Those pieces therefore evolved toward Skills rather than a separate fleet architecture.

One pattern did survive:

> **Start predictable work early, let the main AI continue useful foreground work, then collect the result only when it is needed.**

If the AI launches a worker and simply waits for it, most of the efficiency advantage disappears. The useful case is overlap: the main AI keeps reasoning or using other tools while a small amount of deterministic work proceeds in the background.

That is where **Shadow** came from. The Carrier remains the authoritative AI in the foreground; the shadow layer prepares limited work behind it and returns evidence later.

In short:

> **Burst Fleet tried to make more AIs. Shadow Carrier learned that one strong AI with well-timed background work was usually the better idea.**

## Prior art and positioning

Shadow Carrier does **not** claim to have invented speculative tool execution.

The closest known public prior implementation identified so far is [ToolAhead](https://github.com/michael-ra/toolahead). ToolAhead already demonstrates recurring tool-sequence learning and speculative execution in this problem family. Shadow Carrier should therefore be judged only on additional measurable value such as better activation policy, stronger quality/authority gates, broader workload coverage, or transferable validated patterns.

## Current ChatGPT finding

The tested ChatGPT runtime supports a narrow but real overlap surface:

> A detached deterministic local process can make progress while ChatGPT continues required model/tool/connector processing.

What is **not** available in the tested runtime is equally important:

> The local worker cannot independently own hidden Web/Drive/API speculative prefetch, and this package does not transparently intercept ChatGPT built-in tools.

The strongest current candidate is therefore:

**one local deterministic, read-only, authority-safe support worker, piggyback-dispatched during an already-required foreground ChatGPT step.**

## When it may be useful

Good candidates include:

- repository-wide AST / symbol / reference indexing while ChatGPT reads a remote issue, PR, or spec;
- dependency / impact mapping during required remote/model/tool wait;
- deterministic stack-trace or log clustering;
- relevant-test selection when foreground CPU pressure is low;
- hash / dedup / index / cache preparation over already-present local artifacts;
- long deterministic local validation that is very likely to be consumed next.

The intended use is **support analysis**, not speculative decisions or speculative edits.

## When it must stay off

Do not treat the current build as a general ChatGPT accelerator.

- **No worker-owned external Web/Drive/API prefetch.**
- **No automatic interception of built-in ChatGPT tools.**
- **No speculative code edits, writes, sends, deletes, or irreversible actions.**
- **No authority-dependent decision before the relevant evidence resolves.**
- **Standalone extra Shadow dispatch is blocked by default.**
- **Short local parsing speculation remains DON'T USE.**
- **CPU-heavy foreground work is strongly penalized because contention is measurable.**
- **Current frozen policy allows at most one worker.**
- **No universal speedup percentage is validated.**
- **Autonomous AI patch-reasoning quality parity across held-out tasks is not yet established.**

See [ChatGPT Shadow Interceptor — Use Cases and Limits](./docs/CHATGPT_SHADOW_INTERCEPTOR_USE_CASES_AND_LIMITS.md) for the explicit boundary.

## Quality contract

Latency or token savings do not count as a win unless:

1. quality >= Normal,
2. Hard Failure = 0,
3. evidence / authority / freshness semantics are unchanged,
4. the natural Normal tool-call topology is preserved,
5. dispatch, lifecycle, miss waste, contention, and cleanup are included.

Normal must receive the same parser/code/cache/data-access capability as Shadow. Shadow-specific value must come only from prediction, pre-execution, routing, caching, or learned activation layered on top of equal capabilities.

## Frozen activation policy v0.1.1-experimental

The current policy uses a deterministic gate; it does not call a predictor LLM.

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
- stronger thresholds under CPU pressure.

Implementation: [ChatGPT Runtime Policy v0.1.1](./implementations/chatgpt-runtime-policy-v0.1.1/)

## Installable frozen package

A self-contained Windows PowerShell installer is published here:

[ShadowCarrier-ChatGPT-RuntimePolicy-v0.1.1.ps1](./installers/ShadowCarrier-ChatGPT-RuntimePolicy-v0.1.1.ps1)

SHA-256:

`c8f61b7145df5a9197cd96ad79215a2ca3b807a41e4670b63ddd2c513b100323`

Default install directory:

`%LOCALAPPDATA%\ShadowCarrier\chatgpt-runtime-policy-v0.1.1`

The installer embeds the frozen policy, tests, documentation, and manifest. After the installer itself is downloaded, installation does not require GitHub/network access. If Node.js 20+ is available, it runs the included policy self-test.

**Important:** installing this package does **not** automatically connect it to ChatGPT or intercept built-in tools. It installs the deterministic policy artifact for integration/testing on a compatible execution surface.

Frozen package self-test before publication: **9/9 passed**.

## What the experiments actually showed

Both negative and positive results are retained.

### Negative baseline

A fair naive local parsing retest gave:

- Normal mean ~1.108 s;
- Shadow mean ~1.162 s;
- Shadow direction ~4.9% slower;
- held-out next-action prediction 77.2% (61/79);
- no model-visible output/context advantage under equal parser capability;
- additional millisecond-scale parser crossover tests also remained negative.

Conclusion: short/local parsing speculation is not useful in the current design.

### Real overlap and persistent worker substrate

- detached local worker overlap with ChatGPT processing: verified;
- fresh tiny Python child completion median: ~682 ms;
- warm blocking FIFO submit median: ~3.4 ms;
- blocking FIFO idle CPU: 0.0% at measurement resolution;
- polling worker rejected due avoidable idle CPU use.

### Coding/debugging probes

Observed workload-specific phase results included:

- debugging-support phase: mean direction ~17.0% shorter, while the foreground test itself slowed ~14.5% from contention;
- remote/model/tool-wait coding exploration: observed phase direction ~36.5% shorter across three pairs;
- controlled hard multi-file Xarray workflow with identical patch procedure: mean direction ~21.7% shorter across two pairs with equal final patch/test quality;
- authority-safe held-out Xarray probe: one counterbalanced pair observed ~13.6% shorter with the same correct no-patch conclusion.

These are **research observations, not general ChatGPT coding speed claims**. Runtime, workload, connector latency, cache state, ordering, and worker size all affect the result.

## Authority-safety lesson

A real Xarray case exposed an important quality failure mode: a technically plausible one-line patch existed, but maintainers explicitly rejected that behavioral change as contrary to intended semantics.

That finding changed the policy. Shadow may prepare neutral local analysis early, but it must not pre-commit a patch or authority-dependent decision before the relevant evidence resolves.

## Invalidated claims

Earlier figures of approximately **29.2% latency reduction** and **99.5% model-visible input reduction** are invalid as Shadow Carrier performance evidence. The first used simulated overlap; the second denied Normal an equivalent parser capability.

Do not reuse those figures as benchmark claims.

## Repository map

- [ChatGPT Runtime Policy v0.1.1](./implementations/chatgpt-runtime-policy-v0.1.1/) — current frozen deterministic activation policy.
- [Windows installer](./installers/ShadowCarrier-ChatGPT-RuntimePolicy-v0.1.1.ps1) — self-contained install artifact.
- [Use Cases and Limits](./docs/CHATGPT_SHADOW_INTERCEPTOR_USE_CASES_AND_LIMITS.md) — explicit supported and blocked conditions.
- [Research Freeze — 2026-08-30](./research/CHATGPT_SHADOW_INTERCEPTOR_RESEARCH_FREEZE_2026-08-30.md) — complete current checkpoint.
- [ChatGPT Shadow Interceptor Checkpoint](./research/CHATGPT_SHADOW_INTERCEPTOR_CHECKPOINT_2026-08-30.md) — detailed experimental history before freeze.
- [ChatGPT MCP v0.1](./implementations/chatgpt-mcp-v0.1/) — older remote-MCP prototype; useful history, not the current ChatGPT runtime policy.
- [Operating Protocol](./docs/SHADOW_CARRIER_OPERATING_PROTOCOL.md) — broader project protocol; ChatGPT-specific conflicting legacy guidance is superseded by the newer runtime policy documents.
- [Research Log](./research/SHADOW_CARRIER_RESEARCH_LOG.md) — broader research history.

## Current status

Research is paused at the frozen checkpoint.

Until repeated held-out autonomous end-to-end solves demonstrate quality >= Normal, Hard Failure=0, authority fidelity, and positive net wall-clock value under these same safety rules:

**INCOMPLETE / EXPERIMENTAL / DEFAULT OFF / 0 workers globally**

The objective remains: **preserve the reasoning quality of the strong AI and move only validated, predictable machine work off the critical path.**

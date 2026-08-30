# Shadow Carrier Research Log

Status: Active experimental research  
Repository: `Valon-Jang/Shadow-Carrier`

This file is the living research record for Carrier / Interceptor / Shadow Carrier experiments.

Unverified ideas stay here. Reproduced findings may later be promoted into the public methodology, reference implementation, or benchmark package.

## Research objective

Determine whether a lightweight Interceptor layer can outperform a strong Normal adaptive AI workflow without reducing answer quality.

Current hypothesis:

> Keep Normal reasoning authoritative. Use deterministic Interceptors to pre-execute likely next read-only actions, keep unused results outside model context, and commit only semantically compatible cache hits.

The goal is **not** to reproduce five LLM subagents. The goal is to hide tool/retrieval latency and progressively compile repeated successful reasoning paths into cheaper deterministic execution.

Operational specification: [Shadow Carrier Operating Protocol](../docs/SHADOW_CARRIER_OPERATING_PROTOCOL.md)

## Evaluation contract

Quality is evaluated separately on:

1. Factual Accuracy
2. Critical Coverage / Recall
3. Evidence Precision / Relevance
4. Scope Fidelity
5. Provenance / Authority Fidelity
6. Conflict Handling
7. Reasoning / Decision Quality
8. Information Efficiency

A Hard Failure overrides an attractive average score when there is a decision-changing omission, material hallucination, scope propagation error, provenance/authority error, code regression, or safety/permission violation.

Working success gate:

- quality >= Normal,
- Hard Failure = 0,
- then either end-to-end latency improves >=20% or model-visible input drops >=30%,
- Strong Win if both occur.

## Findings to date

### 1. Carrier parallelism is not intrinsically valuable

A fair ~880K-word structured benchmark allowed Normal to use one realistic deterministic parser over the same corpus. Normal and Carrier produced the same ~541-estimated-token output with identical state and ranking, but Normal was faster:

- Normal: ~9.03 ms
- Carrier: ~27.36 ms
- quality: both 100% on measured deterministic dimensions
- Hard Failure: 0

Interpretation: when one cheap deterministic pass solves the task, Carrier orchestration is a **DON'T-USE** condition.

### 2. Heterogeneous parsing can benefit from Carrier parallelism

A fresh ~882,941-word heterogeneous corpus used equivalent source-specific parsers. Carrier ran those parsers in parallel while Normal used the same parsers sequentially.

Valid rerun:

- Carrier: ~22.52 ms
- Normal: ~85.84 ms
- final model-visible payload: byte-identical, 25,841 bytes (~6,461 estimated tokens)
- Top-5 and eligibility state: identical
- quality: 100% on all measured deterministic dimensions
- Hard Failure: 0

Interpretation: this demonstrated a machine-runtime latency benefit, not a token benefit.

### 3. Conservative natural-language compression can preserve structured meaning

A persistent five-worker Safe Compressor was tested on synthetic natural-language decision evidence.

One validation run:

- Normal visible payload: 318,769 UTF-8 bytes (~79,693 estimated tokens)
- Carrier visible payload: 159,637 bytes (~39,910 estimated tokens)
- total reduction: ~49.9%
- sentence-text reduction alone: ~24.7%
- remaining reduction came mainly from compact provenance handles
- downstream reconstruction: 960 decision-bearing atoms preserved exactly
- same 63 eligible candidates and same Top-5 ranking
- Hard Failure: 0 in deterministic reconstruction

Boundary: this is not an isolated final-LLM answer-quality A/B.

### 4. Web acquisition originally hit the model before Interceptors

A web-heavy benchmark exposed an architectural boundary: Native Web/Search results became model-visible before local OS-level Interceptors could process them. Local child processes also lacked direct internet egress.

Therefore local Carrier compression could not reduce first-pass web acquisition tokens.

### 5. Self-built web upstream bypassed that boundary

A self-owned GitHub Actions upstream was implemented without using an existing web-collection plugin.

Architecture:

```text
request
  -> internet-capable external runner
  -> five search/fetch workers
  -> machine-only raw pages
  -> reducer / compressor
  -> compact result
  -> Carrier
```

This proved that raw web page bodies can be acquired and processed outside model context.

### 6. Aggressive web reduction was the wrong target

Early web smoke runs reduced raw page text by roughly 92–96%, but this was later rejected as inconsistent with the intended design. It behaved more like evidence summarization/selection than conservative wording cleanup.

The compression rule was corrected:

- maximum 30% text reduction,
- minimum 70% retention,
- no forced quota,
- no Top-N semantic thinning,
- no aggressive summarization,
- preserve decision-bearing semantics.

A filler-heavy synthetic guard test stopped at ~29.97% reduction.

### 7. Clean technical documentation often contains almost no removable filler

The exact prior 20-query web workload was rerun under the conservative policy.

Successful run:

- queries: 20
- search hits: 56
- unique URLs: 47
- pages fetched successfully: 45
- failed pages: 2
- five-worker collect/compress time: ~18.279 s
- visible body: 682,180 chars
- after conservative compression: 680,492 chars
- retention: 99.75%
- reduction: only 0.25%

Interpretation: high-quality technical documents are already concise. A safe system should not force 30% compression.

### 8. Retrieval quality, not compression, became the web bottleneck

The conservative rerun preserved almost all fetched text, yet quality still failed because discovery often fetched the wrong material.

Observed examples included:

- Codex queries falling back to generic OpenAI/ChatGPT/Wikipedia pages instead of the needed CLI documentation,
- Copilot queries returning generic GitHub or third-party pages,
- Cursor queries missing required CLI/sandbox/MCP evidence,
- Cline searches sometimes mixing unrelated pages.

The important separation is:

> Retrieval decides **what evidence enters the candidate pool**. Compression only cleans wording inside evidence already selected.

Keeping 99% of the wrong pages does not recover missing evidence.

### 9. Normal's adaptive search loop is the capability to preserve

The Normal workflow behaved approximately as:

```text
search
-> inspect
-> identify missing evidence
-> narrow or redirect search
-> inspect
-> stop when sufficient
```

The naive Interceptor path behaved more like:

```text
pre-generated queries
-> parallel search
-> fetch many similar results
-> clean text
-> send result set
```

This explains why a faster parallel retrieval path could still lose on research quality.

### 10. Recreating full LLM subagents would likely destroy the efficiency target

Giving five Interceptors independent LLM reasoning, large context, search, and reporting would recreate much of the cost of multi-agent research.

The preferred design is therefore not `five mini agents`.

### 11. Current preferred architecture: Shadow Carrier

Shadow Carrier keeps Normal reasoning unchanged and treats Interceptors as speculative read-only execution workers.

```text
Carrier performs current step
        |
        + predicts likely next read-only actions
        |
        v
Interceptors pre-execute likely next actions
        |
        v
hidden cache
        |
actual next action selected by Carrier
        |
   hit -> use cache
   miss -> Normal fallback
```

This creates an asymmetric target:

> Hit -> faster.  
> Miss -> Normal fallback.  
> Never trade quality for speculative speed.

### 12. Proficiency must be learned before heavy automation

Current training direction:

`Observe Normal -> Assisted Shadow -> Dynamic Shadow -> Compiled Workflow`

Shadow should learn not only from Shadow-enabled tasks but also from ordinary Normal tool trajectories. The actual next Normal action becomes the training label.

Historical traces can then be replayed counterfactually to estimate:

- hit@1 / hit@3 / hit@5,
- whether 1, 2, 3, or 5 workers would have been optimal,
- speculative waste,
- expected latency savings,
- useful and dead-end source families.

This allows one real workflow to train several hypothetical dispatch policies without repeating external calls.

## Current proficiency metrics

Track at minimum:

- hit@1
- hit@3
- hit@5
- MRR
- commit rate
- waste rate
- compatibility reject rate
- Normal tool latency
- prefetch latency
- cache-return latency
- end-to-end latency
- speculative requests/bytes/cost
- model-visible input
- quality dimensions
- Hard Failure

Initial workload promotion target:

- quality >= Normal
- Hard Failure = 0
- hit@3 >=70%
- positive net latency value after speculative cost
- E2E improvement >=20% or model-visible input reduction >=30%

These thresholds are experimental and should be recalibrated from real traces.

## Current priority

Do **not** invest first in autonomous retrieval agents.

Priority order:

1. use Shadow Carrier on real multi-step read/search work,
2. collect compact Normal + Shadow action traces,
3. improve next-action prediction,
4. learn source preferences and dead ends,
5. tune dynamic worker count through counterfactual replay,
6. verify quality parity,
7. compile repeated stable trajectories into deterministic Skills/meta-tools.

## Open questions

- What hit@3 is required for a reliable real E2E speed win?
- How much speculative traffic can be tolerated before rate limits erase the benefit?
- Which task classes have stable enough next-action distributions to justify Shadow by default?
- How should semantic cache compatibility be represented compactly?
- How much token reduction comes from avoiding unused retrieval versus wording compression?
- At what repetition count should a successful trajectory be promoted to a compiled meta-tool?
- How portable are learned action transitions across models and tool surfaces?

## Research update policy

Update this file when an experiment materially changes one of:

- architecture,
- measured performance,
- quality outcome,
- failure mode,
- operating policy,
- promotion/demotion decision,
- unresolved research question.

Do not turn every conversation into a commit. Prefer concise checkpoints containing measured results, corrections, and reusable conclusions.

## Current status

**Shadow Carrier is promising but not yet proven to outperform Normal as a general workflow.**

The strongest current rationale is narrower:

- Normal already has strong adaptive reasoning,
- deterministic Interceptors can prepare likely slow reads without taking over judgment,
- unused speculative work can remain outside model context,
- repeated successful trajectories may eventually replace repeated LLM planning with machine execution.

The next evidence should come from measured real-task Shadow traces rather than additional architecture speculation.

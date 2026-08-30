# Shadow Carrier

> **Hit -> faster. Miss -> Normal fallback. Never trade answer quality for speculative speed.**

Shadow Carrier is an experimental speculative-prefetch architecture and an open optimization track for AI workflows.

It keeps the primary AI reasoning loop authoritative while deterministic Interceptors prepare likely next **read-only** actions in advance. Unused speculative results remain outside model context. A compatible cache hit can hide tool, retrieval, or search latency; a miss falls back to the normal workflow.

The intended efficiency contract is **zero incremental model-token speculation**: prediction and speculative acquisition should use machine work, stored trajectories, deterministic rules, or other non-LLM mechanisms whenever possible. Evidence that is never selected should never consume model-visible context tokens.

Shadow Carrier is an **independent research project**. It is not a component or sub-project of Root Engineering.

## Prior art and positioning

Shadow Carrier does **not** claim to have invented speculative tool execution.

The closest known prior implementation identified so far is [ToolAhead](https://github.com/michael-ra/toolahead), which was already public before this repository. ToolAhead learns recurring tool sequences, pre-runs safe calls while an AI agent is still reasoning, reuses prepared results only when the eventual call and workspace are compatible, and otherwise falls back to normal execution. Its transition memory is persisted locally and does not require a separate predictor LLM for its core Markov-style prediction path.

That overlap is important and is intentionally documented here rather than hidden.

Shadow Carrier should therefore be evaluated as a **continuing engineering and optimization effort in the same problem family**, not as a claim of first invention.

The purpose of this repository is to push the design further where measured evidence supports it, especially around:

- zero-incremental-model-token speculative acquisition,
- model-invisible storage of unused speculative evidence,
- broader read/search/research workloads beyond a single tool surface,
- source/authority/freshness-aware cache compatibility,
- learning from ordinary Normal trajectories as ground-truth action labels,
- counterfactual replay for dispatch-policy tuning,
- portable task-class proficiency profiles when learning can be generalized safely,
- compiling repeatedly validated trajectories into deterministic Skills or meta-tools,
- transparent benchmarks against Normal workflows and relevant prior implementations.

If another implementation already performs a capability better, Shadow Carrier should learn from it, cite it, and compete through measurable improvements rather than terminology.

## This repository is a living optimization channel

This repository is both a working research lab and a public distribution point.

The maintainer can use it to continuously train, test, benchmark, and refine Shadow policies. Other users should be able to take the latest validated version instead of independently rediscovering every optimization from scratch.

The intended development loop is:

```text
Real Normal + Shadow traces
        ↓
Candidate optimization
        ↓
Counterfactual replay / benchmark
        ↓
Quality and safety gate
        ↓
Promote reusable improvement
        ↓
Release updated protocol / implementation / proficiency profile
        ↓
Users start from a better baseline
```

A future user should not have to begin at proficiency level P0 when a generic, privacy-safe, benchmarked action pattern can be transferred. Project-specific paths, secrets, commands, and sensitive context must be removed before any shared proficiency artifact is published.

This creates two forms of learning:

1. **Local learning** — each workspace adapts to its own recurring trajectories.
2. **Shared learning** — reusable patterns that survive cross-project validation can be published as improved defaults or portable proficiency profiles.

Shared learning is a roadmap goal, not a claim that a mature pretrained pack already exists today.

## Core idea

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

The goal is not to replace a capable AI with many smaller agents. The goal is to preserve adaptive reasoning while moving predictable machine work off the critical path.

## Design principles

1. **Normal reasoning remains authoritative.** Speculation never decides what the Carrier must do next.
2. **Speculative work is read-only.** Mutating or irreversible actions are never prefetched.
3. **Unused results stay outside model context.** Prefetching should not inflate the reasoning context merely because work was performed.
4. **Prefer zero incremental model tokens for speculation.** Do not recreate a swarm of predictor LLMs unless a benchmark proves the extra model cost is justified.
5. **Compatibility is checked before reuse.** Target, scope, parameters, authority, freshness, and time cutoff must still match.
6. **Misses fall back to Normal.** A prediction error may waste machine work, but should not reduce answer quality.
7. **Quality is the hard gate.** Latency or token savings do not count as a win if reasoning quality regresses.
8. **Prior art stays visible.** Improvements should cite the systems and ideas they build on.

## Current research direction

The current preferred architecture is a **Shadow Scheduler + deterministic Interceptors + hidden cache** rather than a multi-LLM swarm.

The system learns from ordinary Normal tool trajectories as well as Shadow-enabled runs:

```text
Observe Normal
    -> Assisted Shadow
    -> Dynamic Shadow
    -> Compiled Workflow
```

Repeated successful trajectories may eventually be compiled into deterministic Skills or meta-tools, leaving the Carrier to handle novelty, conflict, and exceptions.

As proficiency increases, more predictable work should move from model-time reasoning and waiting into model-invisible machine execution. The target is not to make the model think more; it is to make the surrounding execution layer better at preparing what the model is likely to need next.

## Planned public deliverables

As the project matures, the repository should move beyond research notes toward reusable artifacts such as:

- a reference implementation,
- install / integration adapters for supported AI tool surfaces,
- import / export of local proficiency state,
- privacy-safe task-class proficiency profiles,
- benchmarked default routing and dispatch policies,
- compatibility and freshness policies,
- reproducible benchmark suites,
- versioned releases and changelogs,
- migration guidance when a newer policy clearly outperforms an older one.

No profile should be promoted merely because it has seen more data. It must demonstrate portability and preserve quality on held-out workloads.

## Reference implementations

- [ChatGPT MCP v0.1](./implementations/chatgpt-mcp-v0.1/) — read-only remote-MCP prototype with deterministic worker-thread Interceptors, hidden RAM cache, persisted transition learning, TTL compatibility, and SSRF protection. The speculative workers use no additional LLM calls.

## What early experiments found

So far, experiments have produced both positive and negative results:

- Parallelism is not automatically useful. A single cheap deterministic pass can beat Carrier orchestration.
- Heterogeneous parsing can benefit from parallel execution when equivalent source-specific parsers run concurrently.
- Conservative natural-language compression can reduce model-visible input in some synthetic structured workloads without losing decision-bearing atoms.
- High-quality technical documentation often contains very little safe filler to remove.
- Retrieval quality matters more than compression when the wrong evidence enters the candidate pool.
- Recreating full LLM subagents would likely erase much of the intended efficiency gain.

These findings are experimental, not proof that Shadow Carrier improves general AI workflows.

## Evaluation contract

Quality is tracked separately from speed and cost.

Core quality dimensions:

- Factual Accuracy
- Critical Coverage / Recall
- Evidence Precision / Relevance
- Scope Fidelity
- Provenance / Authority Fidelity
- Conflict Handling
- Reasoning / Decision Quality
- Information Efficiency

A material hallucination, decision-changing omission, scope propagation error, provenance error, code regression, or safety/permission violation is treated as a **Hard Failure**.

Initial promotion target for a workload:

- quality >= Normal
- Hard Failure = 0
- hit@3 >= 70%
- positive net latency value after speculative cost
- end-to-end latency improves >= 20% **or** model-visible input drops >= 30%

These thresholds are provisional and should be recalibrated from real traces.

Improvements intended for public release should eventually be compared not only against Normal but also against relevant prior implementations where a fair, reproducible comparison is possible.

## Repository structure

```text
Shadow-Carrier/
├── README.md
├── docs/
│   └── SHADOW_CARRIER_OPERATING_PROTOCOL.md
├── implementations/
│   └── chatgpt-mcp-v0.1/
└── research/
    └── SHADOW_CARRIER_RESEARCH_LOG.md
```

- [Operating Protocol](./docs/SHADOW_CARRIER_OPERATING_PROTOCOL.md) — current architecture, safety rules, dispatch policy, cache compatibility, training curriculum, metrics, and promotion gates.
- [ChatGPT MCP v0.1](./implementations/chatgpt-mcp-v0.1/) — first ChatGPT-specific implementation prototype.
- [Research Log](./research/SHADOW_CARRIER_RESEARCH_LOG.md) — experimental history, benchmark observations, corrections, current hypotheses, and open questions.

## Current status

**Experimental.** Shadow Carrier is currently a research architecture and optimization track, not a finished framework or production-ready agent system.

The closest known prior implementation, ToolAhead, already demonstrates that this general speculative-tool-execution family can be implemented and installed. Shadow Carrier's job is therefore to produce **measurable additional value** through better policies, broader workload coverage, transferable proficiency, stronger evidence handling, or other validated improvements.

The next useful evidence should come from measured real multi-step tool traces rather than additional architecture speculation.

## Research priority

1. collect compact Normal + Shadow action traces,
2. improve next-action prediction without adding speculative LLM-token cost,
3. learn useful source families and dead ends,
4. tune dynamic worker count through counterfactual replay,
5. determine which learned patterns transfer safely across projects,
6. define import/export formats for proficiency state,
7. verify quality parity,
8. benchmark against Normal and relevant prior implementations,
9. measure true end-to-end latency and context effects,
10. compile only repeatedly validated trajectories,
11. publish improved defaults/profiles only after cross-project validation.

---

The objective is simple: **keep the reasoning quality of a strong AI, continuously improve the machine layer around it, and let future users start from the best validated baseline available.**

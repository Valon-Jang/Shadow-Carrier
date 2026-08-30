# Shadow Carrier

> **Hit -> faster. Miss -> Normal fallback. Never trade answer quality for speculative speed.**

Shadow Carrier is an experimental speculative-prefetch architecture for AI workflows.

It keeps the primary AI reasoning loop authoritative while deterministic Interceptors prepare likely next **read-only** actions in advance. Unused speculative results remain outside model context. A compatible cache hit can hide tool, retrieval, or search latency; a miss falls back to the normal workflow.

Shadow Carrier is an **independent research project**. It is not a component or sub-project of Root Engineering.

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
4. **Compatibility is checked before reuse.** Target, scope, parameters, authority, freshness, and time cutoff must still match.
5. **Misses fall back to Normal.** A prediction error may waste machine work, but should not reduce answer quality.
6. **Quality is the hard gate.** Latency or token savings do not count as a win if reasoning quality regresses.

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

## Repository structure

```text
Shadow-Carrier/
├── README.md
├── docs/
│   └── SHADOW_CARRIER_OPERATING_PROTOCOL.md
└── research/
    └── SHADOW_CARRIER_RESEARCH_LOG.md
```

- [Operating Protocol](./docs/SHADOW_CARRIER_OPERATING_PROTOCOL.md) — current architecture, safety rules, dispatch policy, cache compatibility, training curriculum, metrics, and promotion gates.
- [Research Log](./research/SHADOW_CARRIER_RESEARCH_LOG.md) — experimental history, benchmark observations, corrections, current hypotheses, and open questions.

## Current status

**Experimental.** Shadow Carrier is promising as a narrow latency-hiding and context-safe speculative execution layer, but it has not yet been demonstrated to outperform a strong Normal adaptive workflow across general workloads.

The next useful evidence should come from measured real multi-step tool traces rather than additional architecture speculation.

## Research priority

1. collect compact Normal + Shadow action traces,
2. improve next-action prediction,
3. learn useful source families and dead ends,
4. tune dynamic worker count through counterfactual replay,
5. verify quality parity,
6. measure true end-to-end latency and context effects,
7. compile only repeatedly validated trajectories.

---

Shadow Carrier is currently a research architecture, not a finished framework or production-ready agent system.

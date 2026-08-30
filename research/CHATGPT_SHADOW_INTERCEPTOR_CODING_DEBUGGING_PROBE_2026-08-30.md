# ChatGPT Shadow Interceptor — Coding / Debugging Probe — 2026-08-30

Status: **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**

This note records live experiments using real public coding/debugging examples. It does **not** promote Shadow Carrier to default-on and does not claim an overall coding speedup.

## Why test coding/debugging

Large coding and debugging sessions often alternate between model/tool/remote waiting and deterministic local support work such as repository-wide symbol/reference indexing, impact mapping, log classification, dependency analysis, test selection, and static analysis. That makes them plausible candidates for the narrow validated runtime surface:

`local deterministic work during required foreground ChatGPT processing`

The activation question remains whether the hideable support work is worth its dispatch, miss, lifecycle, and contention costs.

## Public examples selected

### Historical real bug: SymPy autowrap unused array argument

A public SWE-bench-family SymPy issue/task was used as the debugging substrate. The bug concerns `autowrap`/codegen when an array/matrix argument is unused in the wrapped expression: generated C code can incorrectly treat the unused array argument as a scalar.

The installed SymPy 1.14.0 source contains the fixed behavior. A temporary local copy was modified to reintroduce the historical defect by narrowing the relevant `IndexedBase` / `MatrixSymbol` handling in `sympy/utilities/codegen.py`.

A real regression test then failed with the expected mismatch:

- expected generated signature: `double test(double *x)`
- buggy generated signature: `double test(double x)`

This provides a real codebase + real regression-test debugging substrate rather than an invented toy parser benchmark.

### Live large-coding example: SymPy issue #18867

Open issue: `Lazy Jordan decomposition computation`.

The issue proposes making Jordan decomposition / matrix `exp` / `log` results more lazy, including use of `BlockDiagMatrix`, `MatMul`, and `Inverse` rather than eagerly materializing matrix products.

Relevant local surfaces include:

- `sympy/matrices/matrixbase.py`
- `sympy/matrices/matrices.py`
- `sympy/matrices/expressions/blockmatrix.py`
- matrixbase / blockmatrix / eigen-related tests

This is used as a large coding-exploration workload, not as a claim that the issue was solved in this probe.

## Deterministic support worker

A repository-wide Python AST/reference indexer was used as the Shadow-eligible support task.

Work performed:

- recursively parse all SymPy Python files;
- locate definitions and references for selected symbols;
- rank likely relevant implementation and test files.

Repository size in this runtime:

- **1,532 Python files** parsed.

For the Jordan-form workload, the worker consistently ranked files including:

- `matrices/expressions/tests/test_blockmatrix.py`
- `matrices/tests/test_matrices.py`
- `matrices/tests/test_matrixbase.py`
- `matrices/expressions/blockmatrix.py`
- `matrices/matrixbase.py`

Whole-repository worker compute was typically roughly **11–12 s** in this runtime.

## Experiment A — real debugging-support overlap

### Topology

Foreground required work:

- execute the real SymPy codegen test module against the deliberately regressed copy.

Support work:

- repository-wide AST/reference index.

Normal:

`required test -> deterministic index`

Shadow:

`start deterministic index inside the same local action -> required test -> collect index`

Both paths use the same test/code/data/indexer. The Shadow result is not a different parser or a reduced-quality substitute.

### Three paired observations

Pair 1:

- Normal total: **14.2617 s**
- Shadow total: **12.1802 s**
- direction: about **14.6% shorter**

Pair 2:

- Normal total: **16.3806 s**
- Shadow total: **12.3396 s**
- direction: about **24.7% shorter**

Pair 3:

- Normal total: **14.5920 s**
- Shadow total: **13.0086 s**
- direction: about **10.9% shorter**

Means:

- Normal total: about **15.078 s**
- Shadow total: about **12.510 s**
- apparent phase direction: about **17.0% shorter**

### Contention was real

Foreground test time itself increased under overlap:

- Normal foreground test mean: about **2.568 s**
- Shadow foreground test mean: about **2.940 s**
- foreground test direction: about **14.5% slower** under Shadow

Interpretation:

The total support phase became shorter because enough index work was hidden, but the CPU-heavy foreground test paid a measurable contention penalty.

Therefore this experiment is **not** evidence that Shadow makes all debugging 17% faster. It is evidence that a realistic deterministic debugging-support task can be overlapped profitably in this particular phase even while contention is measurable.

## Experiment B — natural large-coding piggyback with remote/model/tool wait

### Topology contract

A natural three-call topology was preserved.

Normal:

1. already-required local code inspection;
2. required GitHub issue / comment / code-search work;
3. repo-wide deterministic index.

Shadow:

1. same already-required local code inspection, with index start piggybacked inside the same call;
2. same required GitHub/model/tool work;
3. collect the index result.

No dummy call was added to Normal. Shadow did not require a standalone extra model-triggered code dispatch.

### Three paired observations

Pair 1:

- Normal: **21.8067 s**
- Shadow: **13.2590 s**
- direction: about **39.2% shorter**

Pair 2, counterbalanced using the issue-comments read:

- Normal: **20.0183 s**
- Shadow: **14.1349 s**
- direction: about **29.4% shorter**

Pair 3, using a different GitHub code-search action:

- Normal: **21.3885 s**
- Shadow: **12.7472 s**
- direction: about **40.4% shorter**

Means:

- Normal: about **21.071 s**
- Shadow: about **13.380 s**
- apparent phase direction: about **36.5% shorter**

Worker behavior:

- each run parsed **1,532 Python files**;
- worker wall time was roughly **12 s**;
- no worker remained running at final cleanup check.

### Interpretation boundary

The ~36.5% figure is **not an overall coding speedup** and must not be presented as general Shadow Carrier performance.

It includes this runtime's model/tool/connector orchestration window and is specific to a coding-exploration phase where a large deterministic local index was highly likely to be useful and could be launched without an extra model-triggered dispatch call.

Connector/cache/model/tool variance remains present. Promotion requires repeated full end-to-end coding solves on held-out tasks, including patch authoring and validation.

## Activation-policy refinement

The strongest current candidate is now more specific:

> Activate one local deterministic worker when a required remote/model/tool foreground window already exists, the next local support task has high conservative probability, the support result is expected to be consumed, and the task can be piggyback-dispatched without an extra model/tool transition.

### Positive candidate class

Examples:

- repo-wide AST/symbol/reference index while reading an issue/PR/spec remotely;
- dependency/impact map while waiting on authoritative source/tool results;
- failure-log clustering or deterministic trace indexing while the model/connector performs required non-local work;
- test-selection preparation while another required non-CPU-bound foreground step proceeds.

### Strong penalty class

If the foreground is itself CPU-heavy, such as a large local test/build, explicitly price contention. This probe measured about a **14.5% foreground slowdown** during overlapping codegen tests.

Do not infer that a long worker is automatically good just because there is something to overlap with.

### Current gate

```text
worker_completion_latency
= cold_start + compute + handoff

expected_gain
= p_lower * min(worker_completion_latency, estimated_hideable_foreground_window)
- incremental_dispatch_orchestration_cost
- miss_waste
- contention_penalty
```

Refinement from this probe:

- `foreground_local_cpu_pressure` should materially increase `contention_penalty`;
- required remote/model/tool wait with idle local CPU is a higher-priority activation surface;
- piggyback dispatch remains strongly preferred over standalone dispatch;
- one worker is sufficient for the current evidence;
- no evidence yet supports routinely opening 2–3 workers.

## What is validated now

Validated:

1. a real historical bug can be reproduced in a substantial codebase and used as a non-toy debugging substrate;
2. repo-wide deterministic support analysis can overlap with required debugging/coding work;
3. CPU contention is measurable and can slow the foreground even when total phase time improves;
4. the same repo-wide support job can make substantial progress or finish while ChatGPT performs required GitHub/model/tool work;
5. natural piggyback topology can avoid adding a separate Shadow model-triggered dispatch call.

Not validated:

1. overall coding productivity improvement;
2. overall bug-resolution improvement;
3. autonomous external Web/Drive/API speculative prefetch from the local worker;
4. a universal 17%, 36.5%, or any other speedup claim;
5. default-on activation;
6. benefit from 2–3 workers.

## Next experiment

Use held-out real coding/debugging tasks and measure the complete solve:

`issue understanding -> code exploration -> hypothesis -> patch -> targeted tests -> regression tests -> final answer`

Compare Normal vs Shadow with natural tool-call topology preserved. Shadow may only activate from the learned conservative gate. Record whether the prefetched/indexed result was actually consumed and include miss waste, contention, lifecycle, and cleanup.

A particularly useful next harder public candidate is Django `django__django-15957` (`Prefetch()` with sliced querysets), because it spans ORM query behavior, related descriptors, window-function behavior, and regression tests.

Until repeated held-out end-to-end wins exist, keep:

**INCOMPLETE / EXPERIMENTAL / DEFAULT OFF / 0 workers globally**

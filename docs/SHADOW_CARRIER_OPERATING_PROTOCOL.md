# Shadow Carrier Operating Protocol

Version: 0.2
Status: Experimental / proficiency-training phase

## Purpose

Shadow Carrier is a speculative prefetch layer that accelerates an otherwise normal adaptive AI workflow without replacing the AI's reasoning loop.

The primary goal is to hide read/search/tool latency while preserving the same decision authority, evidence quality, and final reasoning path as the Normal workflow.

Core principle:

> Do not make Interceptors decide instead of the Carrier. Make them prepare likely next read-only actions before the Carrier asks for them.

The proficiency goal is equally important:

> Learn from every observable tool trajectory, including ordinary Normal workflows, so Shadow prediction improves faster than Shadow-only trial and error.

## Architecture

```text
Carrier / Normal reasoning
        |
        | current tool action
        | + likely next read-only actions
        v
Shadow Scheduler
   |   |   |   |   |
  I1  I2  I3  I4  I5
   \   \   |   /   /
      hidden cache
          |
     commit only if
     Carrier selects it
          |
          v
       Carrier
```

Interceptors remain deterministic workers whenever possible. They search, fetch, open, read, parse, validate basic scope, deduplicate, and cache. They do not make the final research judgment.

## Non-negotiable rules

1. **Normal reasoning remains authoritative.** The Carrier decides what information is needed next. A speculative result never forces the next step.
2. **Speculative work is read-only.** Search, fetch, open, read, parse, hash, deduplicate, cache, and metadata inspection are allowed. Mutating or irreversible actions are not prefetched.
3. **Prefetched results stay hidden until selected.** Unused results do not enter model context.
4. **A miss falls back to Normal.** Speculation may waste machine/network work, but it must not lower answer quality.
5. **Evidence is not aggressively summarized.** For selected natural-language evidence, preserve at least 70% of the selected body text. Maximum text reduction is 30% and is a ceiling, not a quota. Preserve numbers, IDs, dates, negation, conditions, exceptions, scope, authority, provenance, uncertainty, comparisons, causal links, and conflict/supersession relations.
6. **Page/source selection is retrieval, not compression.** Irrelevant prefetched pages may remain outside model context, but selected evidence is not reduced to tiny summaries merely to save tokens.
7. **Prefetch horizon is bounded.** Default horizon is one likely next tool step. Horizon 2 is allowed only for repeatedly validated, low-cost, read-only sequences.
8. **Candidate diversity beats duplicate guessing.** Do not spend five Interceptors on five near-identical queries unless redundancy itself is useful.

## Shadow State

Before predicting, build a compact machine-readable state containing only features that can change the next tool decision.

```json
{
  "task_class": "official_docs_comparison",
  "current_action": "open_headless_docs",
  "recent_actions": ["search_product", "open_headless_docs"],
  "entities": ["Claude Code"],
  "unresolved": ["windows_sandbox", "permissions", "mcp"],
  "required_authority": "first_party",
  "freshness": "current",
  "known_sources": ["code.claude.com"],
  "mutation_allowed": false
}
```

Do not include full conversation text merely to predict the next action.

## Candidate generation hierarchy

Use the cheapest reliable source first:

1. deterministic obligation / missing-field map,
2. exact validated trajectory match,
3. short action-transition memory,
4. task-class pattern,
5. current Carrier plan,
6. a small planner only when the previous sources cannot produce a useful candidate set.

A planner must not reread the full raw corpus merely to predict tool calls.

## Prediction confidence

Early training may use confidence bands instead of fake precision:

- `VERY_HIGH`: nearly forced next step / direct dependency
- `HIGH`: strong repeated pattern
- `MEDIUM`: plausible branch
- `LOW`: weak guess

After enough traces exist, convert these bands into empirical hit probabilities per task class and state signature.

## Choosing how many Interceptors to dispatch

Do not automatically launch all five. Use the smallest candidate set with positive expected value and adequate expected coverage.

```text
prefetch candidate i when:

p_i * (normal_latency_i - cache_latency_i) > speculative_cost_i
```

Practical training policy:

- 0 workers: speculation has no positive expected value.
- 1 worker: one next action is dominant.
- 2–3 workers: several realistic branches exist; default useful range.
- 4–5 workers: branch uncertainty is genuinely broad and speculative calls are cheap/read-only.

When probabilities are available, choose the smallest `k` such that cumulative probability of the top-k candidates reaches the target coverage while every dispatched candidate still has positive expected value. An initial target coverage of 0.80 may be used for training and then calibrated from traces.

## Source-aware prefetching

Shadow Carrier should learn where useful evidence normally comes from.

For technical comparison tasks, prefer first-party documentation, then official repository documentation/issues, then primary standards or regulatory sources. Repeatedly useless marketing, login, generic home, or unrelated pages should be deprioritized without exposing them to the Carrier.

This is retrieval routing, not evidence summarization.

## Operating loop

1. **Execute the Normal current action.** The Carrier chooses the current tool call exactly as it would without Shadow Carrier.
2. **Build Shadow State.** Capture current action, unresolved information, task class, known sources, recent actions, and hard source/authority/freshness constraints.
3. **Predict likely next read-only actions.** Produce a small ranked candidate set.
4. **Dispatch selectively.** Prefer 1–3 positive-EV candidates unless broad uncertainty justifies more.
5. **Store outside model context.** Cache request signature, action type, target, scope/parameters, source, timestamp, freshness window, status, content hash, artifact reference, and provenance.
6. **Compatibility gate before commit.** Require action intent, target/entity, scope, parameters, authority/source type, freshness, and any time cutoff to match semantically.
7. **Commit or discard.** Compatible hit -> cached result. Miss -> Normal action. Unrelated results -> brief cache or discard.
8. **Learn from the transition.** Record Shadow State -> predictions -> actual next action -> hit rank -> latency/cost outcome.

## Learn from Normal workflows too

Shadow proficiency must not depend only on occasions when Shadow Carrier was enabled. Whenever a normal multi-tool workflow exposes a useful sequence, capture the compact transition trace after the fact.

Normal traces can teach:

- next-action transitions,
- common missing-field sequences,
- useful source families,
- dead-end source patterns,
- typical tool latency,
- when branching tends to occur.

The actual Normal action is the ground-truth next-action label.

## Counterfactual replay training

Saved traces can improve policy without executing new web/tool calls.

For each historical trajectory, replay candidate policies offline:

```text
What would hit@1 have been?
What would hit@3 have been?
Would dispatching 5 instead of 2 have saved more wall-clock after speculative cost?
Which confidence threshold minimized waste?
Which source preference would have avoided dead ends?
```

One real workflow can therefore train several hypothetical dispatch policies.

## Training curriculum

### Phase A — Observe Normal

Harvest compact action traces from real Normal workflows. Measure common transitions, tool latency, source preferences, dead ends, and predictable task classes. Shadow may remain off or use one low-risk prefetch.

### Phase B — Assisted Shadow

For read-heavy tasks, execute the Normal current action, predict 1–3 likely next actions, prefetch silently, record the actual next action and hit rank, and preserve Normal reasoning authority.

### Phase C — Dynamic Shadow

Use learned transitions, task classes, source preferences, and unresolved-field maps to dynamically choose 0–5 Interceptors. Tune target coverage and expected-value thresholds from replay. Reuse compatible cached artifacts and shorten cache TTL for time-sensitive data.

### Phase D — Compiled Workflow

When the same successful action sequence repeats reliably, compile the stable portion into a deterministic meta-tool or reusable Skill. The Carrier should then handle novelty, conflict, and exceptions instead of repeatedly re-planning the stable routine.

## Proficiency ladder

- **P0 — Untrained:** no reliable transition data; Shadow mostly off.
- **P1 — Observing:** Normal traces collected; common action/source patterns identified.
- **P2 — Assisted:** hit@3 begins to stabilize; speculation limited to 1–3 read-only candidates.
- **P3 — Calibrated:** per-task-class hit rates and latency estimates available; dispatch count becomes evidence-based; cache mismatches are rare.
- **P4 — Predictive:** Shadow frequently hides material tool latency with Normal-quality parity; source routing avoids known dead ends; replay-selected policy beats fixed-k policies.
- **P5 — Compiled:** repeated stable trajectories are converted into deterministic Skills/meta-tools; the Carrier mainly handles novelty, conflict, and exceptions.

Do not promote proficiency from one successful benchmark.

## Exploration vs exploitation

Reserve a small amount of low-cost read-only exploration when the task class is changing, source layout changed, hit rate is degrading, or multiple branches have similar confidence. Do not explore merely because an Interceptor is idle.

## Cache policy

Use short TTLs for news, availability, prices, versions, live issues/PRs/builds, or other rapidly changing state. Longer TTLs are acceptable for stable official documentation, repository files pinned to a commit/ref, and immutable hash-addressed artifacts.

A cache entry with uncertain freshness must not silently replace a fresh Normal lookup.

## Metrics

Track prediction, latency, cost, context, and quality separately.

Prediction:
- `hit@1`, `hit@3`, `hit@5`
- MRR
- commit rate
- waste rate
- compatibility reject rate

Latency:
- Normal tool latency
- prefetch completion latency
- cache-return latency
- end-to-end task latency
- latency hidden by speculation
- time lost on misses/rate-limit interference

Cost:
- speculative requests
- speculative bytes
- API/network/compute cost
- speculation-caused rate-limit incidents

Context:
- Normal model-visible evidence
- Shadow model-visible evidence
- speculative machine-only bytes
- unused speculative bytes kept outside model context

Quality uses the existing Carrier contract:
- Factual Accuracy
- Critical Coverage / Recall
- Evidence Precision / Relevance
- Scope Fidelity
- Provenance / Authority Fidelity
- Conflict Handling
- Reasoning / Decision Quality
- Information Efficiency
- Hard Failure

Quality must be at least Normal. A speed gain with a material quality regression is a failure.

## Training record schema

```json
{
  "task_class": "product_official_docs_comparison",
  "state_signature": "missing:sandbox,permission",
  "current_action": "open_headless_docs",
  "predictions": [
    {"action": "sandbox_docs", "confidence": "HIGH"},
    {"action": "permission_docs", "confidence": "MEDIUM"},
    {"action": "mcp_docs", "confidence": "MEDIUM"}
  ],
  "dispatched": 3,
  "actual_next": "sandbox_docs",
  "hit_rank": 1,
  "normal_latency_ms": 6200,
  "prefetch_latency_ms": 2700,
  "cache_latency_ms": 280,
  "saved_ms": 5920,
  "unused_prefetches": 2,
  "compatibility_reject": false,
  "quality_regression": false
}
```

Keep traces compact and strip project-sensitive content when the learning pattern can be represented generically.

## Policy update rule

Do not rewrite policy after every observation. At meaningful checkpoints:

1. aggregate traces by task class/state signature,
2. compare current policy with counterfactual alternatives,
3. identify repeated wins/failures,
4. update only reusable routing rules,
5. retain rollback information for policy changes.

Do not encode one-off accidental action sequences as permanent policy.

## Initial promotion gates

These are training gates, not permanent constants.

A workload may move from training to default Shadow use when:

- quality >= Normal,
- Hard Failure = 0,
- hit@3 >= 70%,
- net latency value remains positive after speculative cost,
- end-to-end latency improves >= 20% **or** model-visible input drops >= 30%,
- speculative monetary/rate-limit cost is acceptable,
- compatibility reject rate remains low,
- no speculative mutating actions are used.

If these gates are not met, keep Shadow Carrier off for that workload.

## Failure modes to watch

1. over-prefetching,
2. context leakage,
3. semantic cache mismatch,
4. planner inflation,
5. Interceptors imitating full agents,
6. compression drift,
7. rate-limit amplification,
8. speculative branch explosion,
9. historical pattern lock-in,
10. false cache hits caused by scope/freshness/authority mismatch.

## Current operating stance

Shadow Carrier is not a replacement for Normal reasoning and not a five-LLM subagent architecture.

It is a latency-hiding, context-safe speculative execution layer around Normal reasoning.

Current optimization priority:

1. observe and learn from Normal tool trajectories,
2. maximize next-action prediction quality,
3. minimize speculative waste and cache mismatches,
4. hide read/search latency without changing the reasoning path,
5. compile repeatedly successful trajectories only after evidence accumulates.

Target behavior:

> Hit -> faster.  
> Miss -> fall back to Normal.  
> Learn from both.  
> Never trade answer quality for speculative speed.

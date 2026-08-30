# ChatGPT Shadow Interceptor Runtime Overlap Probe — 2026-08-30

Status: **EXPERIMENTAL EVIDENCE / NOT A PROMOTION BENCHMARK**

This record extends `CHATGPT_SHADOW_INTERCEPTOR_CHECKPOINT_2026-08-30.md`. It does not change the global status: **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**.

## Question

Can the current ChatGPT coding execution environment perform useful deterministic work concurrently with ongoing ChatGPT tool/model processing, without introducing a separate predictor LLM, new MCP, tunnel, or external server?

## Runtime boundary check

Direct network egress from the coding/container environment was tested and remained unavailable. Requests to public Internet endpoints failed at DNS/network resolution. Therefore the local worker still cannot own speculative Web/Drive/API prefetch in the current runtime.

No current built-in execution surface was found that lets the detached coding worker itself launch hidden external Web/Drive/GitHub I/O while the Carrier continues. Existing connector calls remain model-mediated from the assistant workflow.

## Real detached-worker overlap probe

A detached local Python worker was started with `nohup`. It wrote a timestamped tick every 0.1 s for roughly 15 s while ChatGPT executed a Google Drive search through the connected Drive surface.

Observed:

- worker start: about `1788071388.199`
- remote Drive operation returned: about `1788071398.230`
- worker continued writing uninterrupted through about `1788071398.211`
- worker end: about `1788071398.313`

This is direct evidence that a detached deterministic local process can remain alive and make progress while ChatGPT continues connector/tool/model processing in the same turn.

### Valid conclusion

`local deterministic worker <-> ongoing ChatGPT connector/tool/model processing` can overlap in this runtime.

### Invalid conclusion

This does **not** prove that the worker can independently prefetch external I/O. It also does not prove a general end-to-end latency improvement.

## Fair forced-hit surface probe

A deterministic parser was built over a local JSONL artifact containing 500,000 rows (~35 MB). Both Normal and Shadow received the same code, parser, data access, and output contract.

Parser invariant output:

- count: `500000`
- total: `24999752010`
- flagged: `45455`
- max_group: `48`
- max_group_sum: `257890244`

Normal path:

`required remote foreground operation -> local parse`

Shadow surface-probe path:

`start detached local parse -> same required remote foreground operation -> collect parser result`

The test deliberately forced a cache hit (`p=1`) to isolate whether local deterministic work could be hidden. It is therefore **not prediction calibration and not a production benchmark**.

Six paired observations:

| Pair | Normal (s) | Shadow (s) | Apparent direction |
|---|---:|---:|---:|
| 1 | 9.0916 | 9.0008 | +1.0% |
| 2 | 9.9033 | 7.1020 | +28.3% |
| 3 | 10.7130 | 6.3912 | +40.3% |
| 4 | 9.8107 | 7.5177 | +23.4% |
| 5 | 9.4350 | 8.6744 | +8.1% |
| 6 | 11.5415 | 8.9464 | +22.5% |

Means:

- Normal: about **10.082 s**
- Shadow: about **7.939 s**
- apparent mean direction: about **21.3% faster**

Pair-level apparent gain ranged from roughly **1.0% to 40.3%**, showing large orchestration/model/connector variance. Provider-side connector timings in some short-read pairs were below one second while full model-tool sequence latency remained much larger, so the apparent difference cannot be assigned purely to network latency hiding.

### Interpretation

The forced-hit probe supports only this narrower claim: a sufficiently long local deterministic next step can finish while the ChatGPT turn continues other required processing.

Do **not** cite the 21.3% number as validated Shadow Carrier performance.

## Miss / unused-work probe

Two counterbalanced pairs started the same local worker but intentionally did not use its result.

Observed pair directions:

- one pair: unused-worker path appeared ~5.2% faster
- one pair: unused-worker path appeared ~9.7% slower

Means:

- Normal: about **9.269 s**
- unused-worker path: about **9.456 s**
- average direction: about **2.0% slower** with unused work

`n=2` and variance is high, so this is not a stable contention estimate. It is sufficient to reject the assumption that a miss is free. CPU use, dispatch cost, and miss waste remain explicit EV penalties.

## Policy delta

The previous negative result for naive CPU/local parsing remains valid. CPU parsing run speculatively in isolation is still a **DON'T-USE** condition.

A new, narrower experimental task class is now recognized:

`local_deterministic_during_required_foreground_chatgpt_processing`

Candidate conditions:

1. the foreground connector/tool/model operation is already required by Normal;
2. the predicted next action is deterministic local work over data/artifacts already present locally;
3. no speculative external network request is added;
4. authority/freshness/source semantics are not weakened by preparing the local result early;
5. conservative expected value is positive.

Working gate:

```text
expected gain
= p_lower * min(local_work_latency, estimated_hideable_foreground_window)
- dispatch_cost
- miss_waste
- contention_penalty
```

Dispatch only if the result is positive.

Worker policy:

- default: `0`
- one dominant compatible local next action: test `1` worker
- `2–3` only after real traces show multiple distinct branches with positive marginal EV
- do not treat `4–5` as a default training range

Rate-limit penalty can be near zero for a purely local worker because it creates no additional remote request, but CPU contention and miss compute remain.

## What did not change

- global status remains **INCOMPLETE / EXPERIMENTAL / DEFAULT OFF**;
- no separate predictor LLM by default;
- no invention-first claim; ToolAhead remains acknowledged prior art;
- fair Normal gets the same parser/code/cache/data access;
- quality must be >= Normal;
- Hard Failure must be 0;
- naive CPU/local parsing Shadow remains OFF;
- worker-owned external speculative I/O remains unavailable/unverified;
- no promotion until positive end-to-end value repeats on natural workflows.

## Next experiment class

Collect **natural Normal trajectories** where a real next action after Drive/Web/read/fetch work is local deterministic processing such as:

- parse,
- hash,
- deduplicate,
- cache normalization,
- index building,
- deterministic validation,
- counterfactual replay over already-present traces.

For each trace, record:

- actual next action,
- `p_lower`,
- local work latency,
- foreground end-to-end window and provider tool latency where exposed,
- actual hideable overlap,
- dispatch overhead,
- miss waste,
- CPU contention,
- quality parity / Hard Failure,
- whether 0 or 1 worker would have been optimal.

Only run 1-worker Shadow A/B when the conservative EV gate opens. Keep collecting Normal labels when it stays closed.

## Promotion rule

The next milestone is not the forced-hit 21.3% surface signal. It is a natural workload in which Shadow correctly decides to activate, the predicted local step is actually consumed, quality remains at least Normal with Hard Failure = 0, and positive net end-to-end value repeats across held-out or repeated runs.
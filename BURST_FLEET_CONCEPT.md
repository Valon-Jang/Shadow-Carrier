# Burst Fleet

> **Status: SEALED**  
> Technically feasible. Extremely token-hungry. Hardware-hungry too.

Burst Fleet was an earlier latency-first AI execution concept that eventually led to Shadow Carrier.

The idea is simple: do not create a team of AIs after work arrives. **Pre-position the workers and the information paths in advance.** Keep the workers warm or idle rather than fully shutting them down, then wake them almost instantly when a burst is needed.

A burst fans one apparent AI out into multiple workers, lets them process information in parallel, and then collapses the information through a prepared reduction path:

`1 -> N -> N/2 -> ... -> 1`

The reduction path matters because sending every parallel result directly back to one final AI recreates a serial bottleneck. Each stage reads, reduces, and forwards only what the next stage needs, so the whole fleet can still feel like one AI from the user's point of view.

## What it is trying to buy

**Time.**

Burst Fleet is not based on the assumption that more agents automatically produce a better answer. Quality must at least be preserved; faster low-quality output is useless.

The intended trade is deliberately aggressive:

**more tokens + more CPU/GPU/memory -> lower wall-clock latency**

If cost and hardware usage matter less than finishing even a little sooner, the concept can make sense for sufficiently parallel workloads.

## Why it was sealed

A prototype was built and the mechanism worked, but the practical cost was obvious. Token consumption rose quickly, and a full burst could make the original PC noticeably lag under the compute load. Image-editing workloads were one case where the result appeared somewhat faster, but the broader speed benefit was never benchmarked rigorously enough to make a general claim.

So Burst Fleet was not sealed because parallel execution was impossible.

> **It was sealed because it worked expensively.**

## Relationship to Shadow Carrier

Burst Fleet and Shadow Carrier optimize latency in different ways:

- **Burst Fleet:** spend additional compute, hardware capacity, and tokens to buy time.
- **Shadow Carrier:** keep one authoritative AI in the foreground and overlap only small, predictable work that can run while the AI is already busy.

Shadow Carrier kept the useful idea of work happening behind the main AI, but dropped the always-ready fleet as the default strategy.

## Prior-art note

Multi-agent parallelism, hierarchical aggregation, tree-style reduction, warm workers, and sleep/wake model infrastructure all have related prior art. Burst Fleet does **not** claim invention of those primitives. The historical idea documented here is their latency-first combination: a pre-positioned, rapidly activated worker path that expands and collapses while presenting one apparent AI to the user.

## If you still want to build it

Go ahead.

**Your token budget and your cooling system have been warned.**

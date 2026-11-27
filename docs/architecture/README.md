# Architecture

Where we think about how Virtual Bookshelf is built and how it should change.

There are three kinds of writing here, and one next door:

| Kind | Where | Changes? |
| --- | --- | --- |
| **How the system works today** | [`OVERVIEW.md`](OVERVIEW.md) | Kept current. Update it in the same pull request as the change it describes. |
| **How we write code** | [`PATTERNS.md`](PATTERNS.md), [`ANTI_PATTERNS.md`](ANTI_PATTERNS.md) | Kept current. |
| **Ideas being worked out** | [`proposals/`](proposals/) | Drafts. Edit freely, argue in them, abandon them. |
| **Choices we've made** | [`../decisions/`](../decisions/) | Never edited once accepted. A later choice gets its own record. |

## How an idea moves through

1. **Explore.** Copy [`proposals/TEMPLATE.md`](proposals/TEMPLATE.md) to
   `proposals/<short-name>.md` and set its status to `draft`. Half-formed is
   fine; the point is to think in writing next to the code.
2. **Decide.** When a proposal settles something that is hard to reverse,
   write a numbered record in [`../decisions/`](../decisions/) and link it from
   the proposal. Set the proposal's status to `decided`.
3. **Build.** Open issues for the work. When it lands, update
   [`OVERVIEW.md`](OVERVIEW.md) so it describes the system as it now is.

Proposals that go nowhere get status `dropped` and stay in the folder, so the
reasoning isn't lost.

## Open proposals

| Proposal | Status | Summary |
| --- | --- | --- |
| _none yet_ | | |

## Older reference material

Snapshots from earlier reviews. Useful history, but not kept up to date; check
the code before trusting them.

- [`CODEBASE_ORGANIZATION_PLAN.md`](CODEBASE_ORGANIZATION_PLAN.md) (Feb 2026)
- [`COMPREHENSIVE_AUDIT_DECEMBER_2025.md`](COMPREHENSIVE_AUDIT_DECEMBER_2025.md) (Dec 2025)
- [`N1_OPTIMIZATION_SUMMARY.md`](N1_OPTIMIZATION_SUMMARY.md),
  [`PERFORMANCE_N1_OPTIMIZATION.md`](PERFORMANCE_N1_OPTIMIZATION.md)

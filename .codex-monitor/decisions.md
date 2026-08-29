# Decisions

## PHASE 0A

- `D:\projects\UPRE-V0.10` is the new official UPRE V0.10 workspace.
- Existing repository recovery is not attempted.
- Bootstrap structure and review baseline only.
- Feature implementation and dependency installation are deferred.
- GitHub remote creation or connection requires a human decision.

## PHASE 0B

- Core uses independent typed entities and semantic relations.
- Truth/provenance are mandatory; inferred facts cannot auto-promote to observed facts.
- Original, Working, Generated are snapshot/revision states, not overwrites.
- Viewer/editor/source engines are adapter concerns and do not shape Core schema.
- Dependency-free Node validation is used; no runtime package manifest was added.
- MASTER review is required before visualization work.

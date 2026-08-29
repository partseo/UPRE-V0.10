# SMALL V0.1 Scope and PHASE 0B Gate

STATUS: REVIEW_READY

PHASE: PHASE-0B

이번 Phase는 문서, Core JSON Schema, sample fixture, 3개 invalid fixture, dependency-free validator 및 실행 receipt만 포함한다.

| Gate | Criterion | Evidence |
| --- | --- | --- |
| G01 | Universal Program Model | Web/Windows/Source/Document/Runtime 수용 |
| G02 | UI/Behavior/Flow/Data separation | 독립 collection과 ID reference |
| G03 | Truth classification | 5개 상태와 semantic rule |
| G04 | Model state separation | snapshot/revision 및 immutability negative test |
| G05 | Archify independence | Core schema isolation scan |
| G06 | React Flow independence | isolation scan과 reverse command contract |
| G07 | Adapter extensibility | source adapter categories |
| G08 | Evidence/Asset/OSS extensibility | 독립 entities와 provenance |
| G09 | Fixture relationship coverage | required entities, chain, supporting evidence |
| G10 | Executed validation | `node tests/validate-fixtures.mjs`, exit 0, 8/8 |

하나라도 실패하면 PHASE 0B는 FAIL이다. G05, G06, G10은 Critical이다.

## Explicitly Not Implemented

Archify Runtime, React Flow Runtime, Playwright, Tree-sitter, ast-grep, Joern, Neo4j, Kuzu, Qdrant, Local LLM, Windows UIA, Vision Analyzer, Generator 및 실제 target 분석은 설치하거나 구현하지 않는다.

## Next Gate

MASTER 승인 전에는 sample Program Model 시각화 단계로 진행하지 않는다.

## Authorized Research Mode Addendum

PHASE 0B에는 runtime policy engine을 구현하지 않는다. `docs/05_AUTHORIZED_RESEARCH_MODE.md`의 Architecture Contract와 monitor receipt만 추가한다. 기존 G01~G10, 특히 Core independence와 실행 validation이 우선한다.

| Gate | Criterion |
| --- | --- |
| AR01 | Partial Block가 Action 단위로 정의됨 |
| AR02 | Safe Continuation과 substitute가 정의됨 |
| AR03 | UNKNOWN, NOT_OBSERVABLE, BLOCKED가 구분됨 |
| AR04 | Program Model과 Research Policy가 분리됨 |
| AR05 | Human Gate 조건이 정의됨 |
| AR06 | Research event logging contract가 정의됨 |
| AR07 | G01~G10과 충돌하지 않고 Core Schema가 변경되지 않음 |

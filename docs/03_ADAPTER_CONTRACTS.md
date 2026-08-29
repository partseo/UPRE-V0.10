# Adapter Contracts V0.1

STATUS: REVIEW_READY

PHASE: PHASE-0B

| Contract | Input | Output | Rule |
| --- | --- | --- | --- |
| Input Adapter | URL, executable, source, document, runtime target | typed descriptor | 원본을 변경하지 않는다 |
| Analyzer Adapter | descriptor | raw findings | Core Model을 직접 생성하지 않는다 |
| Observation Adapter | findings | Observation + Evidence | source details를 경계에 격리한다 |
| Normalizer | Observations | model revision candidate | truth/provenance를 보존한다 |
| Projection Adapter | Program Model snapshot | viewer IR | projection은 Core truth가 아니다 |
| Visual Adapter | Working snapshot/editor event | visual projection/model command | editor state를 Core에 저장하지 않는다 |
| Sanitizer | Working snapshot | Generated snapshot + status | 위험을 fail closed 처리한다 |
| Generator Adapter | Generated Model | generator request/artifacts | Original/Working을 직접 입력받지 않는다 |

```text
Input → Analyzer → Observation → Normalizer → Program Model
Program Model → Projection Adapter → Viewer
Working Model → Sanitizer → Generated Model
Generated Model → Generator Adapter
```

## Archify Boundary

Archify는 여러 diagram view를 위한 Projection Adapter 후보다. Core를 Archify IR에 맞추지 않으며, view-specific structure와 renderer metadata는 projection이 소유한다.

## Visual Editor Boundary

```text
Program Model → Visual Projection Adapter → React Flow nodes/edges
React Flow Event → Visual Adapter → Model Command → Working Model revision
```

position, selection, viewport, handle 등 편집기 상태는 adapter-owned다. Model Command는 rename, relation change, warehouse move/restore, merge, split, inference rejection 같은 의미 변경만 표현한다.

## AI Boundary

AI는 교체 가능한 Inference Adapter다. Core에는 provider/model/inference receipt만 provenance로 남고 특정 SDK나 prompt format은 포함하지 않는다.

## Authorized Research Orchestration Boundary

Research Orchestrator는 `OBSERVE → EXTRACT → MODEL → INFER → VERIFY → MODIFY → REIMPLEMENT`의 각 Action을 독립적으로 판정한다. 판정은 `ALLOWED`, `LIMITED`, `BLOCKED`, `HUMAN_REQUIRED`이며, 상위 Task 결과와 분리한다.

```text
Research Action
  → policy decision
  → allowed action OR safe substitute OR human gate
  → Observation/Evidence
  → Normalizer
  → Program Model
```

하나의 Action이 `BLOCKED`여도 나머지 정상 사용자 경로는 `CONTINUE_SAFE_PATH`로 계속한다. Orchestrator는 credential extraction, authentication bypass 또는 비인가 접근을 다른 분석 Action과 분리하고, 정상 authenticated observation, synthetic data, public client code, observed network contract 같은 safe substitute를 선택한다.

Program Model은 Safety Engine이 아니다. 정책 판정·거부 사유·substitute 선택은 orchestration receipt와 monitor가 소유한다. Program Model에는 분석 의미상 필요한 최소 `observation_status`, `availability_status`, `verification_status`, Evidence, Provenance만 전달할 수 있다. Truth classification과 실행 상태는 서로 대체하지 않는다.

## Research Event Contract

Orchestrator는 다음 event를 append-only monitor에 기록한다.

- `RESEARCH_ACTION_ALLOWED`
- `RESEARCH_ACTION_LIMITED`
- `RESEARCH_ACTION_BLOCKED`
- `SAFE_SUBSTITUTE_SELECTED`
- `USER_VERIFICATION_REQUIRED`
- `RESEARCH_CONTINUED`

각 event는 action, decision, reason category, affected model area, safe substitute, continued 여부를 지원한다. Secret, token, cookie, credential 또는 실제 사용자 데이터 값은 기록하지 않는다.

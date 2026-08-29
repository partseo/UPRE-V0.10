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

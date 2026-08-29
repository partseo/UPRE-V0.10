# Program Model Schema V0.1

STATUS: REVIEW_READY

PHASE: PHASE-0B

## Purpose

UPRE Program Model은 원본 시스템을 특정 분석기나 시각화 엔진과 무관하게 표현하는 canonical model이다. 웹, Windows, source code, document, runtime 및 향후 adapter가 동일한 Core로 정규화된다.

## Aggregate

`schemas/program-model.schema.json`의 최상위는 `program`, `snapshots`, `model_revisions`, type별 `entities`, typed `relations`, 독립 `evidence`, 사용자 `decisions`를 보존한다.

## Entity Separation

Screen, Component, Action, Behavior, Flow, DataEntity는 서로 다른 collection과 ID namespace를 갖는다. Behavior는 `trigger_ref`, `action_ref`, `result_refs`로 Trigger → Action → Result를 표현하고, Flow는 Behavior reference만 가진다. Data read/write는 typed Relation으로 연결한다. 한 화면 객체에 UI, 행위, 흐름, 데이터를 중첩해 소유시키지 않는다.

LogicRule, ProtectedAsset, OSSReference도 독립 entity다. Evidence와 Decision은 전용 schema로 분리한다.

## Semantic Relations

Relation은 ID/type/source/target와 origin, truth, evidence, confidence, verification, provenance를 가진다. 의미는 `CONTAINS`, `TRIGGERS`, `NAVIGATES_TO`, `READS`, `WRITES`, `DISPLAYS`, `USES`, `DEPENDS_ON`, `PART_OF_FLOW`, `SUPPORTED_BY`, `DERIVED_FROM`, `REPLACES` 중 하나다. Reference는 `TYPE:id` 형식이며 validator가 실제 존재 여부를 확인한다. Relation의 Truth 정책은 Entity와 동일하며 INFERRED, USER_VERIFIED, CONFLICT의 Evidence·provenance 조건은 JSON Schema와 Semantic Validator가 각각 fail-closed로 검사한다.

## Truth Classification

- `OBSERVED`: adapter가 원본에서 직접 포착했다.
- `DERIVED`: 명시적 rule 또는 여러 Observation으로 계산됐다.
- `INFERRED`: AI 또는 heuristic 추론이다. Evidence와 inference provenance가 필수다.
- `USER_VERIFIED`: 사용자가 판단했으며 USER provenance와 Decision 출처를 보존한다.
- `CONFLICT`: 양립하지 않는 판단이며 최소 2개 Evidence를 유지한다.

`INFERRED`를 자동으로 `OBSERVED`로 바꾸는 operation은 없다. 새 Observation 또는 user Decision과 revision이 필요하다.

## Provenance

중요 객체와 관계는 method, source adapter 및 선택적 source reference를 가진다. AI inference는 provider, model, inference ID, confidence, evidence references를 기록하되 provider 종류를 제한하지 않는다.

## Model State Separation

- `ORIGINAL_MODEL`: 분석 완료 snapshot. `immutable=true`, base 없음.
- `WORKING_MODEL`: 선행 snapshot을 참조하는 사용자 수정본. `immutable=false`.
- `GENERATED_MODEL`: Working snapshot을 기반으로 Sanitizer 상태를 가진 불변 생성 입력.

모델은 overwrite가 아니라 snapshot과 revision ID로 연결한다. 각 Snapshot은 전역 객체 reference가 아니라 완전한 값 사본을 가진 `entity_version`/`relation_version` ID를 참조한다. 하나의 값 version을 둘 이상의 Snapshot이 공유하면 Semantic Validator가 거부하므로 Entity와 Relation 모두 Working 변경은 Original 값에, Generated 변경은 Working 또는 Original 값에 역전파될 수 없다. Original 수정도 validator가 거부한다.

## External Engine Isolation

Core schema에는 특정 viewer, editor, browser automation, UI 좌표 또는 renderer metadata가 없다. 합성 Entity는 Draft 2020-12 `unevaluatedProperties: false`로 폐쇄되며, Entity version 내부 값에도 같은 규칙이 적용된다. 외부 형식은 Projection/Visual Adapter가 생성하고 역변환한다.

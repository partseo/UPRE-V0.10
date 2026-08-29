# Authorized Research Mode V0.1

STATUS: REVIEW_READY

PHASE: PHASE-0B

## Purpose

제한된 세부 Action 때문에 허용 가능한 전체 연구를 중단하지 않도록 Action 판정, partial block, safe substitute, human gate 및 logging 계약을 정의한다. 이 계약은 안전정책을 우회하거나 약화하지 않는다.

## Action-Level Decisions

- `ALLOWED`: 승인된 정상 연구 Action을 실행한다.
- `LIMITED`: 허용되는 관찰·모델링 범위까지만 실행한다.
- `BLOCKED`: 제한된 세부 Action만 실행하지 않는다.
- `HUMAN_REQUIRED`: 권한·영향·비용·데이터 노출 판단만 대기한다.
- `CONTINUE_SAFE_PATH`: 나머지 허용 Action과 substitute를 계속한다.

`BLOCKED`는 상위 Task 실패를 뜻하지 않는다. 단, 적용되는 안전정책이 전체 중단을 요구하면 해당 정책이 우선한다.

## Partial Block Protocol

제한 Action을 발견하면 다음 receipt를 만든다.

```text
[PARTIAL BLOCK]
Blocked Action: <exact action>
Reason Category: <category>
Affected Model Area: <area>
Safe Substitute: <allowed substitute>
Remaining Allowed Actions: <actions>
Continue: YES
```

그 후 Remaining Allowed Actions를 즉시 계속한다. 분석 깊이와 Evidence 기준은 낮추지 않는다.

## Safe Substitutes

| Blocked action | Safe substitute |
| --- | --- |
| 인증 우회 | 정상 로그인 또는 제공된 test account로 동일 flow 관찰 |
| credential/token/cookie 추출 | synthetic credential 또는 사용자 제공 test session |
| 서버 DB 직접 접근 | UI와 정상 API response로 logical data model 작성 |
| 비공개 server source 획득 | observed behavior, network, public client code로 INFERRED logic 작성 |
| 원본 독점 source 복제 | behavior specification과 독립 구조로 재구현 |

Substitute는 기존 권한을 넓히지 않고 production 데이터를 추가 노출하지 않아야 한다.

## Status Separation

Truth classification은 사실의 근거를 나타낸다.

`OBSERVED`, `DERIVED`, `INFERRED`, `USER_VERIFIED`, `CONFLICT`

Research availability/execution status는 관찰 가능성과 Action 수행 여부를 나타낸다.

- `UNKNOWN`: 정보 부족
- `NOT_OBSERVABLE`: 현재 관찰 방식으로 확인 불가
- `NOT_AVAILABLE`: source/resource가 제공되지 않음
- `BLOCKED`: 실행하지 않는 제한 Action
- `USER_VERIFICATION_REQUIRED`: 사용자가 확인하면 확정 가능

예를 들어 Authentication Service 존재는 `OBSERVED`일 수 있지만 내부 algorithm은 `NOT_OBSERVABLE`, credential extraction은 `BLOCKED`일 수 있다. 이 상태들은 서로 덮어쓰지 않는다.

## Program Model Separation

Research Policy는 Analyzer/Observation orchestration 계층의 책임이다. Program Model Core는 policy rule, forbidden-action catalog 또는 enforcement engine을 포함하지 않는다. 필요한 최소 observation/availability/verification state와 Evidence/Provenance만 normalizer 경계를 통해 전달한다.

부분 모델은 확인된 UI/Behavior/Flow/Data를 유지한다. 확인 불가 내부 logic 때문에 관찰된 사실을 삭제하지 않으며 coverage receipt에서 Unknown, Not Observable, Blocked 및 User Verification Required를 별도로 합산한다.

## Human Gate

다음은 `HUMAN_REQUIRED`다.

- 권한 또는 대상 소유권이 불명확함
- production 영향이나 데이터 손실 가능성
- 실제 사용자 데이터 노출 가능성
- 외부 서비스 비용 발생 가능성
- 대규모 자동 interaction
- 중요한 business logic 추론 충돌

사람의 승인도 안전정책 자체를 우회하지 않는다.

## Logging Contract

Monitor event는 `RESEARCH_ACTION_ALLOWED`, `RESEARCH_ACTION_LIMITED`, `RESEARCH_ACTION_BLOCKED`, `SAFE_SUBSTITUTE_SELECTED`, `USER_VERIFICATION_REQUIRED`, `RESEARCH_CONTINUED`를 사용한다. 각 event에는 action, reason category, affected model area, safe substitute, continued 여부를 기록할 수 있다. 민감한 값은 기록하지 않는다.

## Coverage Contract

연구 종료 receipt는 Observed Screens/Components/Behaviors/Flows/APIs/Data Entities, Inferred Logic, Unknown, Not Observable, Blocked, User Verification Required와 coverage를 분리해 보고한다. 불완전하지만 유효한 결과는 `PARTIAL_MODEL_COMPLETE`로 남길 수 있다.

## PHASE 0B Constraints

이번 추가 작업은 문서와 monitor 계약뿐이다. policy runtime, Analyzer, Archify, React Flow 및 기타 runtime은 구현하거나 설치하지 않는다. G01~G10이 AR01~AR07보다 우선하며 Core Schema는 변경하지 않는다.

# Universal Program Reconstruction Engine

STATUS: DRAFT

PHASE: PHASE-0

IMPLEMENTATION: NOT IMPLEMENTED

## Mission

실행 중인 원본 프로그램을 사용자 관점에서 관찰하고, 증거에 연결된 독립적인 Program Model로 구조화한다. 사람은 이 모델을 이해하고 수정하며, 수정된 Working Model은 Sanitizer를 거쳐 새로운 프로그램 생성에 사용할 Generated Model이 된다.

## Immutable Pipeline

```text
Original Program
    ↓
Observation
    ↓
Program Model
    ↓
Human Review / Modification
    ↓
Working Model
    ↓
Sanitizer
    ↓
Generated Model
    ↓
Codex Generator
    ↓
New Program
```

Codex는 원본 프로그램에서 새 프로그램 코드를 직접 생성하지 않는다. 각 단계는 독립적으로 검토하고 개선할 수 있어야 한다.

## Core Principles

1. Source of Truth는 외부 도구가 아니라 Program Model이다.
2. Analyzer는 Observation을 생성하고, Normalizer가 Program Model을 만든다.
3. 관찰된 사실, 파생 결과, 추론, 사용자 검증 및 충돌을 구분한다.
4. 주요 판단은 Evidence와 연결한다.
5. Original Model은 불변이며 Working Model 및 Generated Model과 분리한다.
6. 사람의 검토와 수정은 Codex Generator보다 먼저 수행한다.
7. Visual Editor 변경은 그림이 아니라 Working Model을 변경한다.
8. Archify는 이해·검증용 Projection Adapter이고 React Flow는 Visual Program Editor이다.
9. 샘플 Program Model의 시각화·수정·정확한 JSON 변경을 실제 Analyzer보다 먼저 검증한다.
10. SMALL V0.1은 실제 E2E vertical slice를 우선하고 대형 Graph DB, Joern runtime, 대형 Local LLM 및 분산 구조를 도입하지 않는다.

## Required Delivery Order

PHASE 0에서 계약, 샘플 Program Model, React Flow 변환 proof, Archify Architecture/Workflow 변환 proof를 먼저 검증한다. 이 검증이 PASS하기 전에는 실제 Web Analyzer 구현을 시작하지 않는다.

## Current Gate

PHASE 0A bootstrap만 수행한다. 상세 schema 설계, 의존성 설치 및 기능 구현은 아직 허용되지 않는다.

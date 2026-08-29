# Observation and Evidence Schema V0.1

STATUS: REVIEW_READY

PHASE: PHASE-0B

## Observation Boundary

Analyzer는 Program Model을 직접 만들지 않는다.

`Input → Analyzer → Observation → Normalizer → Program Model`

Observation schema는 ID, source adapter, subject reference, type, raw/normalized value, evidence references, confidence, captured time을 요구한다.

## Extensible Sources

- Web: `WEB_DOM`, `WEB_ACCESSIBILITY`, `WEB_NETWORK`
- Windows: `WINDOWS_UIA`, `WINDOWS_WIN32`, `WINDOWS_ACCESSIBILITY`
- Other: `VISION`, `DOCUMENT`, `RUNTIME`, `USER`
- Source: `SOURCE_AST`, `SOURCE_PATTERN`
- Transformation: `RULE_ENGINE`, `AI_INFERENCE`, `OSS_IMPORT`

Source 세부 payload는 Observation boundary에 머물고 Core Entity 필드가 되지 않는다.

## Evidence

Evidence는 string 배열이 아닌 독립 entity다. 필수 필드는 `evidence_id`, `type`, `source_adapter`, `subject_ref`, 기술 중립 `locator`, `captured_at`, `digest`, `confidence`, `provenance`다. subject reference와 digest로 원본 receipt를 추적하며 `CONFLICT`는 충돌 Evidence를 삭제하지 않는다.

## Protected Assets and OSS

ProtectedAsset은 asset type, semantic role, origin, reuse status, replacement strategy를 보존한다. OSSReference는 package, version, license, source, usage, reuse status를 보존한다. 둘 모두 evidence/provenance를 공유하므로 정책을 UI 구조와 독립적으로 확장할 수 있다.

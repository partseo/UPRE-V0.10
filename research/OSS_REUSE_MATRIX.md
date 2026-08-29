# OSS Reuse Matrix

STATUS: REVIEW_READY

PHASE: PHASE-0B

조사일: 2026-08-29. 상세 4개 항목은 공식 GitHub 저장소와 라이선스 파일을 기준으로 확인했다. 채택 결정이 아니라 adapter 경계 결정이다.

| Project | Capability | License | Current Structure | Potential Role | SMALL | MEDIUM | Adapter | Direct Reuse | Research Status | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [tt-a1i/archify](https://github.com/tt-a1i/archify) | 5종 typed diagram, validation, standalone HTML/export | MIT | agent skill, typed JSON IR, CLI/validators, examples, renderer; upstream stable v2.13.0 | Understand/validation projection | Architecture + Workflow proof | More views/live projection | Required | Renderer/validator after review | REVIEWED | ADAPTER; never Core |
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | Node-based React/Svelte editors | MIT | monorepo: `packages/react`, `packages/svelte`, `packages/system` | Visual Program Editor | Later edit proof | Rich editing/warehouse UX | Required | UI library after approval | REVIEWED | ADAPTER; editor state excluded |
| [tree-sitter/tree-sitter](https://github.com/tree-sitter/tree-sitter) | Incremental, error-tolerant syntax parsing | MIT | Rust/C workspace, CLI, bindings, grammar ecosystem | Optional Source Analyzer | Not URL-first dependency | Source symbol extraction | Required | Library per grammar | REVIEWED | OPTIONAL_SOURCE_ADAPTER |
| [ast-grep/ast-grep](https://github.com/ast-grep/ast-grep) | Structural AST search/lint/rewrite | MIT | Rust crates, CLI, npm bindings, schemas, fixtures | Optional structural analysis | Not URL-first dependency | Pattern observations | Required | CLI/library after rules review | REVIEWED | OPTIONAL_SOURCE_ADAPTER |
| tecture-io/tecture | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | Research reference | No runtime | Candidate | TBD | No | CANDIDATE_ONLY | RESEARCH_BACKLOG |
| likec4/likec4 | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | Research reference | No runtime | Candidate | TBD | No | CANDIDATE_ONLY | RESEARCH_BACKLOG |
| structurizr/structurizr | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | Research reference | No runtime | Candidate | TBD | No | CANDIDATE_ONLY | RESEARCH_BACKLOG |
| axumquant/arch-viewer | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | Research reference | No runtime | Candidate | TBD | No | CANDIDATE_ONLY | RESEARCH_BACKLOG |
| joernio/joern | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | Future deep source analysis | Excluded | Candidate | TBD | No | CANDIDATE_ONLY | RESEARCH_BACKLOG |
| cytoscape/cytoscape.js | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | Alternative projection | No runtime | Candidate | TBD | No | CANDIDATE_ONLY | RESEARCH_BACKLOG |
| ashfordeOU/grasp | NOT_REVIEWED | NOT_REVIEWED | NOT_REVIEWED | Benchmark only | Excluded | Candidate | TBD | No | CANDIDATE_ONLY | RESEARCH_BACKLOG |

## Detailed Boundaries

- Archify IR, layout and rendering stay under `projections/archify` or an adapter-owned schema.
- xyflow visual elements/events stay under `visual`; only semantic Model Commands reach Working Model.
- Tree-sitter parse trees and ast-grep matches become source Observation/Evidence, never Core entities.
- No reviewed runtime is installed in PHASE 0B.

## Official Evidence

- Archify repository, typed IR and current release: https://github.com/tt-a1i/archify
- Archify MIT license: https://github.com/tt-a1i/archify/blob/main/LICENSE
- xyflow monorepo and MIT license: https://github.com/xyflow/xyflow and https://github.com/xyflow/xyflow/blob/main/LICENSE
- Tree-sitter structure and MIT license: https://github.com/tree-sitter/tree-sitter and https://github.com/tree-sitter/tree-sitter/blob/master/LICENSE
- ast-grep structure and MIT license: https://github.com/ast-grep/ast-grep and https://github.com/ast-grep/ast-grep/blob/main/LICENSE

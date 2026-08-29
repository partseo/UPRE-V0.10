const COLLECTION_TYPES = Object.freeze({
  screens: "SCREEN", components: "COMPONENT", actions: "ACTION", behaviors: "BEHAVIOR", flows: "FLOW",
  data_entities: "DATA_ENTITY", logic_rules: "LOGIC_RULE", protected_assets: "PROTECTED_ASSET", oss_references: "OSS_REFERENCE"
});
const TRUTH_VALUES = new Set(["OBSERVED", "DERIVED", "INFERRED", "USER_VERIFIED", "CONFLICT"]);
const SNAPSHOT_KINDS = new Set(["ORIGINAL_MODEL", "WORKING_MODEL", "GENERATED_MODEL"]);

function issue(code, message, path = "$") { return { code, message, path }; }
function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function addReference(errors, knownRefs, ref, path) {
  if (typeof ref !== "string" || !knownRefs.has(ref)) errors.push(issue("UNKNOWN_ENTITY_REFERENCE", `Unknown entity reference: ${String(ref)}`, path));
}

function validateMetadata(errors, entity, path, evidenceIds) {
  for (const key of ["id", "name", "origin", "truth", "evidence_ids", "confidence", "verification_status", "provenance"]) {
    if (!(key in entity)) errors.push(issue("MISSING_REQUIRED_FIELD", `Missing ${key}`, `${path}.${key}`));
  }
  if (!TRUTH_VALUES.has(entity.truth)) errors.push(issue("INVALID_TRUTH_CLASSIFICATION", `Invalid truth: ${String(entity.truth)}`, `${path}.truth`));
  if (!Array.isArray(entity.evidence_ids)) errors.push(issue("INVALID_EVIDENCE_REFERENCES", "evidence_ids must be an array", `${path}.evidence_ids`));
  if (!Array.isArray(entity.provenance) || entity.provenance.length === 0) errors.push(issue("MISSING_PROVENANCE", "At least one provenance record is required", `${path}.provenance`));
  for (const id of entity.evidence_ids ?? []) if (!evidenceIds.has(id)) errors.push(issue("UNKNOWN_EVIDENCE_REFERENCE", `Unknown evidence reference: ${id}`, `${path}.evidence_ids`));
  if (entity.truth === "INFERRED") {
    const inference = (entity.provenance ?? []).find(({ method, source_adapter }) => method === "INFERRED" && source_adapter === "AI_INFERENCE");
    const hasInferenceRecord = isObject(inference?.inference) && Array.isArray(inference.inference.evidence_refs) && inference.inference.evidence_refs.length > 0;
    if ((entity.evidence_ids?.length ?? 0) === 0 || !hasInferenceRecord) errors.push(issue("INFERRED_REQUIRES_EVIDENCE_AND_INFERENCE_PROVENANCE", "INFERRED entities require evidence and explicit AI inference provenance", path));
  }
  if (entity.truth === "USER_VERIFIED") {
    const enteredByUser = (entity.provenance ?? []).some(({ method, source_adapter }) => method === "ENTERED" && source_adapter === "USER");
    if (!enteredByUser) errors.push(issue("USER_VERIFIED_REQUIRES_USER_PROVENANCE", "USER_VERIFIED entities require USER provenance", path));
  }
  if (entity.truth === "CONFLICT" && (entity.evidence_ids?.length ?? 0) < 2) errors.push(issue("CONFLICT_REQUIRES_MULTIPLE_EVIDENCE", "CONFLICT entities require at least two evidence records", path));
}

function validateSnapshots(errors, model, knownRefs, relationIds) {
  const snapshotIds = new Set((model.snapshots ?? []).map(({ snapshot_id }) => snapshot_id));
  for (const [index, snapshot] of (model.snapshots ?? []).entries()) {
    const path = `$.snapshots[${index}]`;
    if (!SNAPSHOT_KINDS.has(snapshot.model_kind)) errors.push(issue("INVALID_MODEL_KIND", `Invalid model kind: ${String(snapshot.model_kind)}`, `${path}.model_kind`));
    if (snapshot.model_kind === "ORIGINAL_MODEL" && (snapshot.immutable !== true || snapshot.based_on_snapshot_id !== null)) errors.push(issue("ORIGINAL_MODEL_MUST_BE_IMMUTABLE", "ORIGINAL_MODEL must be immutable and have no base snapshot", path));
    if (snapshot.model_kind === "WORKING_MODEL" && (snapshot.immutable !== false || !snapshotIds.has(snapshot.based_on_snapshot_id))) errors.push(issue("WORKING_MODEL_REQUIRES_ORIGINAL_BASE", "WORKING_MODEL must be mutable and reference an existing base snapshot", path));
    if (snapshot.model_kind === "GENERATED_MODEL" && (snapshot.immutable !== true || !snapshotIds.has(snapshot.based_on_snapshot_id) || !snapshot.sanitizer_status)) errors.push(issue("GENERATED_MODEL_REQUIRES_SANITIZED_BASE", "GENERATED_MODEL must be immutable, based on a snapshot, and carry sanitizer status", path));
    for (const [refIndex, ref] of (snapshot.entity_refs ?? []).entries()) addReference(errors, knownRefs, ref, `${path}.entity_refs[${refIndex}]`);
    for (const ref of snapshot.relation_refs ?? []) if (!relationIds.has(ref)) errors.push(issue("UNKNOWN_RELATION_REFERENCE", `Unknown relation reference: ${ref}`, `${path}.relation_refs`));
  }
  const revisionIds = new Set((model.model_revisions ?? []).map(({ revision_id }) => revision_id));
  for (const [index, revision] of (model.model_revisions ?? []).entries()) {
    if (!snapshotIds.has(revision.snapshot_id)) errors.push(issue("UNKNOWN_SNAPSHOT_REFERENCE", `Unknown snapshot: ${revision.snapshot_id}`, `$.model_revisions[${index}].snapshot_id`));
    if (revision.parent_revision_id !== null && !revisionIds.has(revision.parent_revision_id)) errors.push(issue("UNKNOWN_REVISION_REFERENCE", `Unknown revision: ${revision.parent_revision_id}`, `$.model_revisions[${index}].parent_revision_id`));
  }
}

export function validateModel(model) {
  const errors = [];
  if (!isObject(model)) return [issue("INVALID_MODEL", "Program Model must be an object")];
  for (const key of ["schema_version", "program", "snapshots", "model_revisions", "entities", "relations", "evidence", "decisions"]) if (!(key in model)) errors.push(issue("MISSING_REQUIRED_FIELD", `Missing ${key}`, `$.${key}`));
  if (!isObject(model.program) || !isObject(model.entities)) return [...errors, issue("INVALID_MODEL_SHAPE", "program and entities must be objects")];
  for (const key of ["snapshots", "model_revisions", "relations", "evidence", "decisions"]) if (!Array.isArray(model[key])) errors.push(issue("INVALID_COLLECTION", `${key} must be an array`, `$.${key}`));

  const evidenceIds = new Set((model.evidence ?? []).map(({ evidence_id }) => evidence_id));
  const knownRefs = new Set([`PROGRAM:${model.program.id}`]);
  const entities = [[model.program, "$.program"]];
  for (const [collection, type] of Object.entries(COLLECTION_TYPES)) {
    const values = model.entities[collection];
    if (!Array.isArray(values)) { errors.push(issue("INVALID_COLLECTION", `${collection} must be an array`, `$.entities.${collection}`)); continue; }
    for (const [index, entity] of values.entries()) { knownRefs.add(`${type}:${entity.id}`); entities.push([entity, `$.entities.${collection}[${index}]`]); }
  }
  for (const decision of model.decisions ?? []) knownRefs.add(`DECISION:${decision.decision_id}`);
  for (const [entity, path] of entities) validateMetadata(errors, entity, path, evidenceIds);

  const relationIds = new Set((model.relations ?? []).map(({ relation_id }) => relation_id));
  for (const [index, relation] of (model.relations ?? []).entries()) {
    addReference(errors, knownRefs, relation.source_ref, `$.relations[${index}].source_ref`);
    addReference(errors, knownRefs, relation.target_ref, `$.relations[${index}].target_ref`);
    for (const id of relation.evidence_ids ?? []) if (!evidenceIds.has(id)) errors.push(issue("UNKNOWN_EVIDENCE_REFERENCE", `Unknown evidence: ${id}`, `$.relations[${index}].evidence_ids`));
  }
  for (const [index, evidence] of (model.evidence ?? []).entries()) addReference(errors, knownRefs, evidence.subject_ref, `$.evidence[${index}].subject_ref`);
  for (const [index, decision] of (model.decisions ?? []).entries()) addReference(errors, knownRefs, decision.target_ref, `$.decisions[${index}].target_ref`);
  for (const [index, behavior] of (model.entities.behaviors ?? []).entries()) {
    addReference(errors, knownRefs, behavior.trigger_ref, `$.entities.behaviors[${index}].trigger_ref`);
    addReference(errors, knownRefs, behavior.action_ref, `$.entities.behaviors[${index}].action_ref`);
    for (const [refIndex, ref] of (behavior.result_refs ?? []).entries()) addReference(errors, knownRefs, ref, `$.entities.behaviors[${index}].result_refs[${refIndex}]`);
  }
  for (const [index, flow] of (model.entities.flows ?? []).entries()) for (const [refIndex, ref] of (flow.behavior_refs ?? []).entries()) addReference(errors, knownRefs, ref, `$.entities.flows[${index}].behavior_refs[${refIndex}]`);
  validateSnapshots(errors, model, knownRefs, relationIds);
  return errors;
}

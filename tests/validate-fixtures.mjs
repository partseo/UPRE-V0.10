import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { validateModel } from "./lib/model-validator.mjs";
import { createSchemaValidator, schemaErrors } from "./lib/json-schema-validator.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validateSchema = await createSchemaValidator(root);
const tests = [];

function test(name, execute) {
  tests.push({ name, execute });
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

test("Layer A compiles all Draft 2020-12 schemas", async () => {
  const files = [
    "schemas/program-model.schema.json",
    "schemas/observation.schema.json",
    "schemas/evidence.schema.json",
    "schemas/decision.schema.json"
  ];
  for (const file of files) {
    const schema = await readJson(file);
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.match(schema.$id, /^https:\/\/upre\.local\/schemas\//);
    assert.equal(schema.type, "object");
  }
});

test("schemas declare required entities, truth, state, evidence, and adapter contracts", async () => {
  const programSchema = await readJson("schemas/program-model.schema.json");
  const evidenceSchema = await readJson("schemas/evidence.schema.json");
  const observationSchema = await readJson("schemas/observation.schema.json");
  const decisionSchema = await readJson("schemas/decision.schema.json");
  for (const definition of ["screen", "component", "action", "behavior", "flow", "dataEntity", "logicRule", "protectedAsset", "ossReference", "relation", "modelSnapshot", "modelRevision"]) assert(definition in programSchema.$defs);
  assert.deepEqual(programSchema.$defs.truthClassification.enum, ["OBSERVED", "DERIVED", "INFERRED", "USER_VERIFIED", "CONFLICT"]);
  assert(programSchema.$defs.relation.required.includes("truth"));
  assert.equal(programSchema.$defs.screen.unevaluatedProperties, false);
  assert(programSchema.$defs.modelSnapshot.allOf.some(({ if: condition }) => condition?.properties?.model_kind?.const === "ORIGINAL_MODEL"));
  for (const field of ["evidence_id", "type", "source_adapter", "subject_ref", "locator", "captured_at", "digest", "confidence"]) assert(evidenceSchema.required.includes(field));
  for (const adapter of ["WEB_DOM", "WINDOWS_UIA", "SOURCE_AST", "DOCUMENT", "RUNTIME", "USER"]) assert(observationSchema.$defs.sourceAdapter.enum.includes(adapter));
  assert.equal(decisionSchema.properties.user_verified.const, true);
});

test("positive fixture passes structural and semantic validation", async () => {
  const model = await readJson("fixtures/sample-program-model.json");
  assert.equal(validateSchema(model), true, JSON.stringify(schemaErrors(validateSchema)));
  assert.deepEqual(validateModel(model), []);
});

test("positive fixture covers required entities and customer relation chain", async () => {
  const model = await readJson("fixtures/sample-program-model.json");
  const screenNames = new Set(model.entities.screens.map(({ name }) => name));
  const componentNames = new Set(model.entities.components.map(({ name }) => name));
  for (const name of ["Login", "Dashboard", "Customer List", "Customer Detail", "Consultation"]) assert(screenNames.has(name));
  for (const name of ["Sidebar", "Search Panel", "Customer Table", "Customer Form", "Consultation Form"]) assert(componentNames.has(name));
  const relationKeys = new Set(model.relations.map(({ relation_type, source_ref, target_ref }) => `${relation_type}|${source_ref}|${target_ref}`));
  assert(relationKeys.has("TRIGGERS|COMPONENT:search-button|ACTION:search-customer"));
  assert(relationKeys.has("USES|BEHAVIOR:customer-search|ACTION:search-customer"));
  assert(relationKeys.has("PART_OF_FLOW|BEHAVIOR:customer-search|FLOW:customer-flow"));
  assert(relationKeys.has("READS|BEHAVIOR:customer-search|DATA_ENTITY:customer"));
  assert.equal(model.entities.logic_rules.length > 0, true);
  assert.equal(model.entities.protected_assets.length > 0, true);
  assert.equal(model.entities.oss_references.length > 0, true);
  assert.equal(model.decisions.length > 0, true);
  assert.equal(model.model_revisions.length, 3);
});

test("snapshot entity values remain isolated across original, working, and generated models", async () => {
  const model = await readJson("fixtures/sample-program-model.json");
  const valuesById = new Map(model.entity_versions.map((version) => [version.entity_version_id, version.value]));
  const snapshotsByKind = new Map(model.snapshots.map((snapshot) => [snapshot.model_kind, snapshot]));
  const original = valuesById.get(snapshotsByKind.get("ORIGINAL_MODEL").entity_version_refs.find((ref) => ref.includes("customer-list")));
  const working = valuesById.get(snapshotsByKind.get("WORKING_MODEL").entity_version_refs.find((ref) => ref.includes("customer-list")));
  const generated = valuesById.get(snapshotsByKind.get("GENERATED_MODEL").entity_version_refs.find((ref) => ref.includes("customer-list")));

  working.name = "Working Customer Directory";
  assert.equal(original.name, "Customer List");
  generated.name = "Generated Customer Directory";
  assert.equal(original.name, "Customer List");
  assert.equal(working.name, "Working Customer Directory");
});

test("semantic validation rejects a value version shared across snapshots", async () => {
  const model = await readJson("fixtures/sample-program-model.json");
  const original = model.snapshots.find(({ model_kind }) => model_kind === "ORIGINAL_MODEL");
  const working = model.snapshots.find(({ model_kind }) => model_kind === "WORKING_MODEL");
  working.entity_version_refs = [...original.entity_version_refs];
  const codes = validateModel(model).map(({ code }) => code);
  assert(codes.includes("VERSION_SHARED_ACROSS_SNAPSHOTS"), codes.join(", "));
});

test("snapshot relation values remain isolated across original, working, and generated models", async () => {
  const model = await readJson("fixtures/sample-program-model.json");
  const valuesById = new Map(model.relation_versions.map((version) => [version.relation_version_id, version.value]));
  const snapshotsByKind = new Map(model.snapshots.map((snapshot) => [snapshot.model_kind, snapshot]));
  const original = valuesById.get(snapshotsByKind.get("ORIGINAL_MODEL").relation_version_refs.find((ref) => ref.includes("screen-search")));
  const working = valuesById.get(snapshotsByKind.get("WORKING_MODEL").relation_version_refs.find((ref) => ref.includes("screen-search")));
  const generated = valuesById.get(snapshotsByKind.get("GENERATED_MODEL").relation_version_refs.find((ref) => ref.includes("screen-search")));

  working.target_ref = "COMPONENT:sidebar";
  assert.equal(original.target_ref, "COMPONENT:search-panel");
  generated.target_ref = "COMPONENT:customer-table";
  assert.equal(original.target_ref, "COMPONENT:search-panel");
  assert.equal(working.target_ref, "COMPONENT:sidebar");
});

test("semantic validation rejects a relation version shared across snapshots", async () => {
  const model = await readJson("fixtures/sample-program-model.json");
  const original = model.snapshots.find(({ model_kind }) => model_kind === "ORIGINAL_MODEL");
  const working = model.snapshots.find(({ model_kind }) => model_kind === "WORKING_MODEL");
  working.relation_version_refs = [...original.relation_version_refs];
  const codes = validateModel(model).map(({ code }) => code);
  assert(codes.includes("VERSION_SHARED_ACROSS_SNAPSHOTS"), codes.join(", "));
});

test("relation truth policies match entity truth policies", async () => {
  const base = await readJson("fixtures/sample-program-model.json");
  const cases = [
    ["INFERRED", ["EV-search-button"], [{ method: "INFERRED", source_adapter: "AI_INFERENCE" }], "INFERRED_REQUIRES_EVIDENCE_AND_INFERENCE_PROVENANCE"],
    ["CONFLICT", ["EV-search-button"], [{ method: "OBSERVED", source_adapter: "WEB_ACCESSIBILITY" }], "CONFLICT_REQUIRES_MULTIPLE_EVIDENCE"],
    ["USER_VERIFIED", ["EV-search-button"], [{ method: "OBSERVED", source_adapter: "WEB_ACCESSIBILITY" }], "USER_VERIFIED_REQUIRES_USER_PROVENANCE"]
  ];
  for (const [truth, evidenceIds, provenance, expectedCode] of cases) {
    const model = structuredClone(base);
    Object.assign(model.relations[0], { truth, evidence_ids: evidenceIds, provenance });
    assert.equal(validateSchema(model), false, `${truth} relation unexpectedly passed Layer A`);
    const codes = validateModel(model).map(({ code }) => code);
    assert(codes.includes(expectedCode), `Expected ${expectedCode}; received ${codes.join(", ")}`);
  }
});

for (const [file, expectedCode] of [
  ["neg-01-missing-screen-reference.json", "UNKNOWN_ENTITY_REFERENCE"],
  ["neg-02-inferred-without-evidence.json", "INFERRED_REQUIRES_EVIDENCE_AND_INFERENCE_PROVENANCE"],
  ["neg-03-original-model-mutable.json", "ORIGINAL_MODEL_MUST_BE_IMMUTABLE"]
]) {
  test(`${file} fails closed with ${expectedCode}`, async () => {
    const fixture = await readJson(`fixtures/invalid/${file}`);
    const codes = validateModel(fixture.program_model).map(({ code }) => code);
    assert(codes.includes(expectedCode), `Expected ${expectedCode}; received ${codes.join(", ")}`);
  });
}

test("core schemas contain no external viewer or editor vocabulary", async () => {
  const schemaFiles = (await readdir(path.join(root, "schemas"))).filter((name) => name.endsWith(".json"));
  const forbidden = ["archify", "reactflow", "playwright", "viewport", "renderer-only", "ui coordinate"];
  for (const file of schemaFiles) {
    const content = (await readFile(path.join(root, "schemas", file), "utf8")).toLowerCase();
    for (const token of forbidden) assert.equal(content.includes(token), false, `${file} contains ${token}`);
  }
});

for (const file of ["neg-04-react-flow-position.json", "neg-05-archify-renderer-metadata.json"]) {
  test(`${file} is rejected by the closed core contract`, async () => {
    const fixture = await readJson(`fixtures/invalid/${file}`);
    const model = await readJson("fixtures/sample-program-model.json");
    const entity = model.entities[fixture.mutation.collection].find(({ id }) => id === fixture.mutation.entity_id);
    entity[fixture.mutation.field] = fixture.mutation.value;
    assert.equal(validateSchema(model), false);
    const errors = schemaErrors(validateSchema);
    assert(errors.some(({ keyword, instancePath }) => keyword === fixture.expected_keyword && instancePath.startsWith("/entities/screens/")), JSON.stringify(errors));
  });
}

let passed = 0;
const failures = [];
const startedAt = new Date().toISOString();

for (const { name, execute } of tests) {
  try {
    await execute();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(error instanceof Error ? error.message : String(error));
  }
}

console.log(JSON.stringify({ started_at: startedAt, finished_at: new Date().toISOString(), tests: tests.length, passed, failed: failures.length, not_run: 0 }));
process.exitCode = failures.length === 0 ? 0 : 1;

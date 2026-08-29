import { readFile } from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const PROGRAM_SCHEMA_ID = "https://upre.local/schemas/program-model.schema.json";
const SCHEMA_FILES = Object.freeze([
  "program-model.schema.json",
  "observation.schema.json",
  "evidence.schema.json",
  "decision.schema.json"
]);

export async function createSchemaValidator(root) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const file of SCHEMA_FILES) {
    const content = await readFile(path.join(root, "schemas", file), "utf8");
    const schema = JSON.parse(content);
    if (!ajv.validateSchema(schema)) {
      throw new Error(`Invalid JSON Schema ${file}: ${ajv.errorsText(ajv.errors)}`);
    }
    ajv.addSchema(schema);
  }
  const validate = ajv.getSchema(PROGRAM_SCHEMA_ID);
  if (validate === undefined) throw new Error(`Schema not registered: ${PROGRAM_SCHEMA_ID}`);
  return validate;
}

export function schemaErrors(validate) {
  return structuredClone(validate.errors ?? []);
}

import { protocolVersion } from "@indirection/protocol";
import type { JsonObject, JsonValue } from "@indirection/protocol";
import { z } from "zod";

export const schemaPackageName = "@indirection/schema";
export const schemaVersion = 1;
export const supportedProtocolVersion = protocolVersion;

const namespacePattern = /^[a-z0-9_-]+$/;
const assetReferencePattern = /^[a-z0-9_-]+(:[a-z0-9_-]+(\.[a-z0-9_-]+)*)?$|^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/;

export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema)
  ])
);

export const jsonObjectSchema: z.ZodType<JsonObject> = z.record(
  z.string(),
  jsonValueSchema
);

export const variantConditionSchema = z
  .record(z.string().min(1), z.array(z.string().min(1)).min(1))
  .readonly();

export const manifestSourceSchema = z
  .object({
    url: z.string().min(1),
    when: variantConditionSchema.optional(),
    bytes: z.number().int().nonnegative().optional(),
    integrity: z.string().min(1).optional()
  })
  .strict()
  .readonly();

export const manifestAssetSchema = z
  .object({
    type: z.string().min(1),
    sources: z.array(manifestSourceSchema).min(1),
    dependencies: z.array(z.string().regex(assetReferencePattern)).optional(),
    fallback: z.string().regex(assetReferencePattern).optional(),
    metadata: jsonObjectSchema.optional(),
    extensions: z.record(z.string().min(1), jsonValueSchema).optional()
  })
  .strict()
  .readonly();

export const manifestGroupSchema = z
  .object({
    assets: z.array(z.string().regex(assetReferencePattern)).min(1)
  })
  .strict()
  .readonly();

export const indirectionManifestSchema = z
  .object({
    schemaVersion: z.literal(schemaVersion),
    namespace: z.string().regex(namespacePattern).optional(),
    assets: z.record(z.string().min(1), manifestAssetSchema),
    groups: z.record(z.string().min(1), manifestGroupSchema).optional()
  })
  .strict()
  .readonly();

export type IndirectionManifest = z.infer<typeof indirectionManifestSchema>;
export type IndirectionManifestAsset = z.infer<typeof manifestAssetSchema>;
export type IndirectionManifestSource = z.infer<typeof manifestSourceSchema>;
export type IndirectionManifestGroup = z.infer<typeof manifestGroupSchema>;

export function parseIndirectionManifest(input: unknown): IndirectionManifest {
  return indirectionManifestSchema.parse(input);
}

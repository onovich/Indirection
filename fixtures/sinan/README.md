# Sinan Fixture

This directory contains a desensitized Sinan Engine-style asset manifest for Indirection importer and report tests.

The fixture is intentionally host-owned:

- It is not an Indirection authoring manifest.
- It keeps Sinan-style asset ids, URL fields, budget hints, fallback hints, groups, and references together.
- It includes one missing reference so report generation can prove diagnostics without modifying Sinan runtime data.

Report contract:

- Generated reports are derived artifacts and can be rebuilt from this fixture.
- Repeated report generation must produce byte-stable JSON-compatible data.
- Report generation must not mutate this host-owned fixture input.
- Missing reference diagnostics use stable diagnostic codes and structured paths; messages remain explanatory text, not API keys.

# Sinan Fixture

This directory contains a desensitized Sinan Engine-style asset manifest for Indirection importer and report tests.

The fixture is intentionally host-owned:

- It is not an Indirection authoring manifest.
- It keeps Sinan-style asset ids, URL fields, budget hints, fallback hints, groups, and references together.
- It includes one missing reference so report generation can prove diagnostics without modifying Sinan runtime data.

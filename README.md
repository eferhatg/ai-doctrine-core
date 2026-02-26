# Doctrine

Doctrine is a policy enforcement layer for agent tool governance.

Package name: `ai-doctrine`.

This repository is scaffolded as a single package with modular folders:

- `src/core`: framework-agnostic authorization runtime
- `src/mastra`: Mastra integration helpers and addon APIs

## Status

This is an implementation scaffold derived from the OpenSpec delta:

- deterministic policy path discovery
- fail-closed authorization pipeline
- deny precedence support
- structured audit logging hooks
- safe hot reload primitives
- plugin-style Mastra integration surface

## Layout

`docs/IMPLEMENTATION_PLAN.md` contains a step-by-step build plan.

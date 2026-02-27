# Doctrine

Doctrine is a policy enforcement layer for agent tool governance.

Package name: `@ai-doctrine/core`.

This repository contains the framework-agnostic Doctrine core runtime:

- `src/core`: authorization runtime, policy loading, decision contracts, and metadata parsing

## Status

This is an implementation scaffold derived from the OpenSpec delta:

- deterministic policy path discovery
- fail-closed authorization pipeline
- deny precedence support
- structured audit logging hooks
- safe hot reload primitives

Mastra integration lives in a separate package: `@ai-doctrine/mastra`.

## Layout

`docs/IMPLEMENTATION_PLAN.md` contains a step-by-step build plan.

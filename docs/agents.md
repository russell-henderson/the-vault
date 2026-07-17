# Vault Architect Authority Model Implementation Plan

## Stage 6 implementation status

The authority model described in this plan is active. The registry exposes policy metadata and validation, the Analyzer returns consultative `suggestedGeneratorId` discovery, and the Orchestrator alone builds the passed provider context. See [`ARCHITECTURE_CONTRACT.md`](ARCHITECTURE_CONTRACT.md), [`ARCHITECTURE_ENRICHMENT.md`](ARCHITECTURE_ENRICHMENT.md), and [`adr/ADR-001-authority-model.md`](adr/ADR-001-authority-model.md) for the durable contract and decision.

## Objective

Implement a policy-driven synthesis architecture where:

1. External enrichment can improve discovery but has zero authority.
2. `GeneratorRegistry` becomes the canonical policy engine.
3. `Orchestrator` becomes the enforcement boundary.
4. Every synthesis request is validated against registry policy.
5. Provenance captures the exact authorized path used to generate artifacts.

The implementation should introduce these guarantees without breaking existing generators.

---

# Phase 1: Architecture Baseline Audit

## Goal

Understand the current synthesis pipeline before modifying behavior.

## Tasks

### 1. Map current execution flow

Identify:

```code
User Input
    ↓
Analyzer
    ↓
Generator Selection
    ↓
Orchestrator
    ↓
Generator
    ↓
Artifact Output
```

Document:

* Where stack recommendations originate.
* Where generator IDs are created.
* Where versions are stored.
* Where validation currently occurs.
* Where provenance is currently captured.

---

### 2. Inventory current generator system

Create a registry audit.

Example:

```json
{
  "generator_id": "react-vite-tailwind",
  "framework": "React",
  "version": "19",
  "template": "standard-dashboard",
  "status": "supported"
}
```

Identify missing metadata:

* version constraints
* compatibility rules
* deprecated generators
* experimental generators
* ownership metadata

---

### 3. Create architecture decision record

Add:

```code
docs/adr/
└── ADR-001-authority-model.md
```

Contents:

* Problem
* Current failure mode
* Decision
* Authority hierarchy
* Migration strategy
* Consequences

---

# Phase 2: Convert GeneratorRegistry into Policy Engine

## Goal

Move from:

```code
GeneratorRegistry = lookup table
```

to:

```code
GeneratorRegistry = authorization authority
```

---

## New Registry Contract

Create explicit schema.

Example:

```typescript
interface GeneratorPolicy {
    id: string;

    name: string;

    framework: string;

    versions: {
        supported: string[];
        minimum?: string;
        maximum?: string;
    };

    templates: string[];

    capabilities: string[];

    constraints: {
        requires?: string[];
        conflicts?: string[];
    };

    lifecycle: {
        status:
          | "supported"
          | "experimental"
          | "deprecated"
          | "disabled";
    };

    metadata: {
        owner?: string;
        createdAt: string;
        updatedAt: string;
    };
}
```

---

## Required Registry Methods

Implement:

```python
registry.get_generator(id)

registry.is_supported(id)

registry.validate_request(request)

registry.get_authorized_options(filters)
```

---

## Validation Rules

The Registry must reject:

* unknown generator IDs
* unsupported versions
* disabled templates
* incompatible combinations
* deprecated generators without explicit override

Example:

```json
{
  "status": "review-required",
  "reason": "generator-version-unsupported",
  "details": {
    "requested": "React 20 beta",
    "supported": [
      "React 19"
    ]
  }
}
```

<br>

---

# Phase 3: Introduce Trust Boundary

## Goal

Prevent enrichment from influencing synthesis directly.

## New Pipeline

Replace:

```code
Analyzer
    ↓
Generator
    ↓
Synthesis
```

with:

```code
Analyzer
    ↓
Enrichment
    ↓
Registry Filtering
    ↓
Authorized Selection
    ↓
Orchestrator Validation
    ↓
Synthesis
```

---

# Phase 4: Analyzer Refactor

## Goal

Allow broad discovery while enforcing registry filtering.

---

## Current behavior

Potentially:

```
User:
"Build me an AI dashboard"

Analyzer:
"Use Next.js + React Server Components + XYZ"
```

Problem:

The model invented capability.

---

## New behavior

Analyzer receives:

```
User Intent

+

Enrichment Context

+

Registry Capability Slice
```

Returns:

```json
{
  "recommendations": [
    {
      "generator_id": "react-dashboard-v2",
      "confidence": 0.91,
      "reasoning": [
        "Matches dashboard requirements",
        "Supports authentication",
        "Registry approved"
      ]
    }
  ],

  "missing_information": [
    "database preference"
  ],

  "unsupported_discoveries": [
    {
      "technology": "Experimental Framework X",
      "reason": "Not registry authorized"
    }
  ]
}
```

---

# Phase 5: Orchestrator Enforcement Layer

## Goal

Make validation impossible to bypass.

---

## New Orchestrator Flow

```python
def synthesize(request):

    registry_result = registry.validate_request(
        request
    )

    if not registry_result.allowed:
        return ReviewRequired(
            reason=registry_result.reason
        )

    provenance = create_provenance(request)

    artifact = generator.execute(
        request
    )

    return artifact
```

---

## Critical Rule

No generator execution before:

```
Registry Validation == PASS
```

This should become a hard invariant.

---

# Phase 6: Provenance System

## Goal

Make every generated artifact explainable.

---

## Add provenance schema

Example:

```json
{
  "artifact_id": "abc123",

  "generator": {
    "id": "react-dashboard-v2",
    "registry_version": "0.5.0"
  },

  "orchestrator": {
    "version": "1.2.0"
  },

  "request": {
    "id": "req123"
  },

  "created_at": "2026-07-17T00:00:00Z"
}
```

---

## Rules

Discovery data:

```
temporary
```

Confirmed selection:

```
persistent provenance
```

Generated artifact:

```
traceable forever
```

---

# Phase 7: Architectural Invariant Tests

Create automated enforcement.

Location:

```
tests/
└── architecture/
    ├── test_registry_policy.py
    ├── test_trust_boundary.py
    ├── test_provenance.py
    └── test_orchestrator_validation.py
```

---

## Required Tests

### Registry authority

Test:

```
unsupported generator
    ↓
rejected
```

---

### Version drift prevention

Test:

```
React 20 beta request

Registry:
React 19 only

Result:
review-required
```

---

### Enrichment isolation

Test:

```
Enrichment suggests unsupported stack

Analyzer output:
visible

Synthesis:
blocked
```

---

### Provenance completeness

Test:

Every artifact contains:

```
generator_id
registry_version
orchestrator_version
request_id
timestamp
```

---

# Phase 8: Documentation Contract

Create:

```
docs/
├── ARCHITECTURE_CONTRACT.md
├── ARCHITECTURE_ENRICHMENT.md
└── adr/
    └── ADR-001-authority-model.md
```

---

## ARCHITECTURE_CONTRACT.md Structure

```md
# Vault Architect Architectural Contract

## Purpose

## Architecture Principles

## Authority Model

## Trust Boundary

## Registry Policy Engine

## Orchestrator Enforcement

## Architectural Invariants

## Provenance Guarantees

## Reference Workflow
```

---

# Phase 9: Migration Strategy

Avoid breaking existing workflows.

## Step 1

Add registry validation in warning mode.

```
validate()
    ↓
log violations
    ↓
continue
```

---

## Step 2

Enable enforcement.

```
validate()
    ↓
reject invalid
```

---

## Step 3

Remove legacy paths.

Delete:

* direct generator invocation
* analyzer-controlled stack selection
* undocumented generator IDs

---

# Final Target Architecture

```
                    User Intent
                         |
                         v
                  Analyzer Layer
                         |
             +-----------+-----------+
             |                       |
             v                       v
       Enrichment Sources       Registry Slice
             |                       |
             +-----------+-----------+
                         |
                         v
                  Authorized Options
                         |
                         v
                 User Confirmation
                         |
                         v
              +---------------------+
              |   Orchestrator      |
              |  Enforcement Gate   |
              +---------------------+
                         |
                         v
              GeneratorRegistry
              Policy Validation
                         |
                  PASS / FAIL
                         |
              +----------+----------+
              |                     |
              v                     v
          Synthesis          review-required
              |
              v
          Artifact
              |
              v
          Provenance Record
```

---

# Success Criteria

The implementation is complete when:

* No external source can introduce a new generator.
* No model output can bypass Registry validation.
* Every synthesis has a registry-authorized generator.
* Every artifact has provenance.
* Unsupported requests fail deterministically.
* Registry changes alone control supported capability expansion.
* Future contributors cannot accidentally reintroduce stack drift.

This gives Vault Architect a foundation closer to a compiler architecture: enrichment behaves like analysis hints, the registry behaves like a type system/policy layer, and the orchestrator behaves like the execution gate. That is the right abstraction for scaling the system.

# Final Review: Vault Architect Authority Model Implementation Plan

## Stage 6 disposition

The recommended authority separation is implemented. Enrichment remains untrusted, registry policy is canonical, and orchestrator authorization is required before either local provider can synthesize. Version and policy-hash pinning protect against drift; successful artifacts include authorization provenance; failed validation returns `review-required` without provider access or persistence.

## Overall Assessment

**Status: Implementation-ready**

The plan correctly establishes:

```
Discovery ≠ Authorization ≠ Execution
```

with the following ownership:

| Concern              | Owner                | Can influence synthesis? |
| -------------------- | -------------------- | ------------------------ |
| User intent          | User                 | Yes                      |
| Explicit constraints | Constraint extractor | Yes                      |
| Enrichment           | Discovery adapters   | No                       |
| Registry             | GeneratorRegistry    | Yes                      |
| Analyzer             | Recommendation only  | No                       |
| Orchestrator         | Authorization gate   | Yes                      |
| Provider             | Execution only       | No                       |

This is the correct separation.

---

# Recommended Adjustments Before Execution

## 1. Add a formal Authorization Result object

Currently:

```ts
registry.validateRequest(...)
```

returns a result, but the contract should be stronger.

Add:

```ts
interface RegistryValidationResult {
  status:
    | "passed"
    | "review-required";

  generatorId: string;

  registryVersion: string;

  violations: Array<{
    code: string;
    message: string;
    severity:
      | "error"
      | "warning";
  }>;

  authorizedCapabilities: {
    framework: string;
    language: string;
    platform: string;
    version: string;
  } | null;
}
```

Reason:

The Orchestrator should never have to reconstruct policy decisions. It should consume a complete authorization decision.

---

# 2. Separate Discovery Recommendation from Selection

The plan says:

```ts
recommendedStackId: string | null;
```

I would rename this.

"Recommended" implies authority.

Use:

```ts
suggestedGeneratorId: string | null;
```

or:

```ts
candidateGeneratorId: string | null;
```

The lifecycle becomes:

```
Candidate
    ↓
User Confirmation
    ↓
Authorization Request
    ↓
Authorized Generator
```

This reinforces that the Analyzer cannot select.

---

# 3. Add a Capability Fingerprint

This will become valuable as the system scales.

Add to GeneratorPolicy:

```ts
capabilityFingerprint: string;
```

Example:

```
swift-spritekit:
  mobile-native
  2d-game
  ios
  swift

python-flet:
  desktop-ui
  python
  cross-platform

react-typescript:
  web-ui
  typescript
  browser
```

Why:

Future enrichment systems can reason about capabilities without seeing implementation details.

The registry still remains authoritative.

---

# 4. Tighten Provider Isolation

The plan correctly says:

> Provider = execution only

I would make this explicit.

Provider input should never contain:

```
raw enrichment
```

or:

```
unsupported discovery
```

Provider receives only:

```ts
interface AuthorizedSynthesisContext {
    generatorPolicy;
    validatedConstraints;
    confirmedBrief;
    provenance;
}
```

This prevents accidental leakage.

---

# 5. Add a Hard Architecture Invariant

I would add this:

```md
A provider must never receive an unvalidated synthesis context.
```

This is probably the single most important runtime invariant.

---

# 6. Add Registry Version Pinning

You already capture:

```ts
registryVersion
```

in provenance.

I would make the request itself pin the version.

Example:

```ts
interface AuthorizedRequest {
    generatorId;
    registryVersion;
    policyHash;
}
```

Why:

If registry changes later:

```
React generator v1
allowed yesterday

React generator v2
allowed today
```

you can still reproduce historical builds.

---

# 7. Clarify Manual Endpoint Exception

This section is good, but I would make the boundary explicit:

Current:

> manual structured blueprint endpoint remains unchanged

Better:

```md
Manual blueprint creation is a separate trusted-input pathway.

It bypasses AI discovery and enrichment because the user directly supplies architectural intent.

It does not bypass:
- schema validation;
- provenance recording;
- export integrity checks.
```

Otherwise future developers may interpret "bypass" too broadly.

---

# Recommended Implementation Order

I would slightly adjust the execution sequence.

## Phase 0: Freeze Current Behavior

Before modifications:

* create baseline commit/tag
* run:

```
npm test
npm run typecheck
npm run build
npm run seed:demo
```

Capture results.

---

## Phase 1: Add Contracts First

Before behavior changes:

Create:

```
src/contracts/
    GeneratorPolicy.ts
    AuthorizationResult.ts
    DiscoveryEnricher.ts
    Provenance.ts
```

Reason:

This prevents implementation drift during refactoring.

---

## Phase 2: Registry Upgrade

Convert:

```
GeneratorRegistry
```

from:

```
lookup
```

to:

```
policy authority
```

No analyzer changes yet.

---

## Phase 3: Add Enforcement Shadow Mode

Before hard blocking:

```
validateRequest()

    |
    +-- pass
    |
    +-- fail

log only
```

Run against existing flows.

Look for hidden assumptions.

---

## Phase 4: Activate Enforcement

Change:

```
provider call
```

to:

```
authorization required
```

Hard fail:

```
review-required
```

---

## Phase 5: Add Enrichment

Only after authority works.

Order matters.

Bad order:

```
Add enrichment
      ↓
Try to control drift
```

Good order:

```
Build authority
      ↓
Allow enrichment safely
```

---

# Final Target Contract

After implementation, the system should satisfy:

```text
A user describes an application.

Analyzer discovers possibilities.

Enrichment provides additional context.

Registry determines what is allowed.

User confirms intent.

Orchestrator requests authorization.

Registry approves or rejects.

Provider executes only approved instructions.

Artifact records the authorization path.
```

---

# Final Codex Execution Prompt Recommendation

I would give Codex 5.6 this plan with one additional instruction:

> Implement this as a contract migration, not a feature addition. Preserve current supported generators and endpoints. Do not introduce new frameworks, fallback generators, automatic substitutions, or convenience paths. Any ambiguity should result in review-required, never silent selection.

That final sentence protects the entire design philosophy.

At this point the plan is sufficiently constrained that Codex should be able to execute it in phases with checkpoints without needing architectural reinterpretation.

# Vault Architect System Architecture

## High-Level Architecture

```
+-----------------------------+
| Developer |
| |
| Defines architecture intent |
+-------------+---------------+
|
v
+-----------------------------+
| Blueprint Layer |
| |
| Structured specifications |
| Requirements |
| Dependencies |
| Constraints |
+-------------+---------------+
|
v
+-----------------------------+
| Prompt Compiler |
| |
| Blueprint -> AI instruction |
| Deterministic generation |
+-------------+---------------+
|
v
+-----------------------------+
| AI Provider Adapter |
| |
| Provider abstraction |
| OpenAI/Codex ready |
| Local model compatible |
+-------------+---------------+
|
v
+-----------------------------+
| Execution Service |
| |
| Lifecycle tracking |
| Pending |
| Running |
| Completed |
| Failed |
+-------------+---------------+
|
v
+-----------------------------+
| Evidence Layer |
| |
| Artifacts |
| Outputs |
| Verification notes |
| Execution history |
+-----------------------------+
```


---


# Application Architecture

## Frontend

React Application

```
Dashboard
|
+-- Blueprint Creation
|
+-- Blueprint Detail
|
+-- Prompt Preview
|
+-- Execution Result
|
+-- Verification Panel
```


---

## Backend

### Fastify API

```
Routes
|
+-- Blueprint Routes
|
+-- Prompt Routes
|
+-- Execution Routes
|
+-- Verification Routes
```

### Services

```
+-- Repository Layer
|
+-- Prompt Compiler
|
+-- Execution Service
|
+-- AI Provider Adapter
```


---

# Data Flow

## Blueprint Creation

User Input

|

Zod Validation

|

SQLite Persistence

|

Blueprint Record


---

## Prompt Generation

```
Blueprint

|

Prompt Compiler

|

Prompt Artifact

|

Execution Ready
```


---

## AI Execution

```
Prompt Artifact

|

AI Provider

|

Execution Record

|

Artifact Evidence

|

Verification
```


---

# Design Principles

## Human Intent First

Architecture decisions originate from human-defined requirements.

---

## AI as an Engineering Partner

AI assists implementation but does not replace architectural judgment.

---

## Traceability

Every AI-assisted action should have:

- Input
- Process
- Output
- Verification

---

## Extensibility

The provider abstraction allows future support for:

- OpenAI models
- Local LLMs
- Additional AI systems
# Vault Architect — Enrichment Boundary

Enrichment is consultative only. `DiscoveryEnricher` adapters currently include local Mock and local Ollama-backed implementations; external network adapters are not enabled in Stage 6.

An enricher may return observations, a suggested generator ID, likely stack options, unsupported discoveries, missing information, and questions. These values remain untrusted and ephemeral. The Analyzer exposes them as `suggestedGeneratorId` and visible `unsupportedDiscoveries`, then intersects all actionable options with the authorized `GeneratorRegistry` slice.

The registry alone determines whether a generator, version, template, implementation detail, capability, lifecycle state, or constraint is supported. Enrichment cannot override explicit constraints or any registry policy metadata. A model-returned ID outside the authorized slice causes `review-required` and does not reach synthesis.

The Analyzer never creates an `ArchitecturePacket`, calls blueprint synthesis, or authorizes a generator. The Orchestrator re-extracts constraints after user confirmation and performs the final registry validation.

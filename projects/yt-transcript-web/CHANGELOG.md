# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-04

### Added
- **CLI Bridge**: New `yt-transcript` command-line tool using Click.
  - Commands: `extract` and `summary`.
  - Formats: `plain`, `md`, `json`.
  - Features: Multi-language support (`--language`), timestamp toggling, summary limits.
- **MCP Server**: Model Context Protocol adapter for IDE integration.
  - Tools: `mcp_extract_transcript` and `mcp_get_summary`.
  - Structured results via `MCPTranscriptResult`.
- **Test Suite**: Comprehensive TDD coverage (84 tests passing).
  - Core logic: 60 tests.
  - CLI Layer: 14 tests.
  - MCP Layer: 10 tests.

### Changed
- **Architecture**: Decoupled core `transcript_service` from FastAPI/Pydantic dependencies to enable standalone use by CLI and MCP adapters.
- **Error Handling**: Implemented uniform exception mapping across all access layers.
- **Requirements**: Updated dependencies to include `click>=8.0.0`.

### Fixed
- Hardcoded summary limits in MCP server (now configurable).
- Repository mismatch for PR submissions.

# E.T.D. CLI Comparison Report

**Date:** March 2, 2026  
**Author:** Zoe (Factory Lead)  
**Scope:** Codex, OpenCode, Kilo CLI comparison for Factory operations

---

## Executive Summary

| CLI | Status | Best For | Reliability | Fallback Priority |
|-----|--------|----------|-------------|-------------------|
| **Kilo** | ✅ Working | Config/systemd, simple scripts | High | **1st** |
| **OpenCode** | ⚠️ Intermittent | Medium complexity tasks | Medium | 2nd |
| **Codex** | ❌ Auth Issues | Complex implementations | Low (currently) | 3rd |

**Recommendation:** Use **Kilo** as primary fallback when Codex fails.

---

## Detailed Analysis

### 1. Codex CLI

**Command:** `codex`  
**Package:** `@openai/codex@0.106.0`  
**Model:** gpt-5.2-codex (default)

#### ✅ Strengths
- Most sophisticated agent
- Excellent for complex multi-file changes
- Strong code review capabilities
- Good for refactoring large codebases

#### ❌ Current Issues (March 2, 2026)
```
ERROR: unexpected status 401 Unauthorized: 
Could not parse your authentication token. 
Please try signing in again.
```
- **Root Cause:** Token parsing error
- **Impact:** Cannot spawn Codex for any tasks
- **Status:** Broken / Needs investigation

#### Usage Pattern
```bash
# One-shot with auto-approval
bash pty:true workdir:~/project command:"codex exec --full-auto 'Your task'"

# Background mode
bash pty:true workdir:~/project background:true command:"codex --yolo 'Your task'"
```

---

### 2. OpenCode CLI

**Command:** `opencode`  
**Package:** `opencode-ai@1.2.15`

#### ✅ Strengths
- Multiple provider support
- Good for research and exploration
- Flexible model selection

#### ⚠️ Issues Observed
- **Hangs frequently:** Gets stuck on "config-context" initialization
- **No output:** Sometimes runs but produces no files
- **Unreliable for production tasks**

#### Example Failure
```
[0m
> Sisyphus (Ultraworker) · glm-5-free
[0m
[config-context] getConfigContext() called before initConfigContext(); 
defaulting to CLI paths.
(Hangs indefinitely)
```

#### Usage Pattern
```bash
opencode run "Your task description"
```

---

### 3. Kilo CLI ⭐ RECOMMENDED

**Command:** `kilo`  
**Package:** `@kilocode/cli@7.0.30`  
**Default Model:** stepfun/step-3.5-flash:free

#### ✅ Strengths
- **Reliable:** Works when others fail
- **Fast:** Quick execution
- **Good for infrastructure:** Excels at config files, systemd services
- **Stable:** No auth issues observed

#### Real-World Success (YT-POST-MVP-001)
**Task:** Create systemd deployment files  
**Failed Agents:**
- Codex: 401 Auth error
- OpenCode: Hung with no output

**Kilo Success:**
```bash
kilo run "Create systemd deployment files for FastAPI backend"
```

**Results:**
- ✅ Created `deploy/yt-transcript.service`
- ✅ Created `deploy/install.sh`
- ✅ Created `deploy/status.sh`
- ✅ Committed all files
- ✅ Service deployed and running

#### Usage Pattern
```bash
kilo run "Your task description"
```

---

## Agent Selection Matrix

| Task Type | 1st Choice | 2nd Choice | 3rd Choice |
|-----------|-----------|------------|------------|
| Complex refactoring | Codex | Kilo | OpenCode |
| New feature development | Codex | Kilo | Manual |
| Systemd/config files | **Kilo** | Manual | - |
| Code review | Codex | Kilo | - |
| Quick scripts | Kilo | OpenCode | Manual |
| Research/exploration | OpenCode | Manual | - |

---

## Failure Recovery Protocol

### When an Agent Fails:

1. **Retry once** (transient error)
2. **Try next agent in hierarchy:**
   ```
   Codex → Kilo → OpenCode → Manual (with approval)
   ```
3. **Document failure** in Factory Guidelines
4. **Escalate to `needs_human`** if all agents fail

### Never:
- ❌ Silently take over failed agent tasks
- ❌ Skip to manual implementation without reporting
- ❌ Continue retrying same failing agent indefinitely

---

## Account Status (March 2, 2026)

### Codex Accounts
| Email | Status | Expires |
|-------|--------|---------|
| samade1996@gmail.com | ❌ 401 Error | 2026-03-07 |
| arbonlinebis@gmail.com | ❌ 401 Error | 2026-03-10 |
| samueladegoke16@gmail.com | ❌ 401 Error | 2026-03-10 |
| samadeptc@gmail.com | ❌ 401 Error | 2026-03-10 |
| samtobiadegoke@gmail.com | ❌ 401 Error | 2026-03-10 |

**Issue:** Tokens valid but API rejects them (parsing error)

### Kilo/OpenCode
| Status | Notes |
|--------|-------|
| ✅ Working | No auth issues observed |

---

## Installation

```bash
# Codex
npm install -g @openai/codex

# OpenCode
npm install -g opencode-ai

# Kilo
npm install -g @kilocode/cli

# Verify installations
which codex opencode kilo
```

---

## Environment Requirements

| CLI | PTY Required | Git Repo Required | Notes |
|-----|--------------|-------------------|-------|
| Codex | ✅ Yes | ✅ Yes | Fails without both |
| OpenCode | ✅ Recommended | No | Can run anywhere |
| Kilo | No | No | Most flexible |

---

## Quick Reference

### Spawn Commands

```bash
# Codex (when working)
bash pty:true workdir:~/project background:true \
  command:"codex --yolo exec 'Your task'"

# OpenCode
opencode run "Your task"

# Kilo (RECOMMENDED)
kilo run "Your task"
```

### Monitor Background Tasks

```bash
# List all sessions
process action:list

# Check specific session
process action:poll sessionId:XXX

# View logs
process action:log sessionId:XXX
```

---

## Lessons Learned

### March 2, 2026 - YT-Transcript-Web Deployment

**Scenario:** All primary agents failed for YT-POST-MVP-001

| Agent | Attempt | Result |
|-------|---------|--------|
| Codex | 1 | 401 Auth error |
| OpenCode | 1 | Hung, no output |
| OpenCode | 2 | Same issue |
| **Kilo** | **1** | **✅ Success** |

**Key Insight:** Kilo is the most reliable fallback for infrastructure/config tasks.

**Action Taken:** Updated Factory Guidelines to prioritize Kilo as 2nd choice.

---

## Recommendations

### Immediate Actions
1. **Investigate Codex auth issue** - May need token refresh or re-authentication
2. **Use Kilo for all tasks** until Codex is fixed
3. **Document all agent failures** for pattern analysis

### Long Term
1. **Maintain agent diversity** - Don't rely on single agent
2. **Regular health checks** - Verify all agents working monthly
3. **Fallback documentation** - Keep this report updated

---

## Related Documents

- [Factory Guidelines v2.1](../ETD_FACTORY_GUIDELINES.md)
- [YT-POST-MVP-001 Success Report](./YT-POST-MVP-001-Complete.md)
- [Coding Agent Skill](../../.npm-global/lib/node_modules/openclaw/skills/coding-agent/SKILL.md)

---

**Maintained by:** Zoe (Factory Lead)  
**Last Updated:** March 2, 2026  
**Review Schedule:** Weekly or after major agent failures

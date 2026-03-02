# E.T.D. Factory System Guidelines v2.1

**Last Updated:** March 2, 2026  
**Based On:** RavFlow v2 Protocol

---

## Overview

The Factory System is E.T.D.'s autonomous agent pipeline for code implementation, review, and deployment. Zoe (the orchestrator) never writes code directly - she spawns specialized agents for implementation and Council for review.

---

## Agent Hierarchy

### Primary Implementation Agents (in order of preference)

| Agent | CLI | Best For | Fallback Priority |
|-------|-----|----------|-------------------|
| **Codex** | `codex` | Complex implementations, refactoring | 1st |
| **Kilo** | `kilo` | Quick tasks, systemd/config files | 2nd |
| **OpenCode** | `opencode` | Medium complexity, research | 3rd |
| **Claude Code** | `claude` | Architecture decisions (if installed) | 4th |
| **Pi** | `pi` | Alternative when others fail (if installed) | 5th |

### Review Agents (Council Mode)

| Role | Model | Focus |
|------|-------|-------|
| **Architect** | GLM-5 / MiniMax M2.5 | Security, design patterns |
| **Verifier** | GLM-5 / MiniMax M2.5 | Correctness, edge cases |

---

## Agent Selection Guide

### When to Use Each Agent

#### Codex (Primary)
```bash
# Best for: Complex features, multi-file changes, tests
codex --yolo exec "Implement the auth module with JWT tokens"
```

#### Kilo (Fast/Reliable Alternative)
```bash
# Best for: Config files, systemd services, simple scripts
# Use when: Codex auth fails or other agents hang
kilo run "Create nginx config for this app"
```
**Kilo CLI Success Log:** See [YT-POST-MVP-001 report](#kilo-success-case)

#### OpenCode
```bash
# Best for: Research, documentation, exploration
opencode run "Analyze this codebase for security issues"
```

---

## Factory Workflow

### 1. Task Creation
```json
{
  "id": "PROJECT-TASK-001",
  "title": "Task description",
  "status": "pending",
  "priority": "high|medium|low",
  "repository": "owner/repo",
  "fixAttempts": 0,
  "lastScore": 0
}
```

### 2. Implementation Phase
1. **Update status:** `in_progress`
2. **Spawn agent:** Try Codex → Kilo → OpenCode
3. **Monitor:** Use `process(action=poll)` for background tasks
4. **On failure:** Respawn or escalate to `needs_human`

### 3. Council Review Phase
```bash
# Spawn Architect
opencode run "Review as Architect: focus on security and design"

# Spawn Verifier  
opencode run "Review as Verifier: focus on correctness"
```

### 4. Completion
- Update task status: `approved` or `needs_human`
- Commit changes
- Update registry

---

## Failure Handling

### Agent Failed? Follow This Order:

1. **Retry same agent** (transient error)
2. **Try next agent in hierarchy**
3. **Escalate to `needs_human`** (all agents failed)

### Never:
- ❌ Write code directly (violates Factory Guidelines)
- ❌ Silently take over failed agent tasks
- ❌ Skip Council review for production code

### Always:
- ✅ Report agent failures to user
- ✅ Document which agent succeeded/failed
- ✅ Update Factory Guidelines with learnings

---

## Kilo Success Case (Reference)

**Task:** YT-POST-MVP-001 - Stable Backend Deployment  
**Date:** March 2, 2026  
**Failed Agents:**
- Codex: Auth 401 error
- OpenCode: Hung with no output

**Successful Agent:** Kilo CLI  
**Command:**
```bash
kilo run "Create systemd deployment files for FastAPI backend"
```

**Results:**
- ✅ Created `deploy/yt-transcript.service`
- ✅ Created `deploy/install.sh`
- ✅ Created `deploy/status.sh`
- ✅ Committed to repository
- ✅ Service deployed and running

**Conclusion:** Kilo is **reliable for infrastructure/config tasks** when other agents fail.

---

## CLI Reports and References

| Report | Location | Description |
|--------|----------|-------------|
| YT-POST-MVP-001 | `obsidian-vault/03_Resources/YT-POST-MVP-001-Complete.md` | Kilo CLI success - systemd deployment |
| YT-Transcript Fix | `obsidian-vault/03_Resources/YT-Transcript-Fix-Report.md` | Manual fix (pre-guideline) |
| Council Review | `docs/COUNCIL_REVIEW.md` | yt-transcript-web review |

---

## Account Management

### Codex Vault
**Location:** `~/.openclaw/workspace/.secure/codex_vault.json`

**Accounts:**
- samade1996@gmail.com
- arbonlinebis@gmail.com
- samueladegoke16@gmail.com
- samadeptc@gmail.com
- samtobiadegoke@gmail.com

**Check Status:**
```bash
cat ~/.openclaw/workspace/.secure/codex_vault.json | python3 -c "
import json, sys, time
vault = json.load(sys.stdin)
for email, data in vault.items():
    expires = data.get('expires', 0)
    expires_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(expires/1000))
    print(f'{email}: expires {expires_str}')
"
```

---

## Quick Commands

### Check Agent Availability
```bash
which codex kilo opencode claude pi
```

### Spawn Codex (PTY required)
```bash
# With background monitoring
bash pty:true workdir:~/project \
  background:true \
  command:"codex --yolo exec 'Your task'"

# Check progress
process action:poll sessionId:XXX
```

### Spawn Kilo (Simple tasks)
```bash
kilo run "Your task description"
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Feb 2026 | Initial RavFlow v2 Protocol |
| 2.1 | Mar 2, 2026 | Added Kilo CLI as primary alternative |

---

**Maintained by:** Zoe (Factory Lead)  
**Review Schedule:** After each completed task

## Related Documents

- [Council of Models Guidelines](obsidian-vault/03_Resources/Council-Guidelines.md)
- [YT-POST-MVP-001 Kilo Success Report](obsidian-vault/03_Resources/YT-POST-MVP-001-Complete.md)
- [Active Tasks Registry](factory/active-tasks.json)

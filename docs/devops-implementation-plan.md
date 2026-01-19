# DevOps Implementation Plan: lindas-trifid

**Date:** 2026-01-19
**Author:** Giulio Vannini
**Reference:** DevOps Guidelines LINDAS (devops-comprehensive-review-2026-01-15.md)
**Status:** PENDING APPROVAL

---

## 1. Executive Summary

**Key insight:** lindas-trifid is an **npm library monorepo** - it publishes packages to npm, not Docker images to K8s. The existing Changesets workflow is already correct for npm publishing.

**Scope:** Establish the develop branch workflow for code review. No Docker promotion workflows needed.

---

## 2. Current State

| Aspect | Value | Status |
|--------|-------|--------|
| Primary Branch | main | OK |
| Develop Branch | Local only | Needs push to remote |
| Version | 7.0.2 (unified) | OK |
| Changesets | Configured (baseBranch: main) | OK |
| npm Publish | Via Changesets on main push | OK |
| Docker | On tag `trifid@*.*.*` (convenience) | OK - no changes needed |

### Current Workflows (All OK)

| File | Purpose | Status |
|------|---------|--------|
| `test.yaml` | Run tests + build | Minor update needed |
| `release.yaml` | Changesets publish to npm | OK - no changes |
| `docker.yaml` | Build Docker image on tag | OK - no changes |

---

## 3. Implementation Steps

### Step 1: Push Develop Branch to Remote

The local develop branch has old commits already released in v7.0.2. Reset and push.

```bash
cd lindas-trifid

# Ensure main is up to date
git checkout main
git pull origin main

# Reset develop to match main
git checkout develop
git reset --hard origin/main

# Push develop to remote
git push -u origin develop
```

### Step 2: Update test.yaml

Add explicit PR targets for code review workflow:

```yaml
name: Run Tests

on:
  push:
    branches:
      - "**"
    tags:
      - "**"
  pull_request:
    branches: [develop, main]  # ADD: Explicit PR targets

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  tests:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v5

      - name: Set up NodeJS
        uses: actions/setup-node@v5
        with:
          node-version: "22"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Codecov
        uses: codecov/codecov-action@v5
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout
        uses: actions/checkout@v5

      - name: Set up NodeJS
        uses: actions/setup-node@v5
        with:
          node-version: "22"
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run build of each package
        run: npm run build
```

### Step 3: Configure Branch Protection (GitHub UI)

**Settings -> Branches -> Add rule for `develop`:**
- [x] Require pull request before merging
- [x] Require approvals: 1
- [x] Require status checks: `tests`, `build`

**Settings -> Branches -> Update rule for `main`:**
- [x] Require pull request before merging
- [x] Require approvals: 1
- [x] Require status checks: `tests`, `build`

---

## 4. Workflow After Implementation

```
Feature Branch
     |
     v
[PR to develop] --> CI tests run
     |
     v
develop (code integration)
     |
     v
[PR to main] --> CI tests run
     |
     v
main --> Changesets creates Release PR
     |
     v
[Merge Release PR] --> npm publish all packages
     |
     v
Tag created (trifid@7.0.3) --> Docker image built (optional)
```

---

## 5. What We're NOT Doing

Since this is an npm library (not a deployed application):

- No Docker promotion workflows (promote-int.yaml, promote-prod.yaml)
- No GitHub production environment
- No registry changes (keep zazuko/trifid for backward compatibility)
- No image re-tagging for TEST/INT/PROD

---

## 6. Checklist

### Pre-Implementation
- [ ] Confirm no active PRs or releases in progress

### Implementation
- [ ] Reset local develop to match main
- [ ] Push develop branch to remote
- [ ] Update test.yaml with PR targets and concurrency
- [ ] Configure branch protection for develop
- [ ] Update branch protection for main

### Post-Implementation
- [ ] Test by creating a feature branch and PR to develop
- [ ] Update CHANGELOG.md

---

## 7. Timeline

| Step | Duration |
|------|----------|
| Push develop branch | 5 minutes |
| Update test.yaml | 10 minutes |
| Configure branch protection | 10 minutes |
| Verify workflow | 15 minutes |
| **Total** | ~40 minutes |

---

## 8. Approval

- [ ] **Review:** Giulio Vannini

---

**Document Version:** 1.1
**Last Updated:** 2026-01-19

---
name: Clerk package alignment
description: Clerk packages in this workspace need registry-verified versions so React, themes, Express, and shared exports stay compatible.
---

When adding Clerk dependencies, verify the versions available in the workspace package firewall and align the React, themes, Express, and shared packages before wiring imports.

**Why:** Stale example pins can resolve different `@clerk/shared` majors; the app may typecheck incompletely or fail during Vite dependency optimization even though the Clerk code looks correct.

**How to apply:** Check the installed package tree after every Clerk install, remove duplicate direct pins, and use the versions that expose the required `publishableKeyFromHost` and browser script exports together.
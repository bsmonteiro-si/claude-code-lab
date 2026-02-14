# Epic: User Authentication

Establish user identity so that every piece of work in Prompt Lab belongs to someone, setting the foundation for personal workspaces and future collaboration.

## Context

The application currently operates as a shared, anonymous environment. Every template, pipeline, and execution is visible to everyone with access. There is no concept of "my work." As the user base grows beyond a single person, this becomes untenable — one user's experimental templates clutter another's workspace, there is no privacy, and there is no accountability for who created what.

This epic introduces the minimum viable auth layer: accounts, login, and data ownership. It intentionally excludes advanced features like roles, permissions, teams, OAuth, email verification, and password reset. Those belong to a future epic once the basics are proven.

This is the first epic in the roadmap. All subsequent epics (Iteration Loop, Organization & Navigation) build on the assumption that a current user exists.

## Success Criteria

- A new user can create an account with an email and password, then log in to access their workspace.
- An authenticated user sees only their own templates, pipelines, and execution history.
- An unauthenticated visitor is redirected to the login screen and cannot access any application data.
- Existing data created before auth is migrated to a default admin account so nothing is lost.

## Out of Scope

- Password reset flow
- Email verification
- OAuth / social login
- Roles and permissions
- Team or organization model
- Admin panel
- API key authentication

---

## Feature 1: User Accounts

### Problem

There is no concept of a user in the system. Everyone operates anonymously against a shared dataset. This means no personalization, no privacy, and no way to distinguish one person's work from another's.

### Proposal

Users can create an account by providing an email, display name, and password. The email serves as the unique identifier. Passwords are hashed before storage — plaintext passwords are never persisted. A user's display name is shown in the UI to personalize the experience.

During the initial migration, a default admin account is created automatically. All existing templates and pipelines are assigned to this account so that pre-auth data remains accessible and is not orphaned.

### Scope: Medium

A new data entity, a registration endpoint, password hashing, and a migration that retroactively assigns ownership to existing records.

---

## Feature 2: Login & Session Management

### Problem

Without authentication, the application cannot distinguish between users or protect individual workspaces. Anyone with network access sees everything.

### Proposal

Users log in with their email and password. On successful authentication, the server issues a token (JWT) that the client stores and sends with every subsequent request. The token contains the user's identity and has a reasonable expiration (e.g., 24 hours). Logging out clears the token on the client side.

Every API endpoint (except registration and login) requires a valid token. Requests without a token or with an expired token receive a 401 response.

### Scope: Medium

A login endpoint, token generation and validation logic, and middleware that runs on every request to extract the current user. Touches every existing API route to require authentication.

---

## Feature 3: Data Ownership

### Problem

Templates, pipelines, and execution history are global — there is no owner. In a multi-user environment, this means User A sees User B's draft templates, User B's test executions pollute User A's history, and deleting something affects everyone.

### Proposal

Every template and pipeline belongs to the user who created it. When a user queries their templates or pipelines, they see only their own. Executions inherit ownership through their parent (a template execution belongs to whoever owns the template). This scoping is enforced at the API layer — users cannot access, modify, or delete another user's resources.

For the initial release, there is no sharing mechanism. Each user's workspace is private. Sharing and collaboration are deferred to a future epic.

### Scope: Medium

Adds an ownership relationship to the two core entities (templates and pipelines) and updates every list/get/update/delete operation to enforce user scoping. Requires a migration to add the ownership column to existing tables.

---

## Feature 4: Authenticated Frontend Experience

### Problem

The frontend currently renders the full application immediately on load. There is no login gate, no way to sign up, and no indication of who is using the tool.

### Proposal

The application presents a login screen to unauthenticated visitors. From the login screen, users can navigate to a registration form to create a new account. After logging in, the user sees the normal application with their name displayed in the sidebar or header. A logout option is always accessible.

If a user's session expires while they are using the app (e.g., token expiration), the application redirects them to the login screen gracefully without losing the URL they were on, so they can resume after re-authenticating.

All application routes are protected — navigating directly to `/templates` or `/pipelines` without a valid session redirects to login.

### Scope: Medium

Two new pages (login, registration), an authentication state layer that wraps the application, a route guard mechanism, and minor UI additions (user display, logout action).

---

## Suggested Build Order

```
Phase 1 (identity):
  Feature 1: User Accounts
  Feature 2: Login & Session Management

Phase 2 (enforcement):
  Feature 3: Data Ownership
  Feature 4: Authenticated Frontend Experience
```

Phase 1 establishes the user model and auth mechanism. It can be built and tested independently — existing functionality continues working while auth is being wired in. Phase 2 activates enforcement: data becomes user-scoped and the frontend gates access. This phasing allows a gradual rollout where auth exists but is not yet mandatory, followed by a cutover where it becomes required.

Features within each phase can be built in parallel by different engineers, but each phase should be completed before the next begins.

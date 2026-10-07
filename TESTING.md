# TESTING.md

## RLS two-user isolation test (Section 13) — MANDATORY, run before Phase 6

This is the single most important test in the project. Run it in the Supabase SQL Editor
after applying all four migrations.

### Setup

1. In your app (once Phase 3 is running against your real Supabase project), sign up two
   accounts: **User A** (e.g. `a@test.com`) and **User B** (`b@test.com`).
2. In Supabase Studio → Authentication → Users, copy each user's UUID.
3. As User A (via the app UI, logged in as A), create one collection, one project, one saved
   item, and one task, so A has real rows to try to protect.

### Test 1 — Direct SQL, impersonating each user

In the SQL Editor, Supabase lets you run queries as a specific role. Simplest approach: use
the `anon`/authenticated role with `request.jwt.claim.sub` set, or more simply, test through
the app itself (Test 2) plus this direct check as service-role sanity check:

```sql
-- As service_role (bypasses RLS) — confirms the data exists at all.
select id, user_id, title from saved_items;
```

Then, using the Supabase client with **User B's session token** (e.g. via `curl` with B's
access token, or the app UI logged in as B), attempt:

```sql
-- Should return ZERO rows belonging to User A.
select * from saved_items where user_id = '<USER_A_UUID>';
```

### Test 2 — Through the app UI (the test that matters most)

While logged in as **User B**:

- [ ] Cannot see User A's saved items in the Library
- [ ] Cannot see User A's collections or projects
- [ ] Cannot see User A's tasks
- [ ] Directly navigating to `/app/item/<User A's item id>` does not leak A's data
- [ ] Attempting to `PATCH`/`DELETE` one of User A's rows via the app's own service functions
      (e.g. try favoriting an item by ID you copied from A's session) fails silently or
      with a permissions error — never succeeds

Record the result of each checkbox here once you've run it:

```
Result: PENDING — run against your Supabase project and fill in.
```

### Test 3 — Join tables

Confirm User B cannot insert a `saved_item_tags`, `task_references`, or `project_items` row
that points at one of User A's parent rows (should be rejected by the `with check` clause).

---

## Other tests (filled in as each phase lands)

- [ ] Signup / login / logout / password reset — Phase 3
- [ ] Save flow (URL / note / image / file) — Phase 6
- [ ] Edit / delete / favorite / archive — Phase 7
- [ ] Collections CRUD — Phase 8
- [ ] Projects CRUD — Phase 9
- [ ] Tasks CRUD + completion — Phase 10
- [ ] Structured search — Phase 12
- [ ] AI enrichment success + failure paths — Phase 13
- [ ] Ask Recall, including a zero-result query — Phase 14
- [ ] Responsive layouts at common breakpoints — Phase 17
- [ ] Data export (JSON + CSV) correctness — Phase 27
- [ ] Persistence across logout/login and a simulated "next day"

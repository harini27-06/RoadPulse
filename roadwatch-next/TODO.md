# TODO - RoadWatch Admin “Returned reason”

- [x] Add `returned_message` nullable field to Prisma `Complaint` model.
- [ ] Create & apply Prisma migration (requires PostgreSQL running).
- [ ] Update Admin PATCH endpoint to accept `returned_message` and persist it.
- [ ] Update Admin dashboard UI:
  - [x] Show reason editor when status is `Returned`
  - [ ] Redesign UI so textarea exists only during Send/Update, then collapses to compact display with Edit Reason
- [x] Update complaint display to show `returned_message` when status is `Returned`.
- [ ] Run TypeScript/Next lint or dev build checks.


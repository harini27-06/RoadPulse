# TODO - RoadWatch Admin “Returned reason”

- [x] Add `returned_message` nullable field to Prisma `Complaint` model.

- [ ] Create & apply Prisma migration (requires PostgreSQL running).

- [ ] Update Admin PATCH endpoint to accept `returned_message` and persist it.
- [ ] Update Admin dashboard UI:
  - [ ] When admin sets status to `Returned`, require a non-empty reason text.
  - [ ] Send `returned_message` along with the status in the PATCH request.
  - [ ] If status is not `Returned`, hide reason input.
- [x] Update complaint display to show `returned_message` when status is `Returned`.
- [ ] Run TypeScript/Next lint or dev build checks.


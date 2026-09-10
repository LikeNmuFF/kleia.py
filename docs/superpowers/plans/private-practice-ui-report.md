# Private Practice UI Report

## Delivered

- `/practice` lists rooms available through the server action and gives admins a room creation form.
- `/practice/[id]` returns the standard not-found response for unavailable rooms and renders the authorized room data supplied by the server boundary.
- Admin controls cover registered-user search, invite, reminder, revocation, challenge creation/editing, scoped file upload, recent attempt/feedback review, and idempotent global publication.
- Member controls cover challenge reading, lesson links, authorized file downloads, private flag submissions, solve state, and editable feedback.
- Wording makes the invite-only access model, practice-only points, and global snapshot behavior explicit.
- Private Practice is linked from Learn and the Challenges navigation group on desktop and mobile.

## Verification

- Focused static render tests cover the member/admin experiences and invite-only empty state.
- Type checking and focused test output are recorded in the task handoff.

## Deployment state

No production deployment, migration, invitation, commit, or push was performed by this UI task.

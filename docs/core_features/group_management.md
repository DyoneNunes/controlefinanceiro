# Group Management Feature

The application uses a multi-tenant architecture where "Groups" act as the tenants. A user can belong to multiple groups, and all financial data is scoped to a specific group.

## Roles & Permissions
- **Admin:** Can update group name, delete group, invite members, and manage all data.
- **Editor:** Can read/write financial data but cannot manage group settings.
- **Viewer:** Read-only access (Planned).

## Data Isolation
- **Middleware:** `requireGroupAccess` checks if the `X-Group-ID` header corresponds to a group the user is a member of.
- **Database:** Every financial table (`bills`, `incomes`, etc.) has a `group_id` foreign key. Queries are always filtered by `group_id`.

## Invite System
- Admins can invite existing users by their `username`.
- The system resolves the username to a `user_id` and adds a row to `group_members`.
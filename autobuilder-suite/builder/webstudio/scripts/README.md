Apply UserProduct view and grants

Prereqs:
- Node.js installed
- `npm install pg` in this workspace (or globally available `pg`)
- A Postgres connection URL (e.g., postgres://user:pass@localhost:5432/abs)

Steps:

1. Install dependency (if not installed):

```bash
cd autobuilder-suite/builder/webstudio
npm install pg
```

2. Run the script:

```bash
# from project root
node autobuilder-suite/builder/webstudio/scripts/apply_userproduct_view.js "postgres://webstudio:password@localhost:5432/abs"

# or set env var
DATABASE_URL="postgres://webstudio:password@localhost:5432/abs" node autobuilder-suite/builder/webstudio/scripts/apply_userproduct_view.js
```

If you prefer using `psql` or a GUI, run the SQL in `autobuilder-suite/builder/webstudio/scripts/apply_userproduct_view.sql` instead.

-- Check if UserProduct view exists and is queryable
SELECT * FROM "UserProduct" LIMIT 1;

-- Check permissions for webstudio user
SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_name = 'UserProduct';

-- Check if RLS is enabled
SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'UserProduct';

-- Show view definition
SELECT definition FROM pg_views WHERE viewname = 'UserProduct';

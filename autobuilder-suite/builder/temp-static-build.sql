-- Create LatestStaticBuildPerProject view
DROP VIEW IF EXISTS "LatestStaticBuildPerProject" CASCADE;

CREATE VIEW "LatestStaticBuildPerProject" AS
SELECT DISTINCT ON ("projectId")
  bld.id AS "buildId",
  bld."projectId",
  bld."updatedAt",
  bld."publishStatus"
FROM
  "Build" bld
WHERE
  bld.deployment IS NOT NULL
  AND bld.deployment::jsonb ->> 'destination'::text = 'static'
ORDER BY
  bld."projectId",
  bld."createdAt" DESC,
  "buildId";

-- Grant permissions
GRANT SELECT ON "LatestStaticBuildPerProject" TO anon;

-- Create function for PostgREST computed relationship
CREATE OR REPLACE FUNCTION "latestStaticBuild"("Project")
RETURNS SETOF "LatestStaticBuildPerProject"
ROWS 1 AS $$
SELECT *
FROM "LatestStaticBuildPerProject"
WHERE "projectId" = $1.id
LIMIT 1;
$$
STABLE
LANGUAGE sql;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION "latestStaticBuild"("Project") TO anon;

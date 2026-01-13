-- Create domainsVirtual table
DROP TABLE IF EXISTS "domainsVirtual" CASCADE;

CREATE TABLE "domainsVirtual" (
    "id" text PRIMARY KEY NOT NULL,
    "domainId" text REFERENCES "Domain" (id) NOT NULL,
    "projectId" text REFERENCES "Project" (id) NOT NULL,
    "domain" text NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'INITIALIZING'::"DomainStatus",
    "error" text,
    "domainTxtRecord" text,
    "expectedTxtRecord" text NOT NULL,
    "cname" text NOT NULL,
    "verified" boolean NOT NULL DEFAULT false,
    "createdAt" timestamp(3) with time zone NOT NULL,
    "updatedAt" timestamp(3) with time zone NOT NULL
);

-- Create domainsVirtual function for Project
CREATE OR REPLACE FUNCTION "domainsVirtual"("Project")
RETURNS SETOF "domainsVirtual" AS $$
    SELECT
        "Domain".id || '-' || "ProjectDomain"."projectId" as id,
        "Domain".id AS "domainId",
        "ProjectDomain"."projectId",
        "Domain".domain,
        "Domain".status,
        "Domain".error,
        "Domain"."txtRecord" AS "domainTxtRecord",
        "ProjectDomain"."txtRecord" AS "expectedTxtRecord",
        "ProjectDomain"."cname" AS "cname",
        CASE
            WHEN "Domain"."txtRecord" = "ProjectDomain"."txtRecord" THEN true
            ELSE false
        END AS "verified",
        "ProjectDomain"."createdAt",
        "Domain"."updatedAt"
    FROM
        "Domain"
    JOIN
        "ProjectDomain" ON "Domain".id = "ProjectDomain"."domainId"
    WHERE
        "ProjectDomain"."projectId" = $1.id;
$$
STABLE
LANGUAGE sql;

-- Create latestBuildVirtual table
DROP TABLE IF EXISTS "latestBuildVirtual" CASCADE;

CREATE TABLE "latestBuildVirtual" (
    "buildId" text REFERENCES "Build" (id) unique NOT NULL,
    "projectId" text PRIMARY KEY REFERENCES "Project" (id) NOT NULL,
    "domainsVirtualId" text REFERENCES "domainsVirtual" ("id") unique NOT NULL,
    domain text NOT NULL,
    "createdAt" timestamp(3) with time zone NOT NULL,
    "publishStatus" "PublishStatus" NOT NULL,
    "updatedAt" timestamp(3) with time zone NOT NULL DEFAULT NOW()
);

-- Grant permissions on tables
GRANT SELECT ON "domainsVirtual" TO anon;
GRANT SELECT ON "domainsVirtual" TO authenticated;
GRANT ALL ON "domainsVirtual" TO service_role;

GRANT SELECT ON "latestBuildVirtual" TO anon;
GRANT SELECT ON "latestBuildVirtual" TO authenticated;
GRANT ALL ON "latestBuildVirtual" TO service_role;

-- Create latestBuildVirtual function for Project
CREATE OR REPLACE FUNCTION "latestBuildVirtual"("Project")
RETURNS SETOF "latestBuildVirtual"
ROWS 1 AS $$
SELECT
    b.id AS "buildId",
    b."projectId",
    '' as "domainsVirtualId",
    CASE
        WHEN (b.deployment::jsonb ->> 'projectDomain') = p.domain
             OR (b.deployment::jsonb -> 'domains') @> to_jsonb(array[p.domain])
        THEN p.domain
        ELSE d.domain
    END AS "domain",
    b."createdAt",
    b."publishStatus",
    b."updatedAt"
FROM "Build" b
JOIN "Project" p ON b."projectId" = p.id
LEFT JOIN "ProjectDomain" pd ON pd."projectId" = p.id
LEFT JOIN "Domain" d ON d.id = pd."domainId"
WHERE b."projectId" = $1.id
  AND b.deployment IS NOT NULL
  AND ((b.deployment::jsonb ->> 'destination') IS NULL OR (b.deployment::jsonb ->> 'destination') = 'saas')
  AND (
      (b.deployment::jsonb ->> 'projectDomain') = p.domain
      OR (b.deployment::jsonb -> 'domains') @> to_jsonb(array[p.domain])
      OR (b.deployment::jsonb -> 'domains') @> to_jsonb(array[d.domain])
  )
ORDER BY b."createdAt" DESC
LIMIT 1;
$$
STABLE
LANGUAGE sql;

-- Create latestBuildVirtual function for domainsVirtual
CREATE OR REPLACE FUNCTION "latestBuildVirtual"("domainsVirtual")
RETURNS SETOF "latestBuildVirtual"
ROWS 1 AS $$
SELECT
  b.id AS "buildId",
  b."projectId",
  '' as "domainsVirtualId",
  d."domain",
  b."createdAt",
  b."publishStatus",
  b."updatedAt"
FROM
  "Build" b
  JOIN "Domain" d ON d.id = $1."domainId"
WHERE
  b."projectId" = $1."projectId"
  AND b.deployment IS NOT NULL
  AND (b.deployment :: jsonb -> 'domains') @> to_jsonb(array [d.domain])
ORDER BY
  b."createdAt" DESC
LIMIT
  1;
$$
STABLE
LANGUAGE sql;

-- Create latestProjectDomainBuildVirtual function
CREATE OR REPLACE FUNCTION "latestProjectDomainBuildVirtual"("Project")
RETURNS SETOF "latestBuildVirtual"
ROWS 1 AS $$
SELECT
  b.id AS "buildId",
  b."projectId",
  '' as "domainsVirtualId",
  p.domain AS "domain",
  b."createdAt",
  b."publishStatus",
  b."updatedAt"
FROM
  "Build" b
  JOIN "Project" p ON b."projectId" = p.id
  LEFT JOIN "ProjectDomain" pd ON pd."projectId" = p.id
WHERE
  b."projectId" = $1.id
  AND b.deployment IS NOT NULL
  AND (
    (b.deployment :: jsonb ->> 'destination') IS NULL
    OR (b.deployment :: jsonb ->> 'destination') = 'saas'
  )
  AND (
    (b.deployment :: jsonb ->> 'projectDomain') = p.domain
    OR (b.deployment :: jsonb -> 'domains') @> to_jsonb(array [p.domain])
  )
ORDER BY
  b."createdAt" DESC
LIMIT
  1;
$$
STABLE
LANGUAGE sql;

-- Create latestBuildVirtual function for DashboardProject view
CREATE OR REPLACE FUNCTION "latestBuildVirtual"("DashboardProject")
RETURNS SETOF "latestBuildVirtual"
ROWS 1 AS $$
SELECT
  b.id AS "buildId",
  b."projectId",
  '' as "domainsVirtualId",
  CASE
      WHEN (b.deployment::jsonb ->> 'projectDomain') = $1.domain
           OR (b.deployment::jsonb -> 'domains') @> to_jsonb(array[$1.domain])
      THEN $1.domain
      ELSE d.domain
  END AS "domain",
  b."createdAt",
  b."publishStatus",
  b."updatedAt"
FROM "Build" b
LEFT JOIN "ProjectDomain" pd ON pd."projectId" = $1.id
LEFT JOIN "Domain" d ON d.id = pd."domainId"
WHERE b."projectId" = $1.id
  AND b.deployment IS NOT NULL
  AND ((b.deployment::jsonb ->> 'destination') IS NULL OR (b.deployment::jsonb ->> 'destination') = 'saas')
  AND (
      (b.deployment::jsonb ->> 'projectDomain') = $1.domain
      OR (b.deployment::jsonb -> 'domains') @> to_jsonb(array[$1.domain])
      OR (b.deployment::jsonb -> 'domains') @> to_jsonb(array[d.domain])
  )
ORDER BY b."createdAt" DESC
LIMIT 1;
$$
STABLE
LANGUAGE sql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION "domainsVirtual"("Project") TO anon;
GRANT EXECUTE ON FUNCTION "domainsVirtual"("Project") TO authenticated;
GRANT EXECUTE ON FUNCTION "domainsVirtual"("Project") TO service_role;

GRANT EXECUTE ON FUNCTION "latestBuildVirtual"("Project") TO anon;
GRANT EXECUTE ON FUNCTION "latestBuildVirtual"("Project") TO authenticated;
GRANT EXECUTE ON FUNCTION "latestBuildVirtual"("Project") TO service_role;

GRANT EXECUTE ON FUNCTION "latestBuildVirtual"("domainsVirtual") TO anon;
GRANT EXECUTE ON FUNCTION "latestBuildVirtual"("domainsVirtual") TO authenticated;
GRANT EXECUTE ON FUNCTION "latestBuildVirtual"("domainsVirtual") TO service_role;

GRANT EXECUTE ON FUNCTION "latestProjectDomainBuildVirtual"("Project") TO anon;
GRANT EXECUTE ON FUNCTION "latestProjectDomainBuildVirtual"("Project") TO authenticated;
GRANT EXECUTE ON FUNCTION "latestProjectDomainBuildVirtual"("Project") TO service_role;

GRANT EXECUTE ON FUNCTION "latestBuildVirtual"("DashboardProject") TO anon;
GRANT EXECUTE ON FUNCTION "latestBuildVirtual"("DashboardProject") TO authenticated;
GRANT EXECUTE ON FUNCTION "latestBuildVirtual"("DashboardProject") TO service_role;

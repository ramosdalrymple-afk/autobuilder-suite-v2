-- Create DashboardProject view
DROP VIEW IF EXISTS "DashboardProject";

CREATE VIEW "DashboardProject" AS
SELECT
  id,
  title,
  domain,
  "userId",
  "isDeleted",
  "createdAt",
  "previewImageAssetId",
  "marketplaceApprovalStatus",
  tags,
  (
    EXISTS (
      SELECT
        1
      FROM
        "Build"
      WHERE
        "Build"."projectId" = "Project".id
        AND "Build".deployment IS NOT NULL
    )
  ) AS "isPublished"
FROM
  "Project";

-- Grant permissions
GRANT SELECT ON "DashboardProject" TO anon;

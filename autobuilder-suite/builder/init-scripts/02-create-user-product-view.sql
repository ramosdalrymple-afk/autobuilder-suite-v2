-- Note: TransactionLog table is created by Prisma migrations, not in init scripts
-- Creating view here would fail on first run, so we skip it
-- It will be created automatically when Prisma migrations run

/*
CREATE OR REPLACE VIEW "UserProduct" AS (
  SELECT
    "userId",
    "subscriptionId",
    "productId",
    "customerId",
    "customerEmail"
  FROM
    "TransactionLog" AS tl
  WHERE
    "status" = 'complete'
    AND "eventType" = 'checkout.session.completed'
    AND NOT EXISTS (
      SELECT
        1
      FROM
        "TransactionLog" AS tlexsists
      WHERE
        tlexsists."subscriptionId" = tl."subscriptionId"
        AND tlexsists."eventType" = 'customer.subscription.deleted'
        AND tlexsists."status" = 'canceled'
        AND tlexsists."eventCreated" > tl."eventCreated")
      AND NOT EXISTS (
        SELECT
          1
        FROM
          "TransactionLog" AS tlexsists
        WHERE
          tlexsists."paymentIntent" = tl."paymentIntent"
          AND tlexsists."eventType" = 'charge.refunded'
          AND tlexsists."status" = 'succeeded'
          AND tlexsists."eventCreated" > tl."eventCreated")
      ORDER BY
        "userId",
        "eventCreated" DESC)
    UNION ALL (
      SELECT
        "userId",
        "subscriptionId",
        "productId",
        "customerId",
        "customerEmail"
      FROM
        "TransactionLog"
      WHERE
        "eventType" = 'appsumo.activate');

-- Grant permissions to anon role
GRANT SELECT ON "UserProduct" TO anon;
GRANT SELECT ON "UserProduct" TO authenticated;
GRANT SELECT ON "UserProduct" TO service_role;

-- Create DashboardProject view for PostgREST
DROP VIEW IF EXISTS "DashboardProject";
CREATE VIEW "DashboardProject" AS
SELECT
    id,
    title,
    tags,
    domain,
    "userId",
    "isDeleted",
    "createdAt",
    "previewImageAssetId",
    "marketplaceApprovalStatus",
    (EXISTS (SELECT 1 FROM "Build" WHERE "Build"."projectId" = "Project".id AND "Build".deployment IS NOT NULL)) AS "isPublished"
FROM "Project";
*/

-- Views will be created by Prisma migrations when tables are ready
-- This keeps the database initialization simple for development

-- Grant permissions will be set when views are created by Prisma
-- GRANT SELECT ON "DashboardProject" TO anon;
-- GRANT SELECT ON "DashboardProject" TO authenticated;
-- GRANT SELECT ON "DashboardProject" TO service_role;

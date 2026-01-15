import type { AppContext } from "@webstudio-is/trpc-interface/index.server";
import env from "~/env/env.server";

export type UserPlanFeatures = NonNullable<AppContext["userPlanFeatures"]>;

export const getUserPlanFeatures = async (
  userId: string,
  postgrest: AppContext["postgrest"]
): Promise<UserPlanFeatures> => {
  const defaultFeatures = (isPro: boolean): UserPlanFeatures => ({
    allowShareAdminLinks: isPro,
    allowDynamicData: isPro,
    maxContactEmails: isPro ? 5 : 0,
    maxDomainsAllowedPerUser: isPro ? Number.MAX_SAFE_INTEGER : 0,
    maxPublishesAllowedPerUser: isPro ? Number.MAX_SAFE_INTEGER : 10,
    hasSubscription: isPro,
    hasProPlan: isPro,
    planName: isPro ? "env.USER_PLAN Pro" : "Free",
  });

  try {
    const userProductsResult = await postgrest.client
      .from("UserProduct")
      .select("customerId, subscriptionId, productId")
      .eq("userId", userId);

    if (userProductsResult.error) {
      console.error("[getUserPlanFeatures] userProductsResult.error:", userProductsResult.error);
      // Return a sensible default instead of throwing so the dashboard doesn't crash when PostgREST is unreachable
      return env.USER_PLAN === "pro" ? defaultFeatures(true) : defaultFeatures(false);
    }

    const userProducts = userProductsResult.data;

    const productsResult = await postgrest.client
      .from("Product")
      .select("name, meta")
      .in(
        "id",
        userProducts.map(({ productId }) => productId ?? "")
      );

    if (productsResult.error) {
      console.error("[getUserPlanFeatures] productsResult.error:", productsResult.error);
      return env.USER_PLAN === "pro" ? defaultFeatures(true) : defaultFeatures(false);
    }

    const products = productsResult.data;

    if (userProducts.length > 0) {
      const hasSubscription = userProducts.some(
        (log) => log.subscriptionId !== null
      );
      const productMetas = products.map((product) => {
        return {
          allowShareAdminLinks: true,
          allowDynamicData: true,
          maxContactEmails: 5,
          maxDomainsAllowedPerUser: Number.MAX_SAFE_INTEGER,
          maxPublishesAllowedPerUser: Number.MAX_SAFE_INTEGER,
          ...(product.meta as Partial<UserPlanFeatures>),
        };
      });
      return {
        allowShareAdminLinks: productMetas.some(
          (item) => item.allowShareAdminLinks
        ),
        allowDynamicData: productMetas.some((item) => item.allowDynamicData),
        maxContactEmails: Math.max(
          ...productMetas.map((item) => item.maxContactEmails)
        ),
        maxDomainsAllowedPerUser: Math.max(
          ...productMetas.map((item) => item.maxDomainsAllowedPerUser)
        ),
        maxPublishesAllowedPerUser: Math.max(
          ...productMetas.map((item) => item.maxPublishesAllowedPerUser)
        ),
        hasSubscription,
        hasProPlan: true,
        planName: products[0].name,
      };
    }

    if (env.USER_PLAN === "pro") {
      return defaultFeatures(true);
    }

    return defaultFeatures(false);
  } catch (error) {
    console.error("[getUserPlanFeatures] Unexpected error fetching user products:", error);
    return env.USER_PLAN === "pro" ? defaultFeatures(true) : defaultFeatures(false);
  }
};

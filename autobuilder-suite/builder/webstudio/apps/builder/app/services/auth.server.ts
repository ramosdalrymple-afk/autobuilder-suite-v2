import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { GitHubStrategy, type GitHubProfile } from "remix-auth-github";
import { GoogleStrategy, type GoogleProfile } from "remix-auth-google";
import * as db from "~/shared/db";
import { sessionStorage } from "~/services/session.server";
import { AUTH_PROVIDERS } from "~/shared/session";
import { authCallbackPath, isBuilder, loginPath } from "~/shared/router-utils";
import { redirect } from "~/services/no-store-redirect";
import { getUserById } from "~/shared/db/user.server";
import env from "~/env/env.server"; 
import { builderAuthenticator } from "./builder-auth.server";
import { staticEnv } from "~/env/env.static.server";
import type { SessionData } from "./auth.server.utils";
import { createContext } from "~/shared/context.server";

const transformRefToAlias = (input: string) => {
  const rawAlias = input.endsWith(".staging") ? input.slice(0, -8) : input;

  return rawAlias
    .replace(/[^a-zA-Z0-9_-]/g, "") // Remove all characters except a-z, A-Z, 0-9, _ and -
    .toLowerCase() // Convert to lowercase
    .replace(/_/g, "-") // Replace underscores with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with a single hyphen
};

export const callbackOrigin =
  env.DEPLOYMENT_ENVIRONMENT === "production"
    ? env.DEPLOYMENT_URL
    : env.DEPLOYMENT_ENVIRONMENT === "staging" ||
        env.DEPLOYMENT_ENVIRONMENT === "development"
      ? `https://${transformRefToAlias(staticEnv.GITHUB_REF_NAME ?? "main")}.${env.DEPLOYMENT_ENVIRONMENT}.webstudio.is`
      : `https://wstd.dev:${env.PORT || 5173}`;

const strategyCallback = async ({
  profile,
  request,
}: {
  profile: GitHubProfile | GoogleProfile;
  request: Request;
}) => {
  const context = await createContext(request);

  try {
    // Prefer using the primary email from the provider
    const email = (profile.emails ?? [])[0]?.value;
    if (!email) {
      throw new Error("OAuth profile did not return an email");
    }

    // Try to find existing user by email
    const existingUser = await context.postgrest.client
      .from("User")
      .select()
      .eq("email", email)
      .single();

    if (existingUser.error == null && existingUser.data) {
      return { userId: existingUser.data.id, createdAt: Date.now() };
    }

    // If the error is something other than "not found", fail
    // PostgREST returns PGRST116 when single() can't find a row
    if (existingUser.error && existingUser.error.code !== "PGRST116") {
      console.error("[auth] PostgREST error while selecting user", { email, error: existingUser.error });
      throw existingUser.error;
    }

    // Create a new user record when none exists
    const id = crypto.randomUUID();
    const newUserPayload = {
      id,
      email,
      username: profile.displayName ?? email.split("@")[0],
      image: (profile.photos ?? [])[0]?.value ?? "",
      provider: profile.provider ?? "google",
    } as const;

    const inserted = await context.postgrest.client
      .from("User")
      .insert(newUserPayload)
      .select()
      .single();

    if (inserted.error) {
      console.error("[auth] Failed to insert user", { email, id, error: inserted.error });
      throw new Error("Failed to create user");
    }

    return { userId: inserted.data.id, createdAt: Date.now() };
  } catch (error) {
    if (error instanceof Error) {
      console.error({
        error,
        extras: {
          loginMethod: AUTH_PROVIDERS.LOGIN_DEV,
        },
      });
    }
    throw error;
  }
};

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export const authenticator = new Authenticator<SessionData>(sessionStorage, {
  throwOnError: true,
});

if (env.GH_CLIENT_ID && env.GH_CLIENT_SECRET) {
  const github = new GitHubStrategy(
    {
      clientID: env.GH_CLIENT_ID,
      clientSecret: env.GH_CLIENT_SECRET,
      callbackURL: `${callbackOrigin}${authCallbackPath({ provider: "github" })}`,
    },
    strategyCallback
  );
  authenticator.use(github, "github");
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  const googleCallbackBase = env.GOOGLE_CALLBACK_URL ?? callbackOrigin;
  const google = new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${googleCallbackBase}${authCallbackPath({ provider: "google" })}`,
    },
    strategyCallback
  );
  authenticator.use(google, "google");
}

if (env.DEV_LOGIN === "true") {
  console.log(
    "[auth] Dev login enabled:",
    env.DEV_LOGIN === "true",
    "AUTH_SECRET set:",
    Boolean(env.AUTH_SECRET)
  );

  authenticator.use(
    new FormStrategy(async ({ form, request }) => {
      // DEV BYPASS: allow a specific email to login without secret (development only)
      try {
        const bypassEmail = form.get("email")?.toString();
        if (bypassEmail === "ramosdalrymple@gmail.com") {
          console.log("[auth] Dev email bypass used for:", bypassEmail);
          const context = await createContext(request);
          const user = await db.user.createOrLoginWithDev(context, bypassEmail);
          return { userId: user.id, createdAt: Date.now() };
        }
      } catch (err) {
        console.warn("[auth] Dev bypass encountered error:", err);
      }

      const secretValue = form.get("secret");

      console.log(
        "[auth] Dev login attempt, secret present:",
        secretValue != null
      );

      if (secretValue == null) {
        const message = "Secret is required";
        console.warn("[auth] Dev login: secret missing");
        throw redirect(loginPath({ error: AUTH_PROVIDERS.LOGIN_DEV, message }));
      }

      const [secret, email = "hello@webstudio.is"] = secretValue
        .toString()
        .split(":");

      // Avoid logging the secret content — only log its length for debugging
      console.log(
        "[auth] Dev secret provided length:",
        secret?.toString().length ?? 0,
        "email:",
        email
      );

      if (secret === env.AUTH_SECRET) {
        try {
          const context = await createContext(request);

          const user = await db.user.createOrLoginWithDev(context, email);
          console.log("[auth] Dev login successful", { email, userId: user.id });
          return {
            userId: user.id,
            createdAt: Date.now(),
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error({
            error,
            extras: {
              loginMethod: AUTH_PROVIDERS.LOGIN_DEV,
            },
          });
          // Redirect to login with message rather than throwing to error boundary
          throw redirect(
            loginPath({
              error: AUTH_PROVIDERS.LOGIN_DEV,
              message: message.length > 300 ? message.slice(0, 300) + "..." : message,
            })
          );
        }
      }

      console.warn("[auth] Dev secret mismatch");
      throw redirect(loginPath({ error: AUTH_PROVIDERS.LOGIN_DEV, message: "Secret is incorrect" }));
    }),
    "dev"
  );
}

export const findAuthenticatedUser = async (request: Request) => {
  const user = isBuilder(request)
    ? await builderAuthenticator.isAuthenticated(request)
    : await authenticator.isAuthenticated(request);

  if (user == null) {
    return null;
  }
  const context = await createContext(request);

  try {
    return await getUserById(context, user.userId);
  } catch (error) {
    return null;
  }
};

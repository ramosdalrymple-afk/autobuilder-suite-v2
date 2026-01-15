import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useEffect, useState } from "react";
import {
  Button,
  Flex,
  globalCss,
  Text,
} from "@webstudio-is/design-system";
import { GithubIcon, GoogleIcon } from "@webstudio-is/icons";
import { Form } from "@remix-run/react";
import { authPath } from "~/shared/router-utils";
import { SecretLogin } from "./secret-login";

const globalStyles = globalCss({
  body: {
    margin: 0,
    overflow: "hidden",
    background: "radial-gradient(circle at bottom right, #1e293b 0%, #0f172a 100%)",
    backgroundSize: "cover",
    fontFamily: "Inter, sans-serif",
    color: "white",
  },
});

export type LoginProps = {
  errorMessage: string;
  isGithubEnabled: boolean;
  isGoogleEnabled: boolean;
  isSecretLoginEnabled: boolean;
  serverMessage?: string;
};

export const Login = ({
  errorMessage,
  isGithubEnabled,
  isGoogleEnabled,
  isSecretLoginEnabled,
  serverMessage,
}: LoginProps) => {
  globalStyles();
  
  const [isErrorVisible, setIsErrorVisible] = useState(Boolean(errorMessage));

  useEffect(() => {
    setIsErrorVisible(Boolean(errorMessage));
  }, [errorMessage]);
  
  return (
    <Flex
      align="center"
      justify="center" // Centering the group
      gap="8" // Fixed gap to prevent "huge space"
      css={{
        height: "100vh",
        width: "100vw",
        position: "relative",
        padding: "0 40px",
        "@media (max-width: 900px)": {
            flexDirection: "column-reverse",
            gap: "40px"
        }
      }}
    >
      {/* --- LEFT SIDE: THE LOGIN CARD (UNIQUE SHAPE) --- */}
      <Flex
        direction="column"
        align="center"
        gap="6"
        css={{
          width: "100%",
          maxWidth: "380px",
          padding: "60px 40px",
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          
          // UNIQUE SHAPE: Organic multi-radius corners for a premium feel
          borderRadius: "60px 20px 60px 20px", 
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          zIndex: 10,
        }}
      >
        <Text variant="brandSectionTitle" as="h2" css={{ color: "white", fontSize: "20px" }}>
          Welcome back
        </Text>

        <TooltipProvider>
          <Flex direction="column" gap="3" css={{ width: "100%" }}>
            <Form method="post" style={{ display: "contents" }}>
              <Button
                disabled={isGoogleEnabled === false}
                prefix={<GoogleIcon size={18} />}
                css={{ 
                  height: "46px",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  color: "#0f172a",
                  borderRadius: "12px",
                  "&:hover": { backgroundColor: "#fff" }
                }}
                formAction={authPath({ provider: "google" })}
              >
                Continue with Google
              </Button>
              <Button
                disabled={isGithubEnabled === false}
                prefix={<GithubIcon size={18} fill="currentColor" />}
                css={{
                  height: "46px",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  borderRadius: "12px",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" }
                }}
                formAction={authPath({ provider: "github" })}
              >
                Continue with GitHub
              </Button>
            </Form>

            {isSecretLoginEnabled && (
              <Flex justify="center" css={{ width: "100%", marginTop: "10px" }}>
                <SecretLogin />
              </Flex>
            )}
          </Flex>

        </TooltipProvider>

        {/* DEV ONLY: Bypass button to go directly to dashboard */}
        {process.env.NODE_ENV === "development" && (
          <Button
            type="button"
            color="ghost"
            css={{ marginTop: "16px" }}
            onClick={() => window.location.assign("/dashboard")}
          >
            Bypass (Dev Only)
          </Button>
        )}

        {/* Inline error banner shown when there is a login error or server message */}
        {(serverMessage || (errorMessage && isErrorVisible)) && (
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: serverMessage ? "rgba(250,204,21,0.06)" : "rgba(252,165,165,0.06)",
              border: serverMessage ? "1px solid rgba(250,204,21,0.35)" : "1px solid rgba(252,165,165,0.35)",
              padding: "10px 12px",
              borderRadius: "8px",
              marginTop: "12px",
            }}
          >
            <Text css={{ color: serverMessage ? "#F59E0B" : "#FCA5A5", fontSize: "13px" }}>
              {serverMessage ?? errorMessage}
            </Text>
            <Button color="ghost" onClick={() => setIsErrorVisible(false)}>
              Close
            </Button>
          </Flex>
        )}
      </Flex>

      {/* --- RIGHT SIDE: BRANDING TEXT --- */}
      <Flex 
        direction="column" 
        css={{ 
            maxWidth: "460px",
            zIndex: 1, 
        }}
      >
        {/* Abstract "Blob" glow sitting behind the text */}
        <div style={{
            position: "absolute", top: "20%", right: "10%",
            width: "400px", height: "400px",
            background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
            filter: "blur(120px)", opacity: 0.15, borderRadius: "50%",
            zIndex: -1
        }} />

        <Text 
            as="h1" 
            css={{ 
                color: "#ffffff", 
                fontWeight: 700, 
                fontSize: "56px", 
                lineHeight: "1.05",
                letterSpacing: "-0.03em",
                marginBottom: "20px"
            }}
        >
            Build visually.<br />
            <span style={{ color: "rgba(255,255,255,0.4)" }}>Own the code.</span>
        </Text>
        
        <Text css={{ color: "rgba(255,255,255,0.5)", fontSize: "18px", lineHeight: "1.6" }}>
            The professional Open Source CMS for high-performance teams. 
            Experience the freedom of visual building with the power of modern engineering.
        </Text>
      </Flex>
      
      <div style={{ position: "absolute", bottom: 30, left: 40, opacity: 0.3, fontSize: "11px", letterSpacing: "1px" }}>
        AUTOBUILDER CMS &copy; 2026
      </div>
    </Flex>
  );
};
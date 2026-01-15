import { Flex, InputField } from "@webstudio-is/design-system";
import { useState } from "react";
import { authPath } from "~/shared/router-utils";


export const SecretLogin = () => {
  const [show, setShow] = useState(false);
  
  if (show) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setShow(false);
      }
    };

    return (
      <form
        method="post"
        action={authPath({ provider: "dev" })}
        style={{ display: "contents" }}
      >
        <Flex gap="2" css={{ width: "100%" }}>
          <InputField
            name="secret"
            type="password"
            minLength={2}
            required
            autoFocus
            placeholder="Enter auth secret (press Enter to submit)"
            onKeyDown={handleKeyDown}
            css={{ flexGrow: 1 }}
          />
        </Flex>
      </form>
    );
  }

  return (
    <button
      onClick={() => setShow(true)}
      style={{
        background: "none",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.6)",
        padding: "8px 16px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
        e.currentTarget.style.color = "rgba(255,255,255,0.8)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
        e.currentTarget.style.color = "rgba(255,255,255,0.6)";
      }}
    >
      Login with Secret
    </button>
  );
};

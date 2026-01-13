import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Box,
  Button,
  Flex,
  PanelTitle,
  Separator,
  Text,
  theme,
} from "@webstudio-is/design-system";
import { Link2Icon } from "@webstudio-is/icons";
import { AssetManager } from "~/builder/shared/asset-manager";
import { StrapiMediaBrowser } from "~/builder/shared/asset-manager/strapi-media-browser";
import { AssetUpload } from "~/builder/shared/assets";
import { $isStrapiConnected, connectStrapi } from "~/shared/nano-states";

type TabType = "local" | "strapi";

const TabButton = ({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <Box
    as="button"
    onClick={disabled ? undefined : onClick}
    css={{
      all: "unset",
      cursor: disabled ? "not-allowed" : "pointer",
      padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
      borderBottom: `2px solid ${active ? theme.colors.borderFocus : "transparent"}`,
      color: active ? theme.colors.foregroundMain : theme.colors.foregroundSubtle,
      opacity: disabled ? 0.5 : 1,
      transition: "all 0.15s ease",
      "&:hover": disabled ? {} : {
        color: theme.colors.foregroundMain,
      },
    }}
  >
    <Text variant="labelsSentenceCase">{children}</Text>
  </Box>
);

const StrapiDisconnectedView = () => (
  <Flex
    direction="column"
    gap={4}
    align="center"
    css={{ padding: theme.spacing[9] }}
  >
    <Box
      css={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        backgroundColor: theme.colors.backgroundHover,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Link2Icon style={{ width: 28, height: 28, opacity: 0.5 }} />
    </Box>
    <Text variant="titles" align="center">
      Strapi Not Connected
    </Text>
    <Text color="subtle" align="center" css={{ fontSize: 12, maxWidth: 280 }}>
      Connect to Strapi CMS from the Resources panel to browse media files.
    </Text>
    <Button prefix={<Link2Icon />} onClick={connectStrapi}>
      Connect to Strapi
    </Button>
  </Flex>
);

export const AssetsPanel = (_props: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<TabType>("local");
  const isStrapiConnected = useStore($isStrapiConnected);

  return (
    <Flex direction="column" css={{ height: "100%" }}>
      <PanelTitle suffix={<AssetUpload type="file" />}>Assets</PanelTitle>
      
      {/* Tab Navigation */}
      <Flex
        css={{
          borderBottom: `1px solid ${theme.colors.borderMain}`,
          paddingInline: theme.spacing[5],
        }}
      >
        <TabButton
          active={activeTab === "local"}
          onClick={() => setActiveTab("local")}
        >
          Project
        </TabButton>
        <TabButton
          active={activeTab === "strapi"}
          onClick={() => setActiveTab("strapi")}
        >
          Strapi CMS {!isStrapiConnected && "(Disconnected)"}
        </TabButton>
      </Flex>

      {/* Tab Content */}
      <Box css={{ flex: 1, overflow: "hidden" }}>
        {activeTab === "local" && <AssetManager />}
        {activeTab === "strapi" && (
          isStrapiConnected ? (
            <StrapiMediaBrowser
              onSelect={(url, file) => {
                // When a Strapi image is selected, copy URL to clipboard
                navigator.clipboard.writeText(url);
                console.log("[Assets] Strapi media selected:", file.name, url);
              }}
            />
          ) : (
            <StrapiDisconnectedView />
          )
        )}
      </Box>
    </Flex>
  );
};

import { useStore } from "@nanostores/react";
import {
  theme,
  css,
  Flex,
  Toolbar,
  ToolbarToggleGroup,
  ToolbarButton,
  Text,
  type CSS,
  Tooltip,
  Kbd,
  Button,
} from "@webstudio-is/design-system";
import type { Project } from "@webstudio-is/project";
import { $pages } from "~/shared/sync/data-stores";
import { $editingPageId } from "~/shared/nano-states";

import { ShareButton } from "./share";
import { PublishButton } from "./publish";
import { SyncStatus } from "./sync-status";
import { Menu } from "./menu";
import { BreakpointsContainer } from "../breakpoints";
import { ViewMode } from "./view-mode";
import { AddressBarPopover } from "../address-bar";
import { toggleActiveSidebarPanel } from "~/builder/shared/nano-states";
import type { ReactNode } from "react";
import { CloneButton } from "./clone";
import { $selectedPage } from "~/shared/awareness";
import { BuilderModeDropDown } from "./builder-mode";
import { useState } from "react";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";

const PagesButton = () => {
  const page = useStore($selectedPage);
  if (page === undefined) {
    return;
  }

  return (
    <Tooltip
      content={
        <Text>
          {"Pages or page settings "}
          <Kbd value={["alt", "click"]} color="moreSubtle" />
        </Text>
      }
    >
      <ToolbarButton
        css={{ paddingInline: theme.panel.paddingInline }}
        aria-label="Toggle Pages"
        onClick={(event) => {
          $editingPageId.set(event.altKey ? page.id : undefined);
          toggleActiveSidebarPanel("pages");
        }}
        tabIndex={0}
      >
        <Text truncate css={{ maxWidth: theme.spacing[24] }}>
          {page.name}
        </Text>
      </ToolbarButton>
    </Tooltip>
  );
};

const topbarContainerStyle = css({
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  background: theme.colors.backgroundTopbar,
  height: theme.spacing[15],
  paddingRight: theme.panel.paddingInline,
  color: theme.colors.foregroundContrastMain,
});

type TopbarProps = {
  project: Project;
  hasProPlan: boolean;
  loading: ReactNode;
  css: CSS;
};

export const Topbar = ({ project, hasProPlan, css, loading }: TopbarProps) => {
  const pages = useStore($pages);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const handleSaveTemplate = async ({ name, description, category }: { name: string; description: string; category: string }) => {
    const payload = {
      data: {
        name,
        description,
        category,
        webstudioProjectId: project.id,
      },
    };
    console.log("[SaveAsTemplate] Sending payload to Strapi:", payload);
    try {
      const response = await fetch(`${process.env.STRAPI_URL}/api/website-templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.STRAPI_API_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error("[SaveAsTemplate] Non-JSON response:", text);
        alert("Non-JSON error response: " + text);
        return;
      }
      console.log("[SaveAsTemplate] Strapi response:", result);
      if (!response.ok) {
        alert("Failed to save template: " + (result?.error?.message || response.statusText));
      } else {
        alert("Project saved as template!");
      }
    } catch (error) {
      console.error("[SaveAsTemplate] Error saving template:", error);
      alert("Error saving template: " + error);
    }
  };
  return (
    <nav className={topbarContainerStyle({ css })}>
      <Flex css={{ flexBasis: "20%" }}>
        <Flex grow={false} shrink={false}>
          <Menu />
        </Flex>

        {/* prevent rendering when data is not loaded */}
        {pages && (
          <Flex align="center">
            <PagesButton />
            <AddressBarPopover />
          </Flex>
        )}
      </Flex>
      <Flex css={{ flexBasis: "60%" }} justify="center">
        <BreakpointsContainer />
      </Flex>
      <Toolbar>
        <ToolbarToggleGroup
          type="single"
          css={{
            isolation: "isolate",
            justifyContent: "flex-end",
            gap: theme.spacing[5],
            width: theme.spacing[30],
          }}
        >
          <ViewMode />
          <SyncStatus />

          <BuilderModeDropDown />
          <ShareButton projectId={project.id} hasProPlan={hasProPlan} />
          <PublishButton projectId={project.id} />
          <CloneButton />
          <Button onClick={() => setDialogOpen(true)} color="neutral">Save as Template</Button>
        </ToolbarToggleGroup>
      </Toolbar>
      <SaveAsTemplateDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveTemplate}
        defaultName={project.title}
      />
      {loading}
    </nav>
  );
};

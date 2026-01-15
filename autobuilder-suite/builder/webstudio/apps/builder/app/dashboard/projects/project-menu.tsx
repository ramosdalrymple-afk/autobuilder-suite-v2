import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
  theme,
} from "@webstudio-is/design-system";
import { EllipsesIcon } from "@webstudio-is/icons";
import type { DialogType } from "./project-dialogs";
import { useDuplicateProject } from "./project-dialogs";

type ProjectMenuProps = {
  projectId: string;
  onOpenChange: (dialog: DialogType) => void;
};

export const ProjectMenu = ({ projectId, onOpenChange }: ProjectMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleDuplicateProject = useDuplicateProject(projectId);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <IconButton
          aria-label="Menu Button"
          tabIndex={-1}
          css={{ alignSelf: "center", position: "relative", zIndex: 1 }}
        >
          <EllipsesIcon width={15} height={15} />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" css={{ width: theme.spacing[24] }}>
        <DropdownMenuItem onSelect={handleDuplicateProject}>
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpenChange("rename")}> 
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpenChange("share")}> 
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpenChange("tags")}> 
          Tags
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpenChange("settings")}> 
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            // Call Strapi API to save as template
            await fetch(`${process.env.STRAPI_URL}/api/website-templates`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(process.env.STRAPI_API_TOKEN ? { "Authorization": `Bearer ${process.env.STRAPI_API_TOKEN}` } : {})
              },
              body: JSON.stringify({
                data: {
                  name: "New Template", // You can prompt for name if needed
                  webstudioProjectId: projectId,
                  description: "Created from builder",
                  category: "other"
                }
              })
            });
            alert("Project saved as template!");
          }}
        >
          Save as Template
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onOpenChange("delete")}> 
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

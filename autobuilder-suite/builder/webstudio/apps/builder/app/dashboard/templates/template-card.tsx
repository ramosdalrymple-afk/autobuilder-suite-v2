import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  Flex,
  Text,
  Tooltip,
  theme,
} from "@webstudio-is/design-system";
import { EyeOpenIcon, XIcon, ExternalLinkIcon } from "@webstudio-is/icons";
import type { EnrichedTemplate } from "~/routes/_ui.dashboard";
import { builderUrl } from "~/shared/router-utils";
import { Card, CardContent, CardFooter } from "../shared/card";
import { ThumbnailWithAbbr, ThumbnailWithImage } from "../shared/thumbnail";
import { CloneProjectDialog } from "~/shared/clone-project";

type TemplateCardProps = {
  template: EnrichedTemplate;
};

// Category icons
const categoryIcons: Record<string, string> = {
  business: "💼",
  portfolio: "🎨",
  ecommerce: "🛒",
  blog: "📝",
  landing: "🚀",
  saas: "☁️",
  agency: "🏢",
  personal: "👤",
  other: "📦",
};

export const TemplateCard = ({ template, ...props }: TemplateCardProps) => {
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { title, previewImageAsset, strapiMeta, isExternal } = template;
  
  // Use Strapi thumbnail if available, otherwise fall back to Webstudio preview
  const thumbnailUrl = strapiMeta?.thumbnailUrl;
  
  // Build the preview URL - use Strapi previewUrl or construct from project ID
  const previewUrl = strapiMeta?.previewUrl || `https://${template.id}.wstd.io`;
  
  const handleClick = () => {
    if (isExternal) {
      // For external templates, open preview
      setIsPreviewOpen(true);
    } else {
      // For local templates, open clone dialog
      setIsDuplicateDialogOpen(true);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPreviewOpen(true);
  };
  
  const handleUseTemplate = () => {
    if (isExternal) {
      // For external templates, open the external Webstudio in a new tab
      // They can clone it there
      window.open(previewUrl, "_blank");
    } else {
      setIsPreviewOpen(false);
      setIsDuplicateDialogOpen(true);
    }
  };

  return (
    <Card {...props}>
      <CardContent
        css={{
          background: theme.colors.brandBackgroundProjectCardBack,
          cursor: "pointer",
          position: "relative",
          "&:hover .preview-button": {
            opacity: 1,
          },
        }}
      >
        {/* External template badge */}
        {isExternal && (
          <Tooltip content="External template - opens in new tab">
            <Text
              variant="mono"
              css={{
                position: "absolute",
                top: theme.spacing[3],
                right: strapiMeta?.isPremium ? theme.spacing[17] : theme.spacing[3],
                zIndex: 1,
                background: theme.colors.backgroundAlertInfo,
                color: theme.colors.foregroundContrastMain,
                padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
                borderRadius: theme.borderRadius[3],
                fontSize: "10px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: theme.spacing[1],
              }}
            >
              <ExternalLinkIcon style={{ width: 10, height: 10 }} />
              External
            </Text>
          </Tooltip>
        )}
        
        {/* Premium label */}
        {strapiMeta?.isPremium && (
          <Text
            variant="mono"
            css={{
              position: "absolute",
              top: theme.spacing[3],
              right: theme.spacing[3],
              zIndex: 1,
              background: theme.colors.backgroundAlertWarning,
              color: theme.colors.foregroundMain,
              padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
              borderRadius: theme.borderRadius[3],
              fontSize: "10px",
              fontWeight: 600,
            }}
          >
            Premium
          </Text>
        )}
        
        {/* Live Preview Button */}
        <Box
          className="preview-button"
          css={{
            position: "absolute",
            top: theme.spacing[3],
            left: theme.spacing[3],
            zIndex: 2,
            opacity: 0,
            transition: "opacity 0.15s ease",
          }}
        >
          <Tooltip content="Live Preview">
            <Button
              color="dark"
              prefix={<EyeOpenIcon />}
              onClick={handlePreviewClick}
              css={{
                padding: theme.spacing[2],
                minWidth: "auto",
                backgroundColor: "rgba(0,0,0,0.7)",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.85)",
                },
              }}
            >
              Preview
            </Button>
          </Tooltip>
        </Box>
        
        {thumbnailUrl ? (
          // Use Strapi thumbnail
          <div
            onClick={handleClick}
            style={{
              width: "100%",
              height: "100%",
              cursor: "pointer",
            }}
          >
            <img
              src={thumbnailUrl}
              alt={title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: theme.borderRadius[4],
              }}
            />
          </div>
        ) : previewImageAsset ? (
          <ThumbnailWithImage
            name={previewImageAsset.name}
            onClick={handleClick}
          />
        ) : (
          <ThumbnailWithAbbr
            title={title}
            onClick={handleClick}
          />
        )}
      </CardContent>
      <CardFooter>
        <Flex direction="column" justify="around" gap="1">
          <Flex justify="between" align="center">
            <Text variant="titles" truncate userSelect="text" css={{ flex: 1 }}>
              {title}
            </Text>
          </Flex>
          {strapiMeta?.description && (
            <Tooltip content={strapiMeta.description}>
              <Text
                variant="mono"
                color="subtle"
                truncate
                css={{ fontSize: "11px" }}
              >
                {strapiMeta.description}
              </Text>
            </Tooltip>
          )}
          {/* Category label and actions */}
          <Flex justify="between" align="center">
            {strapiMeta?.category && (
              <Text variant="mono" color="subtle" css={{ fontSize: "10px" }}>
                {categoryIcons[strapiMeta.category] || "📦"} {strapiMeta.category}
              </Text>
            )}
            <Flex gap="1">
              <Tooltip content="Preview this template">
                <Button
                  color="ghost"
                  prefix={<EyeOpenIcon />}
                  onClick={handlePreviewClick}
                  css={{ padding: theme.spacing[2], minWidth: "auto" }}
                />
              </Tooltip>
            </Flex>
          </Flex>
        </Flex>
      </CardFooter>
      
      {/* Clone Dialog - only for local templates */}
      {!isExternal && (
        <CloneProjectDialog
          isOpen={isDuplicateDialogOpen}
          onOpenChange={setIsDuplicateDialogOpen}
          project={{ id: template.id, title }}
          onCreate={(projectId) => {
            window.location.href = builderUrl({
              origin: window.origin,
              projectId: projectId,
            });
          }}
        />
      )}
      
      {/* Live Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          css={{
            width: "95vw",
            maxWidth: "1400px",
            height: "90vh",
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <DialogTitle
            css={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: theme.spacing[5],
              borderBottom: `1px solid ${theme.colors.borderMain}`,
              margin: 0,
            }}
          >
            <Flex align="center" gap="3">
              <Text variant="titles">{title}</Text>
              {isExternal && (
                <Text
                  variant="mono"
                  css={{
                    fontSize: "10px",
                    background: theme.colors.backgroundAlertInfo,
                    color: theme.colors.foregroundContrastMain,
                    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                    borderRadius: theme.borderRadius[2],
                  }}
                >
                  External
                </Text>
              )}
              {strapiMeta?.category && (
                <Text variant="mono" color="subtle" css={{ fontSize: "11px" }}>
                  {categoryIcons[strapiMeta.category] || "📦"} {strapiMeta.category}
                </Text>
              )}
            </Flex>
            <Flex gap="2" align="center">
              <Button
                color="primary"
                prefix={isExternal ? <ExternalLinkIcon /> : undefined}
                onClick={handleUseTemplate}
              >
                {isExternal ? "Open in Webstudio" : "Use This Template"}
              </Button>
              <DialogClose asChild>
                <Button color="ghost" prefix={<XIcon />} />
              </DialogClose>
            </Flex>
          </DialogTitle>
          
          {/* Preview Iframe */}
          <Box
            css={{
              flex: 1,
              backgroundColor: theme.colors.backgroundPanel,
              position: "relative",
            }}
          >
            <iframe
              src={previewUrl}
              title={`Preview: ${title}`}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </Box>
          
          {/* Footer with URL */}
          <Flex
            align="center"
            justify="between"
            css={{
              padding: theme.spacing[3],
              borderTop: `1px solid ${theme.colors.borderMain}`,
              backgroundColor: theme.colors.backgroundPanel,
            }}
          >
            <Text variant="mono" color="subtle" css={{ fontSize: "11px" }}>
              {previewUrl}
            </Text>
            <Button
              color="ghost"
              onClick={() => window.open(previewUrl, "_blank")}
              css={{ fontSize: "11px" }}
            >
              Open in new tab ↗
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

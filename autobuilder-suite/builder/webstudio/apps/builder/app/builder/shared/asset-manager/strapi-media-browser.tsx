/**
 * Strapi Media Browser Component
 * 
 * Displays media files from Strapi's media library in Webstudio's asset manager.
 * Users can browse and select Strapi media to use in their designs.
 */

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  ScrollArea,
  SearchField,
  Separator,
  Text,
  theme,
  Tooltip,
} from "@webstudio-is/design-system";
import { RefreshIcon } from "@webstudio-is/icons";
import type { StrapiMediaFile, StrapiMediaResponse } from "~/routes/rest.strapi-media";

interface StrapiMediaBrowserProps {
  onSelect?: (url: string, file: StrapiMediaFile) => void;
  accept?: string; // "image/*", "video/*", etc.
}

type FilterType = "all" | "image" | "video" | "file";

export const StrapiMediaBrowser = ({
  onSelect,
  accept = "*",
}: StrapiMediaBrowserProps) => {
  const [files, setFiles] = useState<StrapiMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>(() => {
    if (accept.startsWith("image/")) return "image";
    if (accept.startsWith("video/")) return "video";
    return "all";
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const typeParam = filterType !== "all" ? `?type=${filterType}` : "";
      const response = await fetch(`/rest/strapi-media${typeParam}`);
      const data: StrapiMediaResponse = await response.json();
      
      setAvailable(data.available);
      setFiles(data.files);
      
      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch media");
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [filterType]);

  // Filter files by search query
  const filteredFiles = files.filter((file) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      file.name.toLowerCase().includes(query) ||
      file.alternativeText?.toLowerCase().includes(query) ||
      file.caption?.toLowerCase().includes(query)
    );
  });

  const handleSelect = (file: StrapiMediaFile) => {
    setSelectedId(file.id);
    onSelect?.(file.url, file);
  };

  const getFilePreview = (file: StrapiMediaFile) => {
    if (file.mime.startsWith("image/")) {
      const thumbnailUrl =
        file.formats?.thumbnail?.url ||
        file.formats?.small?.url ||
        file.url;
      return (
        <img
          src={thumbnailUrl}
          alt={file.alternativeText || file.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: theme.borderRadius[2],
          }}
        />
      );
    }

    if (file.mime.startsWith("video/")) {
      return (
        <Flex
          align="center"
          justify="center"
          css={{
            width: "100%",
            height: "100%",
            backgroundColor: theme.colors.backgroundNeutralMain,
            borderRadius: theme.borderRadius[2],
          }}
        >
          <Text variant="mono" css={{ fontSize: "24px" }}>
            🎬
          </Text>
        </Flex>
      );
    }

    // File icon based on extension
    const extIcons: Record<string, string> = {
      ".pdf": "📄",
      ".doc": "📝",
      ".docx": "📝",
      ".xls": "📊",
      ".xlsx": "📊",
      ".zip": "📦",
      ".rar": "📦",
    };

    return (
      <Flex
        align="center"
        justify="center"
        css={{
          width: "100%",
          height: "100%",
          backgroundColor: theme.colors.backgroundNeutralMain,
          borderRadius: theme.borderRadius[2],
        }}
      >
        <Text variant="mono" css={{ fontSize: "24px" }}>
          {extIcons[file.ext] || "📎"}
        </Text>
      </Flex>
    );
  };

  if (!available && !loading) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap={3}
        css={{ padding: theme.spacing[9], textAlign: "center" }}
      >
        <Text variant="labelsSentenceCase" color="subtle">
          Strapi Media Library Not Available
        </Text>
        <Text variant="mono" color="subtle" css={{ fontSize: "11px" }}>
          {error || "Make sure Strapi is running and media permissions are configured."}
        </Text>
        <Button color="ghost" prefix={<RefreshIcon />} onClick={fetchMedia}>
          Retry
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" css={{ height: "100%" }}>
      {/* Header */}
      <Flex
        align="center"
        justify="between"
        css={{
          padding: theme.spacing[5],
          borderBottom: `1px solid ${theme.colors.borderMain}`,
        }}
      >
        <Text variant="labelsTitleCase">Strapi Media</Text>
        <Flex gap={2} align="center">
          <Text variant="mono" color="subtle" css={{ fontSize: "11px" }}>
            {filteredFiles.length} files
          </Text>
          <Button
            color="ghost"
            prefix={<RefreshIcon />}
            onClick={fetchMedia}
            disabled={loading}
          />
        </Flex>
      </Flex>

      {/* Search & Filters */}
      <Flex
        gap={2}
        css={{
          padding: theme.spacing[5],
          borderBottom: `1px solid ${theme.colors.borderMain}`,
        }}
      >
        <Box css={{ flex: 1 }}>
          <SearchField
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search media..."
          />
        </Box>
        <Flex gap={1}>
          {(["all", "image", "video", "file"] as FilterType[]).map((type) => (
            <Button
              key={type}
              color={filterType === type ? "primary" : "ghost"}
              onClick={() => setFilterType(type)}
              css={{ textTransform: "capitalize", minWidth: "auto" }}
            >
              {type}
            </Button>
          ))}
        </Flex>
      </Flex>

      {/* Media Grid */}
      <ScrollArea>
        <Box css={{ padding: theme.spacing[5] }}>
          {loading ? (
            <Flex align="center" justify="center" css={{ padding: theme.spacing[9] }}>
              <Text color="subtle">Loading media...</Text>
            </Flex>
          ) : filteredFiles.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              gap={2}
              css={{ padding: theme.spacing[9] }}
            >
              <Text color="subtle">No media files found</Text>
              <Text variant="mono" color="subtle" css={{ fontSize: "11px" }}>
                Upload files in Strapi Admin → Media Library
              </Text>
            </Flex>
          ) : (
            <Grid
              columns={3}
              gap={2}
              css={{
                "& > *": {
                  aspectRatio: "1",
                },
              }}
            >
              {filteredFiles.map((file) => (
                <Tooltip key={file.id} content={file.name}>
                  <Box
                    onClick={() => handleSelect(file)}
                    css={{
                      cursor: "pointer",
                      borderRadius: theme.borderRadius[4],
                      overflow: "hidden",
                      border: `2px solid ${
                        selectedId === file.id
                          ? theme.colors.borderFocus
                          : "transparent"
                      }`,
                      transition: "all 0.15s ease",
                      "&:hover": {
                        opacity: 0.8,
                        borderColor: theme.colors.borderMain,
                      },
                    }}
                  >
                    {getFilePreview(file)}
                  </Box>
                </Tooltip>
              ))}
            </Grid>
          )}
        </Box>
      </ScrollArea>

      {/* Selected file info */}
      {selectedId && (
        <>
          <Separator />
          <Box css={{ padding: theme.spacing[5] }}>
            {(() => {
              const selectedFile = files.find((f) => f.id === selectedId);
              if (!selectedFile) return null;
              return (
                <Flex direction="column" gap={1}>
                  <Text variant="labelsSentenceCase" truncate>
                    {selectedFile.name}
                  </Text>
                  <Flex gap={2}>
                    <Text variant="mono" color="subtle" css={{ fontSize: "10px" }}>
                      {selectedFile.width && selectedFile.height
                        ? `${selectedFile.width}×${selectedFile.height}`
                        : selectedFile.ext.toUpperCase()}
                    </Text>
                    <Text variant="mono" color="subtle" css={{ fontSize: "10px" }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </Text>
                  </Flex>
                </Flex>
              );
            })()}
          </Box>
        </>
      )}
    </Flex>
  );
};

import { useState, useId, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { nanoid } from "nanoid";
import {
  Box,
  Button,
  Flex,
  Grid,
  InputErrorsTooltip,
  InputField,
  Label,
  PanelTitle,
  ScrollArea,
  Select,
  Separator,
  Text,
  theme,
  Tooltip,
} from "@webstudio-is/design-system";
import {
  PlusIcon,
  TrashIcon,
  RefreshIcon,
  Link2UnlinkedIcon,
  Link2Icon,
} from "@webstudio-is/icons";
import { $dataSources, $resources, $isStrapiConnected, connectStrapi, disconnectStrapi } from "~/shared/nano-states";
import { $selectedPage } from "~/shared/awareness";
import { updateWebstudioData } from "~/shared/instance-utils";
import type { Resource, DataSource } from "@webstudio-is/sdk";

// ============================================================================
// STRAPI CONTENT TYPE INTERFACE (from API)
// ============================================================================

interface StrapiContentType {
  uid: string;
  apiId: string;
  displayName: string;
  pluralName: string;
  singularName: string;
  description: string;
  endpoint: string;
  directEndpoint: string;
  icon: string;
  category: string;
}

interface ContentTypesResponse {
  available: boolean;
  contentTypes: StrapiContentType[];
  count: number;
  error?: string;
}

// ============================================================================
// STRAPI CONTENT TYPE CARD COMPONENT
// ============================================================================

interface StrapiContentTypeCardProps {
  contentType: StrapiContentType;
  isAdded: boolean;
  onAdd: () => void;
}

const StrapiContentTypeCard = ({
  contentType,
  isAdded,
  onAdd,
}: StrapiContentTypeCardProps) => {
  return (
    <Box
      css={{
        padding: theme.spacing[5],
        backgroundColor: isAdded
          ? theme.colors.backgroundSuccessNotification
          : theme.colors.backgroundPanel,
        borderRadius: theme.borderRadius[4],
        border: `1px solid ${isAdded ? theme.colors.borderSuccess : theme.colors.borderMain}`,
        cursor: isAdded ? "default" : "pointer",
        transition: "all 0.15s ease",
        "&:hover": isAdded
          ? {}
          : {
              backgroundColor: theme.colors.backgroundHover,
              borderColor: theme.colors.borderFocus,
            },
      }}
      onClick={isAdded ? undefined : onAdd}
    >
      <Flex direction="column" gap={2}>
        <Flex justify="between" align="center">
          <Flex align="center" gap={2}>
            <Box css={{ fontSize: 18, lineHeight: 1 }}>{contentType.icon}</Box>
            <Text variant="labelsSentenceCase">{contentType.displayName}</Text>
          </Flex>
          {isAdded ? (
            <Box
              css={{
                padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
                backgroundColor: theme.colors.backgroundSuccessMain,
                borderRadius: theme.borderRadius[3],
              }}
            >
              <Text variant="mono" css={{ fontSize: 9, color: "white" }}>
                ADDED
              </Text>
            </Box>
          ) : (
            <PlusIcon />
          )}
        </Flex>
        <Text
          variant="mono"
          color="subtle"
          truncate
          css={{ fontSize: 10, opacity: 0.7 }}
        >
          {contentType.endpoint}
        </Text>
      </Flex>
    </Box>
  );
};

// ============================================================================
// CUSTOM RESOURCE FORM
// ============================================================================

type NewResourceFormProps = {
  onClose: () => void;
  onSave: (name: string, url: string, method: string) => void;
};

const NewResourceForm = ({ onClose, onSave }: NewResourceFormProps) => {
  const nameId = useId();
  const urlId = useId();
  const methodId = useId();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("get");
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});

  const handleSubmit = () => {
    const newErrors: { name?: string; url?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!url.trim()) {
      newErrors.url = "URL is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(name, url, method);
    onClose();
  };

  return (
    <Box css={{ padding: theme.spacing[5] }}>
      <Grid gap={3}>
        <Flex justify="between" align="center">
          <Text variant="titles">Custom REST API</Text>
          <Button color="ghost" onClick={onClose} css={{ fontSize: 11 }}>
            Cancel
          </Button>
        </Flex>

        <Grid gap={1}>
          <Label htmlFor={nameId}>Name</Label>
          <InputErrorsTooltip errors={errors.name ? [errors.name] : undefined}>
            <InputField
              id={nameId}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g., My API"
              color={errors.name ? "error" : undefined}
            />
          </InputErrorsTooltip>
        </Grid>

        <Grid gap={1}>
          <Label htmlFor={urlId}>URL</Label>
          <InputErrorsTooltip errors={errors.url ? [errors.url] : undefined}>
            <InputField
              id={urlId}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrors((prev) => ({ ...prev, url: undefined }));
              }}
              placeholder="https://api.example.com/data"
              color={errors.url ? "error" : undefined}
            />
          </InputErrorsTooltip>
        </Grid>

        <Grid gap={1}>
          <Label htmlFor={methodId}>Method</Label>
          <Select
            options={["get", "post", "put", "delete"]}
            value={method}
            onChange={(value) => setMethod(value)}
          />
        </Grid>

        <Button onClick={handleSubmit}>Add Resource</Button>
      </Grid>
    </Box>
  );
};

// ============================================================================
// RESOURCE ITEM COMPONENT
// ============================================================================

type ResourceItemProps = {
  dataSource: DataSource;
  resource: Resource;
  onDelete: () => void;
};

const ResourceItem = ({
  dataSource,
  resource,
  onDelete,
}: ResourceItemProps) => {
  // Extract URL from expression (remove quotes if present)
  const displayUrl = resource.url.replace(/^["']|["']$/g, "");
  const isStrapi = displayUrl.includes("/rest/strapi/");

  return (
    <Box
      css={{
        padding: theme.spacing[5],
        backgroundColor: theme.colors.backgroundPanel,
        borderRadius: theme.borderRadius[4],
        border: `1px solid ${theme.colors.borderMain}`,
      }}
    >
      <Flex direction="column" gap={2}>
        <Flex justify="between" align="center">
          <Text variant="labelsSentenceCase" truncate>
            {dataSource.name}
          </Text>
          <Tooltip content="Delete">
            <Button
              color="ghost"
              prefix={<TrashIcon />}
              onClick={onDelete}
              aria-label="Delete resource"
            />
          </Tooltip>
        </Flex>

        <Text variant="mono" color="subtle" truncate css={{ fontSize: 11 }}>
          {resource.method.toUpperCase()} {displayUrl}
        </Text>

        <Flex align="center" gap={2}>
          <Flex align="center" gap={1}>
            <Box
              css={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: theme.colors.backgroundSuccessMain,
              }}
            />
            <Text variant="mono" color="subtle" css={{ fontSize: 10 }}>
              Configured
            </Text>
          </Flex>
          {isStrapi && (
            <Box
              css={{
                padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                backgroundColor: theme.colors.backgroundInfoNotification,
                borderRadius: theme.borderRadius[2],
              }}
            >
              <Text
                variant="mono"
                css={{ fontSize: 9, color: theme.colors.backgroundInfoMain }}
              >
                STRAPI
              </Text>
            </Box>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

// ============================================================================
// STRAPI DYNAMIC CONTENT TYPES TAB
// ============================================================================

interface StrapiDynamicTabProps {
  existingEndpoints: Set<string>;
  onAddContentType: (contentType: StrapiContentType) => void;
  isConnected: boolean;
  onDisconnect: () => void;
  onConnect: () => void;
  strapiResourceCount: number;
}

const StrapiDynamicTab = ({
  existingEndpoints,
  onAddContentType,
  isConnected,
  onDisconnect,
  onConnect,
  strapiResourceCount,
}: StrapiDynamicTabProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentTypes, setContentTypes] = useState<StrapiContentType[]>([]);
  const [strapiAvailable, setStrapiAvailable] = useState(true);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const fetchContentTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/rest/strapi-content-types");
      const data: ContentTypesResponse = await response.json();

      if (!data.available) {
        setStrapiAvailable(false);
        setError(data.error || "Strapi is not available");
        setContentTypes([]);
      } else {
        setStrapiAvailable(true);
        setContentTypes(data.contentTypes);
      }
    } catch (err) {
      setError("Failed to fetch content types");
      setStrapiAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchContentTypes();
    }
  }, [isConnected]);

  // If not connected, show connect prompt
  if (!isConnected) {
    return (
      <Box css={{ padding: theme.spacing[5] }}>
        <Flex direction="column" gap={4} align="center" css={{ paddingTop: theme.spacing[9] }}>
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
            Connect to your Strapi CMS to browse collections and add them as data resources.
          </Text>
          <Button
            prefix={<Link2Icon />}
            onClick={() => {
              onConnect();
              fetchContentTypes();
            }}
          >
            Connect to Strapi
          </Button>
        </Flex>
      </Box>
    );
  }

  return (
    <Box css={{ padding: theme.spacing[5] }}>
      <Flex direction="column" gap={4}>
        {/* Header with refresh and disconnect */}
        <Flex justify="between" align="center">
          <Text variant="labelsSentenceCase" color="subtle">
            Available Collections
          </Text>
          <Flex gap={1}>
            <Tooltip content="Refresh from Strapi">
              <Button
                color="ghost"
                prefix={<RefreshIcon />}
                onClick={fetchContentTypes}
                disabled={loading}
                aria-label="Refresh content types"
              />
            </Tooltip>
            <Tooltip content="Disconnect from Strapi">
              <Button
                color="ghost"
                prefix={<Link2UnlinkedIcon />}
                onClick={() => setShowDisconnectConfirm(true)}
                aria-label="Disconnect from Strapi"
              />
            </Tooltip>
          </Flex>
        </Flex>

        {/* Disconnect confirmation */}
        {showDisconnectConfirm && (
          <Box
            css={{
              padding: theme.spacing[5],
              backgroundColor: theme.colors.backgroundDestructiveNotification,
              borderRadius: theme.borderRadius[4],
              border: `1px solid ${theme.colors.backgroundDestructiveMain}`,
            }}
          >
            <Flex direction="column" gap={3}>
              <Text
                variant="labelsSentenceCase"
                css={{ color: theme.colors.foregroundDestructive }}
              >
                Disconnect from Strapi?
              </Text>
              <Text css={{ fontSize: 12, color: theme.colors.foregroundDestructive }}>
                {strapiResourceCount > 0
                  ? `This will remove ${strapiResourceCount} Strapi resource${strapiResourceCount !== 1 ? "s" : ""} from this project.`
                  : "You can reconnect at any time."}
              </Text>
              <Flex gap={2}>
                <Button
                  color="destructive"
                  onClick={() => {
                    onDisconnect();
                    setShowDisconnectConfirm(false);
                  }}
                >
                  Disconnect
                </Button>
                <Button
                  color="ghost"
                  onClick={() => setShowDisconnectConfirm(false)}
                >
                  Cancel
                </Button>
              </Flex>
            </Flex>
          </Box>
        )}

        {/* Loading state */}
        {loading && (
          <Flex
            justify="center"
            align="center"
            css={{ padding: theme.spacing[9] }}
          >
            <Text color="subtle">Loading collections from Strapi...</Text>
          </Flex>
        )}

        {/* Error state */}
        {!loading && error && (
          <Box
            css={{
              padding: theme.spacing[5],
              backgroundColor: theme.colors.backgroundDestructiveNotification,
              borderRadius: theme.borderRadius[4],
              border: `1px solid ${theme.colors.backgroundDestructiveMain}`,
            }}
          >
            <Flex direction="column" gap={2}>
              <Text
                variant="labelsSentenceCase"
                css={{ color: theme.colors.foregroundDestructive }}
              >
                {strapiAvailable ? "Error" : "Strapi Not Available"}
              </Text>
              <Text css={{ fontSize: 12, color: theme.colors.foregroundDestructive }}>
                {error}
              </Text>
              <Text
                css={{
                  fontSize: 11,
                  color: theme.colors.foregroundDestructive,
                  opacity: 0.8,
                }}
              >
                Make sure Strapi is running at http://localhost:1337
              </Text>
            </Flex>
          </Box>
        )}

        {/* Success - show content types */}
        {!loading && !error && strapiAvailable && (
          <>
            {/* Info Banner */}
            <Box
              css={{
                padding: theme.spacing[5],
                backgroundColor: theme.colors.backgroundInfoNotification,
                borderRadius: theme.borderRadius[4],
                border: `1px solid ${theme.colors.backgroundInfoMain}`,
              }}
            >
              <Flex direction="column" gap={2}>
                <Text
                  variant="labelsSentenceCase"
                  css={{ color: theme.colors.backgroundInfoMain }}
                >
                  {contentTypes.length} Collection
                  {contentTypes.length !== 1 ? "s" : ""} Found
                </Text>
                <Text
                  css={{
                    fontSize: 12,
                    color: theme.colors.backgroundInfoMain,
                    opacity: 0.9,
                  }}
                >
                  Click any collection to add it as a resource. New collections
                  you create in Strapi will appear here automatically.
                </Text>
              </Flex>
            </Box>

            {/* All collections in a flat list */}
            <Flex direction="column" gap={2}>
              {contentTypes.map((ct) => {
                const endpointBase = ct.endpoint.split("?")[0];
                const isAdded = existingEndpoints.has(endpointBase);
                return (
                  <StrapiContentTypeCard
                    key={ct.uid}
                    contentType={ct}
                    isAdded={isAdded}
                    onAdd={() => onAddContentType(ct)}
                  />
                );
              })}
            </Flex>

            {/* No content types */}
            {contentTypes.length === 0 && (
              <Flex
                direction="column"
                align="center"
                gap={3}
                css={{ padding: theme.spacing[9] }}
              >
                <Text color="subtle" align="center">
                  No content types found in Strapi.
                </Text>
                <Text color="subtle" align="center" css={{ fontSize: 12 }}>
                  Create a collection in Strapi admin, then click refresh.
                </Text>
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Box>
  );
};

// ============================================================================
// MAIN RESOURCES PANEL
// ============================================================================

export const ResourcesPanel = (_props: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<string>("strapi");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const isStrapiConnected = useStore($isStrapiConnected);
  const dataSources = useStore($dataSources);
  const resources = useStore($resources);
  const selectedPage = useStore($selectedPage);

  // Get all resource data sources with their resources
  const resourceDataSources: Array<{
    dataSource: DataSource;
    resource: Resource;
  }> = [];

  const existingEndpoints = new Set<string>();

  const strapiResources: Array<{
    dataSource: DataSource;
    resource: Resource;
  }> = [];

  for (const dataSource of dataSources.values()) {
    if (dataSource.type === "resource") {
      const resource = resources.get(dataSource.resourceId);
      if (resource) {
        resourceDataSources.push({ dataSource, resource });
        // Track existing endpoints (without query params)
        const urlBase = resource.url.replace(/^["']|["']$/g, "").split("?")[0];
        existingEndpoints.add(urlBase);
        
        // Track Strapi resources separately
        if (urlBase.includes("/rest/strapi/")) {
          strapiResources.push({ dataSource, resource });
        }
      }
    }
  }

  const handleDisconnectStrapi = () => {
    // Remove all Strapi resources
    updateWebstudioData((data) => {
      for (const { dataSource, resource } of strapiResources) {
        data.dataSources.delete(dataSource.id);
        data.resources.delete(resource.id);
      }
    });
    disconnectStrapi();
  };

  const handleAddResource = (name: string, url: string, method: string) => {
    const resourceId = nanoid();
    const dataSourceId = nanoid();
    const rootInstanceId = selectedPage?.rootInstanceId;

    updateWebstudioData((data) => {
      data.resources.set(resourceId, {
        id: resourceId,
        name,
        url: `"${url}"`,
        method: method as "get" | "post" | "put" | "delete",
        headers: [],
      });

      data.dataSources.set(dataSourceId, {
        id: dataSourceId,
        scopeInstanceId: rootInstanceId,
        name,
        type: "resource",
        resourceId,
      });
    });
  };

  const handleAddStrapiContentType = (contentType: StrapiContentType) => {
    handleAddResource(contentType.displayName, contentType.endpoint, "get");
  };

  const handleDeleteResource = (dataSourceId: string, resourceId: string) => {
    updateWebstudioData((data) => {
      data.dataSources.delete(dataSourceId);
      data.resources.delete(resourceId);
    });
  };

  return (
    <Flex direction="column" css={{ height: "100%" }}>
      <PanelTitle>Resources</PanelTitle>
      <Separator />

      {/* Tabs */}
      <Box css={{ borderBottom: `1px solid ${theme.colors.borderMain}` }}>
        <Flex css={{ padding: `0 ${theme.spacing[3]}` }}>
          <Button
            color={activeTab === "strapi" ? "primary" : "ghost"}
            onClick={() => setActiveTab("strapi")}
            css={{
              borderRadius: 0,
              borderBottom:
                activeTab === "strapi"
                  ? `2px solid ${theme.colors.backgroundPrimary}`
                  : "2px solid transparent",
            }}
          >
            Strapi CMS
          </Button>
          <Button
            color={activeTab === "custom" ? "primary" : "ghost"}
            onClick={() => setActiveTab("custom")}
            css={{
              borderRadius: 0,
              borderBottom:
                activeTab === "custom"
                  ? `2px solid ${theme.colors.backgroundPrimary}`
                  : "2px solid transparent",
            }}
          >
            Custom API
          </Button>
          <Button
            color={activeTab === "active" ? "primary" : "ghost"}
            onClick={() => setActiveTab("active")}
            css={{
              borderRadius: 0,
              borderBottom:
                activeTab === "active"
                  ? `2px solid ${theme.colors.backgroundPrimary}`
                  : "2px solid transparent",
            }}
          >
            Active ({resourceDataSources.length})
          </Button>
        </Flex>
      </Box>

      {/* Tab Content */}
      <ScrollArea>
        {activeTab === "strapi" && (
          <StrapiDynamicTab
            existingEndpoints={existingEndpoints}
            onAddContentType={handleAddStrapiContentType}
            isConnected={isStrapiConnected}
            onDisconnect={handleDisconnectStrapi}
            onConnect={connectStrapi}
            strapiResourceCount={strapiResources.length}
          />
        )}

        {activeTab === "custom" && (
          <Box css={{ padding: theme.spacing[5] }}>
            {showCustomForm ? (
              <NewResourceForm
                onClose={() => setShowCustomForm(false)}
                onSave={(name, url, method) => {
                  handleAddResource(name, url, method);
                  setShowCustomForm(false);
                }}
              />
            ) : (
              <Flex direction="column" gap={3} align="center">
                <Text color="subtle" align="center" css={{ fontSize: 12 }}>
                  Add a custom REST API endpoint to fetch data from any external
                  service.
                </Text>
                <Button
                  prefix={<PlusIcon />}
                  onClick={() => setShowCustomForm(true)}
                >
                  Add Custom Resource
                </Button>
              </Flex>
            )}
          </Box>
        )}

        {activeTab === "active" && (
          <Box css={{ padding: theme.spacing[5] }}>
            {resourceDataSources.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                gap={3}
                css={{ padding: theme.spacing[9] }}
              >
                <Text color="subtle" align="center">
                  No resources configured yet.
                </Text>
                <Text color="subtle" align="center" css={{ fontSize: 12 }}>
                  Add a Strapi collection or custom resource to get started.
                </Text>
                <Button onClick={() => setActiveTab("strapi")}>
                  Browse Strapi Collections
                </Button>
              </Flex>
            ) : (
              <Flex direction="column" gap={2}>
                {resourceDataSources.map(({ dataSource, resource }) => (
                  <ResourceItem
                    key={dataSource.id}
                    dataSource={dataSource}
                    resource={resource}
                    onDelete={() => {
                      if (dataSource.type === "resource") {
                        handleDeleteResource(
                          dataSource.id,
                          dataSource.resourceId
                        );
                      }
                    }}
                  />
                ))}
              </Flex>
            )}
          </Box>
        )}
      </ScrollArea>
    </Flex>
  );
};

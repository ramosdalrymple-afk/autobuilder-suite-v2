import {
  Flex,
  Grid,
  List,
  ListItem,
  Text,
  rawTheme,
  theme,
} from "@webstudio-is/design-system";
import type { EnrichedTemplate } from "~/routes/_ui.dashboard";
import { Header, Main } from "../shared/layout";
import { CreateProject } from "../projects/project-dialogs";
import { TemplateCard } from "./template-card";

// Category display configuration
const categoryLabels: Record<string, string> = {
  business: "Business",
  portfolio: "Portfolio",
  ecommerce: "E-Commerce",
  blog: "Blog",
  landing: "Landing Page",
  saas: "SaaS",
  agency: "Agency",
  personal: "Personal",
  other: "Other",
};

export const TemplatesGrid = ({
  templates,
}: {
  templates: Array<EnrichedTemplate>;
}) => {
  return (
    <List asChild>
      <Grid
        gap="6"
        css={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${rawTheme.spacing[31]}, 1fr))`,
          paddingBottom: theme.spacing[13],
        }}
      >
        {templates.map((template) => {
          return (
            <ListItem index={0} key={template.id} asChild>
              <TemplateCard template={template} />
            </ListItem>
          );
        })}
      </Grid>
    </List>
  );
};

type TemplatesProps = {
  templates: Array<EnrichedTemplate>;
  welcome?: boolean;
};

export const Templates = ({ templates, welcome = false }: TemplatesProps) => {
  // Get featured templates (with Strapi metadata)
  const featuredTemplates = templates.filter((t) => t.strapiMeta?.isPremium === false);
  const premiumTemplates = templates.filter((t) => t.strapiMeta?.isPremium === true);
  
  // Group by category
  const categorizedTemplates = templates.reduce((acc, template) => {
    const category = template.strapiMeta?.category || "other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, EnrichedTemplate[]>);

  const hasCategories = Object.keys(categorizedTemplates).length > 1;

  return (
    <Main>
      <Header variant="main">
        <Text variant="brandSectionTitle" as="h2">
          {welcome ? "What will you create?" : "Starter templates"}
        </Text>
        <Flex gap="2" align="center">
          {templates.length > 0 && (
            <Text variant="mono" color="subtle">
              {templates.length} templates
            </Text>
          )}
          <CreateProject />
        </Flex>
      </Header>
      <Flex
        direction="column"
        gap="6"
        css={{ paddingInline: theme.spacing[13] }}
      >
        {/* If no Strapi metadata, show all in one grid */}
        {!hasCategories && <TemplatesGrid templates={templates} />}
        
        {/* If we have categories, show featured first, then by category */}
        {hasCategories && (
          <>
            {/* Featured/Free Templates */}
            {featuredTemplates.length > 0 && (
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <Text variant="labelsTitleCase">Free Templates</Text>
                  <Text variant="mono" color="subtle">({featuredTemplates.length})</Text>
                </Flex>
                <TemplatesGrid templates={featuredTemplates} />
              </Flex>
            )}
            
            {/* Premium Templates */}
            {premiumTemplates.length > 0 && (
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <Text variant="labelsTitleCase">Premium</Text>
                  <Text variant="mono" color="subtle">({premiumTemplates.length})</Text>
                </Flex>
                <TemplatesGrid templates={premiumTemplates} />
              </Flex>
            )}
          </>
        )}
      </Flex>
    </Main>
  );
};

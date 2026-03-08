import {
  Template,
  PropertyMapping,
  PredicatesMapping,
} from '../components/Graph/types';

export interface TemplateSpecificGuidance {
  templateId: string;
  templateLabel: string;
  domainKnowledge?: string;
  queryExamples?: string;
  specificRules?: string;
  commonPatterns?: string;
  troubleshooting?: string;
}

/**
 * Static object containing template-specific guidance for different ORKG templates
 * This provides domain-specific knowledge, examples, and best practices for each template
 */
export const TEMPLATE_SPECIFIC_GUIDANCE: Record<
  string,
  TemplateSpecificGuidance
> = {
  // Empirical Research Practice Template (R186491)
  R186491: {
    templateId: 'R186491',
    templateLabel: 'Empirical Research Practice',
    domainKnowledge: `
Empirical study = has data collection (not "no collection"), data analysis (not "no analysis"). Often filter venue = IEEE International Requirements Engineering Conference. Use \`?contribution a orkgc:C27001\`; return ?dc_label/?da_label and let processing filter.
`,
    queryExamples: '',
    specificRules: `
Exclude non-empirical: \`FILTER(LCASE(STR(?dc_label)) != LCASE("no collection"))\`, \`FILTER(LCASE(STR(?da_label)) != LCASE("no analysis"))\`. Venue: \`?contribution orkgp:P135046 ?venue . ?venue rdfs:label ?venue_name\` then FILTER with LCASE. Method types: traverse contribution → data collection → method → method type → label. Threats: \`?contribution orkgp:P39099 ?threats\` then OPTIONAL per threat type. Use SAMPLE()+GROUP BY for boolean/dedup.
`,
    commonPatterns: `
OPTIONAL for optional props; declare contribution class; traverse to method type for method labels; SAMPLE()+GROUP BY for one row per paper when needed.
`,
    troubleshooting: `
Empty methods → traverse to method type (collection→method→method type→label). Venue not working → get \`?venue rdfs:label ?venue_name\` first. Duplicates → SAMPLE() with GROUP BY.
`,
  },
  // NLP for Requirements Engineering Template (R1544125)
  R1544125: {
    templateId: 'R1544125',
    templateLabel: 'NLP for Requirements Engineering (NLP4RE)',
    domainKnowledge: `
NLP4RE: NLP/RE tasks, evaluation metrics, datasets, annotation, baselines. Use \`?contribution a orkgc:C121001\`. Evaluation: HAS_EVALUATION → P110006 (metrics). NLP tasks: P181003 → P181004. RE tasks: P181002. Datasets: P181011 → P181022 → P181023. Annotation: P181031 → P181036 → P181038.
`,
    queryExamples: '',
    specificRules: `
Class: \`?contribution a orkgc:C121001\`. Use SELECT DISTINCT. OPTIONAL for labels. Top N: include ?paper and ?paperLabel, no LIMIT, ORDER BY ?paperLabel. Traverse full chains (e.g. dataset→datatype→dataformat; HAS_EVALUATION→evaluation→P110006).
`,
    commonPatterns: `
DISTINCT; OPTIONAL for labels; full property chains; for "top N" return ?paper ?paperLabel + field, no LIMIT.
`,
    troubleshooting: `
Duplicates → SELECT DISTINCT. Missing labels → OPTIONAL { rdfs:label }. Empty nested → traverse full chain. Metrics → HAS_EVALUATION then P110006.
`,
  },
};

/**
 * Generate a template mapping from template data
 */
export const generateTemplateMapping = (
  templates: Template[]
): PredicatesMapping => {
  const predicatesMapping: PredicatesMapping = {};

  // Create a map of templates by their target class ID for quick lookup
  const templateMap = new Map<string, Template>();
  templates.forEach((template) => {
    if (template.target_class?.id) {
      templateMap.set(template.target_class.id, template);
    }
  });

  // Process each template and its properties
  templates.forEach((template) => {
    if (!template.properties || template.properties.length === 0) return;

    template.properties.forEach((property) => {
      const pathId = property.path?.id;
      if (!pathId) return;

      // Determine cardinality based on min_count and max_count
      let cardinality = 'one to one';
      if (property.max_count === null || property.max_count > 1) {
        cardinality = 'one to many';
      }

      const propertyMapping: PropertyMapping = {
        label: property.class?.label ?? property.path.label,
        cardinality,
        description:
          property.description || property.label || property.path.label,
        predicate_label: property.path.label,
        class_label: property.class?.label,
      };

      // If property has a class (object property), it's a subtemplate
      if (property.class?.id) {
        const targetTemplate = templateMap.get(property.class.id);
        if (targetTemplate) {
          propertyMapping.subtemplate_id = targetTemplate.id;
          propertyMapping.subtemplate_label = targetTemplate.label;
          propertyMapping.class_id = property.class.id;

          // Recursively process subtemplate properties
          if (
            targetTemplate.properties &&
            targetTemplate.properties.length > 0
          ) {
            propertyMapping.subtemplate_properties = {};

            targetTemplate.properties.forEach((subProperty) => {
              const subPathId = subProperty.path?.id;
              if (!subPathId) return;

              let subCardinality = 'one to one';
              if (subProperty.max_count === null || subProperty.max_count > 1) {
                subCardinality = 'one to many';
              }

              const subPropertyMapping: PropertyMapping = {
                label: subProperty.class?.label ?? subProperty.path.label,
                cardinality: subCardinality,
                description:
                  subProperty.description ||
                  subProperty.label ||
                  subProperty.path.label,
                predicate_label: subProperty.path.label,
                class_label: subProperty.class?.label,
              };

              // Check if this sub-property also has a class (nested subtemplate)
              if (subProperty.class?.id) {
                const subTargetTemplate = templateMap.get(subProperty.class.id);
                if (subTargetTemplate) {
                  subPropertyMapping.subtemplate_id = subTargetTemplate.id;
                  subPropertyMapping.subtemplate_label =
                    subTargetTemplate.label;
                  subPropertyMapping.class_id = subProperty.class.id;

                  // Process nested subtemplate properties
                  if (
                    subTargetTemplate.properties &&
                    subTargetTemplate.properties.length > 0
                  ) {
                    subPropertyMapping.subtemplate_properties = {};

                    subTargetTemplate.properties.forEach((nestedProperty) => {
                      const nestedPathId = nestedProperty.path?.id;
                      if (!nestedPathId) return;

                      let nestedCardinality = 'one to one';
                      if (
                        nestedProperty.max_count === null ||
                        nestedProperty.max_count > 1
                      ) {
                        nestedCardinality = 'one to many';
                      }

                      if (subPropertyMapping.subtemplate_properties) {
                        subPropertyMapping.subtemplate_properties[
                          nestedPathId
                        ] = {
                          label:
                            nestedProperty.class?.label ??
                            nestedProperty.path.label,
                          cardinality: nestedCardinality,
                          description:
                            nestedProperty.description ||
                            nestedProperty.label ||
                            nestedProperty.path.label,
                          predicate_label: nestedProperty.path.label,
                          class_label: nestedProperty.class?.label,
                        };
                      }
                    });
                  }
                }
              }

              if (propertyMapping.subtemplate_properties) {
                propertyMapping.subtemplate_properties[subPathId] =
                  subPropertyMapping;
              }
            });
          }
        }
      }

      predicatesMapping[pathId] = propertyMapping;
    });
  });

  return predicatesMapping;
};

/**
 * Generate a dynamic SPARQL prompt based on template information
 */
export const generateDynamicSPARQLPrompt = (
  templateMapping: PredicatesMapping,
  templateId: string,
  templateLabel?: string,
  targetClassId?: string
): string => {
  // Check if we have template-specific guidance for this template
  const specificGuidance = TEMPLATE_SPECIFIC_GUIDANCE[templateId];

  const basePrompt = `# ORKG SPARQL Generator

Generate precise, executable SPARQL for the Open Research Knowledge Graph. Template: "${templateLabel || specificGuidance?.templateLabel || templateId}" (ID: ${templateId}).

## Prefixes (required in every query)
\`\`\`sparql
PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
\`\`\`

## Core
| Entity | Term | Usage |
|--------|------|--------|
| Paper | - | publication resource |
| Contribution | \`orkgp:P31\`, \`orkgc:${targetClassId || 'C27001'}\` | \`?paper orkgp:P31 ?contribution\` ; \`?contribution a orkgc:${targetClassId || 'C27001'} .\` |
| Year (if time/trends) | \`orkgp:P29\` | \`?paper orkgp:P29 ?year\` (never on contribution) |
| Venue (if asked) | \`orkgp:P135046\` | \`?contribution orkgp:P135046 ?venue . ?venue rdfs:label ?venue_name\` |`;

  // Generate the schema section based on template mapping
  const schemaSection = generateSchemaSection(templateMapping);

  // Generate hierarchy section
  const hierarchySection = generateHierarchySection(templateMapping);

  // Add template-specific guidance if available
  let templateSpecificSection = '';
  if (specificGuidance) {
    templateSpecificSection = '\n\n## Template-Specific Guidance\n';

    if (specificGuidance.domainKnowledge) {
      templateSpecificSection += specificGuidance.domainKnowledge;
    }

    if (specificGuidance.queryExamples) {
      templateSpecificSection += '\n\n' + specificGuidance.queryExamples;
    }

    if (specificGuidance.specificRules) {
      templateSpecificSection += '\n\n' + specificGuidance.specificRules;
    }

    if (specificGuidance.commonPatterns) {
      templateSpecificSection += '\n\n' + specificGuidance.commonPatterns;
    }

    if (specificGuidance.troubleshooting) {
      templateSpecificSection += '\n\n' + specificGuidance.troubleshooting;
    }
  }

  const rulesSection = `

## Rules
1. **Class**: Always \`?contribution a orkgc:${targetClassId || 'C27001'} .\`
2. **Year**: Only if question asks time/trends; use \`?paper orkgp:P29 ?year\` (never \`?contribution orkgp:P29\`).
3. **Top N / frequency**: Include \`?paper\` and \`?paperLabel\` in SELECT; no LIMIT; ORDER BY paper.
4. **One query per code block**: Each \`\`\`sparql block has one SELECT; use \`# id: name\`.
5. **URIs vs labels**: Properties return URIs. Get label first: \`?resource rdfs:label ?label\`. Compare only the label to strings.
6. **Label comparison**: Always use \`LCASE(STR(?label)) = LCASE("value")\` (case-insensitive).
7. **BIND**: Only in WHERE; variables in BIND must be defined before it. No IF() in SELECT—use BIND(IF(...)) in WHERE.
8. **Proportions**: Use subqueries; cast \`xsd:decimal\` for division.
9. **Nested props**: Follow schema hierarchy (contribution → parent → child); use \`└─\` in Template Properties.

**Output**: Only SPARQL in \`\`\`sparql blocks. No explanations. One query per block.

## Input
**Research Question:** [Research Question]`;

  return (
    basePrompt +
    schemaSection +
    hierarchySection +
    templateSpecificSection +
    rulesSection
  );
};

/**
 * Generate the schema section from template mapping
 */
const generateSchemaSection = (templateMapping: PredicatesMapping): string => {
  let schemaSection = '\n\n#### Template Properties\n\n';

  schemaSection += '| Concept | ORKG Term | Type | Description & Usage |\n';
  schemaSection += '|---------|-----------|------|---------------------|\n';

  Object.entries(templateMapping).forEach(([predicateId, mapping]) => {
    const term = `\`orkgp:${predicateId}\``;
    const type =
      mapping.cardinality === 'one to many'
        ? 'Predicate (multiple)'
        : 'Predicate';
    const usage = `Usage: \`?variable orkgp:${predicateId} ?target\``;

    schemaSection += `| ${mapping.label} | ${term} | ${type} | ${mapping.description}. ${usage} |\n`;

    // Add subtemplate properties if they exist
    if (mapping.subtemplate_properties) {
      Object.entries(mapping.subtemplate_properties).forEach(
        ([subPredicateId, subMapping]) => {
          const subTerm = `\`orkgp:${subPredicateId}\``;
          const subType =
            subMapping.cardinality === 'one to many'
              ? 'Predicate (multiple)'
              : 'Predicate';
          const subUsage = `Usage: \`?contribution orkgp:${predicateId} ?subtemplate . ?subtemplate orkgp:${subPredicateId} ?subtarget\``;

          schemaSection += `| └─ ${subMapping.label} | ${subTerm} | ${subType} | ${subMapping.description}. ${subUsage} |\n`;

          // Add nested properties if they exist
          if (subMapping.subtemplate_properties) {
            Object.entries(subMapping.subtemplate_properties).forEach(
              ([nestedPredicateId, nestedMapping]) => {
                const nestedTerm = `\`orkgp:${nestedPredicateId}\``;
                const nestedType =
                  nestedMapping.cardinality === 'one to many'
                    ? 'Predicate (multiple)'
                    : 'Predicate';
                const nestedUsage = `Usage: \`?contribution orkgp:${predicateId} ?subtemplate . ?subtemplate orkgp:${subPredicateId} ?nestedtemplate . ?nestedtemplate orkgp:${nestedPredicateId} ?nestedtarget\``;

                schemaSection += `| &nbsp;&nbsp;&nbsp;&nbsp;└─ ${nestedMapping.label} | ${nestedTerm} | ${nestedType} | ${nestedMapping.description}. ${nestedUsage} |\n`;
              }
            );
          }
        }
      );
    }
  });

  return schemaSection;
};

/**
 * Generate hierarchy section showing the nested structure
 */
const generateHierarchySection = (
  templateMapping: PredicatesMapping
): string => {
  let hierarchySection = '\n\n#### Template Hierarchy Structure\n\n';

  hierarchySection += 'Traverse via parent → child:\n\n';

  Object.entries(templateMapping).forEach(([predicateId, mapping]) => {
    hierarchySection += `**${mapping.label}** (\`orkgp:${predicateId}\`)\n`;

    // Add subtemplate properties if they exist
    if (mapping.subtemplate_properties) {
      Object.entries(mapping.subtemplate_properties).forEach(
        ([subPredicateId, subMapping]) => {
          hierarchySection += `  └─ **${subMapping.label}** (\`orkgp:${subPredicateId}\`)\n`;

          // Add nested properties if they exist
          if (subMapping.subtemplate_properties) {
            Object.entries(subMapping.subtemplate_properties).forEach(
              ([nestedPredicateId, nestedMapping]) => {
                hierarchySection += `    └─ **${nestedMapping.label}** (\`orkgp:${nestedPredicateId}\`)\n`;
              }
            );
          }
        }
      );
    }
    hierarchySection += '\n';
  });

  hierarchySection += '└─ = child of above; traverse parent first.\n\n';
  return hierarchySection;
};

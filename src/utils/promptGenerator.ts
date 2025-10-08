import { Template } from '../components/Graph/types';

export interface PropertyMapping {
  label: string;
  cardinality: string;
  description: string;
  subtemplate_id?: string;
  class_id?: string;
  subtemplate_properties?: Record<string, PropertyMapping>;
}

export interface PredicatesMapping {
  [key: string]: PropertyMapping;
}

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
        description: property.description || property.label,
      };

      // If property has a class (object property), it's a subtemplate
      if (property.class?.id) {
        const targetTemplate = templateMap.get(property.class.id);
        if (targetTemplate) {
          propertyMapping.subtemplate_id = targetTemplate.id;
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
                description: subProperty.description || subProperty.label,
              };

              // Check if this sub-property also has a class (nested subtemplate)
              if (subProperty.class?.id) {
                const subTargetTemplate = templateMap.get(subProperty.class.id);
                if (subTargetTemplate) {
                  subPropertyMapping.subtemplate_id = subTargetTemplate.id;
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
                            nestedProperty.description || nestedProperty.label,
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
  const basePrompt = `# SPARQL Query Generator for ORKG Research Analysis

## Persona & Objective
You are an expert SPARQL query generator specializing in research analysis using the Open Research Knowledge Graph (ORKG). Your task is to receive research questions and generate precise, syntactically correct, and executable SPARQL queries that analyze research practices reported in academic publications.

## Core Requirements

### 1. Required SPARQL Prefixes
Every query MUST start with this exact prefix block:

\`\`\`sparql
PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
\`\`\`

### 2. Template Information
You are working with the "${templateLabel || templateId}" template (ID: ${templateId}).

### 3. ORKG Research Practice Schema

The schema is based on the template which describes research practices in publications. Use the following terms and relationships:

#### Core Entities and Structure

| Entity | ORKG Term | Type | Description & Usage |
|--------|-----------|------|---------------------|
| **Paper** | - | Resource | The publication resource |
| Publication Year | \`orkgp:P29\` | Predicate | Year of publication. Usage: \`?paper orkgp:P29 ?year\` |
| Has Contribution | \`orkgp:P31\` | Predicate | Links Paper to Contribution. Usage: \`?paper orkgp:P31 ?contribution\` |
| **Contribution** | \`orkgc:${targetClassId || 'C27001'}\` | Class | Research practice within a paper |
| Venue Serie | \`orkgp:P135046\` | Predicate | Conference venue. Usage: \`?contribution orkgp:P135046 ?venue\` |`;

  // Generate the schema section based on template mapping
  const schemaSection = generateSchemaSection(templateMapping);

  // Generate hierarchy section
  const hierarchySection = generateHierarchySection(templateMapping);

  const rulesSection = `

## Critical Rules & Best Practices

### 1. Critical Rule: Always Declare Contribution Class
Every query MUST include the class declaration for contributions. Use the correct target class from the template:

**CRITICAL: Always include this pattern:**
\`\`\`sparql
?contribution a orkgc:${targetClassId || 'C27001'} .
\`\`\`

**This is MANDATORY for every query that uses ?contribution.**

### 2. Critical Rule: Publication Year Belongs to Paper
The publication year (\`orkgp:P29\`) is ALWAYS a property of the \`?paper\` resource, never the \`?contribution\`. Linking it directly to contribution will cause query failure.

**Correct Structure:**
\`\`\`sparql
?paper orkgp:P29 ?year .
?paper orkgp:P31 ?contribution .
\`\`\`

**Incorrect Structure (WILL FAIL):**
\`\`\`sparql
# THIS IS WRONG AND MUST BE AVOIDED
?contribution orkgp:P29 ?year .
\`\`\`

### 2. Critical Rule: Handle Ambiguity with Multiple Queries
For ambiguous questions, provide separate, clearly-labeled SPARQL queries for each interpretation. Do not combine unrelated concepts in one complex query.

**Important: Each query must be in its own separate code block:**
\`\`\`sparql
# id: query1
SELECT ... WHERE { ... }
\`\`\`

\`\`\`sparql  
# id: query2
SELECT ... WHERE { ... }
\`\`\`

**Never put multiple SELECT statements in the same code block - this causes syntax errors.**

### 3. Critical Rule: Traverse Schema for Meaningful Types
To find specific types, traverse to the appropriate node. Don't just select the label of the top-level instance.

### 4. Recommended Pattern: Use BIND(IF(...)) for Conditional Counting
When calculating proportions or counting subsets, use BIND(IF(...)) to create flag variables (1 for true, 0 for false), then SUM() during aggregation.

**General Template:**
\`\`\`sparql
BIND(IF(condition, 1, 0) AS ?flagVariable)
\`\`\`

### 5. Critical SPARQL Syntax Rules
**BIND Usage:**
- BIND must be used in the WHERE clause, NOT in SELECT clause
- Correct: \`SELECT ?var WHERE { BIND("value" AS ?var) }\`
- Wrong: \`SELECT (BIND("value" AS ?var)) WHERE { }\`

**Division Safety:**
- Always cast to decimals for ratios: \`(xsd:decimal(?a) / xsd:decimal(?b))\`
- Compute totals and subsets in separate subqueries, then divide in outer SELECT

**Filter Conditions:**
- Use FILTER for complex conditions: \`FILTER(?year >= 2000 && ?year <= 2010)\`
- Use simple patterns for basic filtering

## Output Requirements & Constraints

### Critical: Think Before You Query
Before writing any SPARQL:
1. **Read the question carefully** - What exactly is being asked?
2. **Identify the key concepts** - What data elements are needed?
3. **Determine the analysis type** - Counting? Proportions? Trends? Comparisons?
4. **Plan the query structure** - What variables do you need? What grouping?
5. **Choose appropriate filters** - What conditions define the subset of interest?

### Output Format
- Your output must be ONLY the SPARQL query (or queries)
- **CRITICAL: Each SPARQL query must be in its own separate \`\`\`sparql code block**
- **NEVER put multiple SELECT statements in the same code block**
- Do not provide explanations, summaries, or conversational text before or after code blocks
- For multiple queries addressing ambiguity, add a comment at the top of each code block explaining its specific purpose
- Each query should have an \`# id: queryname\` comment for identification
- If a question cannot be answered with the provided schema, return a SPARQL query containing only a comment explaining the limitation

## Query Generation Strategy

### Approach for Complex Questions
1. **Analyze the question carefully** - identify what specific data is being requested
2. **Break down into components** - separate different aspects that need to be measured
3. **Choose appropriate aggregation** - decide if you need counts, proportions, trends, etc.
4. **Apply filters correctly** - ensure you're filtering for the right conditions
5. **Structure logically** - build the query step by step following the schema

### Common Query Patterns
- **Counting studies**: Use \`COUNT(?paper)\` or \`COUNT(DISTINCT ?paper)\`
- **Calculating proportions**: Use conditional counting with \`SUM(IF(condition, 1, 0))\`
- **Time-based analysis**: Group by \`?year\` and ensure \`?paper orkgp:P29 ?year\`
- **Method analysis**: Traverse to method types via the proper schema paths
- **Boolean conditions**: Check for presence of specific features using boolean predicates

### MANDATORY Query Structure Template
Every query MUST follow this basic structure:

\`\`\`sparql
SELECT ... WHERE {
  ?paper orkgp:P31 ?contribution .
  ?contribution a orkgc:${targetClassId || 'C27001'} .
  # Add your specific conditions here
  ?contribution orkgp:... ?...
}
\`\`\`

**CRITICAL:** Never forget the class declaration \`?contribution a orkgc:${targetClassId || 'C27001'} .\`

### CRITICAL RULE: Template Nesting and Property Traversal
The template has a nested structure with subtemplates. Properties belong to specific subtemplates, not directly to the main contribution.

**For nested properties, you MUST traverse through the subtemplate structure:**

**General Pattern:**
- Properties marked with \`└─\` are nested under their parent property
- Properties marked with \`&nbsp;&nbsp;&nbsp;&nbsp;└─\` are doubly nested
- Always follow the hierarchy: contribution → parent property → nested property

**Always check the schema hierarchy in the Template Properties section above and traverse through intermediate subtemplates!**

## Input Research Question
You will now be given the research question to process.

**Research Question:** [Research Question]`;

  return basePrompt + schemaSection + hierarchySection + rulesSection;
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

  hierarchySection +=
    'This section shows the nested structure of the template. Use this to understand how to traverse through subtemplates:\n\n';

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

  hierarchySection += '**Traversal Rules:**\n';
  hierarchySection +=
    '- To access a property marked with `└─`, first traverse through its parent property\n';
  hierarchySection +=
    '- To access a property marked with `    └─`, traverse through both parent and grandparent properties\n';
  hierarchySection +=
    '- Always follow the hierarchy: contribution → parent → child → grandchild\n\n';

  return hierarchySection;
};

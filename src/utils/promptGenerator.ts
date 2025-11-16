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
### Domain-Specific Knowledge: Empirical Research Practice Template

**Understanding "Empirical Studies" in this Context:**
In this domain, an empirical study is a paper that:
1. Has data collection that is NOT "no collection"
2. Has data analysis that is NOT "no analysis"
3. Is typically from the IEEE International Requirements Engineering Conference

**The Standard Pattern for Empirical Research Questions:**
\`\`\`sparql
# This is the canonical pattern used in existing queries
SELECT ?paper ?year ?dc_label ?da_label WHERE {
  ?paper orkgp:P31 ?contribution .
  ?paper orkgp:P29 ?year .
  ?contribution a orkgc:C27001 .
  ?contribution orkgp:P135046 ?venue .
  ?venue rdfs:label ?venue_name .
  
  OPTIONAL {
    ?contribution orkgp:P56008 ?data_collection .
    ?data_collection rdfs:label ?dc_label .
  }
  OPTIONAL {
    ?contribution orkgp:P15124 ?data_analysis .
    ?data_analysis rdfs:label ?da_label .
  }
  
  FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string) 
}
\`\`\`

**Handling "Empirical Studies" Questions:**
When questions ask about "empirical studies," use a simple approach:
- Return relevant fields including ?dc_label and ?da_label
- Let the processing function filter based on criteria like:
  - Exclude "no collection" and "no analysis"
  - Filter by specific venue
  - Check for specific methods
`,
    queryExamples: '',
    specificRules: `
### Empirical Research Practice Specific Rules

**1. Definition of "Empirical Study"**
An "empirical study" typically refers to research that involves:
- Data collection from real-world sources (NOT "no collection")
- Analysis of that data using systematic methods (NOT "no analysis")

**MANDATORY: Always exclude non-empirical studies using these filters:**
- \`FILTER(?dc_label != "no collection"^^xsd:string)\` - for data collection queries
- \`FILTER(?da_label != "no analysis"^^xsd:string)\` - for data analysis queries

**2. Venue Filtering**
Most queries should filter for the IEEE International Requirements Engineering Conference unless otherwise specified:
\`\`\`sparql
?contribution orkgp:P135046 ?venue .
?venue rdfs:label ?venue_name .
FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
\`\`\`

**3. Method Type Traversal**
To find specific method types (e.g., 'Case Study'), traverse to the Method Type node:

**Correct Traversal for Data Collection Method Type:**
\`\`\`sparql
?contribution orkgp:P56008 ?data_collection_instance .
?data_collection_instance orkgp:P1005 ?dc_method .
?dc_method orkgp:P94003 ?dc_method_type .
?dc_method_type rdfs:label ?method_type_label .
\`\`\`

**4. Statistical Analysis Patterns**
For inferential statistics:
\`\`\`sparql
?data_analysis orkgp:P56043 ?inferential_stats .
?inferential_stats orkgp:P30001 ?hypothesis .
?inferential_stats orkgp:P35133 ?stat_test .
\`\`\`

For descriptive statistics:
\`\`\`sparql
?data_analysis orkgp:P56048 ?descriptive_stats .
OPTIONAL { ?descriptive_stats orkgp:P56049 ?freq_node . }
OPTIONAL { ?descriptive_stats orkgp:P57005 ?central_tendency . }
OPTIONAL { ?descriptive_stats orkgp:P57008 ?dispersion . }
\`\`\`

**5. Threats to Validity Pattern**
\`\`\`sparql
?contribution orkgp:P39099 ?threats_node .
OPTIONAL { ?threats_node orkgp:P55034 ?external. }
OPTIONAL { ?threats_node orkgp:P55035 ?internal. }
OPTIONAL { ?threats_node orkgp:P55037 ?construct. }
OPTIONAL { ?threats_node orkgp:P55036 ?conclusion. }
\`\`\`

**6. Always include the venue filter: FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
`,
    commonPatterns: `
### Common Query Patterns for Empirical Research

**Pattern 1: Simple Empirical Studies Count**
\`\`\`sparql
SELECT ?paper ?year ?dc_label ?da_label WHERE {
  ?paper orkgp:P29 ?year .
  ?paper orkgp:P31 ?contribution .
  ?contribution a orkgc:C27001 .
  ?contribution orkgp:P135046 ?venue .
  ?venue rdfs:label ?venue_name .
  
  OPTIONAL {
    ?contribution orkgp:P56008 ?data_collection .
    ?data_collection rdfs:label ?dc_label .
  }
  OPTIONAL {
    ?contribution orkgp:P15124 ?data_analysis .
    ?data_analysis rdfs:label ?da_label .
  }
  
  FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
}
\`\`\`

**Pattern 2: Method Type Analysis**
\`\`\`sparql
SELECT ?paper ?year ?method_type_label WHERE {
  ?paper orkgp:P29 ?year .
  ?paper orkgp:P31 ?contribution .
  ?contribution a orkgc:C27001 .
  ?contribution orkgp:P135046 ?venue .
  ?venue rdfs:label ?venue_name .
  
  OPTIONAL {
    ?contribution orkgp:P56008 ?data_collection .
    ?data_collection orkgp:P1005 ?method .
    ?method orkgp:P94003 ?method_type .
    ?method_type rdfs:label ?method_type_label .
  }
  
  FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
}
\`\`\`

**Pattern 3: Boolean Property Analysis (with SAMPLE)**
\`\`\`sparql
SELECT ?paper ?year (SAMPLE(?boolean_prop) AS ?boolean_prop) WHERE {
  ?paper orkgp:P29 ?year .
  ?paper orkgp:P31 ?contribution .
  ?contribution a orkgc:C27001 .
  ?contribution orkgp:P135046 ?venue .
  ?venue rdfs:label ?venue_name .
  
  OPTIONAL {
    ?contribution orkgp:SomeProperty ?node .
    OPTIONAL { ?node orkgp:BooleanProperty ?boolean_prop . }
  }
  
  FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
}
GROUP BY ?paper ?year
\`\`\`
`,
    troubleshooting: `
### Troubleshooting for Empirical Research Queries

**Problem: Query returns empty results for methods**
- **Likely cause**: Not traversing to the method type node
- **Solution**: Use the full path: collection → method → method type → label

**Problem: All papers show as non-empirical**
- **Likely cause**: Missing OPTIONAL for data collection/analysis
- **Solution**: Wrap data collection and analysis in OPTIONAL blocks

**Problem: Venue filter not working**
- **Likely cause**: Comparing URI to string without getting label
- **Solution**: Always get venue label first: \`?venue rdfs:label ?venue_name\`

**Problem: Duplicate rows for papers**
- **Likely cause**: Multiple methods or boolean properties per paper
- **Solution**: Use SAMPLE() with GROUP BY to get one row per paper

**Problem: Statistical analysis fields are empty**
- **Likely cause**: Not traversing through the analysis structure
- **Solution**: Check if analysis has the specific type (inferential/descriptive/ML) first
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
You are working with the "${templateLabel || specificGuidance?.templateLabel || templateId}" template (ID: ${templateId}).

### 3. ORKG Research Practice Schema

The schema is based on the template which describes research practices in publications. Use the following terms and relationships:

#### Core Entities and Structure

| Entity | ORKG Term | Type | Description & Usage |
|--------|-----------|------|---------------------|
| **Paper** | - | Resource | The publication resource |
| Has Contribution | \`orkgp:P31\` | Predicate | Links Paper to Contribution. Usage: \`?paper orkgp:P31 ?contribution\` |
| **Contribution** | \`orkgc:${targetClassId || 'C27001'}\` | Class | Research practice within a paper |

#### Optional Properties (Use Only When Relevant to the Question)

| Entity | ORKG Term | Type | Description & Usage |
|--------|-----------|------|---------------------|
| Publication Year | \`orkgp:P29\` | Predicate | Year of publication. **Only use when the question asks for temporal analysis, trends over time, or specific year ranges.** Usage: \`?paper orkgp:P29 ?year\` |
| Venue Serie | \`orkgp:P135046\` | Predicate | Conference venue. **Only use when the question asks about venues or conferences.** Usage: \`?contribution orkgp:P135046 ?venue\` |`;

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

## Critical Rules & Best Practices

### 1. Critical Rule: Always Declare Contribution Class
Every query MUST include the class declaration for contributions. Use the correct target class from the template:

**CRITICAL: Always include this pattern:**
\`\`\`sparql
?contribution a orkgc:${targetClassId || 'C27001'} .
\`\`\`

**This is MANDATORY for every query that uses ?contribution.**

### 2. Critical Rule: Publication Year Belongs to Paper (When Needed)
**Only include publication year if the research question explicitly asks for temporal analysis, trends, or year-based filtering.**

When you do need to use year, remember that the publication year (\`orkgp:P29\`) is ALWAYS a property of the \`?paper\` resource, never the \`?contribution\`. Linking it directly to contribution will cause query failure.

**Correct Structure (when year is needed):**
\`\`\`sparql
?paper orkgp:P29 ?year .
?paper orkgp:P31 ?contribution .
\`\`\`

**Incorrect Structure (WILL FAIL):**
\`\`\`sparql
# THIS IS WRONG AND MUST BE AVOIDED
?contribution orkgp:P29 ?year .
\`\`\`

**Important: Do not include year-related patterns unless the question asks for:**
- Temporal analysis (e.g., "trends over time")
- Specific year ranges (e.g., "between 2010 and 2020")
- Year-based grouping (e.g., "by year")
- Publication year information

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

### 5. CRITICAL RULE: URIs vs Labels (MOST COMMON MISTAKE)

**⚠️ EXTREMELY IMPORTANT: Resources are URIs, NOT Strings**

In ORKG, properties return **resource URIs** (e.g., \`http://orkg.org/orkg/resource/R12345\`), NOT string values. You MUST use \`rdfs:label\` to get the human-readable label before comparing to strings.

**❌ WRONG (Will always fail - comparing URI to string):**
\`\`\`sparql
?contribution orkgp:SomeProperty ?resource .
BIND(IF(?resource = "Expected Value", 1, 0) AS ?flag)
\`\`\`
This fails because \`?resource\` is a URI, not a string!

**✅ CORRECT (Get label first, then compare):**
\`\`\`sparql
?contribution orkgp:SomeProperty ?resource .
?resource rdfs:label ?resource_label .
BIND(IF(?resource_label = "Expected Value"^^xsd:string, 1, 0) AS ?flag)
\`\`\`

**Critical Pattern for Checking Labels:**
\`\`\`sparql
# Step 1: Get the resource
?subject orkgp:PropertyID ?resource .

# Step 2: Get the resource's label
?resource rdfs:label ?resource_label .

# Step 3: Compare the LABEL (not the resource)
FILTER(?resource_label = "expected value"^^xsd:string)
# OR
BIND(IF(?resource_label = "expected value"^^xsd:string, 1, 0) AS ?flag)
\`\`\`

**BIND Statement Ordering (Critical):**
- BIND that uses a variable MUST come AFTER that variable is defined
- ❌ Wrong: \`BIND(IF(?label = "X", 1, 0) AS ?flag) ?resource rdfs:label ?label .\`
- ✅ Correct: \`?resource rdfs:label ?label . BIND(IF(?label = "X", 1, 0) AS ?flag)\`

### 6. Critical SPARQL Syntax Rules


**BIND Usage:**
- BIND must be used in the WHERE clause, NOT in SELECT clause
- Correct: \`SELECT ?var WHERE { BIND("value" AS ?var) }\`
- Wrong: \`SELECT (BIND("value" AS ?var)) WHERE { }\`
- **CRITICAL: All variables used in BIND must be defined BEFORE the BIND statement**

**Division Safety:**
- Always cast to decimals for ratios: \`(xsd:decimal(?a) / xsd:decimal(?b))\`
- Compute totals and subsets in separate subqueries, then divide in outer SELECT
- **For proportions with aggregation, use subquery pattern to avoid IF() in SELECT**

**Filter Conditions:**
- Use FILTER for complex conditions: \`FILTER(?year >= 2000 && ?year <= 2010)\`
- Use simple patterns for basic filtering

## Output Requirements & Constraints

### Critical: Think Before You Query
Before writing any SPARQL:
1. **Read the question carefully** - What exactly is being asked?
2. **Identify the key concepts** - What data elements are needed?
3. **Determine the analysis type** - Counting? Proportions? Trends? Comparisons?
4. **Check temporal requirements** - Does the question ask for trends over time, specific years, or year-based analysis? If NO, do NOT include year in the query.
5. **Plan the query structure** - What variables do you need? What grouping?
6. **Choose appropriate filters** - What conditions define the subset of interest?

### Output Format
- Your output must be ONLY the SPARQL query (or queries)
- **CRITICAL: Each SPARQL query must be in its own separate \`\`\`sparql code block**
- **NEVER put multiple SELECT statements in the same code block**
- Do not provide explanations, summaries, or conversational text before or after code blocks
- For multiple queries addressing ambiguity, add a comment at the top of each code block explaining its specific purpose
- Each query should have an \`# id: queryname\` comment for identification
- If a question cannot be answered with the provided schema, return a SPARQL query containing only a comment explaining the limitation

### MANDATORY: Add Comments Explaining Each Line
**CRITICAL REQUIREMENT:** Every SPARQL query line MUST have a comment above it explaining what that line does. This is mandatory for code readability and understanding.

**Format:**
\`\`\`sparql
# Comment explaining what this line does
SPARQL line here
# Another comment explaining the next line
Another SPARQL line
\`\`\`

**Example with proper comments:**
\`\`\`sparql
# Select the paper resource and publication year
SELECT ?paper ?year WHERE {
  # Link the paper to its contribution using the P31 predicate
  ?paper orkgp:P31 ?contribution .
  # Declare that the contribution is of type Empirical Research Practice (C27001)
  ?contribution a orkgc:C27001 .
  # Get the publication year of the paper
  ?paper orkgp:P29 ?year .
}
\`\`\`

**Rules for comments:**
- Every SPARQL statement (triple pattern, FILTER, OPTIONAL, etc.) must have a comment above it
- Comments should be concise but descriptive
- Explain WHAT the line does, not just repeat the syntax
- Group related lines with a single comment if they form a logical unit
- Prefix declarations (PREFIX statements) don't need individual comments, but can have a group comment

## Query Generation Strategy

### Approach for Complex Questions
1. **Analyze the question carefully** - identify what DATA FIELDS are needed
2. **Only use SPARQL features when necessary** - avoid premature optimization
3. **Use OPTIONAL** - for fields that might not exist for all entities

### Common Query Patterns
- **For counting/proportions questions**: Return the relevant data fields, let processing function count/calculate
- **Time-based analysis**: Include \`?year\` field if needed, let processing function group by year
- **Method analysis**: Return method labels, let processing function categorize
- **Boolean conditions**: Return the field values, let processing function check conditions

### Analyzing the Question
Before writing the query, determine what DATA FIELDS are needed:
- Does it ask about time/trends? → Include \`?year\` field
- Does it ask about venues/conferences? → Include venue field
- Does it ask about methods? → Include method-related fields

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

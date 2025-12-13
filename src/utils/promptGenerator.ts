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
- Link paper to contribution using \`orkgp:P31\`
- Declare contribution class \`orkgc:C27001\`
- Include year if temporal analysis is needed
- Filter by venue label when needed

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
- Start from contribution → data collection instance → method → method type → label
- Traverse through each intermediate node to reach the final property
- Use rdfs:label at the final level to get human-readable values

**4. Statistical Analysis Patterns**
For inferential statistics:
- Traverse from data analysis → inferential stats → hypothesis/test properties
- Use appropriate predicates for each level

For descriptive statistics:
- Traverse from data analysis → descriptive stats → frequency/central tendency/dispersion
- Use OPTIONAL blocks for properties that may not exist

**5. Threats to Validity Pattern**
- Access threats node from contribution
- Use OPTIONAL blocks for each threat type (external, internal, construct, conclusion)

**6. Always include the venue filter: FILTER(?venue_name = "IEEE International Requirements Engineering Conference"^^xsd:string)
`,
    commonPatterns: `
### Common Query Patterns for Empirical Research

**Pattern 1: Basic Query with Optional Properties**
- Include paper and year (if needed) in SELECT
- Use OPTIONAL blocks for properties that may not exist for all contributions
- Filter by venue label when needed
- Always declare contribution class

**Pattern 2: Nested Property Traversal**
- Traverse through intermediate nodes to reach the target property
- Get labels at the final level for meaningful results

**Pattern 3: Aggregation with SAMPLE**
- Use SAMPLE() with GROUP BY when multiple values exist per paper
- Group by paper and year (or other identifying fields)
- Useful for boolean properties or when deduplication is needed
`,
    troubleshooting: `
### Troubleshooting for Empirical Research Queries

**Problem: Query returns empty results for methods**
- **Likely cause**: Not traversing to the method type node
- **Solution**: Use the full path: collection → method → method type → label


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
  // NLP for Requirements Engineering Template (R1544125)
  R1544125: {
    templateId: 'R1544125',
    templateLabel: 'NLP for Requirements Engineering (NLP4RE)',
    domainKnowledge: `
### Domain-Specific Knowledge: NLP4RE Template

**Understanding NLP4RE Research:**
This template focuses on Natural Language Processing approaches applied to Requirements Engineering tasks. The template organizes data about:
- NLP methods and tasks used in RE
- Evaluation metrics for NLP4RE approaches
- Datasets used in NLP4RE research
- Annotation processes and guidelines
- Baseline comparisons
- Data formats and sources

**The Standard Pattern for NLP4RE Questions:**
\`\`\`sparql
# Basic pattern for NLP4RE queries
SELECT DISTINCT ?paper ?paperLabel ?fieldLabel WHERE {
  ?paper orkgp:P31 ?contribution .
  ?contribution a orkgc:C121001 .
  
  # Add specific NLP4RE properties here
  ?contribution orkgp:SomeProperty ?resource .
  ?resource rdfs:label ?fieldLabel .
  
  OPTIONAL { ?paper rdfs:label ?paperLabel . }
}
ORDER BY ?paperLabel
\`\`\`

**Key NLP4RE Concepts:**
- **Evaluation Metrics**: Use \`orkgp:HAS_EVALUATION\` to access evaluation information, then \`orkgp:P110006\` for metrics
- **NLP Tasks**: Use \`orkgp:P181003\` for NLP tasks, \`orkgp:P181004\` for task types
- **RE Tasks**: Use \`orkgp:P181002\` for Requirements Engineering tasks
- **Datasets**: Use \`orkgp:P181011\` for NLP datasets
- **Annotation Process**: Use \`orkgp:P181031\` for annotation processes
`,
    queryExamples: '',
    specificRules: `
### NLP4RE Specific Rules

**1. Target Class Declaration**
Every query MUST include the class declaration:
\`\`\`sparql
?contribution a orkgc:C121001 .
\`\`\`

**2. Evaluation Metrics Pattern**
To access evaluation metrics:
- Start from contribution → HAS_EVALUATION → evaluation → P110006 → evaluation metric → label
- Traverse through each level to reach the metric label

**3. NLP Task Pattern**
To access NLP task information:
- Start from contribution → P181003 → NLP task → P181004 → NLP task type → label
- Follow the property chain to reach the task type

**4. Dataset Pattern**
To access dataset information:
- Start from contribution → P181011 → dataset → P181022 → datatype → P181023 → dataformat → label
- Traverse through all intermediate levels

**5. Annotation Process Pattern**
To access annotation process information:
- Start from contribution → P181031 → annotation process → P181036 → annotation scheme → P181038 → guideline availability → label
- Follow the complete property chain

**6. Baseline Comparison Pattern**
To access baseline comparison information:
- Start from contribution → HAS_EVALUATION → evaluation → P181051 → baseline comparison → P181052 → baseline type → label
- Traverse through evaluation to reach baseline information

**7. Always Use DISTINCT**
NLP4RE queries often return duplicate rows due to multiple tasks, metrics, or datasets per contribution. Always use \`SELECT DISTINCT\` to avoid duplicates.

**8. Use OPTIONAL for Labels**
Always wrap label retrieval in OPTIONAL blocks:
\`\`\`sparql
OPTIONAL { ?paper rdfs:label ?paperLabel . }
OPTIONAL { ?resource rdfs:label ?resourceLabel . }
\`\`\`

**9. CRITICAL: For "Top N" or "Most Frequently Used" Questions**
- **ALWAYS include \`?paper\` and \`?paperLabel\` in SELECT** - the processing function needs paper information to count frequency
- **DO NOT use LIMIT in SPARQL** - return all rows, let the processing function count and select top N
- **ORDER BY should be by paper** (e.g., \`ORDER BY ?paperLabel\`), not by the field being counted
- Example: For "top 10 evaluation metrics", return \`?paper ?paperLabel ?evaluation_metricLabel\` with no LIMIT
`,
    commonPatterns: `
### Common Query Patterns for NLP4RE

**Pattern 1: Counting/Frequency Queries**
For questions about frequency or "top N", the query should:
- Include \`?paper\` and \`?paperLabel\` in SELECT along with the field being counted
- Use \`SELECT DISTINCT\` to avoid duplicate rows
- Use \`ORDER BY ?paperLabel\` (or similar paper-based ordering)
- Do NOT use LIMIT - return all rows for counting

**Pattern 2: Multi-Property Queries**
For queries accessing multiple properties (e.g., RE tasks and NLP tasks):
- Include all relevant fields in SELECT
- Traverse through each property path correctly
- Order by contribution or paper as appropriate

**Pattern 3: Nested Property Traversal**
For queries accessing nested properties (e.g., dataset → datatype → dataformat):
- Traverse through each level of the hierarchy
- Include intermediate nodes if needed for filtering
`,
    troubleshooting: `
### Troubleshooting for NLP4RE Queries

**Problem: Query returns duplicate rows**
- **Likely cause**: Multiple tasks, metrics, or datasets per contribution
- **Solution**: Use \`SELECT DISTINCT\` and ensure proper grouping

**Problem: Missing labels in results**
- **Likely cause**: Not using OPTIONAL for label retrieval
- **Solution**: Always wrap \`rdfs:label\` queries in OPTIONAL blocks

**Problem: Empty results for nested properties**
- **Likely cause**: Not traversing through the full property chain
- **Solution**: Check the template hierarchy and traverse through all intermediate nodes

**Problem: Evaluation metrics not found**
- **Likely cause**: Using wrong predicate or not accessing through HAS_EVALUATION
- **Solution**: Use \`orkgp:HAS_EVALUATION\` first, then \`orkgp:P110006\` for metrics

**Problem: Dataset information incomplete**
- **Likely cause**: Not traversing through datatype to dataformat
- **Solution**: Use the full path: dataset → datatype → dataformat
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

### 2. Critical Rule: "Top N" or "Most Frequently Used" Questions
**When the question asks for "top N", "most frequently used", "most common", or similar counting/ranking questions:**

1. **MUST include paper information in SELECT**: Always include \`?paper\` and \`?paperLabel\` along with the field being counted (e.g., if counting metrics, include both paper and metric fields)
2. **DO NOT use LIMIT in SPARQL**: Return ALL rows - the processing function will count papers per item and select the top N. LIMIT in SPARQL would truncate results before counting can occur.
3. **ORDER BY should be by paper**: Use \`ORDER BY ?paperLabel\` (or similar paper-based ordering), not by the field being counted. The processing function handles ranking.
4. **Return all data**: The processing function needs all paper-item pairs to count frequency correctly. Each row should represent one paper using one instance of the item being counted.

### 3. Critical Rule: Handle Ambiguity with Multiple Queries
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

### 4. Critical Rule: Traverse Schema for Meaningful Types
To find specific types, traverse to the appropriate node. Don't just select the label of the top-level instance.

### 5. Recommended Pattern: Use BIND(IF(...)) for Conditional Counting
When calculating proportions or counting subsets, use BIND(IF(...)) to create flag variables (1 for true, 0 for false), then SUM() during aggregation.

**General Template:**
\`\`\`sparql
BIND(IF(condition, 1, 0) AS ?flagVariable)
\`\`\`

### 6. CRITICAL RULE: URIs vs Labels (MOST COMMON MISTAKE)

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

### 6.1. MANDATORY RULE: Always Use Lowercase for Label Comparisons

**🚨 CRITICAL: ALL label comparisons MUST use lowercase normalization**

Labels in ORKG may have inconsistent casing (e.g., "Case Study", "case study", "CASE STUDY"). To ensure reliable filtering and matching, you MUST ALWAYS convert labels to lowercase before comparing them.

**MANDATORY Pattern for ALL Label Comparisons:**
\`\`\`sparql
# Step 1: Get the resource
?subject orkgp:PropertyID ?resource .

# Step 2: Get the resource's label
?resource rdfs:label ?resource_label .

# Step 3: ALWAYS normalize to lowercase and compare
FILTER(LCASE(STR(?resource_label)) = LCASE("expected value"))
# OR for BIND statements
BIND(IF(LCASE(STR(?resource_label)) = LCASE("expected value"), 1, 0) AS ?flag)
\`\`\`

**❌ WRONG (Case-sensitive comparison - will miss matches):**
\`\`\`sparql
?resource rdfs:label ?resource_label .
FILTER(?resource_label = "Case Study"^^xsd:string)
# This will FAIL if the label is "case study" or "CASE STUDY"
\`\`\`

**✅ CORRECT (Case-insensitive comparison - always works):**
\`\`\`sparql
?resource rdfs:label ?resource_label .
FILTER(LCASE(STR(?resource_label)) = LCASE("Case Study"))
# This will match "Case Study", "case study", "CASE STUDY", etc.
\`\`\`

**Examples of Correct Label Filtering:**
\`\`\`sparql
# Filtering venue labels
?venue rdfs:label ?venue_label .
FILTER(LCASE(STR(?venue_label)) = LCASE("IEEE International Requirements Engineering Conference"))

# Filtering data collection labels
?data_collection rdfs:label ?dc_label .
FILTER(LCASE(STR(?dc_label)) != LCASE("no collection"))

# Filtering data analysis labels
?data_analysis rdfs:label ?da_label .
FILTER(LCASE(STR(?da_label)) != LCASE("no analysis"))

# Filtering method type labels
?method_type rdfs:label ?method_type_label .
FILTER(LCASE(STR(?method_type_label)) = LCASE("Case Study"))

# Using in BIND for conditional counting
?resource rdfs:label ?resource_label .
BIND(IF(LCASE(STR(?resource_label)) = LCASE("Expected Value"), 1, 0) AS ?flag)
\`\`\`

**Important Notes:**
- Use \`LCASE(STR(?label))\` to convert the label to lowercase string
- Always compare both sides: \`LCASE(STR(?label)) = LCASE("value")\` (not just \`LCASE(STR(?label)) = "value"\`)
- This applies to ALL label comparisons: FILTER, BIND, and WHERE clause patterns
- Even if you think the case matches, ALWAYS use lowercase normalization for consistency

**BIND Statement Ordering (Critical):**
- BIND that uses a variable MUST come AFTER that variable is defined
- ❌ Wrong: \`BIND(IF(LCASE(STR(?label)) = LCASE("X"), 1, 0) AS ?flag) ?resource rdfs:label ?label .\`
- ✅ Correct: \`?resource rdfs:label ?label . BIND(IF(LCASE(STR(?label)) = LCASE("X"), 1, 0) AS ?flag)\`

### 7. Critical SPARQL Syntax Rules


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
4. **Check for "top N" or frequency questions** - If the question asks for "top N", "most frequently used", "most common":
   - **MUST include \`?paper\` and \`?paperLabel\` in SELECT**
   - **DO NOT use LIMIT** - return all rows for counting
   - **ORDER BY paper**, not by the counted field
5. **Check temporal requirements** - Does the question ask for trends over time, specific years, or year-based analysis? If NO, do NOT include year in the query.
6. **Plan the query structure** - What variables do you need? What grouping?
7. **Choose appropriate filters** - What conditions define the subset of interest?

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

**Example structure with proper comments:**
- Every SELECT statement should have a comment explaining what is being selected
- Every triple pattern should have a comment explaining the relationship
- Class declarations should be commented
- Property accesses should be commented
- OPTIONAL blocks should be commented
- FILTER clauses should be commented

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

### Common Query Patterns
- **For counting/proportions questions**: Return the relevant data fields, let processing function count/calculate
- **For "top N" or "most frequently used" questions**: 
  - **CRITICAL**: Return ALL rows with paper information (include \`?paper\` and \`?paperLabel\` in SELECT)
  - **DO NOT use LIMIT** in SPARQL - the processing function will count and select top N
  - Return paper + the field being counted (e.g., \`?paper ?paperLabel ?evaluation_metricLabel\`)
  - ORDER BY should typically be by paper (e.g., \`ORDER BY ?paperLabel\`), not by the counted field
- **Time-based analysis**: Include \`?year\` field if needed, let processing function group by year
- **Method analysis**: Return method labels, let processing function categorize
- **Boolean conditions**: Return the field values, let processing function check conditions

### Analyzing the Question
Before writing the query, determine what DATA FIELDS are needed:
- Does it ask about "top N" or "most frequently used"? → **MUST include \`?paper\` and \`?paperLabel\`** + the field being counted
- Does it ask about time/trends? → Include \`?year\` field
- Does it ask about venues/conferences? → Include venue field
- Does it ask about methods? → Include method-related fields
- Does it ask about counting or frequency? → **ALWAYS include paper information** so processing function can count

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

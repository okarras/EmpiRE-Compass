# Template JSON Files

This directory contains JSON files for importing templates into the EmpiRE-Compass system.

## Available Templates

### 1. `nlp4re-template.json`

- **Template ID**: C121001
- **Title**: NLP for Requirements Engineering (NLP4RE)
- **Collection**: Questions Nlp4re
- **Questions**: 10 research questions
- **Description**: Template for analyzing Natural Language Processing approaches applied to Requirements Engineering tasks

## How to Import a Template

### Via Admin Interface

1. **Navigate to Admin Panel**

   - Log in as an admin user
   - Go to `/R186491/admin/data` (Admin Data Management)

2. **Import Template**

   - Click on the "Import/Export" tab
   - In the "Import Template" section:
     - Click "Choose File" and select the JSON template file (e.g., `nlp4re-template.json`)
     - Click "Import Template" button
   - Wait for the import to complete
   - You'll see a success message once the import is finished

3. **Verify Import**
   - The new template will appear in the template selector
   - Switch to the imported template to view its questions
   - Navigate to `/C121001/` to see the NLP4RE template in action

### Template Structure

Each template JSON file contains:

```json
{
  "template": {
    "id": "string",           // Unique template identifier (e.g., "C121001")
    "title": "string",        // Display name
    "collectionName": "string", // Firebase collection name
    "description": "string"   // Template description
  },
  "questions": [              // Array of research questions
    {
      "id": number,           // Sequential question number
      "uid": "string",        // Unique identifier (e.g., "query_1")
      "title": "string",      // Question title
      "sparqlQuery": "string", // SPARQL query for data retrieval
      "chartType": "bar|pie", // Optional: Chart type
      "chartSettings": {},    // Optional: Chart configuration
      "dataProcessingFunction": "string", // Function name (reference only)
      "dataAnalysisInformation": {
        "question": "string",
        "requiredDataForAnalysis": "string",
        "questionExplanation": "string", // Optional
        "dataAnalysis": "string",        // Optional
        "dataInterpretation": "string"   // Optional
      }
    }
  ],
  "statistics": [],           // Optional: Statistical analyses
  "metadata": {              // Optional: Additional information
    "createdDate": "string",
    "version": "string",
    "notes": []
  }
}
```

## Important Notes

### Data Processing Functions

The `dataProcessingFunction` field in questions is a **reference only**. The actual functions need to be:

1. **Implemented** in the appropriate file:

   - For NLP4RE: `src/constants/data_processing_helper_functions_nlp4re.ts`
   - For main template: `src/constants/data_processing_helper_functions.ts`

2. **Mapped** in the chart info file:
   - For NLP4RE: `src/constants/queries_nlp4re_chart_info.ts`
   - For main template: `src/constants/queries_chart_info.ts`

### SPARQL Queries

- All SPARQL queries require ORKG prefixes (defined in `src/api/SPARQL_QUERIES.ts` or `SPARQL_QUERIES_NLP4RE.ts`)
- Template-specific class IDs:
  - Main EmpiRE template: `orkgc:C27001`
  - NLP4RE template: `orkgc:C121001`

### Chart Settings

Chart settings use MUI X-Charts configuration:

- `xAxis`: X-axis configuration (scale type, data key, labels)
- `yAxis`: Y-axis configuration (labels, data keys)
- `series`: Data series to display
- `height`: Chart height in pixels
- `sx`: MUI styling object

## Creating a New Template

To create a new template JSON:

1. **Copy an existing template** as a starting point
2. **Update template metadata**:
   - Change `id` to your ORKG class ID
   - Update `title` and `description`
   - Set `collectionName` for Firebase storage
3. **Add questions**:
   - Include all SPARQL queries
   - Add chart configurations (if visualization is needed)
   - Provide complete data analysis information
4. **Implement data processing functions** (if needed):
   - Create functions in the appropriate helper file
   - Map them in the chart info configuration
5. **Test the import** through the admin interface

## Example Usage

### Importing NLP4RE Template

```bash
# 1. Ensure you're logged in as admin
# 2. Navigate to: /R186491/admin/data
# 3. Go to Import/Export tab
# 4. Upload: src/templates/nlp4re-template.json
# 5. Wait for confirmation
# 6. Access the template at: /C121001/
```

### Switching Between Templates

After importing, you can switch between templates:

- Main EmpiRE template: `/R186491/`
- NLP4RE template: `/C121001/`

The menu drawer will show the active template and allow switching between them.

## Troubleshooting

### Import Fails

- **Check JSON syntax**: Validate the JSON file format
- **Verify Firebase permissions**: Ensure you have admin rights
- **Check template ID uniqueness**: Template IDs must be unique

### Questions Don't Display

- **Check SPARQL queries**: Ensure queries are valid and match your ORKG structure
- **Verify data processing functions**: Make sure referenced functions exist
- **Check Firebase collection**: Ensure the collection name is correct

### Charts Don't Render

- **Verify chart settings**: Check that `chartSettings` is properly formatted
- **Check data processing**: Ensure the processing function returns the correct data structure
- **Review console errors**: Browser console will show specific chart rendering issues

## Firebase Structure

After import, templates are stored in Firebase as:

```
Templates/{templateId}/
  ├─ Questions/{questionId}/
  │   ├─ id: number
  │   ├─ uid: string
  │   ├─ title: string
  │   ├─ sparqlQuery: string
  │   └─ dataAnalysisInformation: object
  └─ Statistics/{statisticId}/
      ├─ id: string
      ├─ name: string
      └─ sparqlQuery: string
```

## Support

For questions or issues with template import:

1. Check the browser console for error messages
2. Verify all required fields are present in the JSON
3. Ensure you have admin permissions
4. Contact the system administrator if problems persist

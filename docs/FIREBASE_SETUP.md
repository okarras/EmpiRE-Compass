# Firebase Setup for Empire Statistics

This guide explains how to set up Firebase integration for automatic statistics updates.

## Prerequisites

1. A Firebase project with Firestore database enabled
2. GitHub repository with admin access
3. Python 3.10+ for local development

## Firebase Configuration

### 1. Create a Firebase Service Account

1. Go to your Firebase Console
2. Navigate to **Project Settings** > **Service Accounts**
3. Click **Generate New Private Key**
4. Save the JSON file securely (this contains sensitive credentials)

### 2. Configure Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Create a collection called `Statistics`
3. The script will automatically create a document called `empire-statistics`

## GitHub Actions Setup

### 1. Add GitHub Secret

1. In your GitHub repository, go to **Settings** > **Secrets and Variables** > **Actions**
2. Click **New repository secret**
3. Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
4. Value: Copy the entire content of your Firebase service account JSON file
5. Click **Add secret**

### 2. Workflow Configuration

The workflow (`/.github/workflows/update-statistics.yml`) is configured to run:

- On pushes to main/master branch
- On merged pull requests
- Weekly on Mondays at 6 AM UTC
- Manually via workflow dispatch

## Local Development

### 1. Install Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 2. Set up Firebase Credentials

Option A: Service Account File

```bash
# Place your service account JSON file in the scripts directory
python empire-statistics.py --service_account path/to/service-account.json
```

Option B: Environment Variables

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
python empire-statistics.py
```

### 3. Test Firebase Integration

```bash
# Test Firebase connectivity
python firebase_integration.py

# Run statistics update (without Firebase)
python empire-statistics.py --no_firebase

# Run with Firebase update
python empire-statistics.py --service_account firebase-service-account.json
```

## Script Options

The `empire-statistics.py` script supports several options:

```bash
python empire-statistics.py [OPTIONS]

Options:
  --reload_data         Ignore cache and re-fetch all bundles
  --limit N            Limit processing to first N papers (for testing)
  --no_firebase        Skip Firebase update
  --service_account    Path to Firebase service account key file
  --help              Show help message
```

## Data Structure

The script updates Firebase with the following statistics:

```json
{
  "paperCount": 123,
  "tripleCount": 45678,
  "resources": 12345,
  "literals": 23456,
  "predicates": 1234,
  "distinctResources": 10000,
  "distinctLiterals": 15000,
  "distinctPredicates": 800,
  "venueCount": 50,
  "perVenueData": [],
  "averageStatements": 372.5,
  "averageResources": 100.4,
  "averageLiterals": 190.7,
  "averagePredicates": 10.0,
  "lastProcessedAt": "2024-01-15T10:30:00Z",
  "dataSource": "empire-statistics-script",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Frontend Integration

The React frontend automatically reads from the Firebase `Statistics` collection:

```typescript
// In Statistics.tsx
CRUDStatistics.getStatistics().then((statisticsValues) => {
  Object.keys(statisticsValues[0]).forEach((key) => {
    setStatistics((prev) => ({
      ...prev,
      [key]: statisticsValues[0][key],
    }));
  });
});
```

## Troubleshooting

### Common Issues

1. **Firebase permission denied**

   - Ensure service account has Firestore write permissions
   - Check that the JSON key is correctly formatted in GitHub secrets

2. **Script timeout**

   - The workflow has a 60-minute timeout
   - Use `--limit` option for testing with fewer papers

3. **Cache issues**
   - Use `--reload_data` to force fresh data fetching
   - Clear the `cache/` directory if needed

### Monitoring

- Check GitHub Actions logs for execution details
- Monitor Firebase Console for database updates
- Review uploaded artifacts for result files

### Manual Execution

If automatic updates fail, you can manually trigger the workflow:

1. Go to **Actions** tab in GitHub
2. Select **Update Empire Statistics** workflow
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

## Security Notes

- Never commit the service account JSON file to version control
- Use GitHub secrets for sensitive credentials
- The workflow automatically cleans up temporary credential files
- Consider rotating service account keys periodically

## Support

If you encounter issues:

1. Check GitHub Actions logs
2. Review Firebase Console for errors
3. Test locally with the same parameters
4. Verify Firebase permissions and quotas

# GitHub Firebase Setup Guide

This guide walks you through setting up Firebase service account authentication for automatic statistics updates via GitHub Actions.

## 🔥 Step 1: Create Firebase Service Account

### 1.1 Go to Firebase Console

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click on the **gear icon** ⚙️ in the top-left
4. Select **Project settings**

### 1.2 Create Service Account

1. Click on the **Service accounts** tab
2. Click **Generate new private key**
3. A dialog will appear with a warning about keeping the key secure
4. Click **Generate key**
5. A JSON file will be downloaded to your computer

### 1.3 Service Account Permissions

Ensure your service account has the following permissions:

- **Firebase Admin SDK Admin Service Agent**
- **Cloud Datastore User** (for Firestore access)

## 🔧 Step 2: Configure GitHub Repository

### 2.1 Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Set the following:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Copy and paste the **entire content** of your downloaded JSON file

### 2.2 Example Secret Content

Your secret should look like this (but with your actual values):

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-abc123@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-abc123%40your-project-id.iam.gserviceaccount.com"
}
```

### 2.3 Verify Secret Setup

1. After adding the secret, it should appear in your repository secrets list
2. You'll only see the name `FIREBASE_SERVICE_ACCOUNT_KEY`, not the content (this is normal)

## 🗄️ Step 3: Configure Firestore Database

### 3.1 Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** or **Start in production mode**
4. Select your preferred location

### 3.2 Set Up Security Rules

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to Statistics collection
    match /Statistics/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Your other rules...
  }
}
```

## 🧪 Step 4: Test the Setup

### 4.1 Manual Workflow Test

1. Go to your repository's **Actions** tab
2. Click on **Update Empire Statistics** workflow
3. Click **Run workflow**
4. Select your branch (usually `main`)
5. Click **Run workflow**

### 4.2 Check Workflow Execution

1. Click on the running workflow to see details
2. Look for these success indicators:
   - ✅ Firebase initialized successfully
   - ✅ Statistics updated successfully in Firebase
   - ✅ Processing completed

### 4.3 Verify Data in Firebase

1. Go to Firebase Console → Firestore Database
2. Look for a collection called `Statistics`
3. Inside should be a document called `empire-statistics`
4. The document should contain your calculated statistics

## 🔍 Step 5: Troubleshooting

### 5.1 Common Issues

#### Issue: "Firebase permission denied"

**Solution:**

```bash
# Check if service account has correct permissions
# In Firebase Console → IAM & Admin → IAM
# Find your service account and ensure it has:
# - Firebase Admin SDK Admin Service Agent
# - Cloud Datastore User
```

#### Issue: "Invalid JSON format in secret"

**Solution:**

- Ensure you copied the entire JSON file content
- Check for any missing brackets `{}` or commas
- Verify there are no extra spaces or characters

#### Issue: "Service account key not found"

**Solution:**

- Verify the secret name is exactly: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Check if the secret is set at the repository level (not organization level)

### 5.2 Debug Steps

1. **Check GitHub Actions logs:**

   ```bash
   # Look for error messages in the workflow logs
   # Common errors appear in the "Run empire statistics script" step
   ```

2. **Test locally:**

   ```bash
   cd scripts
   python empire-statistics.py --service_account path/to/your/service-account.json --limit 5
   ```

3. **Verify Firebase connectivity:**
   ```bash
   cd scripts
   python firebase_integration.py
   ```

### 5.3 Workflow Status Meanings

- ✅ **Success**: Everything worked correctly
- ⚠️ **Warning**: Partial success, check logs for details
- ❌ **Failure**: Something went wrong, check error messages

## 📋 Step 6: Environment Variables Alternative

Instead of using GitHub secrets, you can also use environment variables in your workflow:

### 6.1 Update workflow file

```yaml
# In .github/workflows/update-statistics.yml
- name: Set up Firebase credentials
  env:
    FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
    FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
    FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
  run: |
    echo "Setting up Firebase with environment variables..."
```

### 6.2 Required secrets for this approach:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

## 🔐 Security Best Practices

### 6.1 Service Account Security

- ✅ Never commit service account JSON files to version control
- ✅ Use GitHub secrets for sensitive data
- ✅ Regularly rotate service account keys
- ✅ Use minimal required permissions

### 6.2 Repository Security

- ✅ Restrict who can modify GitHub secrets
- ✅ Use environment protection rules for production
- ✅ Enable branch protection for main branch
- ✅ Require pull request reviews

## 📊 Step 7: Monitor and Maintain

### 7.1 Regular Checks

- Monitor workflow execution weekly
- Check Firebase usage quotas monthly
- Review service account permissions quarterly
- Rotate service account keys annually

### 7.2 Monitoring Dashboard

Set up monitoring for:

- Workflow execution success rate
- Firebase database writes
- Script execution time
- Error rates and types

## 🚀 Step 8: Next Steps

After successful setup:

1. **Set up notifications** for failed workflows
2. **Configure branch protection** to require successful statistics updates
3. **Create monitoring dashboards** for Firebase usage
4. **Set up alerts** for service account key expiration

## 📞 Support

If you need help:

1. Check GitHub Actions logs first
2. Review Firebase Console for errors
3. Test with a small dataset (`--limit 5`)
4. Verify all secrets are properly set

## 🔄 Workflow Schedule

The workflow is configured to run:

- **On push** to main branch
- **On merged PR** to main branch
- **Weekly** on Mondays at 6 AM UTC
- **Manually** via workflow dispatch

You can modify the schedule in `.github/workflows/update-statistics.yml`:

```yaml
schedule:
  - cron: '0 6 * * 1' # Every Monday at 6 AM UTC
```

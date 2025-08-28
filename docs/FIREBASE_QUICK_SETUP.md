# Firebase Quick Setup Reference

## ⚡ Quick Steps (5 minutes)

### 1. Firebase Console

```bash
1. Go to Firebase Console
2. Project Settings → Service Accounts
3. Generate new private key
4. Download JSON file
```

### 2. GitHub Secret

```bash
1. GitHub Repo → Settings → Secrets and variables → Actions
2. New repository secret
3. Name: FIREBASE_SERVICE_ACCOUNT_KEY
4. Value: [paste entire JSON file content]
```

### 3. Test Setup

```bash
1. GitHub Actions → Update Empire Statistics
2. Run workflow → Choose main branch
3. Check for ✅ Firebase initialized successfully
```

## 🔧 Local Testing

```bash
cd scripts
pip install -r requirements.txt
python empire-statistics.py --service_account path/to/service-account.json --limit 5
```

## 📋 Checklist

- [ ] Firebase project created
- [ ] Service account JSON downloaded
- [ ] GitHub secret `FIREBASE_SERVICE_ACCOUNT_KEY` added
- [ ] Firestore database enabled
- [ ] Workflow test successful
- [ ] Statistics visible in Firebase Console

## 🚨 Common Issues

| Issue             | Solution                                                     |
| ----------------- | ------------------------------------------------------------ |
| Permission denied | Check service account has Firebase Admin SDK role            |
| Invalid JSON      | Ensure complete JSON file content copied                     |
| Secret not found  | Verify secret name is exactly `FIREBASE_SERVICE_ACCOUNT_KEY` |

## 🔗 Quick Links

- [Firebase Console](https://console.firebase.google.com/)
- [GitHub Actions](../../actions)
- [Detailed Setup Guide](./GITHUB_FIREBASE_SETUP.md)
- [Firebase Setup Guide](./FIREBASE_SETUP.md)

# EmpiRE-Compass Backend API

Complete backend API for EmpiRE-Compass application with secure admin operations and Firebase integration.

## Features

- ✅ **Firebase Admin SDK** - Secure server-side Firestore operations
- ✅ **Keycloak Authentication** - Token validation middleware
- ✅ **Admin Protection** - All write operations require admin authentication
- ✅ **SPARQL Validation** - Query validation before execution
- ✅ **Request Logging** - All operations logged to Firebase
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **AI Service** - Secure AI API key management

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Keycloak Configuration (optional - defaults to ORKG Keycloak)
KEYCLOAK_URL=https://accounts.orkg.org
KEYCLOAK_REALM=orkg
# Comma-separated list of allowed Keycloak client IDs (first entry is primary)
KEYCLOAK_CLIENT_IDS=empire-compass-devel,empire-compass

# Firebase Admin SDK (must be minified single-line JSON)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"projectdbclass","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"...","universe_domain":"googleapis.com"}

# AI Configuration
AI_PROVIDER=groq
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
MISTRAL_API_KEY=your_mistral_key
OPENAI_MODEL=gpt-5-nano
GROQ_MODEL=llama-3.1-8b-instant
MISTRAL_MODEL=mistral-large-latest
```

### 3. Firebase Service Account Setup

**IMPORTANT:** You need TWO different Firebase configurations:

1. **Firebase Web SDK** (for frontend) - Your `.env` for frontend
2. **Firebase Admin SDK** (for backend) - The `FIREBASE_SERVICE_ACCOUNT_KEY`

To get the Admin SDK key:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Download the JSON file
5. Convert to single-line format:

**Option 1: Using Node.js**

```bash
node -e "console.log(JSON.stringify(require('../scripts/firebase-service-account.json')))"
```

**Option 2: Using Python**

```bash
python3 -c "import json; print(json.dumps(json.load(open('../scripts/firebase-service-account.json'))))"
```

Copy the output and paste into your `.env` file.

**For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## API Endpoints

### Authentication

All admin endpoints require:

- `Authorization: Bearer <keycloak_token>` header with a valid Keycloak JWT token

**Token Verification:**

- **Always verified**: When a Bearer token is provided, it is always verified using Keycloak's JWKS endpoint (both production and development)
- Token signature, expiration, issuer, and audience are validated
- Invalid or expired tokens are rejected

**Development Mode Fallback:**

- In development (`NODE_ENV !== 'production'`), if no token is provided, you can use headers for testing:
  - `x-user-id`: User ID
  - `x-user-email`: User email
- **Note:** Header-based auth is only used as a fallback when no token is provided. If a token is present, it will always be verified.
- Header-based auth is completely disabled in production for security

### Users

- `POST /api/users/sync` - Sync Keycloak user to Firebase (authenticated)
- `GET /api/users/:userId` - Get user by ID (authenticated)

### Team

- `GET /api/team` - Get all team members (public)
- `POST /api/team` - Create team member (admin)
- `PUT /api/team/:id` - Update team member (admin)
- `DELETE /api/team/:id` - Delete team member (admin)

### Home Content

- `GET /api/home-content` - Get home content (public)
- `PUT /api/home-content` - Update home content (admin)

### Templates

- `GET /api/templates` - Get all templates (public)
- `GET /api/templates/:templateId` - Get template by ID (public)
- `POST /api/templates` - Create template (admin)
- `PUT /api/templates/:templateId` - Update template (admin)
- `DELETE /api/templates/:templateId` - Delete template (admin)

### Questions (Nested under Templates)

- `GET /api/templates/:templateId/questions` - Get all questions (public)
- `GET /api/templates/:templateId/questions/:questionId` - Get question by ID (public)
- `POST /api/templates/:templateId/questions` - Create question (admin, validates SPARQL)
- `PUT /api/templates/:templateId/questions/:questionId` - Update question (admin, validates SPARQL)
- `DELETE /api/templates/:templateId/questions/:questionId` - Delete question (admin)

### Statistics (Nested under Templates)

- `GET /api/templates/:templateId/statistics` - Get all statistics (public)
- `POST /api/templates/:templateId/statistics` - Create statistic (admin, validates SPARQL)
- `PUT /api/templates/:templateId/statistics/:statisticId` - Update statistic (admin, validates SPARQL)
- `DELETE /api/templates/:templateId/statistics/:statisticId` - Delete statistic (admin)

### AI Service

- `GET /api/health` - Health check
- `GET /api/ai/config` - Get AI configuration (requires API key)
- `POST /api/ai/generate` - Generate text with AI (requires API key)

## Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Security Features

1. **Keycloak Token Verification** - JWT tokens are verified using Keycloak's public keys (JWKS)
2. **Firebase Admin SDK** - All write operations use Admin SDK (bypasses security rules)
3. **Admin Verification** - Double-checks admin status against Firebase Users collection
4. **SPARQL Validation** - Validates queries before saving
5. **Request Logging** - All operations logged with user info
6. **Rate Limiting** - 100 requests per 15 minutes per IP
7. **CORS Protection** - Only allows requests from configured frontend URL
8. **Production Security** - Header-based auth bypass disabled in production

## Migration Notes

The frontend should be updated to:

1. Call backend APIs instead of direct Firestore writes
2. Pass Keycloak token in Authorization header
3. Handle errors from backend API responses

See `MIGRATION_GUIDE.md` for detailed migration steps.

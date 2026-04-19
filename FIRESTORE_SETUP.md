# Setting Up Firestore Backend

Your Express backend (Option B) uses Firestore for the database. To use it, you need to authenticate with Firebase.

## **Quick Setup (3 steps)**

### 1. Get Service Account Credentials
Go to: https://console.firebase.google.com/project/scriptvault-4da93/settings/serviceaccounts/adminsdk

- Click **"Generate New Private Key"**
- Save the JSON file to your project: `artifacts/api-server/service-account-key.json`

### 2. Update `.env` file
Edit `artifacts/api-server/.env` and set:
```
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

### 3. Start the backend
```powershell
cd d:\Secure-Data-Vault\artifacts\api-server
pnpm run start
```

The backend will now connect to Firestore using your credentials.

## **Backend Port**
- Express Backend: `http://localhost:8080`
- API Base: `http://localhost:8080/api`

## **Frontend Configuration**

The frontend (deployed on Firebase Hosting) needs to know where the backend is. In development:
- Open DevTools Console when visiting your app
- The API calls will try `localhost:8080` if configured

For production, you'll need to either:
1. Run the backend on a public server (e.g., Cloud Run, Heroku, Replit)
2. Configure CORS and a permanent backend URL in the frontend

## **Environment Variables (.env)**

```
SCRIPT_ENCRYPTION_KEY=<encryption key for script content>
ADMIN_SECRET=<secret for admin authentication>
PORT=8080
FIREBASE_PROJECT_ID=scriptvault-4da93
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

**Important:** Never commit `service-account-key.json` to version control!

## **Firestore Collections**

Collections will be created automatically when you first use them:
- `licenses` - License keys and their metadata
- `scripts` - Encrypted script content
- `access_logs` - API access logs

## **Testing the Backend**

```powershell
# Health check
Invoke-WebRequest http://localhost:8080/api/healthz | % { $_.Content }

# Admin stats (requires x-admin-secret header)
$headers = @{'x-admin-secret'='e40d17fad4c74d75dc21d499b4a03e81'}
Invoke-WebRequest http://localhost:8080/api/admin/stats -Headers $headers | % { $_.Content }
```

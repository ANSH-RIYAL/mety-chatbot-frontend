# Mety Chatbot Frontend
React + TypeScript frontend for the Mety Chatbot platform, deployed on Firebase Hosting.
## Live URL
**Production:** https://chatbot-display-23dca.web.app
## Tech Stack
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Hosting:** Firebase Hosting
## Local Development
```bash
# Install dependencies
npm install
# Run dev server (connects to local backend)
npm run dev
# Run dev server with production backend
VITE_BACKEND_URL=https://mety-chatbot-api-172415469528.us-central1.run.app npm run dev
# Build for production
npm run build
```
## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `http://localhost:8000` |
| `VITE_PREDICTION_API_URL` | Prediction API URL | `https://mlmodel.myyouthspan.com/prediction_model_test/` |
## CI/CD
Auto-deploys to Firebase Hosting on push to `main` via GitHub Actions.
**Required Secrets:**
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON
- `VITE_BACKEND_URL` - Production backend URL
## Project Structure
```
├── src/
│   ├── components/     # UI components
│   │   ├── chat/       # Chat panel
│   │   ├── dashboard/  # Dashboard cards
│   │   ├── layout/     # Shell & navigation
│   │   └── ui/         # shadcn components
│   ├── lib/
│   │   ├── api.ts          # API calls
│   │   ├── api-config.ts   # API URLs config
│   │   ├── store.ts        # Zustand state
│   │   └── constants.ts    # Plan variables
│   └── pages/          # Route pages
├── firebase.json       # Firebase hosting config
├── .firebaserc         # Firebase project config
└── vite.config.ts      # Vite configuration
```
## Related Repos
- **Backend:** [mety-chatbot-backend](https://github.com/ANSH-RIYAL/mety-chatbot-backend)

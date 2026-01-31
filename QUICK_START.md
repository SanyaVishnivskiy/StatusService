# Quick Start Guide

## Prerequisites
- Node.js 18+
- MongoDB running locally or connection string
- OpenSSL for generating encryption key

## Setup

### 1. Backend Setup
```bash
cd status-api

# Install dependencies (already done with create-next-app)
npm install

# Generate TOKEN_ENC_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Create .env file
cat > .env << EOF
MONGODB_URL=mongodb://localhost:27017/status-db
DEFAULT_GROUP_NAME=General
DEFAULT_GROUP_JOIN_KEY=secret123
TOKEN_ENC_KEY=<paste-generated-key-above>
EOF

# Start development server
npm run start:dev
# Backend runs on http://localhost:3001
```

### 2. Frontend Setup
```bash
cd status-ui

# Dependencies already installed with create-next-app
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

## First Test

1. Open `http://localhost:3000` in browser
2. You should be redirected to `/login`
3. Click "Register" tab
4. Enter username: `testuser`
5. Enter password: `password123`
6. Click "Register"
7. You should see groups page
8. If default group exists, click it
9. Enter join key: `secret123`
10. Click "Join"
11. You should now see the group and can view members

## API Testing (with curl)

### Register
```bash
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Get Groups (use token from login)
```bash
curl -X GET http://localhost:3001/groups \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Join Group
```bash
curl -X POST http://localhost:3001/groups/{groupId}/join \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"joinKey":"secret123"}'
```

### Get Group Members
```bash
curl -X GET http://localhost:3001/groups/{groupId}/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Group Statuses
```bash
curl -X GET http://localhost:3001/groups/{groupId}/statuses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update My Status
```bash
curl -X PUT http://localhost:3001/groups/{groupId}/statuses/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"state":"AVAILABLE","message":"Ready to play"}'
```

## Project Structure

```
StatusService/
├── status-api/          # NestJS Backend
│   ├── src/
│   │   ├── features/
│   │   │   ├── users/       # Auth & user management
│   │   │   ├── groups/      # Group management
│   │   │   └── statuses/    # User statuses
│   │   ├── common/
│   │   │   └── guards/      # Auth & membership guards
│   │   └── config/          # Configuration
│   └── package.json
│
└── status-ui/           # Next.js Frontend
    ├── app/
    │   ├── login/           # Login/Register page
    │   └── groups/          # Groups & members pages
    ├── lib/
    │   ├── api.ts           # API client
    │   ├── auth-context.tsx # Auth provider
    │   └── protected-route.tsx
    └── package.json
```

## Key Files Modified/Created

### Backend
- ✅ User schema with token encryption fields
- ✅ Auth endpoints (signup, login, logout)
- ✅ Groups endpoints (getAll, getMe, join)
- ✅ Users endpoint (getGroupUsers)
- ✅ Statuses endpoints (get, update)
- ✅ Guards (auth, membership)

### Frontend
- ✅ Login page with toggle
- ✅ Groups page with join status
- ✅ Group detail page with members
- ✅ Auth context & provider
- ✅ Protected route wrapper
- ✅ API client utilities

## Troubleshooting

**Backend won't start**
- Check MongoDB connection: `mongodb://localhost:27017/status-db`
- Verify TOKEN_ENC_KEY is set and is valid hex

**Frontend shows blank/can't connect**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running on port 3001
- Check browser console for CORS or network errors

**Login fails**
- Verify `DEFAULT_GROUP_JOIN_KEY` matches what you set
- Check MongoDB is running with data

**Join group fails**
- Verify you entered the correct join key
- Check group ID in URL is valid

## Next Steps

Future features to implement:
- Games CRUD endpoints
- Populate games in status responses
- Games UI page
- Real-time updates with WebSockets
- User profiles & settings
- Admin panel for group management

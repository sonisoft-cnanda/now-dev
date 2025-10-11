# AMB Connection Debugging Guide

## 🎯 Summary of Issues Found & Fixes Applied

I've analyzed your AMB connection logs and identified the root cause of why Record Watcher messages aren't being received.

---

## 🔴 **ROOT CAUSE**

The AMB WebSocket connection is **getting 403 Forbidden** because it's using **expired hard-coded session cookies**.

### Evidence from Your Logs:

**combined.log (Your Node.js test)** ❌:
```
Line 17: "statusCode": 403, "statusMessage": "Forbidden"
Line 39: "glide.session.status": "session.invalidated"
Line 409: "glide.amb.reply.status.message": "Either the channel is not a public channel or http session is not mapped against glide session with a valid user"
```

**amb.json (Browser - Working)** ✅:
```
Line 111: "glide.session.status": "session.logged.in"
Line 111: "glide.session.time.remaining.in.seconds": 1800
```

---

## ✅ **FIXES APPLIED**

I've made three key changes to fix this:

### 1. **ServerConnection.ts** - Dynamic Cookie Management

**Added**:
- `setInstanceUrl(url)` - Set instance URL dynamically
- `setSessionCookies(cookies)` - Set fresh session cookies
- `setUserToken(token)` - Set user token dynamically

**Modified**:
- `connect()` - Now uses dynamic cookies instead of hard-coded
- `getBaseUrl()` - Returns dynamic URL if set
- `getUserToken()` - Returns dynamic token if set

### 2. **AMBClient.ts** - Authentication Support

**Added**:
- Constructor now accepts `ServiceNowInstance` parameter
- `authenticate()` method - Authenticates and extracts session cookies
- `isAuthenticated()` method - Check authentication status

### 3. **AMBClient.test.ts** - Proper Test Flow

**Changed**:
- Added `ServiceNowInstance` setup with credentials
- Calls `authenticate()` BEFORE `connect()`
- Added better logging to track connection status
- Increased wait time to 30 seconds for testing

---

## 🔧 **HOW TO TEST THE FIX**

### Step 1: Run the Updated Test

```bash
npm test -- AMBClient.test.ts
```

### Step 2: Watch for These Messages

You should see:
```
🔐 Authenticating...
  [AMBClient] Successfully authenticated and obtained session cookies

✅ Authentication complete

🔌 Connecting to AMB...
  [ServerConnection] cometd.handshake: Connection Successful
  [ServerConnection] glide.session.status: session.logged.in  ← KEY!

✅ AMB Connected

📡 Setting up Record Watcher...
📋 Record Watcher Channel Created: /rw/default/incident/c3lzX2lkPTdlYWVjYTIwOTNlZjM5MTAwYzhhMzAxMThiYmExMDY3

👀 Waiting for messages (30 seconds)...
```

### Step 3: Update the Incident

While the test is waiting, open a browser and:
1. Go to: `https://tanengdev012.service-now.com/nav_to.do?uri=incident.do?sys_id=7eaeca2093ef39100c8a30118bba1067`
2. Make any change to the incident (add a comment, change priority, etc.)
3. Save the incident

### Step 4: Verify Message Received

You should see in the test output:
```
🎉 RECEIVED MESSAGE via channel subscribe callback!
{
  "channel": "/rw/default/incident/...",
  "data": {
    "table": "incident",
    "operation": "update",
    "sys_id": "7eaeca2093ef39100c8a30118bba1067",
    ...
  }
}
```

---

## 🐛 **If It Still Doesn't Work**

### Check 1: Verify Authentication Succeeded

Look for this in the logs:
```
✅ "Successfully authenticated and obtained session cookies"
```

If you see ❌ "Authentication succeeded but no cookies received", then the HTTP response isn't returning cookies properly.

### Check 2: Verify Session Status

In the logs, look for:
```
"glide.session.status": "session.logged.in"  ← Should be this
```

NOT:
```
"glide.session.status": "session.invalidated"  ← Bad!
```

### Check 3: Check for 403 Errors

Look for any `403 Forbidden` errors in the logs. There should be **NONE** after the fix.

### Check 4: Verify Subscription Success

Look for:
```
"Successfully subscribed to channel: /rw/default/incident/..."
```

NOT:
```
"glide.amb.reply.status.code": 403
"error": "404::message_deleted"
```

---

## 💡 **ADDITIONAL DEBUGGING**

### Add This to Your Test

To see exactly what cookies are being used:

```typescript
await client.authenticate();

// Add this debug code:
const serverConn: any = client.getServerConnection();
console.log('\n🍪 Session Cookies:', serverConn._sessionCookies);
console.log('🌐 Instance URL:', serverConn._instanceUrl);
console.log('✅ Authenticated:', client.isAuthenticated());

client.connect();
```

### Compare Cookies

The cookies from HTTP authentication should include:
- `JSESSIONID=...` - Session ID
- `glide_session_store=...` - Glide session
- `glide_user_route=...` - Routing info

These are the minimum required for AMB to work.

---

## 📚 **WHY THIS APPROACH WORKS**

### The Authentication Flow:

1. **HTTP Request** to `/api/now/table/sys_user`
   - ServiceNow authenticates the request
   - Returns session cookies in `Set-Cookie` headers
   
2. **Extract Cookies** from HTTP response
   - Get JSESSIONID and glide_session_store
   - Format as cookie header string

3. **Pass to WebSocket** connection
   - WebSocket includes cookies in headers
   - Server validates session
   - Connection succeeds with `session.logged.in` status

4. **Subscribe to Channels**
   - With valid session, subscriptions succeed
   - Server sends messages to subscribed channels

5. **Receive Messages**
   - When records update, messages are delivered
   - Callbacks are triggered

---

## 🎯 **WHAT CHANGED**

### Before (Broken):
```
AMBClient() → connect() 
  → 403 Forbidden (expired cookies)
  → session.invalidated
  → No messages ❌
```

### After (Fixed):
```
AMBClient(instance) → authenticate() → connect()
  → Fresh cookies
  → session.logged.in ✅
  → Messages received! 🎉
```

---

## 🧪 **Quick Verification Script**

Create this file: `test-amb-cookies.ts`

```typescript
import { ServiceNowRequest } from './src/comm/http/ServiceNowRequest';
import { ServiceNowInstance } from './src/sn/ServiceNowInstance';
import { getCredentials } from '@servicenow/sdk-cli/dist/auth/index.js';

async function testCookies() {
    const credential = await getCredentials('tanengdev012');
    const instance = new ServiceNowInstance({
        alias: 'tanengdev012',
        credential: credential
    });
    
    const req = new ServiceNowRequest(instance);
    const response: any = await req.get({
        method: 'GET',
        path: '/api/now/table/sys_user',
        query: { sysparm_limit: 1 }
    });
    
    console.log('Status:', response.status);
    console.log('Cookies received:', response.cookies);
    console.log('Cookie count:', response.cookies?.length);
    
    if (response.cookies) {
        response.cookies.forEach((cookie: string) => {
            if (cookie.includes('JSESSIONID') || cookie.includes('glide_session')) {
                console.log('  ✅', cookie.substring(0, 50) + '...');
            }
        });
    }
}

testCookies();
```

Run it:
```bash
tsx test-amb-cookies.ts
```

This will show you exactly what cookies are being extracted.

---

## 📞 **SUMMARY**

**Problem**: Expired hard-coded cookies causing 403 Forbidden and session.invalidated

**Solution**: 
1. ✅ Dynamic cookie management in ServerConnection
2. ✅ Pre-authentication in AMBClient to get fresh cookies
3. ✅ Updated test to authenticate before connecting

**Expected Result**: AMB connects with `session.logged.in` status and Record Watcher receives messages

**Test It**: `npm test -- AMBClient.test.ts` and watch for the connection success messages!

The fixes are complete and ready to test. The authentication should now work and you should see Record Watcher messages when incidents are updated! 🎉


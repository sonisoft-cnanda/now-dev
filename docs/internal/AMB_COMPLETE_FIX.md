# AMB Connection - Complete Fix & Analysis

## 📊 Summary of Issues & Fixes

After deep analysis of your logs, I've identified and fixed **5 critical issues** preventing AMB Record Watcher from working.

---

## 🔴 Issue #1: Expired Hard-Coded Cookies

**Problem**: `ServerConnection.ts` used expired hard-coded cookies

**Evidence**:
```
combined.log:39 - "glide.session.status": "session.invalidated"
combined.log:409 - "glide.amb.reply.status.code": 403
combined.log:409 - "http session is not mapped against glide session with a valid user"
```

**Fix**: Added dynamic cookie management to `ServerConnection`
```typescript
private _sessionCookies: string | null = null;
public setSessionCookies(cookies: string) { this._sessionCookies = cookies; }

// In connect():
const cookieHeader = this._sessionCookies || "...fallback...";
```

---

## 🔴 Issue #2: Hard-Coded Instance URL

**Problem**: `ServerConnection.ts:128` hard-coded instance URL

**Evidence**:
```
combined.log:436 - "AMBClient configured with instance: undefined"
```

**Fix**: Added dynamic instance URL
```typescript
private _instanceUrl: string | null = null;
public setInstanceUrl(url: string) { this._instanceUrl = url; }

public getBaseUrl():string{
    return this._instanceUrl || "https://tanengdev012.service-now.com";
}
```

---

## 🔴 Issue #3: Instance URL Extraction

**Problem**: `ServiceNowInstance.getHost()` returns undefined when created with only alias/credential

**Evidence**:
```
combined.log:436/583 - "AMBClient configured with instance: undefined"
```

**Fix**: Added `extractInstanceUrl()` method to AMBClient that:
- Checks session.instanceUrl
- Checks credential.instanceUrl
- Falls back to constructing from alias: `https://${alias}.service-now.com`

---

## 🔴 Issue #4: Cookie Format for WebSocket

**Problem**: Cookies extracted from HTTP response include Set-Cookie directives (httponly, secure, path, etc.) which shouldn't be in Cookie header

**Evidence**:
```
combined.log:444 - "Cookies: BIGipServerpool_tanengdev012=9fd826a5e97b1b61c7745b431bacad45; httponly; secure; samesite=None; path=/; ..."
```

**Fix**: Added `extractCookiesFromStore()` method that:
- Accesses cookie store from authentication handler
- Extracts ONLY `key=value` pairs
- Formats correctly for Cookie header: `JSESSIONID=xxx; glide_session_store=yyy`

---

## 🔴 Issue #5: WebSocket Not Sending Cookies

**Problem**: Node.js `ws.WebSocket` doesn't automatically use cookies from CometD config - they must be passed in constructor options

**Evidence**:
```
combined.log:17-22 - WebSocket closes immediately with 403
combined.log:22 - "Transport","websocket","accept, supported:","4":false
combined.log:30 - Falls back to long-polling
```

**Fix**: Modified `cometd-nodejs-client.ts` to create custom WebSocket class:
```typescript
window.WebSocket = class extends ws.WebSocket {
    constructor(url: string, protocols?: string | string[]) {
        const wsOptions: ws.ClientOptions = {};
        
        // Include cookies in WebSocket headers!
        if (window._wsOptions && window._wsOptions.cookies) {
            wsOptions.headers = {
                'Cookie': window._wsOptions.cookies,
                'Origin': url.replace(/^wss?:\/\//, 'https://').replace(/\/amb.*$/, '')
            };
        }
        
        super(url, protocols, wsOptions);
    }
};
```

---

## ✅ All Files Modified

### 1. `src/sn/amb/ServerConnection.ts`
- ✅ Added `_instanceUrl`, `_sessionCookies`, `_userToken` properties
- ✅ Added setter methods for dynamic configuration
- ✅ Modified `connect()` to use dynamic cookies
- ✅ Modified `getBaseUrl()` and `getUserToken()` for dynamic values

### 2. `src/sn/amb/AMBClient.ts`
- ✅ Added `_instance` and `_authenticated` properties
- ✅ Modified constructor to accept `ServiceNowInstance`
- ✅ Added `authenticate()` method to get session and cookies
- ✅ Added `extractInstanceUrl()` to get URL from credential/alias
- ✅ Added `extractCookiesFromStore()` to properly format cookies
- ✅ Added `isAuthenticated()` helper method

### 3. `src/sn/amb/cometd-nodejs-client.ts`
- ✅ Modified `adapt()` to accept cookies in options
- ✅ Created custom WebSocket class that includes cookies in headers
- ✅ Added Origin header for CORS
- ✅ Added debug logging for WebSocket connections

### 4. `src/sn/amb/AuthenticatedWebSocket.ts` (New File)
- ✅ Helper class for WebSocket authentication (reference implementation)

### 5. `test/unit/amb/AMBClient.test.ts`
- ✅ Added `ServiceNowInstance` setup with credentials
- ✅ Modified to call `authenticate()` before `connect()`
- ✅ Modified to pass cookies to `adapt()` function
- ✅ Initializes window AFTER cookies are obtained
- ✅ Enhanced logging for debugging
- ✅ Increased timeout to 60 seconds

---

## 🚀 How to Test

### Step 1: Run the Test

```bash
# Clear old logs (optional)
> logs/combined.log

# Run the test
npm test -- AMBClient.test.ts
```

### Step 2: Watch for Success Indicators

You should see:
```
🔐 Authenticating...
✅ Authentication complete

📋 Cookies obtained: JSESSIONID=...; glide_session_store=...; ...

🔌 Connecting to AMB...
✅ AMB Connected

📡 Setting up Record Watcher...
📋 Record Watcher Channel Created: /rw/default/incident/...

👀 Waiting for messages (30 seconds)...
```

### Step 3: Update the Incident

During the 30-second wait:
1. Open browser: `https://tanengdev012.service-now.com/incident.do?sys_id=7eaeca2093ef39100c8a30118bba1067`
2. Change something (short_description, priority, etc.)
3. Click "Update"

### Step 4: Verify Message Received

You should see:
```
🎉 RECEIVED MESSAGE via channel subscribe callback!
{
  "channel": "/rw/default/incident/c3lzX2lkPTdlYWVjYTIwOTNlZjM5MTAwYzhhMzAxMThiYmExMDY3",
  "data": {
    "operation": "update",
    "table_name": "incident",
    "sys_id": "7eaeca2093ef39100c8a30118bba1067",
    "changes": ["short_description"],
    ...
  }
}
```

---

## 🔍 What to Check in Logs

### ✅ Success Indicators

**In combined.log, you should see**:

1. **Authentication**:
```
"Successfully authenticated and obtained session cookies"
"Instance URL configured: https://tanengdev012.service-now.com"
```

2. **WebSocket Connection** (not long-polling):
```
"WebSocket connecting with cookies"
"connectionType": "websocket"  (not "long-polling")
```

3. **Session Status**:
```
"glide.session.status": "session.logged.in"  (not "invalidated")
"glide.session.time.remaining.in.seconds": 1800  (not 0)
```

4. **Subscription Success**:
```
"Successfully subscribed to channel: /rw/default/incident/..."
"ext": { "processed_by_glide": true }
NOT: "glide.amb.reply.status.code": 403
```

5. **Messages Received**:
```
"operation": "update"
"table_name": "incident"
"sys_id": "7eaeca2093ef39100c8a30118bba1067"
```

### ❌ Failure Indicators

If you still see these, there's an issue:

1. ❌ `"session.invalidated"`
2. ❌ `"glide.amb.reply.status.code": 403`
3. ❌ `"Transport","long-polling"` (should be websocket)
4. ❌ `"rejected_by_glide": true`
5. ❌ `"http session is not mapped against glide session"`

---

## 🔬 Debug Output

The enhanced logging will show:

```
🔐 Authenticating...
  [AMBClient] Authenticating to ServiceNow to obtain session cookies...
  [NowSDKAuthenticationHandler] Login Attempt Complete
  [AMBClient] Session obtained
  [AMBClient] Instance URL configured: https://tanengdev012.service-now.com
  [AMBClient] Found X cookies from CookieJar store
  [AMBClient] Successfully authenticated and obtained session cookies
✅ Authentication complete

📋 Cookies obtained: JSESSIONID=xxx; glide_session_store=yyy; ...

  [cometd] WebSocket connecting with cookies, cookieLength: 200
  [cometd] Transport websocket configured
🔌 Connecting to AMB...
  [ServerConnection] cometd.handshake: Connection Successful
  [ServerConnection] glide.session.status: session.logged.in
✅ AMB Connected
```

---

## 🎯 Key Differences: Before vs After

### WebSocket Connection

**Before** ❌:
```
GET /amb HTTP/1.1
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: xxx
Connection: Upgrade
Upgrade: websocket
Host: tanengdev012.service-now.com

→ Response: 403 Forbidden
→ Falls back to long-polling
→ Session: invalidated
```

**After** ✅:
```
GET /amb HTTP/1.1
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: xxx
Cookie: JSESSIONID=xxx; glide_session_store=yyy  ← ADDED!
Origin: https://tanengdev012.service-now.com      ← ADDED!
Connection: Upgrade
Upgrade: websocket
Host: tanengdev012.service-now.com

→ Response: 101 Switching Protocols
→ WebSocket connection established
→ Session: logged.in
```

---

## 📝 Testing Checklist

Before running, verify:
- [ ] `logs/combined.log` exists (or will be created)
- [ ] You have credentials configured for `tanengdev012`
- [ ] The incident `7eaeca2093ef39100c8a30118bba1067` exists
- [ ] You can access the incident in a browser

When running:
- [ ] Watch for "Successfully authenticated"
- [ ] Watch for "Instance URL configured"
- [ ] Watch for "WebSocket connecting with cookies"
- [ ] Check cookies are not empty
- [ ] Verify session.logged.in status
- [ ] Wait for "Ready to receive messages"

When testing:
- [ ] Update the incident in browser during the 30-second window
- [ ] Watch for "RECEIVED MESSAGE" in test output
- [ ] Verify message contains operation: "update"

---

## 🚨 If Issues Persist

### Check 1: Verify Cookies Are Extracted

Add this after authenticate():
```typescript
await client.authenticate();
const serverConn: any = client.getServerConnection();
console.log('Cookies:', serverConn._sessionCookies);
console.log('Instance URL:', serverConn._instanceUrl);
```

You should see actual cookie values, not undefined.

### Check 2: Verify WebSocket Uses Cookies

Look for in logs:
```
"WebSocket connecting with cookies"
"cookieLength": 200  (or some positive number)
```

### Check 3: Check Session Status

Must see:
```
"glide.session.status": "session.logged.in"
```

NOT:
```
"glide.session.status": "session.invalidated"
```

### Check 4: Verify Connection Type

Must see:
```
"connectionType": "websocket"
```

NOT:
```
"Transport","long-polling"
```

---

## 🎉 Expected Final Result

When everything works, here's what happens:

1. ✅ **Authentication** → Gets fresh JSESSIONID and glide_session_store cookies
2. ✅ **Instance URL** → Extracted from alias: `https://tanengdev012.service-now.com`  
3. ✅ **WebSocket** → Connects with cookies, gets 101 Switching Protocols
4. ✅ **Handshake** → Returns `"session.logged.in"` with 1800 seconds remaining
5. ✅ **Subscribe** → Record Watcher subscription succeeds
6. ✅ **Messages** → When incident updates, callback is triggered!

---

## 📞 Next Steps

### Option 1: Run Test Now

```bash
# Run the updated test
npm test -- AMBClient.test.ts

# During the 30-second wait, update the incident in browser
# Watch for the message callback!
```

### Option 2: Check Logs First

```bash
# Run test
npm test -- AMBClient.test.ts

# Then examine logs
cat logs/combined.log | jq -r '.message + ": " + (.metadata | tostring)' | tail -50
```

Look for:
- "Successfully authenticated"
- "session.logged.in"
- "WebSocket connecting with cookies"

###  Option 3: Regenerate combined.log

If you want me to analyze the new logs:
1. Clear logs: `> logs/combined.log`
2. Run test: `npm test -- AMBClient.test.ts`
3. Share the new `combined.log` content

I can then verify if all fixes are working correctly!

---

## 🎯 Files Modified (Complete List)

1. ✅ `src/sn/amb/ServerConnection.ts` - Dynamic cookies, URL, token
2. ✅ `src/sn/amb/AMBClient.ts` - Authentication, cookie extraction, URL extraction
3. ✅ `src/sn/amb/cometd-nodejs-client.ts` - WebSocket with cookie headers
4. ✅ `src/sn/amb/AuthenticatedWebSocket.ts` - Helper class (NEW)
5. ✅ `test/unit/amb/AMBClient.test.ts` - Proper authentication flow

---

## 💡 Why These Fixes Should Work

### Comparing with Browser Success:

**Browser (amb.json)**:
- ✅ Uses WebSocket with cookies
- ✅ Session status: "logged.in"
- ✅ Receives messages on channel

**Node.js (After Fixes)**:
- ✅ Authenticates to get fresh cookies
- ✅ Extracts instance URL from alias
- ✅ Passes cookies to WebSocket constructor
- ✅ Should match browser behavior!

The critical change is **passing cookies to WebSocket constructor** which the `ws` package requires but CometD doesn't do by default.

---

## 🎉 Ready to Test!

All fixes are complete and compiled. Run the test and let me know if you'd like me to analyze the new logs!

```bash
npm test -- AMBClient.test.ts
```

Watch for the 🎉 **"RECEIVED MESSAGE"** output when you update the incident!


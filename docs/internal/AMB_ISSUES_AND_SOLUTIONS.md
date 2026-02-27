# AMB Connection Issues & Solutions

## 🔍 Issues Identified

Based on log analysis (`combined.log` vs `amb.json`), here are the problems preventing AMB Record Watcher from receiving messages:

### Issue 1: Invalid/Expired Session Cookies ❌

**Location**: `src/sn/amb/ServerConnection.ts:89`

**Problem**:
- Hard-coded cookies from an expired session
- WebSocket connection gets **403 Forbidden**
- Session status shows `"session.invalidated"` instead of `"session.logged.in"`

**Log Evidence**:
```
Line 409: "glide.amb.reply.status.code": 403
Line 409: "glide.amb.reply.status.message": "Either the channel is not a public channel or http session is not mapped against glide session with a valid user"
Line 427: "glide.session.status": "session.invalidated"
Line 427: "glide.session.time.remaining.in.seconds": 0
```

**Browser (Working)**:
```json
"glide.session.status": "session.logged.in"
"glide.session.time.remaining.in.seconds": 1800
```

---

## ✅ Fixes Applied

### Fix 1: Made ServerConnection Accept Dynamic Configuration

**Added to `ServerConnection.ts`**:

```typescript
// Dynamic configuration properties
private _instanceUrl: string | null = null;
private _sessionCookies: string | null = null;
private _userToken: string | null = null;

// Setter methods
public setInstanceUrl(url: string) {
    this._instanceUrl = url;
}

public setSessionCookies(cookies: string) {
    this._sessionCookies = cookies;
}

public setUserToken(token: string) {
    this._userToken = token;
}

// Updated connect() to use dynamic cookies
public connect() {
    const cookieHeader = this._sessionCookies || "...fallback...";
    const configParameters:any = {
        url: this.getURL(properties.instance["servletPath"]),
        logLevel: properties.instance.logLevel,
        connectTimeout: properties.instance["wsConnectTimeout"],
        requestHeaders: {
            "cookie": cookieHeader  // ✅ Uses dynamic cookies!
        }
    };
    this._cometd.configure(configParameters);
    this._cometd.handshake(...);
}

// Updated getBaseUrl() and getUserToken()
public getBaseUrl():string{
    return this._instanceUrl || "https://tanengdev012.service-now.com";
}

public getUserToken(){
    return this._userToken || "...fallback...";
}
```

### Fix 2: Added Authentication to AMBClient

**Modified `AMBClient.ts`**:

```typescript
export class AMBClient {
    private _instance: ServiceNowInstance | null = null;
    private _authenticated: boolean = false;

    constructor(clientSubscriptions:any, instance?: ServiceNowInstance) {
        this._instance = instance || null;
        // ...
        
        if (this._instance) {
            const instanceUrl = this._instance.getHost();
            this._serverConnection.setInstanceUrl(instanceUrl);
        }
    }

    /**
     * Authenticate and obtain session cookies
     * MUST be called before connect()
     */
    public async authenticate(): Promise<void> {
        const snRequest = new ServiceNowRequest(this._instance);
        
        // Make HTTP request to authenticate and get cookies
        const testRequest: HTTPRequest = {
            method: 'GET',
            path: '/api/now/table/sys_user',
            query: { sysparm_limit: 1 },
            headers: { 'Accept': 'application/json' },
            body: null
        };

        const response = await snRequest.get(testRequest);
        const httpResponse: any = response;
        
        if (response.status === 200 && httpResponse.cookies) {
            // ✅ Extract fresh cookies!
            const cookieString = httpResponse.cookies.join('; ');
            this._serverConnection.setSessionCookies(cookieString);
            this._authenticated = true;
        }
    }
}
```

### Fix 3: Updated Test to Authenticate First

**Modified `test/unit/amb/AMBClient.test.ts`**:

```typescript
describe('AMBClient', () => {
    let instance: ServiceNowInstance;
    
    beforeEach(async () => {
        credential = await getCredentials('tanengdev012');
        instance = new ServiceNowInstance({
            alias: 'tanengdev012',
            credential: credential
        });
    });

    it('can run client', async () => {
        const clientSubscriptions = mb.buildClientSubscriptions();
        
        // ✅ Pass instance to AMBClient
        const client = new AMBClient(clientSubscriptions, instance);
        
        // ✅ Authenticate FIRST to get session cookies
        await client.authenticate();
        
        // ✅ Then connect with valid cookies
        client.connect();
        
        // Subscribe to Record Watcher
        const rwChannel = client.getRecordWatcherChannel("incident", "sys_id=...", null, subConfig);
        rwChannel.subscribe(callback);
        
        // Wait for messages...
    });
});
```

---

## ⚠️ Remaining Issue

Even with fresh cookies from HTTP authentication, the logs still show:

```
"glide.amb.reply.status.message": "Either the channel is not a public channel or http session is not mapped against glide session with a valid user"
```

This suggests **one more issue**:

### Possible Cause: HTTP Session vs Glide Session Mapping

The error message indicates that even though we have HTTP session cookies, **they may not be properly mapped to a Glide session** for AMB purposes.

### Additional Investigation Needed

Compare the browser logs more carefully to see:

1. **What happens before the browser connects to AMB?**
   - Is there a session setup request?
   - Are there specific cookies that must be present?
   
2. **Check the WebSocket request headers in browser logs**
   - What cookies are actually being sent?
   - Are there any other headers needed?

3. **Verify the cookies being extracted**
   - Add logging to see exactly what cookies are being set
   - Compare with browser cookies

---

## 🔬 Debug Steps

### Step 1: Verify Cookie Extraction

Add this to the test:

```typescript
await client.authenticate();

// Debug: Check what cookies were set
const serverConn = client.getServerConnection();
console.log('Cookies set:', serverConn['_sessionCookies']);
```

### Step 2: Check Browser Cookies

In the browser, before connecting to AMB, check `document.cookie` to see exactly what cookies are present.

### Step 3: Compare Cookie Requirements

The critical cookies for AMB are likely:
- `JSESSIONID` - Session ID
- `glide_session_store` - Glide session
- `glide_user_route` - User routing
- `BAYEUX_BROWSER` - CometD browser ID

### Step 4: Check for Additional Session Setup

Look in the browser logs (`amb.json`) for any requests made BEFORE the WebSocket connection that might set up the glide session.

---

## 🧪 Quick Test

Run this to see the cookies being obtained:

```typescript
import { ServiceNowRequest } from '../src/comm/http/ServiceNowRequest';
import { ServiceNowInstance } from '../src/sn/ServiceNowInstance';

const instance = new ServiceNowInstance({ alias: 'tanengdev012' });
const req = new ServiceNowRequest(instance);

const response: any = await req.get({
    method: 'GET',
    path: '/api/now/table/sys_user',
    query: { sysparm_limit: 1 }
});

console.log('Cookies received:', response.cookies);
```

---

## 💡 Alternative Approach

If HTTP session cookies don't work for WebSocket, consider:

### Option 1: Bearer Token Authentication

Some ServiceNow instances support bearer token auth for WebSockets:

```typescript
requestHeaders: {
    "Authorization": `Bearer ${bearerToken}`
}
```

### Option 2: Session Extension Request

Make a request to `/amb/handshake` or session setup endpoint BEFORE connecting to WebSocket to establish the glide session mapping.

### Option 3: Cookie Store from SDK

Use the ServiceNow SDK's cookie store if available:

```typescript
const cookieStore = await getCookieStore(instance);
// Pass to AMB connection
```

---

## 📝 Summary

**Fixes Applied**:
- ✅ Dynamic instance URL configuration
- ✅ Dynamic cookie management
- ✅ Pre-authentication to get fresh cookies
- ✅ Improved test structure

**Still Investigating**:
- ⚠️ HTTP session cookies may not be sufficient for AMB WebSocket
- ⚠️ May need additional session mapping step
- ⚠️ Need to verify exact cookies required

**Next Step**:
Examine the browser's Network tab more carefully to see:
1. What requests happen BEFORE WebSocket connection
2. What exact cookies are sent with the WebSocket upgrade request
3. If there's a specific session setup endpoint that needs to be called

Would you like me to investigate further by examining the browser logs more carefully, or would you like to try running the updated test to see if the authentication helps?


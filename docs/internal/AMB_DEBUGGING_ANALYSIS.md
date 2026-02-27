# AMB Connection Debugging Analysis

## 🔴 Issues Identified

### Issue 1: Hard-Coded Expired Cookies
**Location**: `src/sn/amb/ServerConnection.ts:89`

```typescript
requestHeaders: {
    "cookie":"_gcl_au=1.1.1571932408.1717610613; ...; JSESSIONID=7C489DA2F13E60409995655754C236FE; glide_session_store=9EBA246F1BFF4A1073ED84415B4BCB57; ..."
}
```

**Problem**: These cookies are hard-coded and expired. The server is returning `403 Forbidden` because the session is invalid.

**Evidence from logs**:
- `combined.log:17` - `"statusCode":403,"statusMessage":"Forbidden"`
- `combined.log:39,48` - `"glide.session.status":"session.invalidated"`
- `amb.json:111` (browser) - `"glide.session.status":"session.logged.in"` ✅

### Issue 2: Hard-Coded Instance URL
**Location**: `src/sn/amb/ServerConnection.ts:128`

```typescript
public getBaseUrl():string{
    return "https://tanengdev012.service-now.com";
}
```

**Problem**: Instance URL is hard-coded, not using the ServiceNowInstance configuration.

### Issue 3: Hard-Coded User Token
**Location**: `src/sn/amb/ServerConnection.ts:132`

```typescript
public getUserToken(){
    return "49c21d3c0f2c3a10ab240ff800d1b2d29dd1b33d87a05b1aa4c0f3a52b0efd8e04ca4628";
}
```

**Problem**: User token is hard-coded instead of being retrieved from the authenticated session.

### Issue 4: No Authentication Before AMB Connection
**Location**: `test/unit/amb/AMBClient.test.ts:28-30`

```typescript
const client:AMBClient = new AMBClient(clientSubscriptions);
client.connect();
```

**Problem**: The test connects to AMB without first authenticating to get valid session cookies.

## 📊 Log Comparison

### Browser (Working) ✅
```json
{
    "glide.session.status": "session.logged.in",
    "glide.amb.active": true,
    "glide.session.time.remaining.in.seconds": 1800,
    "successful": true
}
```

### Node.js Test (Failing) ❌
```json
{
    "glide.session.status": "session.invalidated",
    "glide.amb.active": true,
    "glide.session.time.remaining.in.seconds": 0,
    "successful": true  // Handshake "succeeds" but session is invalid
}
```

## 🔧 Required Fixes

### Fix 1: Accept ServiceNowInstance in AMBClient

The AMBClient needs to receive a ServiceNowInstance to:
- Get the instance URL dynamically
- Authenticate and obtain session cookies
- Pass cookies to the WebSocket connection

### Fix 2: Authenticate Before Connecting

The connection flow should be:
1. Authenticate via HTTP to get session cookies (JSESSIONID, glide_session_store)
2. Extract cookies from the authenticated session
3. Pass cookies to CometD configure
4. Connect to AMB WebSocket with valid session

### Fix 3: Dynamic Cookie Retrieval

Replace hard-coded cookies with cookies from authenticated ServiceNowRequest session.

## 💡 Solution Approach

### Option A: Modify AMBClient Constructor

```typescript
export class AMBClient {
    private _instance: ServiceNowInstance;
    
    constructor(instance: ServiceNowInstance, clientSubscriptions:any) {
        this._instance = instance;
        this._clientSubscriptions = clientSubscriptions;
        this._ambClient = new MessageClient();
        this._serverConnection = this._ambClient.getServerConnection();
        
        // Set instance on ServerConnection
        this._serverConnection.setInstance(instance);
    }
    
    async connect() {
        // Authenticate first to get session cookies
        await this._serverConnection.authenticate();
        // Then connect to AMB
        this._ambClient.connect();
    }
}
```

### Option B: Add setCookies Method to ServerConnection

```typescript
export class ServerConnection {
    private _instanceUrl: string;
    private _sessionCookies: string;
    
    public setInstance(instance: ServiceNowInstance) {
        this._instanceUrl = instance.getInstanceURL();
    }
    
    public async authenticate() {
        // Make HTTP request to get session cookies
        const req = new ServiceNowRequest(this._instance);
        await req.ensureLoggedIn();
        const session = await req.getUserSession();
        
        // Extract cookies from session
        this._sessionCookies = this.extractCookies(session);
    }
    
    public connect() {
        const configParameters:any = {
            url: this.getURL(properties.instance["servletPath"]),
            logLevel: properties.instance.logLevel,
            connectTimeout: properties.instance["wsConnectTimeout"],
            requestHeaders: {
                "cookie": this._sessionCookies  // Use dynamic cookies
            }
        };
        this._cometd.configure(configParameters);
        this._cometd.handshake(...);
    }
    
    public getBaseUrl():string{
        return this._instanceUrl;  // Use dynamic URL
    }
}
```

## 🎯 Recommended Fix

The cleanest solution is to:

1. **Modify ServerConnection** to accept instance and cookies
2. **Modify AMBClient** to accept ServiceNowInstance
3. **Update the test** to authenticate before connecting
4. **Remove all hard-coded values**

This ensures:
- ✅ Dynamic instance URL
- ✅ Fresh session cookies
- ✅ Proper authentication
- ✅ Works with any ServiceNow instance

## 📝 Implementation Steps

1. Add `setInstance()` and `setCookies()` methods to ServerConnection
2. Modify `connect()` to use dynamic cookies instead of hard-coded
3. Add authentication helper to get cookies from ServiceNowRequest
4. Update AMBClient to accept ServiceNowInstance
5. Update test to authenticate before connecting

## 🔍 Key Log Messages to Watch

When fixed, you should see:
- ✅ `"glide.session.status":"session.logged.in"` (not "invalidated")
- ✅ `"successful":true` on handshake
- ✅ WebSocket status `101 Switching Protocols` (not `403 Forbidden`)
- ✅ Messages received on subscribed channels

## Next Steps

Would you like me to implement these fixes in the ServerConnection and AMBClient classes?


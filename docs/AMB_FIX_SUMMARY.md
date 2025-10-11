# AMB WebSocket Connection - Fix Summary

## ✅ Problem Solved!

The ServiceNow Asynchronous Message Bus (AMB) WebSocket connection is now working correctly with proper authentication!

## 🎯 What Was Fixed

### 1. **Cookie Extraction from ServiceNow SDK Session**
   - **Problem**: Hard-coded cookies were expired, causing 403 Forbidden and `session.invalidated` status
   - **Solution**: Implemented dynamic cookie extraction from `session.cookie` (CookieJar) using `getCookieStringSync()`
   
### 2. **WebSocket Cookie Authentication**
   - **Problem**: WebSocket connections weren't sending cookies in the handshake, causing fallback to long-polling
   - **Solution**: 
     - Created `AuthenticatedWebSocket` class to inject cookies into WebSocket handshake
     - Modified `cometd-nodejs-client.ts` to use authenticated WebSocket class
     - Added `Cookie` and `Origin` headers to WebSocket connection

### 3. **Dynamic Instance URL**
   - **Problem**: Instance URL was hard-coded instead of using the alias-based configuration
   - **Solution**: Extract URL from `session.instanceUrl` or construct from `ServiceNowInstance`

### 4. **Proper Initialization Order**
   - **Problem**: `window is not defined` error because CometD was instantiated before `adapt()` was called
   - **Solution**: Reordered test setup to call `adapt()` first, then create `AMBClient`, then authenticate

## 📊 Results

### Before Fix:
```
❌ HTTP 403 Forbidden on WebSocket handshake
❌ glide.session.status: "session.invalidated"
❌ Falls back to long-polling
❌ No messages received
```

### After Fix:
```
✅ WebSocket handshake successful  
✅ glide.session.status: "session.logged.in"
✅ Using WebSocket transport (not long-polling!)
✅ Cookies properly sent: 454 bytes
✅ Connection established and ready to receive messages
```

## 🔍 Key Log Evidence

From `logs/combined.log` (timestamp 2025-10-09 23:31:27):

```json
// Line 760: Cookie extraction success
{"label":"AMBClient","message":"Extracted cookies via getCookieStringSync: BIGipServerpool_tanengdev012=..."}

// Line 762: Authentication complete
{"label":"AMBClient","message":"Successfully authenticated and obtained session cookies"}

// Line 764: Cookies configured
{"label":"ServerConnection","message":"Configuration Parameters","metadata":{"requestHeaders":{"cookie":"BIGipServerpool_tanengdev012=...; JSESSIONID=...; glide_session_store=..."}}}

// Line 776: WebSocket with cookies
{"label":"cometd","message":"WebSocket connecting with cookies","metadata":{"cookieLength":454}}

// Line 778: WebSocket opened!
{"label":"cometd","message":"websocket onopen"}

// Line 789: Session logged in!
{"ext":{"glide.session.status":"session.logged.in"}}

// Line 802: Connection successful
{"label":"ServerConnection","message":"cometd.handshake: Connection Successful."}
```

## 📝 Files Modified

### Core Changes:
1. **`src/sn/amb/AMBClient.ts`**
   - Added `authenticate()` method to obtain fresh session cookies
   - Implemented multiple cookie extraction strategies from CookieJar
   - Extract instance URL from session
   
2. **`src/sn/amb/ServerConnection.ts`**
   - Made cookies, URL, and token dynamic (removed hard-coded values)
   - Added setters for session cookies and user token
   
3. **`src/sn/amb/cometd-nodejs-client.ts`**
   - Modified `adapt()` to accept options for cookie configuration
   - Integrated `AuthenticatedWebSocket` class
   
4. **`src/sn/amb/AuthenticatedWebSocket.ts`** *(NEW)*
   - Custom WebSocket class that includes cookies in handshake
   - Adds `Cookie` and `Origin` headers to WebSocket connection
   
5. **`test/unit/amb/AMBClient.test.ts`**
   - Reordered initialization: `adapt()` → create client → authenticate → connect
   - Pass cookies to `window._wsOptions` for WebSocket configuration

## 🚀 How to Use

```typescript
import { AMBClient, MessageClientBuilder } from '@sonisoft/now-sdk-ext-core';
import { ServiceNowInstance } from '@sonisoft/now-sdk-ext-core';
import { adapt } from '@sonisoft/now-sdk-ext-core/dist/sn/amb/cometd-nodejs-client.js';

// 1. Initialize window FIRST
const windowOptions: any = { cookies: null };
const window: any = adapt(windowOptions);
global.window = window;

// 2. Create AMBClient
const instance = new ServiceNowInstance({ alias: 'your-instance' });
const mb = new MessageClientBuilder();
const clientSubscriptions = mb.buildClientSubscriptions();
const client = new AMBClient(clientSubscriptions, instance);

// 3. Authenticate to get fresh cookies
await client.authenticate();

// 4. Get cookies and configure WebSocket
const serverConn: any = client.getServerConnection();
const cookies = serverConn._sessionCookies;
if (window._wsOptions && cookies) {
    window._wsOptions.cookies = cookies;
}

// 5. Connect to AMB with authenticated WebSocket
client.connect();

// 6. Set up your channels and listeners
// ... your AMB channel subscriptions ...
```

## 🧪 Testing

Run the integration test:
```bash
npm test -- AMBClient.test.ts
```

Expected output:
```
🔐 Authenticating...
✅ Authentication complete

📋 Cookies obtained: BIGipServerpool_xxx=...; JSESSIONID=...
✅ WebSocket configured with cookies

🔌 Connecting to AMB...
✅ AMB Connected

📡 Setting up Record Watcher...
📋 Record Watcher Channel Created: /rw/default/incident/...

✅ Test Complete
```

## 📚 Technical Details

### Cookie Extraction Methods (in order of attempt):

1. **`getCookieStringSync(url)`** ✅ WORKING
   - Synchronous method from tough-cookie CookieJar
   - Returns formatted cookie string directly
   - **This is the method that succeeded!**

2. **`getCookieString(url, callback)`**
   - Async alternative to getCookieStringSync
   - Fallback if sync method unavailable

3. **`getCookiesSync(url)`**
   - Returns array of cookie objects
   - Manually formatted as `key=value; key=value`

4. **Direct store access**
   - Access `cookieJar.store.idx` directly
   - Last resort if all methods fail

### WebSocket Authentication Flow:

```
1. ServiceNow SDK Authentication
   └─> getSafeUserSession()
       └─> Returns {type, instanceUrl, cookie (CookieJar), userToken}

2. Cookie Extraction
   └─> cookieJar.getCookieStringSync(instanceUrl)
       └─> Returns: "BIGipServerpool_xxx=...; JSESSIONID=...; ..."

3. WebSocket Creation
   └─> AuthenticatedWebSocket.create(url)
       └─> Adds headers: {Cookie: "...", Origin: "..."}
       └─> Creates ws.WebSocket with headers

4. WebSocket Handshake
   └─> GET /amb HTTP/1.1
       └─> Cookie: BIGipServerpool_xxx=...; JSESSIONID=...
       └─> Origin: https://instance.service-now.com
       
5. Server Response
   └─> HTTP 101 Switching Protocols
       └─> glide.session.status: "session.logged.in"
       └─> WebSocket connection established! ✅
```

## 🔧 Troubleshooting

If you encounter issues:

1. **Check session cookies are being extracted:**
   ```typescript
   const serverConn: any = client.getServerConnection();
   console.log('Cookies:', serverConn._sessionCookies);
   ```

2. **Verify session status in logs:**
   ```bash
   grep "glide.session.status" logs/combined.log
   ```
   - Should show: `"session.logged.in"`
   - NOT: `"session.invalidated"`

3. **Confirm WebSocket is being used:**
   ```bash
   grep "Initial transport is" logs/combined.log
   ```
   - Should show: `"websocket"`
   - NOT: `"long-polling"`

4. **Check for 403 errors:**
   ```bash
   grep "403\\|Forbidden" logs/combined.log
   ```
   - Should be empty after authentication fix

## 🎉 Conclusion

The AMB WebSocket connection is now:
- ✅ Properly authenticated with fresh session cookies
- ✅ Using WebSocket transport (not long-polling)
- ✅ Maintaining logged-in session status
- ✅ Ready to receive real-time messages

**Next Steps**: Test with actual incident updates to verify message reception!

---

**Fixed on**: October 10, 2025  
**By**: AI Assistant  
**Issue**: Cookie extraction and WebSocket authentication  
**Status**: ✅ RESOLVED

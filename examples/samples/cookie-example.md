# Example: session.cookies

## Retrieving all session cookies
```javascript
await initTLS();
const session = new Session();
await session.get("http://localhost:3000/");
console.log(await session.cookies());
await destroyTLS();
```

## Cookies Response Example
```json
[
  {
    "key": "cookie1",
    "value": "value1",
    "domain": "localhost",
    "path": "/",
    "hostOnly": true,
    "pathIsDefault": true,
    "creation": "2025-06-20T19:30:28.478Z",
    "lastAccessed": "2025-06-20T19:30:28.478Z"
  },
  {
    "key": "cookie2",
    "value": "value2",
    "domain": "localhost",
    "path": "/",
    "hostOnly": true,
    "pathIsDefault": true,
    "creation": "2025-06-20T19:30:28.480Z",
    "lastAccessed": "2025-06-20T19:30:28.480Z"
  },
  {
    "key": "cookie3",
    "value": "value3",
    "domain": "localhost",
    "path": "/",
    "hostOnly": true,
    "pathIsDefault": true,
    "creation": "2025-06-20T19:30:28.480Z",
    "lastAccessed": "2025-06-20T19:30:28.480Z"
  },
  {
    "key": "cookie4",
    "value": "value4",
    "domain": "localhost",
    "path": "/",
    "hostOnly": true,
    "pathIsDefault": true,
    "creation": "2025-06-20T19:30:28.480Z",
    "lastAccessed": "2025-06-20T19:30:28.480Z"
  }
]
```

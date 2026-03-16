# JaQR

A lightweight JavaScript utility module for creating a serverless dynamic QR code system and allows for user and QR code analytics


---

## Functions

### `getClientMetadata(req)` · *Node.js only*

Extracts metadata from an incoming Node.js/Express request object.

**Parameters**
- `req` — A Node.js or Express request object.

**Returns** an object with:
| Field | Description |
|---|---|
| `signature` | The `JaQR` query param value (trailing `~` stripped), or `""` if absent |
| `ip` | Client IP address (respects `x-forwarded-for`) |
| `device` | User-Agent string, or `"Unknown"` |
| `timestamp` | Human-readable timestamp (MM/DD/YYYY, HH:MM AM/PM) |

```js
app.get('/track', (req, res) => {
  const meta = JaQR.getClientMetadata(req);
  console.log(meta);
  // { signature: 'a3f9...', ip: '192.168.1.1', device: 'Mozilla/5.0...', timestamp: '03/16/2026, 10:30 AM' }
});
```

---

### `Get_Signature()` · *Browser only*

Reads the `JaQR` query parameter from the current browser URL.

**Returns** the signature string of the QR code, or `null` if not present.

```js
// URL: https://example.com/page?JaQR=a3f9b2~~
const sig = JaQR.Get_Signature();
// → 'a3f9b2'
```

---

### `Sign_URL(url, metadata)` · *async*

Appends a SHA-256 signature of `metadata` which can be appended with addtional info about the QR code, to a URL as the `JaQR` query parameter.

**Parameters**
- `url` *(string)* — The URL to sign.
- `metadata` *(any)* — Data to hash into the signature.

**Returns** a `Promise<string>` — the signed URL.

```js
const signedURL = await JaQR.Sign_URL('https://example.com/scan', { userId: 42 });
// → 'https://example.com/scan?JaQR=7f83b...'
```

---

### `Create_Signature(obj)` · *async*

Produces a SHA-256 hex digest of any serializable object.

**Parameters**
- `obj` *(any)* — The value to hash (JSON-serialized before hashing).

**Returns** a `Promise<string>` — a 64-character hex string.

```js
const hash = await JaQR.Create_Signature({ userId: 42, action: 'scan' });
// → '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
```

---

### `convertToSMSURI(obj)`

Generates an SMS URI formatted for iOS or Android.

**Parameters**
- `obj.tel` *(string)* — Recipient phone number.
- `obj.message` *(string)* — Pre-filled message body.
- `obj.device_OS` *(string)* — `"ios"` or `"android"` (case-insensitive).

**Returns** a formatted `sms:` URI string, which can be provided to the client as a link

```js
JaQR.convertToSMSURI({ tel: '+15551234567', message: 'Hello!', device_OS: 'ios' });
// → 'sms:+15551234567&body=Hello!'

JaQR.convertToSMSURI({ tel: '+15551234567', message: 'Hello!', device_OS: 'android' });
// → 'sms:+15551234567?body=Hello!'
```

---

### `getVCardBytes(obj)`

Generates a vCard 3.0 contact as a `Uint8Array`, suitable for file download or Blob creation.

**Parameters**
- `obj.firstname` *(string)*
- `obj.lastname` *(string)*
- `obj.organization` *(string, optional)*
- `obj.email` *(string, optional)*
- `obj.phoneMobile` *(string, optional)*

**Returns** a `Uint8Array` of the vCard content.

```js
const bytes = JaQR.getVCardBytes({
  firstname: 'Jane',
  lastname: 'Doe',
  organization: 'Acme Corp',
  email: 'jane@acme.com',
  phoneMobile: '+15559876543'
});

// Browser download example:
const blob = new Blob([bytes], { type: 'text/vcard' });
const url = URL.createObjectURL(blob);
```

---

### `convertToTelURI(obj)`

Generates a `tel:` URI for initiating a phone call.

**Parameters**
- `obj.tel` *(string)* — The phone number.

**Returns** a `tel:` URI string, which can be provided to the client as a link

```js
JaQR.convertToTelURI({ tel: '+15551234567' });
// → 'tel:+15551234567'
```

---

### `convertToLocationURL(addr)`

Generates a Google Maps search URL from an address object.

**Parameters**
- `addr.street` *(string, optional)*
- `addr.city` *(string, optional)*
- `addr.state` *(string, optional)*
- `addr.zipcode` *(string, optional)*
- `addr.country` *(string, optional)*

**Returns** a Google Maps URL string, which can be given to the client as a link

```js
JaQR.convertToLocationURL({
  street: '1600 Amphitheatre Pkwy',
  city: 'Mountain View',
  state: 'CA',
  zipcode: '94043',
  country: 'USA'
});
// → 'https://www.google.com/maps/search/?api=1&query=1600+Amphitheatre+Pkwy%2C+Mountain+View%2C+CA%2C+94043%2C+USA'
```

---

## Environment Compatibility

| Function | Node.js | Browser |
|---|---|---|
| `getClientMetadata` | ✅ | ❌ |
| `Get_Signature` | ❌ | ✅ |
| `Sign_URL` | ✅ | ✅ |
| `Create_Signature` | ✅ | ✅ |
| `convertToSMSURI` | ✅ | ✅ |
| `getVCardBytes` | ✅ | ✅ |
| `convertToTelURI` | ✅ | ✅ |
| `convertToLocationURL` | ✅ | ✅ |

> `Sign_URL` and `Create_Signature` require the `crypto.subtle` Web Crypto API, available natively in browsers and in Node.js v15+.

# Usage

**JaQR** is a commonJS module and do not require any other external packages. So use as follows,

```javascript
const JaQR = require('@monteluke/jaqr');

const metadata = JaQR.getClientMetadata(req);
```

This package is designed to be used along with the **JaQR API** which is under development by myself. It allows to create a redirect qr code of a url appended with unique signature, which can be used for QR code analytics (using Get_Signature function). The functions convertToSMSURI, getVCardBytes, convertToTelURI, convertToLocationURL can be used to create links and downloadable file (for getVCardBytes function), which can be provided to the client to trigger the necessary actions. The function getClientMetaData provide additional analytic capabilities about the client that enters through the redirect QR code. The actions triggered by using the functions is as follows,

| Function | Action | 
|---|---|
| `convertToSMSURI` | `link opens the messages app with the given phone number and message` |
| `getVCardBytes` | `downloads a .vcf file which can be added to the contacts` |
| `convertToTelURI` | `link opens the dialer with the given phone number` |
| `convertToLocationURL` | `link opens google map to the given address` |

---


## Contributing & Maintenance

**JaQR** is a utility package maintained by the author. To keep the project scope focused and manageable, **I am not currently accepting Pull Requests (PRs) or feature requests.**

Feel free to fork the repository for your own personal use if you need to make modifications!


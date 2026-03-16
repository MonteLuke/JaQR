/**
 * @module @monteluke/jaqr (JaQR)
 */

/**
 * Extracts metadata from any Node.js request object.
 * @param {Object} req - The Node.js/Express request object.
 * @returns {Object} {signature, ip, device, timestamp}
 */
function getClientMetadata(req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || '0.0.0.0';
    let rawSignature = "";
    if (req.query && req.query.JaQR) {
        rawSignature = req.query.JaQR;
    } else if (req.url) {
        try {
            const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            rawSignature = url.searchParams.get('JaQR') || "";
        } catch (e) { rawSignature = ""; }
    }
    const cleanedSignature = rawSignature.replace(/~+$/, '');
    const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
    return { signature: cleanedSignature, ip, device: req.headers['user-agent'] || 'Unknown', timestamp };
}

/**
 * Extracts Signature of the QR code entry from browser URL.
 */
function Get_Signature() {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('JaQR')?.replace(/~+$/, '') || null;
}

/**
 * Add a SHA-256 signature to a URL.
 */
async function Sign_URL(url, metadata) {
    if (!url) throw new Error("URL required");
    const sig = await Create_Signature(metadata);
    return `${url}${url.includes('?') ? '&' : '?'}JaQR=${sig}`;
}

/**
 * Hashes a js object using SHA-256.
 */
async function Create_Signature(obj) {
    const msg = new TextEncoder().encode(JSON.stringify(obj));
    const buf = await crypto.subtle.digest('SHA-256', msg);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Formats SMS URI for iOS or Android.
 */
function convertToSMSURI(obj) {
    const msg = encodeURIComponent(obj.message || "");
    const isIOS = obj.device_OS?.toLowerCase() === "ios";
    return `sms:${obj.tel}${isIOS ? '&' : '?'}body=${msg}`;
}

/**
 * Generates vCard Uint8Array for downloads.
 */
function getVCardBytes(obj) {
    let v = "BEGIN:VCARD\r\nVERSION:3.0\r\n";
    v += `N:${obj.lastname || ""};${obj.firstname || ""};;;\r\n`;
    v += `FN:${obj.firstname || ""} ${obj.lastname || ""}`.trim() + "\r\n";
    if (obj.organization) v += `ORG:${obj.organization}\r\n`;
    if (obj.email) v += `EMAIL;TYPE=INTERNET:${obj.email}\r\n`;
    if (obj.phoneMobile) v += `TEL;TYPE=CELL,VOICE:${obj.phoneMobile}\r\n`;
    v += "END:VCARD";
    return new TextEncoder().encode(v);
}

/**
 * Phone URI generator.
 */
function convertToTelURI(obj) {
    return `tel:${obj.tel}`;
}

/**
 * Google Maps redirect URL generator.
 */
function convertToLocationURL(addr) {
    const q = [addr.street, addr.city, addr.state, addr.zipcode, addr.country].filter(Boolean).join(", ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

module.exports = {
    getClientMetadata,
    Get_Signature,
    Sign_URL,
    Create_Signature,
    convertToSMSURI,
    getVCardBytes,
    convertToTelURI,
    convertToLocationURL
};
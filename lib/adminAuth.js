import crypto from "crypto";

// We store a hash of the admin password (not the plaintext) in the cookie,
// and compare it against a hash computed from the env var on each request.
export function expectedSessionToken() {
  return crypto
    .createHash("sha256")
    .update(process.env.ADMIN_PASSWORD || "")
    .digest("hex");
}

export function isAuthorized(request) {
  const cookie = request.cookies.get("admin_session");
  if (!cookie) return false;
  return cookie.value === expectedSessionToken();
}

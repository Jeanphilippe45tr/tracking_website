// Quick end-to-end API smoke test against a running server.
// Usage: node scripts/smoke.js [baseUrl]

const base = process.argv[2] || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} -> ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

(async () => {
  const health = await request("/health");
  console.log("health:", health);

  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@example.com", password: "admin123" }),
  });
  console.log("login:", login.user.email, "prefs speed:", login.user.prefs.defaultSpeed);
  const auth = { Authorization: `Bearer ${login.token}` };

  const me = await request("/auth/me", { headers: auth });
  console.log("me:", me.name, me.email, "joinedAt:", me.joinedAt);

  const list = await request("/shipments", { headers: auth });
  console.log("shipments:", list.length, "first:", list[0].trackingNumber, "events:", list[0].events.length);

  const tracked = await request("/shipments/TRK000000001");
  console.log("public track:", tracked.trackingNumber, tracked.status, tracked.events.length);

  const created = await request("/shipments", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      senderName: "Smoke Sender",
      receiverName: "Smoke Receiver",
      receiverPhone: "+1 555 0100",
      origin: "Boston",
      destination: "Chicago",
      weight: 3.2,
      description: "Smoke test shipment",
    }),
  });
  console.log("created:", created.trackingNumber, created.status, created.events.length);

  const updated = await request(`/shipments/${created.trackingNumber}/events`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ status: "Picked up", location: "Boston", description: "Collected" }),
  });
  console.log("event added:", updated.status, updated.events.length);

  const relay = await request("/relay-points?q=London");
  console.log("relay search:", relay.length);

  const publicSettings = await request("/settings/public");
  console.log("public settings:", publicSettings);

  const prefs = await request("/auth/preferences", {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({ defaultSpeed: 5, chatWelcome: "Hello from the smoke test" }),
  });
  console.log("prefs updated:", prefs.defaultSpeed, prefs.chatWelcome);

  const conversation = await request("/chat/visitor/smoke-visitor/messages", {
    method: "POST",
    body: JSON.stringify({
      text: "Hello from the smoke test",
      name: "Smoke Visitor",
      email: "smoke@example.com",
    }),
  });
  console.log("visitor chat:", conversation.id, conversation.messages.length);

  const conversations = await request("/chat/conversations", { headers: auth });
  console.log("admin conversations:", conversations.length);

  const reply = await request(`/chat/conversations/${conversation.id}/messages`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ text: "Thanks for reaching out" }),
  });
  console.log("admin reply:", reply.messages.length);

  const contact = await request("/contact", {
    method: "POST",
    body: JSON.stringify({
      name: "Smoke User",
      email: "smoke@example.com",
      subject: "Question",
      message: "This is a smoke test contact message.",
    }),
  });
  console.log("contact:", contact);

  console.log("\nAll smoke checks passed.");
})().catch((err) => {
  console.error("\nSmoke test failed:", err.message);
  process.exit(1);
});

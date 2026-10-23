// Social App (v1) - Agile Project 2 - Reg No: 24MIS0476
// Features: Add Post
// Plain Node.js (no npm packages needed) so it builds easily in Docker/Jenkins.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const VERSION = "v1";

// In-memory data store
let posts = [];
let nextId = 1;

function sendJSON(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); } catch { resolve({}); }
    });
  });
}

function findPost(id) {
  return posts.find((p) => p.id === Number(id));
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  // Home page
  if (req.method === "GET" && (url === "/" || url === "/index.html")) {
    const html = fs.readFileSync(path.join(__dirname, "public", "index.html"));
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(html);
  }

  // Health / version check
  if (req.method === "GET" && url === "/api/version") {
    return sendJSON(res, 200, { app: "Social App", version: VERSION });
  }

  // List posts
  if (req.method === "GET" && url === "/api/posts") {
    return sendJSON(res, 200, posts.slice().reverse());
  }

  // FEATURE (v1): Add Post
  if (req.method === "POST" && url === "/api/posts") {
    const { author, text } = await readBody(req);
    if (!text || !text.trim()) return sendJSON(res, 400, { error: "Post text is required" });
    const post = {
      id: nextId++,
      author: (author || "Anonymous").trim(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    posts.push(post);
    return sendJSON(res, 201, post);
  }

  sendJSON(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Social App ${VERSION} running on http://localhost:${PORT}`);
});

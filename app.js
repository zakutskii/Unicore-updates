const API_URL = "https://api.github.com/repos/zakutskii/Unicore-updates/releases?per_page=50";

const releasesRoot = document.getElementById("releases");
const statusEl = document.getElementById("status");
const template = document.getElementById("release-template");

function fmtDate(value) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setStatus(text) {
  statusEl.textContent = text;
}

function renderReleases(items) {
  releasesRoot.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.textContent = "No releases found yet.";
    releasesRoot.appendChild(empty);
    return;
  }

  for (const release of items) {
    const node = template.content.cloneNode(true);
    const link = node.querySelector(".release-link");
    const meta = node.querySelector(".meta");
    const notes = node.querySelector(".notes");

    link.textContent = release.name || release.tag_name;
    link.href = release.html_url;

    const tag = release.tag_name || "untagged";
    const published = release.published_at ? fmtDate(release.published_at) : "unknown date";
    meta.textContent = `${tag} • published ${published}`;

    const markdownHtml = release.body_html || "";
    if (markdownHtml.trim()) {
      notes.innerHTML = markdownHtml;
    } else {
      notes.textContent = (release.body || "No release notes.").trim();
    }
    releasesRoot.appendChild(node);
  }
}

async function loadReleases() {
  try {
    setStatus("Loading releases...");

    const response = await fetch(API_URL, {
      headers: {
        // Ask GitHub for release markdown already rendered to sanitized HTML.
        Accept: "application/vnd.github.html+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const releases = await response.json();
    renderReleases(Array.isArray(releases) ? releases : []);
    setStatus(`Last updated: ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    releasesRoot.replaceChildren();
    const message = document.createElement("p");
    message.textContent = `Failed to load releases: ${error.message}`;
    releasesRoot.appendChild(message);
    setStatus("Error loading releases");
  }
}

loadReleases();

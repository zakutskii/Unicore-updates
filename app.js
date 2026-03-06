const API_URL = "https://api.github.com/repos/zakutskii/Unicore-updates/releases?per_page=50";

const releasesRoot = document.getElementById("releases");
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

function showError(message) {
  if (!releasesRoot) return;
  releasesRoot.replaceChildren();
  const errorEl = document.createElement("p");
  errorEl.textContent = message;
  releasesRoot.appendChild(errorEl);
}

function renderReleases(items) {
  if (!releasesRoot || !template) return;
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

async function fetchReleases() {
  const accepts = [
    "application/vnd.github.html+json",
    "application/vnd.github+json",
  ];

  let lastError;

  for (const accept of accepts) {
    const response = await fetch(API_URL, {
      headers: { Accept: accept },
    });

    if (response.ok) {
      const releases = await response.json();
      if (Array.isArray(releases)) return releases;
      lastError = new Error("Unexpected API payload");
      continue;
    }

    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");
    if (response.status === 403 && remaining === "0" && reset) {
      const resetAt = new Date(Number(reset) * 1000).toLocaleTimeString();
      throw new Error(`GitHub API rate limit reached. Try again after ${resetAt}.`);
    }

    lastError = new Error(`GitHub API error: ${response.status}`);
  }

  throw lastError || new Error("Failed to fetch releases");
}

async function loadReleases() {
  try {
    const releases = await fetchReleases();
    renderReleases(releases);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    showError(`Failed to load releases: ${reason}`);
  }
}

loadReleases();

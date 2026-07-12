const API =
    "https://video-worker.clip-devious-turf.workers.dev";

const statusMessage =
    document.getElementById("statusMessage");

const videoGrid =
    document.getElementById("videoGrid");

const pagination =
    document.getElementById("pagination");

const previousButton =
    document.getElementById("previousButton");

const nextButton =
    document.getElementById("nextButton");

const pageIndicator =
    document.getElementById("pageIndicator");

let currentPage =
    readPageFromUrl();

document.addEventListener(
    "DOMContentLoaded",
    () => loadPopularVideos(currentPage)
);

previousButton.addEventListener(
    "click",
    () => {
        if (currentPage > 1) {
            loadPopularVideos(
                currentPage - 1
            );
        }
    }
);

nextButton.addEventListener(
    "click",
    () => {
        loadPopularVideos(
            currentPage + 1
        );
    }
);

window.addEventListener(
    "popstate",
    () => {
        currentPage =
            readPageFromUrl();

        loadPopularVideos(
            currentPage,
            false
        );
    }
);


/*
============================================================
Load popular videos
============================================================
*/

async function loadPopularVideos(
    page,
    updateHistory = true
) {
    showLoading();

    try {
        const response =
            await fetch(
                `${API}/popular?page=${encodeURIComponent(page)}`,
                {
                    method: "GET",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        const text =
            await response.text();

        let result;

        try {
            result =
                JSON.parse(text);
        } catch {
            throw new Error(
                "The popular-video API returned invalid JSON."
            );
        }

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.error ||
                `Popular videos failed with HTTP ${response.status}.`
            );
        }

        currentPage =
            Number(result.page || 1);

        if (updateHistory) {
            updatePageUrl(
                currentPage
            );
        }

        renderVideos(
            result.videos || []
        );

        renderPagination(
            result
        );
    } catch (error) {
        console.error(
            "Unable to load popular videos:",
            error
        );

        showError(
            error instanceof Error
                ? error.message
                : String(error)
        );
    }
}


/*
============================================================
Render video cards
============================================================
*/

function renderVideos(videos) {
    videoGrid.replaceChildren();

    if (videos.length === 0) {
        statusMessage.hidden = false;

        statusMessage.textContent =
            currentPage === 1
                ? "No videos have reached 15 views yet."
                : "There are no videos on this page.";

        videoGrid.hidden = true;

        return;
    }

    for (const video of videos) {
        videoGrid.append(
            createVideoCard(video)
        );
    }

    statusMessage.hidden = true;
    videoGrid.hidden = false;
}


function createVideoCard(video) {
    const article =
        document.createElement("article");

    article.className =
        "video-card";

    const videoUrl =
        typeof video.videoUrl === "string" &&
        video.videoUrl
            ? video.videoUrl
            : `/vid?id=${encodeURIComponent(video.id)}`;

    const thumbnailLink =
        document.createElement("a");

    thumbnailLink.className =
        "thumbnail-link";

    thumbnailLink.href =
        videoUrl;

    thumbnailLink.setAttribute(
        "aria-label",
        `Watch ${video.title || "video"}`
    );

    if (video.thumbnailUrl) {
        const image =
            document.createElement("img");

        image.className =
            "thumbnail-image";

        image.src =
            video.thumbnailUrl;

        image.alt =
            video.title
                ? `Thumbnail for ${video.title}`
                : "Video thumbnail";

        image.loading =
            "lazy";

        image.addEventListener(
            "error",
            () => {
                image.remove();

                thumbnailLink.prepend(
                    createThumbnailPlaceholder(
                        video.title
                    )
                );
            },
            {
                once: true
            }
        );

        thumbnailLink.append(image);
    } else {
        thumbnailLink.append(
            createThumbnailPlaceholder(
                video.title
            )
        );
    }

    const duration =
        Number(
            video.durationSeconds || 0
        );

    if (
        Number.isFinite(duration) &&
        duration > 0
    ) {
        const badge =
            document.createElement("span");

        badge.className =
            "duration-badge";

        badge.textContent =
            formatDuration(duration);

        thumbnailLink.append(badge);
    }

    const content =
        document.createElement("div");

    content.className =
        "video-content";

    const heading =
        document.createElement("h3");

    heading.className =
        "video-title";

    const titleLink =
        document.createElement("a");

    titleLink.href =
        videoUrl;

    titleLink.textContent =
        video.title ||
        "Untitled video";

    heading.append(titleLink);

    const meta =
        document.createElement("div");

    meta.className =
        "video-meta";

    meta.textContent =
        buildMetaText(video);

    const description =
        document.createElement("p");

    description.className =
        "video-description";

    description.textContent =
        video.description ||
        "No description provided.";

    content.append(
        heading,
        meta,
        description
    );

    article.append(
        thumbnailLink,
        content
    );

    return article;
}


function createThumbnailPlaceholder(title) {
    const placeholder =
        document.createElement("div");

    placeholder.className =
        "thumbnail-placeholder";

    placeholder.textContent =
        title ||
        "Video";

    return placeholder;
}


/*
============================================================
Pagination
============================================================
*/

function renderPagination(result) {
    const totalPages =
        Math.max(
            1,
            Number(result.totalPages || 1)
        );

    const totalVideos =
        Number(result.totalVideos || 0);

    previousButton.disabled =
        !result.hasPreviousPage;

    nextButton.disabled =
        !result.hasNextPage;

    pageIndicator.textContent =
        `Page ${currentPage} of ${totalPages}`;

    pagination.hidden =
        totalVideos === 0;
}


function readPageFromUrl() {
    const parameters =
        new URLSearchParams(
            window.location.search
        );

    const requestedPage =
        Number.parseInt(
            parameters.get("page") || "1",
            10
        );

    return (
        Number.isInteger(requestedPage) &&
        requestedPage > 0
    )
        ? requestedPage
        : 1;
}


function updatePageUrl(page) {
    const url =
        new URL(window.location.href);

    if (page <= 1) {
        url.searchParams.delete(
            "page"
        );
    } else {
        url.searchParams.set(
            "page",
            String(page)
        );
    }

    window.history.pushState(
        {
            page
        },
        "",
        url
    );
}


/*
============================================================
Formatting
============================================================
*/

function buildMetaText(video) {
    const parts = [];

    const views =
        Number(video.views || 0);

    parts.push(
        `${views.toLocaleString()} ` +
        `view${views === 1 ? "" : "s"}`
    );

    const uploadDate =
        Number(video.uploadDate || 0);

    if (
        Number.isFinite(uploadDate) &&
        uploadDate > 0
    ) {
        parts.push(
            formatUploadDate(
                uploadDate
            )
        );
    }

    return parts.join(" • ");
}


function formatUploadDate(timestampSeconds) {
    return new Date(
        timestampSeconds * 1000
    ).toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


function formatDuration(totalSeconds) {
    const total =
        Math.max(
            0,
            Math.floor(totalSeconds)
        );

    const hours =
        Math.floor(total / 3600);

    const minutes =
        Math.floor(
            (total % 3600) / 60
        );

    const seconds =
        total % 60;

    if (hours > 0) {
        return (
            `${hours}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );
    }

    return (
        `${minutes}:` +
        `${String(seconds).padStart(2, "0")}`
    );
}


/*
============================================================
Status messages
============================================================
*/

function showLoading() {
    statusMessage.hidden = false;

    statusMessage.textContent =
        "Loading popular videos...";

    videoGrid.hidden = true;
    pagination.hidden = true;
}


function showError(message) {
    statusMessage.hidden = false;

    statusMessage.textContent =
        `Unable to load popular videos: ${message}`;

    videoGrid.hidden = true;
    pagination.hidden = true;
}
const API =
    "https://cloudflareworkers.workers.dev";

const messageElement =
    document.getElementById("message");

const videoSection =
    document.getElementById("videoSection");

const videoPlayer =
    document.getElementById("videoPlayer");

const titleElement =
    document.getElementById("videoTitle");

const descriptionElement =
    document.getElementById("description");

const detailsElement =
    document.getElementById("details");

loadVideo();

async function loadVideo() {
    const parameters =
        new URLSearchParams(window.location.search);

    const videoId =
        parameters.get("id");

    if (!videoId) {
        showError("The video ID is missing from the URL.");
        return;
    }

    try {
        const metadataUrl =
            `${API}/video?id=${encodeURIComponent(videoId)}`;

        const response =
            await fetch(metadataUrl, {
                headers: {
                    Accept: "application/json"
                }
            });

        const text =
            await response.text();

        let result;

        try {
            result = JSON.parse(text);
        } catch {
            throw new Error(
                `The video API returned invalid data: ` +
                text.slice(0, 200)
            );
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.error ||
                `Video request failed with HTTP ${response.status}.`
            );
        }

        const video =
            result.video;

        titleElement.textContent =
            video.title || "Untitled video";

        descriptionElement.textContent =
            video.description || "";

        detailsElement.textContent =
            formatDetails(video);

        /*
         * The stream must use the Worker hostname.
         *
         * Do not use only "/stream?id=..." here because that
         * would request myyear.net/stream instead of the Worker.
         */
        videoPlayer.src =
            `${API}/stream?id=${encodeURIComponent(videoId)}`;

        if (video.mime_type) {
            videoPlayer.setAttribute(
                "type",
                video.mime_type
            );
        }

        videoPlayer.addEventListener(
            "error",
            () => {
                showError(
                    "The video file could not be loaded from storage."
                );
            }
        );

        messageElement.hidden = true;
        videoSection.hidden = false;
    } catch (error) {
        console.error(error);

        showError(
            error instanceof Error
                ? error.message
                : String(error)
        );
    }
}

function showError(message) {
    videoSection.hidden = true;
    messageElement.hidden = false;
    messageElement.textContent =
        `Unable to load video: ${message}`;
}

function formatDetails(video) {
    const details = [];

    if (Number.isFinite(Number(video.views))) {
        details.push(
            `${Number(video.views).toLocaleString()} views`
        );
    }

    if (Number.isFinite(Number(video.duration_seconds))) {
        details.push(
            formatDuration(
                Number(video.duration_seconds)
            )
        );
    }

    return details.join(" • ");
}

function formatDuration(totalSeconds) {
    const minutes =
        Math.floor(totalSeconds / 60);

    const seconds =
        Math.floor(totalSeconds % 60);

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

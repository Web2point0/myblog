const API =
    "https://video-worker.clip-devious-turf.workers.dev";

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

const viewCountElement =
    document.getElementById("viewCount");

const expirationBanner =
    document.getElementById("expirationBanner");

const expirationTitle =
    document.getElementById("expirationTitle");

const expirationMessage =
    document.getElementById("expirationMessage");

const extendButton =
    document.getElementById("extendButton");


document.addEventListener(
    "DOMContentLoaded",
    loadVideo
);


/*
============================================================
Load video metadata and player
============================================================
*/

async function loadVideo() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );

    const videoId =
        parameters.get("id");


    if (!videoId) {

        showError(
            "The video ID is missing from the URL."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API}/video?id=${encodeURIComponent(videoId)}`,
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
                "The video API returned invalid JSON: " +
                text.slice(0, 200)
            );

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                `Video request failed with HTTP ${response.status}.`
            );

        }


        const video =
            result.video;


        if (!video) {

            throw new Error(
                "The video metadata was missing from the API response."
            );

        }


        /*
        ------------------------------------------------------------
        Populate page content
        ------------------------------------------------------------
        */

        if (titleElement) {

            titleElement.textContent =
                video.title ||
                "Untitled video";

        }


        if (descriptionElement) {

            descriptionElement.textContent =
                video.description || "";

        }


        if (detailsElement) {

            detailsElement.textContent =
                formatDetails(video);

        }


        if (viewCountElement) {

            viewCountElement.textContent =
                `${Number(video.views || 0).toLocaleString()} views`;

        }


        /*
        ------------------------------------------------------------
        Render expiration banner
        ------------------------------------------------------------
        */

        renderExpiration(
            video,
            videoId
        );


        /*
        ------------------------------------------------------------
        Configure video source
        ------------------------------------------------------------
        */

        if (!videoPlayer) {

            throw new Error(
                "The videoPlayer element is missing from index.html."
            );

        }


        videoPlayer.src =
            `${API}/stream?id=${encodeURIComponent(videoId)}`;


        videoPlayer.addEventListener(
            "error",
            () => {

                const mediaError =
                    videoPlayer.error;

                console.error(
                    "Video playback error:",
                    mediaError
                );

                showError(
                    "The video file could not be loaded from storage."
                );

            }
        );


        /*
        ------------------------------------------------------------
        Count view once playback begins
        ------------------------------------------------------------
        */

        let viewReported = false;


        videoPlayer.addEventListener(
            "play",
            () => {

                if (viewReported) {

                    return;

                }


                viewReported = true;


                reportView(videoId);

            }
        );


        /*
        ------------------------------------------------------------
        Reveal player
        ------------------------------------------------------------
        */

        if (messageElement) {

            messageElement.hidden = true;

        }


        if (videoSection) {

            videoSection.hidden = false;

        }


        videoPlayer.load();

    } catch (error) {

        console.error(
            "Unable to load video:",
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
Expiration banner
============================================================
*/

function renderExpiration(
    video,
    videoId
) {

    /*
     * The page can still work when the expiration elements
     * have not yet been added to index.html.
     */

    if (
        !expirationBanner ||
        !expirationMessage ||
        !extendButton
    ) {

        console.warn(
            "Expiration banner elements are missing from index.html."
        );

        return;

    }


    if (!video.show_expiration_banner) {

        expirationBanner.hidden = true;

        return;

    }


    expirationBanner.hidden = false;


    if (expirationTitle) {

        expirationTitle.textContent =
            "This video will expire soon.";

    }


    const secondsRemaining =
        Math.max(
            0,
            Number(
                video.seconds_remaining || 0
            )
        );


    const daysRemaining =
        Math.max(
            1,
            Math.ceil(
                secondsRemaining /
                86400
            )
        );


    expirationMessage.textContent =
        `This video is scheduled to expire in ` +
        `${daysRemaining} ` +
        `day${daysRemaining === 1 ? "" : "s"}.`;


    if (video.can_extend) {

        extendButton.hidden = false;

        extendButton.disabled = false;

        extendButton.textContent =
            `Extend for ` +
            `${Number(video.extension_months || 12)} months`;


        extendButton.onclick =
            () => submitExtension(videoId);

    } else {

        extendButton.hidden = true;

        extendButton.onclick = null;

    }

}


/*
============================================================
Submit video extension
============================================================
*/

async function submitExtension(videoId) {

    if (
        !extendButton ||
        !expirationMessage
    ) {

        return;

    }


    extendButton.disabled = true;

    extendButton.textContent =
        "Extending...";


    try {

        const response =
            await fetch(
                `${API}/extend`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        id: videoId
                    })
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
                "The extension API returned invalid JSON."
            );

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                `Extension failed with HTTP ${response.status}.`
            );

        }


        expirationMessage.textContent =
            result.message ||
            "The video expiration was extended.";


        extendButton.hidden = true;


        setTimeout(
            () => {

                if (expirationBanner) {

                    expirationBanner.hidden = true;

                }

            },
            4000
        );

    } catch (error) {

        console.error(
            "Video extension failed:",
            error
        );


        expirationMessage.textContent =
            error instanceof Error
                ? error.message
                : String(error);


        extendButton.disabled = false;

        extendButton.textContent =
            "Try extension again";

    }

}


/*
============================================================
Browser-based view reporting
============================================================
*/

async function reportView(videoId) {

    try {

        const response =
            await fetch(
                `${API}/view`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json",

                        "X-Viewer-Id":
                            getViewerId()
                    },

                    body: JSON.stringify({
                        id: videoId
                    })
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
                "The view API returned invalid JSON."
            );

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                `View request failed with HTTP ${response.status}.`
            );

        }


        if (viewCountElement) {

            viewCountElement.textContent =
                `${Number(result.views || 0).toLocaleString()} views`;

        }

    } catch (error) {

        /*
         * View-count failures must not interrupt playback.
         */

        console.warn(
            "Could not record video view:",
            error
        );

    }

}


function getViewerId() {

    const storageKey =
        "videoViewerId";


    let viewerId =
        localStorage.getItem(
            storageKey
        );


    if (!viewerId) {

        viewerId =
            crypto.randomUUID();


        localStorage.setItem(
            storageKey,
            viewerId
        );

    }


    return viewerId;

}


/*
============================================================
UI helpers
============================================================
*/

function showError(message) {

    if (videoSection) {

        videoSection.hidden = true;

    }


    if (messageElement) {

        messageElement.hidden = false;

        messageElement.textContent =
            `Unable to load video: ${message}`;

    }

}


function formatDetails(video) {

    const details = [];


    const duration =
        Number(
            video.duration_seconds
        );


    if (
        Number.isFinite(duration) &&
        duration > 0
    ) {

        details.push(
            formatDuration(duration)
        );

    }


    const uploaded =
        Number(
            video.upload_date
        );


    if (
        Number.isFinite(uploaded) &&
        uploaded > 0
    ) {

        details.push(
            `Uploaded ${new Date(
                uploaded * 1000
            ).toLocaleDateString()}`
        );

    }


    return details.join(" • ");

}


function formatDuration(totalSeconds) {

    const secondsValue =
        Math.max(
            0,
            Math.floor(totalSeconds)
        );


    const hours =
        Math.floor(
            secondsValue / 3600
        );


    const minutes =
        Math.floor(
            (
                secondsValue % 3600
            ) / 60
        );


    const seconds =
        secondsValue % 60;


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
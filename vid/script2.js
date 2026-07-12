const API = "https://video-worker.clip-devious-turf.workers.dev";

const fileInput = document.getElementById("videoFile");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const uploadButton = document.getElementById("uploadBtn");
const progressBar = document.getElementById("progressBar");
const statusElement = document.getElementById("status");

const MAX_UPLOAD_SIZE = 6 * 1024 * 1024 * 1024;

uploadButton.addEventListener("click", uploadVideo);

async function uploadVideo() {
    const file = fileInput.files[0];
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!file) {
        alert("Please select a video file.");
        return;
    }

    if (!title) {
        alert("Please enter a video title.");
        return;
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
        alert("The video must be larger than 0 bytes and no more than 6 GB.");
        return;
    }

    const mimeType = getMimeType(file);

    if (!mimeType) {
        alert("Only MP4 and WebM files are supported.");
        return;
    }

    uploadButton.disabled = true;
    progressBar.value = 0;
    setStatus("Reading video metadata...");

    try {
        const metadata = await getVideoMetadata(file);

        /*
         * 1. Start multipart upload
         */
        setStatus("Starting upload...");

        const upload = await fetchJson(`${API}/upload/start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                title,
                description,
                size: file.size,
                fileSize: file.size,
                mimeType,
                width: metadata.width,
                height: metadata.height,
                duration: metadata.duration
            })
        });

        const uploadId = upload.uploadId;
        const objectKey = upload.objectKey;
        const videoId = upload.videoId;
        const chunkSize = Number(upload.partSize) || 8 * 1024 * 1024;

        if (!uploadId || !objectKey) {
            throw new Error(
                "The Worker did not return an upload ID and object key."
            );
        }

        if (chunkSize < 5 * 1024 * 1024) {
            throw new Error("The multipart chunk size is too small.");
        }

        /*
         * 2. Upload every part
         */
        const totalParts = Math.ceil(file.size / chunkSize);

        for (
            let partNumber = 1, offset = 0;
            offset < file.size;
            partNumber++, offset += chunkSize
        ) {
            const chunk = file.slice(
                offset,
                Math.min(offset + chunkSize, file.size)
            );

            setStatus(`Uploading part ${partNumber} of ${totalParts}...`);

            const part = await fetchJson(`${API}/upload/part`, {
                method: "POST",
                headers: {
                    "Upload-Id": uploadId,
                    "Part-Number": String(partNumber),
                    "Object-Key": objectKey,
                    "Content-Type": "application/octet-stream",
                    Accept: "application/json"
                },
                body: chunk
            });

            if (!part.etag) {
                throw new Error(
                    `The Worker did not return an ETag for part ${partNumber}.`
                );
            }

            const uploadedBytes = Math.min(
                offset + chunk.size,
                file.size
            );

            progressBar.value = Math.round(
                (uploadedBytes / file.size) * 100
            );
        }

        /*
         * 3. Finish multipart upload
         */
        setStatus("Finalizing upload...");

        const complete = await fetchJson(`${API}/upload/finish`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                uploadId,
                objectKey
            })
        });

        progressBar.value = 100;

        const videoUrl =
            complete.url ||
            `${window.location.origin}/vid?id=${encodeURIComponent(
                complete.videoId || videoId
            )}`;

        statusElement.innerHTML = `
            Upload complete!
            <br><br>
            <a href="${escapeHtml(videoUrl)}"
               target="_blank"
               rel="noopener noreferrer">
                ${escapeHtml(videoUrl)}
            </a>
        `;
    } catch (error) {
        console.error(error);
        setStatus(`Upload failed: ${error.message}`);
    } finally {
        uploadButton.disabled = false;
    }
}

async function fetchJson(url, options) {
    let response;

    try {
        response = await fetch(url, options);
    } catch (error) {
        throw new Error(`Network request failed: ${error.message}`);
    }

    const text = await response.text();

    let data = {};

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                `${options.method || "GET"} ${new URL(url).pathname} ` +
                `returned invalid JSON (${response.status}): ` +
                text.slice(0, 200)
            );
        }
    }

    if (!response.ok || data.success === false) {
        throw new Error(
            data.error ||
            `${options.method || "GET"} ${new URL(url).pathname} ` +
            `failed with HTTP ${response.status}`
        );
    }

    return data;
}

function getMimeType(file) {
    if (file.type === "video/webm" || file.type === "video/mp4") {
        return file.type;
    }

    const name = file.name.toLowerCase();

    if (name.endsWith(".webm")) {
        return "video/webm";
    }

    if (name.endsWith(".mp4")) {
        return "video/mp4";
    }

    return "";
}

function getVideoMetadata(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        const objectUrl = URL.createObjectURL(file);

        video.preload = "metadata";

        video.onloadedmetadata = () => {
            resolve({
                width: video.videoWidth || 0,
                height: video.videoHeight || 0,
                duration: Number.isFinite(video.duration)
                    ? Math.floor(video.duration)
                    : 0
            });

            URL.revokeObjectURL(objectUrl);
        };

        video.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Unable to read the video metadata."));
        };

        video.src = objectUrl;
    });
}

function setStatus(message) {
    statusElement.textContent = message;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
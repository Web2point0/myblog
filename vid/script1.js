const API =
"https://video-worker.clip-devious-turf.workers.dev";


const fileInput =
document.getElementById("videoFile");


const uploadButton =
document.getElementById("uploadBtn");


const progressBar =
document.getElementById("progressBar");


const status =
document.getElementById("status");



uploadButton.onclick = async ()=>{


    const file =
        fileInput.files[0];


    if(!file){

        alert("Select a video first.");

        return;

    }



    if(file.size > 6442450944){

        alert(
        "Maximum video size is 6GB."
        );

        return;

    }



    const title =
        document.getElementById("title")
        .value.trim();



    const description =
        document.getElementById("description")
        .value.trim();



    if(!title){

        alert(
        "Please enter a title."
        );

        return;

    }



    status.textContent =
    "Reading video information...";



    const metadata =
        await getVideoMetadata(file);



    try{


        status.textContent =
        "Starting upload...";


        const start =
        await fetch(
            API+"/upload/start",
            {

            method:"POST",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:
            JSON.stringify({

                title,

                description,

                mimeType:
                file.type,

                fileSize:
                file.size,

                width:
                metadata.width,

                height:
                metadata.height,

                duration:
                metadata.duration

            })

            }
        );


        const upload =
        await start.json();



        if(!upload.success){

            throw new Error(
            upload.error
            );

        }



        const uploadId =
            upload.uploadId;



        const parts=[];



        const chunkSize =
        10 * 1024 * 1024; 
        //10MB chunks



        let partNumber=1;



        for(
            let offset=0;
            offset<file.size;
            offset+=chunkSize
        ){


            const chunk =
            file.slice(
                offset,
                offset+chunkSize
            );



            status.textContent =
            `Uploading part ${partNumber}...`;



            const result =
            await fetch(
                API+"/upload/part",
                {

                method:"POST",

                headers:{


                uploadId,

                partNumber:
                String(partNumber)

                },


                body:chunk

                }

            );



            const part =
            await result.json();



            parts.push({

                partNumber,

                etag:
                part.etag

            });



            progressBar.value =
            Math.round(
            ((offset+chunk.size)
            /
            file.size)
            *100
            );



            partNumber++;

        }



        status.textContent =
        "Finalizing upload...";



        const finish =
        await fetch(
        API+"/upload/finish",
        {

        method:"POST",

        headers:{
            "Content-Type":
            "application/json"
        },


        body:
        JSON.stringify({

            uploadId,

            parts

        })

        });



        const complete =
        await finish.json();



        if(!complete.success){

            throw new Error(
            complete.error
            );

        }



        status.innerHTML =

        `
        Upload Complete!
        <br><br>

        Video URL:
        <br>

        <a href="/vid?id=${complete.videoId}">
        ${location.origin}/vid?id=${complete.videoId}
        </a>

        `;



    }

    catch(error){


        console.error(error);


        status.textContent =
        "Upload failed: "
        +
        error.message;


    }



};





function getVideoMetadata(file){


return new Promise(resolve=>{


const video =
document.createElement("video");


video.preload="metadata";


video.onloadedmetadata=()=>{


resolve({

width:
video.videoWidth,


height:
video.videoHeight,


duration:
Math.floor(
video.duration
)

});


};


video.src =
URL.createObjectURL(file);



});


}

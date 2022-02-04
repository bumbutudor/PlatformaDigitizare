import React from "react";
import "react-dropzone-uploader/dist/styles.css";
import Dropzone from "react-dropzone-uploader";
import { getDroppedOrSelectedFiles } from "html5-file-selector";


const FileUpload = (props) => {
    const fileParams = ({ file, meta }) => {
        const body = new FormData();
        body.append("profile_pic", file);
        console.log(file);
        return { url: "https://httpbin.org/post", body }; // localhost
        //http://127.0.0.1:8000/get_file/
        //https://httpbin.org/post
    };

    const onFileChange = ({ meta, file }, status) => {
        console.log(file, meta, status);
    };

    const handleSubmit = (files) => {
        props.updateStore({ sourceFiles: ["saasfasf"] });
        // files.map(f => f.meta)
    }


    const getFilesFromEvent = (e) => {
        return new Promise((resolve) => {
            getDroppedOrSelectedFiles(e).then((chosenFiles) => {
                resolve(chosenFiles.map((f) => f.fileObject));
            });
        });
    };

    const selectFileInput = ({ accept, onFiles, files, getFilesFromEvent }) => {
        const textMsg =
            files.length > 0 ? "Mai selectează un fișier" : "Selectează fișierele din calculatorul tău";

        return ( <
            label className = "btn btn-danger mt-4 btn_upload" > { textMsg } <
            input style = {
                { display: "none" }
            }
            type = "file"
            accept = { accept }
            multiple onChange = {
                (e) => {
                    getFilesFromEvent(e).then((chosenFiles) => {
                        onFiles(chosenFiles);
                    });
                }
            }
            /> < /
            label >
        );
    };

    return ( <
        Dropzone onSubmit = { handleSubmit }
        onChangeStatus = { onFileChange }
        InputComponent = { selectFileInput }
        getUploadParams = { fileParams }
        getFilesFromEvent = { getFilesFromEvent }
        accept = ".jpg,.jpeg,.png,.pdf,.doc"
        maxFiles = { 5 }
        inputContent = "Trage sau click pentru a selecta fisiere"
        styles = {
            {
                dropzone: {},
            }
        }
        />
    );
};

export default FileUpload;
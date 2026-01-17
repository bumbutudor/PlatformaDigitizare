import React from "react";
import "react-dropzone-uploader/dist/styles.css";
import Dropzone from "react-dropzone-uploader";
import { getDroppedOrSelectedFiles } from "html5-file-selector";


const FileUpload = (props) => {
    const fileParams = ({ file, meta }) => {
        const body = new FormData();
        body.append("uploadedFiles", file);
        // console.log(file);
        return { url: props.getStore().api + "upload/", body }; // localhost http://127.0.0.1:8000/get_file/
    };

    const onFileChange = ({ meta, file }, status) => {
        // console.log(file, meta, status);
    };
    
    const getS3Files = (files) => {
        let allS3Files = [];
        files.forEach((f) => {
            const response = JSON.parse(f.xhr.response);
            // Check if it's a PDF response with multiple images
            if (response.isPdf && response.s3Files) {
                allS3Files = allS3Files.concat(response.s3Files);
            } else {
                allS3Files.push(response.s3File);
            }
        });
        return allS3Files;
    }

    const getSourceFileMetas = (files) => {
        let allMetas = [];
        files.forEach((f) => {
            const response = JSON.parse(f.xhr.response);
            // Check if it's a PDF response with multiple images
            if (response.isPdf && response.s3Files) {
                response.s3Files.forEach((s3File) => {
                    allMetas.push({
                        ...f.meta,
                        name: s3File.name,
                        isPdfPage: true
                    });
                });
            } else {
                allMetas.push(f.meta);
            }
        });
        return allMetas;
    }

    const handleSubmit = (files, allFiles) => {
        props.updateStore({ s3SourceFiles: getS3Files(files) });
        props.updateStore({ sourceFiles: getSourceFileMetas(files) });
        allFiles.forEach(f => f.remove())
        props.jumpToStep(1);
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

        return (<label className="btn btn-danger mt-4 btn_upload" > {textMsg}
            <input style={
                { display: "none" }
            }
                type="file"
                accept={accept}
                multiple onChange={
                    (e) => {
                        getFilesFromEvent(e).then((chosenFiles) => {
                            onFiles(chosenFiles);
                        });
                    }
                }
            /> </label>
        );
    };

    return (<
        Dropzone onSubmit={handleSubmit}
        onChangeStatus={onFileChange}
        InputComponent={selectFileInput}
        getUploadParams={fileParams}
        getFilesFromEvent={getFilesFromEvent}
        accept=".jpg,.jpeg,.png, .tiff, .tif, .pdf" // .pdf, docx
        maxFiles={5}
        inputContent="Trage sau click pentru a selecta fișiere"
        submitButtonContent="Continuă cu procesarea imaginii"
        styles={
            {
                dropzone: { height: 300, border: "2px dashed" },
            }
        }
    />
    );
};

export default FileUpload;
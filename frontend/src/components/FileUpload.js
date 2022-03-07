import React from "react";
import "react-dropzone-uploader/dist/styles.css";
import Dropzone from "react-dropzone-uploader";
import { getDroppedOrSelectedFiles } from "html5-file-selector";


const FileUpload = (props) => {
    const fileParams = ({ file, meta }) => {
        const body = new FormData();
        body.append("uploadedFiles", file);
        console.log(file);
        return { url: "http://127.0.0.1:8000/get_file/", body }; // localhost http://127.0.0.1:8000/get_file/
    };

    const onFileChange = ({ meta, file }, status) => {
        // console.log(file, meta, status);
    };

    const handleSubmit = (files, allFiles) => {
        console.log(props.get)
        props.updateStore({ sourceFiles: files.map(f => f.meta) });
        // console.log(props)
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
        accept=".jpg,.jpeg,.png,.pdf,.doc, .tiff, .tif"
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
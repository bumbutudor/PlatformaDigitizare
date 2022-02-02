import React from "react";
import "react-dropzone-uploader/dist/styles.css";
import Dropzone from "react-dropzone-uploader";
import { getDroppedOrSelectedFiles } from "html5-file-selector";

const FileUpload = () => {
  const fileParams = ({ file, meta }) => {
    const body = new FormData();
    body.append("profile_pic", file);
    return { url: "http://127.0.0.1:8000/get_file/", body }; // localhost
  };

  const onFileChange = ({ meta, file }, status) => {
    console.log(status, meta, file);
  };

  const onSubmit = (files, allFiles) => {
    allFiles.forEach((f) => f.show());
  };

  const getFilesFromEvent = (e) => {
    return new Promise((resolve) => {
      getDroppedOrSelectedFiles(e).then((chosenFiles) => {
        resolve(chosenFiles.map((f) => f.fileObject));
      });
    });
  };

  const selectFileInput = ({ accept, onFiles, files, getFilesFromEvent }) => {
    const textMsg =
      files.length > 0 ? "Mai încarcă un fișier" : "Selectează fișierele";

    return (
      <label className="btn btn-danger mt-4">
        {textMsg}
        <input
          style={{ display: "none" }}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => {
            getFilesFromEvent(e).then((chosenFiles) => {
              onFiles(chosenFiles);
            });
          }}
        />
      </label>
    );
  };

  return (
    <Dropzone
      onSubmit={onSubmit}
      onChangeStatus={onFileChange}
      InputComponent={selectFileInput}
      getUploadParams={fileParams}
      getFilesFromEvent={getFilesFromEvent}
      accept=".jpg,.jpeg,.png,.pdf,.doc"
      maxFiles={5}
      inputContent="Trage sau click pentru a selecta fisiere"
      styles={{
        dropzone: { width: 900, height: 300, overflow: "hidden" },
      }}
    />
  );
};

export default FileUpload;

import React from "react";
import "react-dropzone-uploader/dist/styles.css";
import Dropzone from "react-dropzone-uploader";
import { getDroppedOrSelectedFiles } from "html5-file-selector";

// Custom Preview component to handle PDF files with icon preview
const CustomPreview = ({ meta, fileWithMeta }) => {
    const { name, percent, status, previewUrl } = meta;
    const isPdf = name?.toLowerCase().endsWith('.pdf');
    
    // Standard PDF icon - use image from Wikimedia Commons
    const PdfIcon = () => (
        <img 
            src="https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg"
            alt="PDF"
            style={{ width: '80px', height: '80px' }}
        />
    );
    
    return (
        <div className="dzu-previewContainer" style={{ 
            padding: '8px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            margin: '4px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#f8f9fa',
            width: '130px',
            position: 'relative'
        }}>
            {/* Preview Image or PDF icon */}
            <div style={{ 
                width: '115px', 
                height: '120px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '6px',
                backgroundColor: '#fff',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid #dee2e6'
            }}>
                {isPdf ? (
                    <PdfIcon />
                ) : previewUrl ? (
                    <img 
                        src={previewUrl} 
                        alt={name}
                        style={{ 
                            maxWidth: '100%', 
                            maxHeight: '100%', 
                            objectFit: 'contain' 
                        }} 
                    />
                ) : (
                    <div style={{ color: '#6c757d', fontSize: '10px' }}>...</div>
                )}
            </div>
            
            {/* File name + status on same row */}
            <div style={{ 
                fontSize: '12px', 
                textAlign: 'center', 
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#333',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
            }} title={name}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                </span>
                {status === 'done' && <span style={{ color: '#28a745' }}>✓</span>}
                {status === 'error_upload' && <span style={{ color: '#dc3545' }}>✗</span>}
            </div>
            
            {/* Progress bar only when uploading */}
            {status === 'uploading' && (
                <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '3px', height: '4px', marginTop: '3px' }}>
                    <div style={{ 
                        width: `${percent}%`, 
                        backgroundColor: '#007bff', 
                        height: '100%',
                        borderRadius: '3px'
                    }} />
                </div>
            )}
            
            {/* Remove button - small X */}
            <button
                onClick={() => fileWithMeta.remove()}
                style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    padding: '0',
                    fontSize: '10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    lineHeight: '14px'
                }}
                title="Șterge"
            >
                ×
            </button>
        </div>
    );
};

const FileUpload = (props) => {
    const fileParams = ({ file, meta }) => {
        const body = new FormData();
        body.append("uploadedFiles", file);
        body.append("period", props.getStore().period || "secolulXX");
        // console.log(file);
        return { url: props.getStore().api + "upload/", body }; // localhost http://127.0.0.1:8000/get_file/
    };

    const onFileChange = ({ meta, file }, status) => {
        // console.log(file, meta, status);
    };
    
    const getS3Files = (files) => {
        return files.map((f) => {
            const response = JSON.parse(f.xhr.response);
            return response.s3File;
        });
    }

    const handleSubmit = (files, allFiles) => {
        const s3Files = getS3Files(files);
        const sourceFileMetas = files.map(f => {
            const response = JSON.parse(f.xhr.response);
            return {
                ...f.meta,
                isPdf: response.isPdf || false
            };
        });
        
        props.updateStore({ s3SourceFiles: s3Files });
        props.updateStore({ sourceFiles: sourceFileMetas });
        
        // Check if any file is a PDF - if so, skip preprocessing
        const hasPdf = s3Files.some(f => f.isPdf);
        if (hasPdf) {
            props.updateStore({ preprocessWith: 'None', hasPdfFiles: true });
        }
        
        allFiles.forEach(f => f.remove());
        
        // If PDF, skip to step 3 (OCR), otherwise go to step 2 (preprocessing)
        if (hasPdf) {
            // Set preprocessed files same as source for PDFs
            props.updateStore({ 
                preprocessedFiles: sourceFileMetas, 
                s3PreprocessedFiles: s3Files.map(f => f.url) 
            });
            props.jumpToStep(2); // Go directly to OCR step
        } else {
            props.jumpToStep(1); // Go to preprocessing step
        }
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
            files.length > 0 ? "Mai încarcă un fișier" : "Selectează fișierele din calculatorul tău";

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
        PreviewComponent={CustomPreview}
        getUploadParams={fileParams}
        getFilesFromEvent={getFilesFromEvent}
        accept=".jpg,.jpeg,.png, .tiff, .tif, .pdf"
        maxFiles={5}
        inputContent="Trage sau click pentru a selecta fișiere"
        submitButtonContent="Continuă"
        styles={{
            dropzone: { 
                minHeight: 200, 
                maxHeight: 350,
                border: "2px dashed #ccc",
                overflow: 'auto'
            },
            dropzoneActive: { borderColor: '#007bff' },
            inputLabel: { color: '#6c757d' },
            preview: { 
                display: 'flex', 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '10px'
            }
        }}
    />
    );
};

export default FileUpload;
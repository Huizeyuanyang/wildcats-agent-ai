import React from "react";
import axios from "axios"; // Import axios for HTTP requests
import { InboxOutlined } from "@ant-design/icons";
import { message, Upload } from "antd";

const { Dragger } = Upload;

const DOMAIN = "http://localhost:5001";

const uploadToBackend = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
    const response = await axios.post(`${DOMAIN}/upload`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response;
    } catch (error) {
        console.error("Error uploading file: ", error);
    return null;
  }
};

const attributes = {
    name: "file",
    multiple: false,
    accept: ".pdf",
    maxCount: 1, // only show the current file
    customRequest: async ({file, onSuccess, onError}) => {
        const response = await uploadToBackend(file);
        if (response && response.status === 200) {
            onSuccess(response.data);
        } else {
            onError(new Error("File upload failed"));
        }
    },
    onChange(info) {
        const { status } = info.file;
        if (status === "done") {
            message.success(`${info.file.name} file uploaded successfully.`);
        } else if (status === "error") {
            message.error(`${info.file.name} file upload failed.`);
        }
    },
};

const PdfUploader = () => {
    return (
        <Dragger {...attributes}>
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">
                Click or drag a PDF here to upload
            </p>
            <p className="ant-upload-hint">
                Only PDF files are supported. Uploading a new file replaces the current one.
            </p>
        </Dragger>
    );
};

export default PdfUploader;
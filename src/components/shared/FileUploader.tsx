import { useCallback, useState } from "react";
import { FileWithPath, useDropzone } from "react-dropzone";

import { Button } from "@/components/ui";

type FileUploaderProps = {
  fieldChange: (files: File[]) => void;
  mediaUrl: string;
};

const FileUploader = ({ fieldChange, mediaUrl }: FileUploaderProps) => {
  const [file, setFile] = useState<File[]>([]);
  const [fileUrl, setFileUrl] = useState<string>(mediaUrl);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      console.log("Files dropped:", acceptedFiles); // Debug log
      
      setFile(acceptedFiles);
      fieldChange(acceptedFiles);
      
      // Create a local preview URL for immediate display
      if (acceptedFiles && acceptedFiles.length > 0 && acceptedFiles[0]) {
        try {
          const previewUrl = URL.createObjectURL(acceptedFiles[0]);
          console.log("Preview URL created:", previewUrl); // Debug log
          setFileUrl(previewUrl);
        } catch (error) {
          console.error("Error creating preview URL:", error);
        }
      }
    },
    [fieldChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpeg", ".jpg"],
    },
    multiple: false, // Only allow single file
  });

  console.log("FileUploader render - fileUrl:", fileUrl, "isDragActive:", isDragActive); // Debug log

  return (
    <div
      {...getRootProps()}
      className="flex flex-col items-center justify-center bg-gray-800 rounded-xl cursor-pointer p-4">
      <input {...getInputProps()} className="cursor-pointer" />

      {fileUrl ? (
        <>
          <div className="flex flex-1 justify-center w-full p-5 lg:p-10">
            <img 
              src={fileUrl} 
              alt="uploaded preview" 
              className="max-w-full max-h-64 object-contain rounded-lg"
              onError={(e) => {
                console.error("Image failed to load:", fileUrl);
                setFileUrl("");
              }}
            />
          </div>
          <p className="text-gray-300 text-sm mt-2">Click or drag photo to replace</p>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          {/* Using a simple icon instead of potentially missing SVG */}
          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
            <svg width="32" height="32" fill="currentColor" className="text-gray-400">
              <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 6c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm0 20c-3.866 0-7.24-2.024-9.186-5.072C8.36 20.456 12.04 19 16 19s7.64 1.456 9.186 3.928C23.24 25.976 19.866 28 16 28z"/>
            </svg>
          </div>

          <h3 className="text-gray-200 font-medium mb-2">
            {isDragActive ? "Drop photo here" : "Drag photo here"}
          </h3>
          <p className="text-gray-400 text-sm mb-4">SVG, PNG, JPG</p>

          <Button 
            type="button" 
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Button clicked"); // Debug log
            }}
          >
            Select from your device
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
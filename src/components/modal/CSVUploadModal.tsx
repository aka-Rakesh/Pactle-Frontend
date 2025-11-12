import React, { useCallback, useRef, useState } from "react";
import { IconUpload, IconX } from "@tabler/icons-react";
import { Button } from "../ui/Button";

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void> | void;
  isUploading?: boolean;
}

const CSVUploadModal: React.FC<CSVUploadModalProps> = ({ isOpen, onClose, onUpload, isUploading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback((f: FileList | null) => {
    if (!f || f.length === 0) return;
    const picked = f[0];
    if (!picked.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a .csv file");
      return;
    }
    setError("");
    setFile(picked);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onUploadClick = useCallback(async () => {
    if (!file) {
      setError("Select a CSV file to upload");
      return;
    }
    await onUpload(file);
    setFile(null);
    onClose();
  }, [file, onUpload, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/36 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background-light rounded-lg p-4 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-dark">Upload CSV</h2>
          <button onClick={onClose} className="text-gray-light hover:text-gray-dark" aria-label="Close">
            <IconX size={20} />
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={onDrop}
          className="border-2 border-dashed border-border-dark rounded-lg p-6 bg-white text-center cursor-pointer hover:bg-background-light transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <IconUpload size={28} className="text-gray-light" />
            <p className="text-gray-dark text-sm">Drag and drop your CSV here</p>
            <p className="text-gray-light text-xs">or click to browse</p>
            {file && (
              <div className="mt-2 text-gray-dark text-sm bg-background-light px-2 py-1 rounded">{file.name}</div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <Button onClick={onUploadClick} disabled={!file || isUploading} className="flex-1">
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CSVUploadModal;



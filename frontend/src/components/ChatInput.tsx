import { useState, useRef } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string, file?: File | { filename: string; file_size: number; file_type: string }) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<{ filename: string; file_size: number; file_type: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasContent = message.trim().length > 0;

  const handleSubmit = () => {
    if (!hasContent && !file && !uploadData) return;
    onSend(message.trim(), file || undefined);
    setMessage("");
    setFile(null);
    setUploadData(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Client-side validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert("Invalid file type. Please upload a PDF, JPG, or PNG.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File is too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);
    setUploadData(null); // Reset previous upload

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload failed");
      }

      const data = await res.json();
      setUploadData(data);
    } catch (error) {
      console.error("File upload error:", error);
      alert(`File upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setFile(null); // Reset on failure
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t border-border bg-background pt-4 pb-6 px-4">
      {(file || uploadData) && (
        <div className="mb-3 flex items-center gap-2 text-xs font-medium bg-secondary/50 text-foreground w-fit px-3 py-1.5 rounded-full border border-border/50">
          <Paperclip className="h-3.5 w-3.5 text-medical-green" />
          {isUploading ? (
            <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin"/> Uploading {file?.name}...</span>
          ) : uploadData ? (
             <span className="flex items-center gap-2">
                 {uploadData.filename} 
                 <span className="text-muted-foreground font-normal">{(uploadData.file_size / 1024 / 1024).toFixed(2)} MB [{uploadData.file_type}]</span>
             </span>
          ) : (
             <span>{file?.name}</span>
          )}
          <button 
             onClick={() => { setFile(null); setUploadData(null); }} 
             className="ml-2 text-destructive hover:text-destructive/80 transition-colors"
             disabled={isUploading}
          >✕</button>
        </div>
      )}
      <div className="flex items-center gap-3 bg-card border border-border/60 shadow-sm focus-within:border-medical-green/50 focus-within:ring-2 focus-within:ring-medical-green/20 rounded-full pl-5 pr-2 py-2 transition-all">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="text-muted-foreground hover:text-medical-green transition-colors"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          placeholder="Describe symptoms here..."
          className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none py-2"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={isLoading || isUploading || (!hasContent && !file && !uploadData)}
          className={`h-10 w-10 rounded-full transition-all shadow-md flex items-center justify-center ${
            (hasContent || uploadData) ? "bg-medical-green hover:bg-medical-green/90 text-white scale-100" : "bg-secondary text-muted-foreground scale-95 opacity-80"
          }`}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
        </Button>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasContent = message.trim().length > 0;

  const handleSubmit = () => {
    if (!hasContent && !file) return;
    onSend(message.trim(), file || undefined);
    setMessage("");
    setFile(null);
  };

  return (
    <div className="border-t border-border bg-card p-4">
      {file && (
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Paperclip className="h-3 w-3" />
          <span>{file.name}</span>
          <button onClick={() => setFile(null)} className="text-destructive hover:underline">Remove</button>
        </div>
      )}
      <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="text-muted-foreground hover:text-card-foreground transition-colors"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          placeholder="Ask anything"
          className="flex-1 bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground outline-none"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={isLoading || (!hasContent && !file)}
          className={`h-8 w-8 rounded-full transition-colors ${
            hasContent ? "bg-medical-green hover:bg-medical-green/90 text-background" : "bg-muted text-muted-foreground"
          }`}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

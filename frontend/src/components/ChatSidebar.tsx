import Link from "next/link";
import { Plus, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatSession } from "@/types/chat";

interface Props {
  sessions: ChatSession[];
  activeId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
}

export function ChatSidebar({ sessions, activeId, onNewChat, onSelect }: Props) {
  return (
    <div className="w-64 h-full flex flex-col bg-background border-r border-border">
      {/* Logo */}
      <div className="px-4 py-5">
        <span className="font-display text-sm font-bold text-foreground tracking-tight">SANJEEVANI</span>
      </div>

      {/* New Chat */}
      <div className="px-3 mb-2">
        <Button onClick={onNewChat} variant="outline" className="w-full justify-start gap-2 rounded-lg text-sm">
          <Plus className="h-4 w-4" /> New Chat
        </Button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground px-2 py-2 uppercase tracking-wider">Recent Chats</p>
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
              activeId === s.id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">{s.title}</span>
          </button>
        ))}
      </div>

      {/* User */}
      <Link href="/profile" className="px-4 py-4 border-t border-border flex items-center gap-2 hover:bg-secondary/30 transition-colors">
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-xs text-muted-foreground truncate">asha worker_bora</span>
      </Link>
    </div>
  );
}

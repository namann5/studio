import { Message } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Props = {
  message: Message;
};

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-start gap-4", isUser && "justify-end")}>
      {!isUser && (
        <Avatar className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center">
            <Bot className="w-5 h-5" />
        </Avatar>
      )}

      <div className={cn("max-w-md space-y-1", isUser && "text-right")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2 whitespace-pre-wrap",
            isUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none"
          )}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </p>
      </div>

      {isUser && (
        <Avatar className="w-8 h-8">
          <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" />
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

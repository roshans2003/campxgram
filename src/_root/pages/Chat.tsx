import { useEffect, useRef, useState, useCallback } from "react";
import { databases, appwriteConfig } from "@/lib/appwrite/config";
import { ID, Permission, Role, Query } from "appwrite";
import { useUserContext } from "@/context/AuthContext";
import { Send, MessageCircle, Loader2 } from "lucide-react";

interface Message {
  $id: string;
  senderId: string;
  senderName?: string;
  text: string;
  createdAt: string;
}

const Chat = () => {
  const { user, isLoading: userLoading } = useUserContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const DATABASE_ID = appwriteConfig.databaseId;
  const COLLECTION_ID = appwriteConfig.messagesCollectionId;

  // Get user ID
  const getUserId = () => user?.id || user?.$id;

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!DATABASE_ID || !COLLECTION_ID) {
      setError("Database configuration is missing");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.orderAsc("createdAt"),
        Query.limit(100)
      ]);

      const msgs: Message[] = res.documents.map((doc: any) => ({
        $id: doc.$id,
        senderId: doc.senderId,
        senderName: doc.senderName || "Unknown User",
        text: doc.text,
        createdAt: doc.createdAt,
      }));

      setMessages(msgs);
    } catch (error: any) {
      setError(`Failed to load messages: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [DATABASE_ID, COLLECTION_ID]);

  // Send message
  const sendMessage = async () => {
    const userId = getUserId();

    if (!input.trim() || !userId || isSending) return;

    const messageText = input.trim();
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const messageData = {
        senderId: userId,
        senderName: user.name || user.username || "Anonymous",
        text: messageText,
        createdAt: new Date().toISOString(),
      };

      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        messageData,
        [Permission.read(Role.any())]
      );
      
      // Refresh messages
      setTimeout(fetchMessages, 300);
    } catch (error: any) {
      setError(`Failed to send message: ${error.message || 'Unknown error'}`);
      setInput(messageText); // Restore message
    } finally {
      setIsSending(false);
    }
  };

  // Initialize chat
  useEffect(() => {
    if (userLoading || !getUserId()) return;
    fetchMessages();
  }, [user, userLoading, fetchMessages]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Main Chat Container - Centered */}
      <div className="max-w-4xl mx-auto h-screen max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-4rem)] flex flex-col bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl">
        
        {/* Header */}
        <div className="bg-gray-800/60 border-b border-gray-700/50 px-6 py-5 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Chat Room</h1>
              <p className="text-sm text-gray-300 mt-1">
                {messages.length} message{messages.length !== 1 ? 's' : ''} • Online
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-900/30 border border-red-500/40 rounded-2xl backdrop-blur-sm">
            <div className="text-red-300 text-sm flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              {error}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 px-6 py-6 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="p-6 bg-gray-800/60 rounded-3xl mb-6 shadow-xl">
                <Loader2 className="w-16 h-16 animate-spin text-blue-400" />
              </div>
              <p className="text-gray-400 text-lg">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6">
              <div className="p-8 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-3xl mb-8 backdrop-blur-sm border border-blue-500/20 shadow-xl">
                <MessageCircle className="w-20 h-20 text-blue-400 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Welcome to Chat</h3>
              <p className="text-gray-400 text-center text-lg max-w-md leading-relaxed">
                Start a conversation! Your messages will appear here once you send your first message.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, index) => {
                const isOwn = msg.senderId === getUserId();
                const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
                
                return (
                  <div
                    key={msg.$id}
                    className={`flex gap-4 ${isOwn ? "justify-end" : "justify-start"} ${
                      !showAvatar && !isOwn ? "ml-16" : ""
                    }`}
                  >
                    {!isOwn && showAvatar && (
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                        {msg.senderName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    
                    <div className={`max-w-md lg:max-w-lg ${isOwn ? "order-first" : ""}`}>
                      {!isOwn && showAvatar && (
                        <div className="text-sm font-semibold text-gray-300 mb-2 ml-2">
                          {msg.senderName}
                        </div>
                      )}
                      
                      <div
                        className={`px-5 py-4 rounded-3xl backdrop-blur-sm border shadow-lg ${
                          isOwn
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-400/30 rounded-br-lg shadow-blue-500/20"
                            : "bg-gray-800/80 text-gray-100 border-gray-600/40 rounded-bl-lg shadow-xl"
                        }`}
                      >
                        <div className="text-base leading-relaxed">{msg.text}</div>
                        <div className={`text-xs mt-3 ${
                          isOwn ? 'text-blue-100/80' : 'text-gray-400'
                        }`}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    {isOwn && (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg">
                        {user?.name?.charAt(0)?.toUpperCase() || "Me"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-6 bg-gray-800/40 border-t border-gray-700/50 rounded-b-3xl">
          <div className="flex items-end gap-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                disabled={isSending || !getUserId()}
                className="w-full px-6 py-5 text-white placeholder-gray-400 bg-gray-700/60 border border-gray-600/50 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all duration-300 text-base shadow-lg"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isSending || !getUserId()}
              className="p-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-3xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
            >
              {isSending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </div>
          
          {/* Typing indicator */}
          <div className="mt-3 text-sm text-gray-400 h-5 px-2">
            {isSending && (
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>Sending message...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
};

export default Chat;
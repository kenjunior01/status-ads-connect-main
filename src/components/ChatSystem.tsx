import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useConversations, useMessages } from "@/hooks/useConversations";
import { supabase } from "@/integrations/supabase/client";
import { ImagePreview } from "@/components/ImagePreview";
import { 
  Send, 
  MessageSquare, 
  Search, 
  MoreVertical,
  Check,
  CheckCheck,
  Loader2,
  WifiOff,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ChatSystem = () => {
  const { toast } = useToast();
  const { conversations, loading: loadingConversations, currentUserId, refetch: refetchConversations } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { messages, loading: loadingMessages, sendMessage, uploadAttachment } = useMessages(selectedConversationId);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ url: string; type: string; name: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLength = useRef(messages.length);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Collect all images from messages for gallery navigation
  const chatImages = useMemo(() => {
    return messages
      .filter(m => m.attachment_url && m.attachment_type?.startsWith('image/'))
      .map(m => ({ url: m.attachment_url!, name: m.attachment_name || undefined }));
  }, [messages]);

  const handleImageClick = useCallback((imageUrl: string) => {
    const index = chatImages.findIndex(img => img.url === imageUrl);
    setSelectedImageIndex(index >= 0 ? index : 0);
    setImagePreviewOpen(true);
  }, [chatImages]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const updateStatus = () => setIsConnected(navigator.onLine);
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  // Presence channel for typing indicator
  useEffect(() => {
    if (!selectedConversationId || !currentUserId) return;

    const channel = supabase.channel(`presence-${selectedConversationId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUsers = Object.entries(state).filter(([key]) => key !== currentUserId);
        const isOtherTyping = otherUsers.some(([_, presences]) => 
          (presences as Array<{ typing?: boolean }>).some(p => p.typing === true)
        );
        setOtherUserTyping(isOtherTyping);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false, online_at: new Date().toISOString() });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      presenceChannelRef.current = null;
    };
  }, [selectedConversationId, currentUserId]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!presenceChannelRef.current) return;

    // Track typing state
    presenceChannelRef.current.track({ typing: true, online_at: new Date().toISOString() });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({ typing: false, online_at: new Date().toISOString() });
      }
    }, 2000);
  }, []);

  // Update typing state when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      handleTyping();
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const attachment = await uploadAttachment(file);
      setPendingAttachment(attachment);
      toast({
        title: "Arquivo pronto",
        description: "Clique em enviar para compartilhar o arquivo.",
      });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !pendingAttachment) || sending) return;

    setSending(true);
    try {
      await sendMessage(newMessage, pendingAttachment || undefined);
      setNewMessage("");
      setPendingAttachment(null);
    } finally {
      setSending(false);
    }
  };

  const removePendingAttachment = () => {
    setPendingAttachment(null);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const MessageStatus = ({ status }: { status: string }) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-primary" />;
      default:
        return null;
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.other_participant?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.campaign?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingConversations) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
    <ImagePreview 
      images={chatImages}
      initialIndex={selectedImageIndex}
      open={imagePreviewOpen}
      onOpenChange={setImagePreviewOpen}
    />
    <div className="flex h-[600px] rounded-lg border bg-card overflow-hidden">
      {/* Connection Status */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 bg-destructive text-destructive-foreground text-xs py-1 px-2 flex items-center justify-center gap-1 z-10">
          <WifiOff className="h-3 w-3" />
          Reconectando...
        </div>
      )}
      
      {/* Conversations List */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-3">Mensagens</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Nenhuma conversa encontrada
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-muted' : ''
                }`}
                onClick={() => setSelectedConversationId(conversation.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.other_participant?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conversation.other_participant?.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-medium truncate">
                        {conversation.other_participant?.display_name || 'Usuário'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(conversation.last_message_at)}
                      </span>
                    </div>
                    {conversation.campaign && (
                      <Badge variant="secondary" className="text-xs mt-1 mb-1">
                        {conversation.campaign.title}
                      </Badge>
                    )}
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message || 'Nenhuma mensagem'}
                      </p>
                      {(conversation.unread_count || 0) > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.other_participant?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedConversation.other_participant?.display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedConversation.other_participant?.display_name || 'Usuário'}
                  </p>
                  {selectedConversation.campaign && (
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.campaign.title}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhuma mensagem ainda. Comece a conversa!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.sender_id === currentUserId
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        {/* Attachment Preview */}
                        {message.attachment_url && (
                          <div className="mb-2">
                            {message.attachment_type?.startsWith('image/') ? (
                              <button
                                onClick={() => handleImageClick(message.attachment_url!)}
                                className="block cursor-zoom-in transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                              >
                                <img 
                                  src={message.attachment_url} 
                                  alt={message.attachment_name || 'Imagem'} 
                                  className="max-w-full rounded-lg max-h-48 object-cover"
                                />
                              </button>
                            ) : (
                              <a 
                                href={message.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-2 rounded-lg ${
                                  message.sender_id === currentUserId 
                                    ? 'bg-primary-foreground/10' 
                                    : 'bg-background/50'
                                }`}
                              >
                                <FileText className="h-5 w-5" />
                                <span className="text-sm truncate max-w-[150px]">
                                  {message.attachment_name || 'Arquivo'}
                                </span>
                                <Download className="h-4 w-4 ml-auto" />
                              </a>
                            )}
                          </div>
                        )}
                        
                        {message.content && !message.content.startsWith('📎') && (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          message.sender_id === currentUserId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          <span className="text-xs">{formatTime(message.created_at)}</span>
                          {message.sender_id === currentUserId && <MessageStatus status={message.status} />}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {otherUserTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2">
                        <div className="flex items-center gap-1">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">digitando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t space-y-2">
              {/* Pending Attachment Preview */}
              {pendingAttachment && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  {pendingAttachment.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm truncate flex-1">{pendingAttachment.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={removePendingAttachment}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {/* File Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </Button>
                
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                  disabled={sending || uploading}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={(!newMessage.trim() && !pendingAttachment) || sending || uploading}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Suas Mensagens</h3>
              <p className="text-muted-foreground">
                Selecione uma conversa para começar a trocar mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

// Chat Button Component
export const ChatButton = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[900px] max-w-full p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Chat</SheetTitle>
        </SheetHeader>
        <ChatSystem />
      </SheetContent>
    </Sheet>
  );
};

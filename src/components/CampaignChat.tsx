
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatProps {
  campaignId: string;
  className?: string;
}

export const CampaignChat = ({ campaignId, className }: ChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchRoomAndMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Get or create room
      const result = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('campaign_id', campaignId)
        .single();
      let room = result.data;
      const roomError = result.error;

      if (roomError && roomError.code !== 'PGRST116') throw roomError;

      if (!room) {
        // This should normally be handled by the DB trigger, 
        // but adding fallback for robustness
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('creator_id, advertiser_id')
          .eq('id', campaignId)
          .single();

        if (campaign) {
          const { data: newRoom, error: createError } = await supabase
            .from('chat_rooms')
            .insert({
              campaign_id: campaignId,
              creator_id: campaign.creator_id,
              advertiser_id: campaign.advertiser_id
            })
            .select('id')
            .single();
          
          if (createError) throw createError;
          room = newRoom;
        }
      }

      if (room) {
        setRoomId(room.id);
        
        // 2. Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', room.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
      toast({ title: 'Erro', description: 'Não foi possível carregar o chat.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [campaignId, user, toast]);

  useEffect(() => {
    fetchRoomAndMessages();

    if (!roomId) return;

    // 3. Real-time subscription
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, fetchRoomAndMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !roomId || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast({ title: 'Erro', description: 'Falha ao enviar mensagem.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center border rounded-lg bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-[450px] border rounded-lg overflow-hidden bg-background", className)}>
      <div className="bg-primary/5 p-3 border-b flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 rounded-full">
          <User className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold">Chat da Campanha</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                <div className={cn(
                  "px-3 py-2 rounded-2xl text-sm",
                  isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                )}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="p-3 border-t bg-card flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Check, 
  CheckCheck,
  MessageSquare, 
  DollarSign, 
  Target, 
  Star, 
  AlertCircle,
  Info,
  Trash2,
  Settings,
  X
} from "lucide-react";

interface Notification {
  id: string;
  type: 'message' | 'campaign' | 'payment' | 'review' | 'alert' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface NotificationsPanelProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "campaign",
    title: "Nova campanha disponível!",
    description: "Uma marca de beleza quer trabalhar com você. Orçamento: R$ 200",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  },
  {
    id: "2",
    type: "message",
    title: "Nova mensagem de Maria Beauty",
    description: "Olá! Vi que você está interessado na campanha...",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: "3",
    type: "payment",
    title: "Pagamento recebido!",
    description: "Você recebeu R$ 150,00 pela campanha 'Produto Natural'",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
  {
    id: "4",
    type: "review",
    title: "Nova avaliação recebida",
    description: "BeautyBrand avaliou você com 5 estrelas!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
  },
  {
    id: "5",
    type: "alert",
    title: "Prazo se aproximando",
    description: "A campanha 'App de Fitness' vence em 2 dias",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    read: false,
  },
  {
    id: "6",
    type: "info",
    title: "Perfil atualizado",
    description: "Suas alterações de perfil foram salvas com sucesso",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
  },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'message':
      return <MessageSquare className="h-5 w-5 text-primary" />;
    case 'campaign':
      return <Target className="h-5 w-5 text-success" />;
    case 'payment':
      return <DollarSign className="h-5 w-5 text-success" />;
    case 'review':
      return <Star className="h-5 w-5 text-warning" />;
    case 'alert':
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    case 'info':
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days === 1) return 'Ontem';
  return `${days} dias atrás`;
};

export const NotificationsPanel = ({
  notifications = mockNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationsPanelProps) => {
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = localNotifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setLocalNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    onMarkAsRead?.(id);
  };

  const handleMarkAllAsRead = () => {
    setLocalNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    onMarkAllAsRead?.();
  };

  const handleDelete = (id: string) => {
    setLocalNotifications(prev =>
      prev.filter(n => n.id !== id)
    );
    onDelete?.(id);
  };

  const filteredNotifications = localNotifications.filter(n => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !n.read;
    return n.type === activeTab;
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {unreadCount > 0 && (
              <Badge className="bg-primary">{unreadCount}</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-transparent">
              Todas
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-transparent">
              Não lidas
            </TabsTrigger>
            <TabsTrigger value="campaign" className="data-[state=active]:bg-transparent">
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="message" className="data-[state=active]:bg-transparent">
              Mensagens
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma notificação encontrada
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="absolute top-4 right-4">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Notification Button with Popover
export const NotificationButton = () => {
  const [open, setOpen] = useState(false);
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4 mr-2" />
          Notificações
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <NotificationsPanel />
      </PopoverContent>
    </Popover>
  );
};

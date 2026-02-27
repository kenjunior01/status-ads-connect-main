import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChatSystem } from "@/components/ChatSystem";
import { Badge } from "@/components/ui/badge";
import { Users, MessagesSquare } from "lucide-react";

export const CommunityHub = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Comunidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="geral">
            <TabsList>
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="dicas">Dicas</TabsTrigger>
              <TabsTrigger value="mentorias">Mentorias</TabsTrigger>
            </TabsList>
            <TabsContent value="geral">
              <Badge variant="secondary">Discussões abertas</Badge>
              <ChatSystem />
            </TabsContent>
            <TabsContent value="dicas">
              <Badge variant="secondary">Compartilhe boas práticas</Badge>
              <ChatSystem />
            </TabsContent>
            <TabsContent value="mentorias">
              <Badge variant="secondary">Conecte mentores e novatos</Badge>
              <ChatSystem />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  id?: string;
  title: string;
  image_url: string;
  link?: string | null;
  featured?: boolean;
};

export const SponsoredBannerCard = ({ id, title, image_url, link, featured }: Props) => {
  const content = (
    <Card className={`group overflow-hidden ${featured ? "border-2 border-accent/60" : ""}`}>
      <div className="relative">
        <img
          src={image_url}
          alt={title}
          loading="lazy"
          decoding="async"
          className="w-full h-40 md:h-44 object-cover"
        />
        <Badge className="absolute top-2 left-2 bg-primary/80 text-primary-foreground border-0">Patrocinado</Badge>
        {featured ? (
          <Badge className="absolute top-2 right-2 bg-accent/80 text-accent-foreground border-0">Destaque</Badge>
        ) : null}
      </div>
      <CardContent className="p-2">
        <div className="text-xs line-clamp-2">{title}</div>
      </CardContent>
    </Card>
  );
  if (link) {
    const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
      try {
        if (id) navigator.sendBeacon("/functions/v1/banner-track", new Blob([JSON.stringify({ banner_id: id, type: "click" })], { type: "application/json" }));
      } catch { /* noop */ }
    };
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        {content}
      </a>
    );
  }
  return content;
};

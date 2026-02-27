import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export const ServiceStatusBanner = () => {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const check = () => {
      const flag = localStorage.getItem("statusads_service_available");
      const unavailable = flag !== null && flag === "false";
      setOffline(unavailable);
    };
    check();
    const i = setInterval(check, 3000);
    return () => clearInterval(i);
  }, []);

  if (!offline) return null;

  return (
    <div className="w-full bg-warning/10 border-y border-warning/20 text-warning">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Serviço temporariamente indisponível</span>
        </div>
        <button
          className="text-xs underline hover:opacity-80"
          onClick={() => {
            localStorage.removeItem("statusads_service_available");
            setOffline(false);
          }}
        >
          Ocultar
        </button>
      </div>
    </div>
  );
}

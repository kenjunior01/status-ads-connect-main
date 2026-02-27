import { Card, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

type ChartPoint = { name: string } & { [key: string]: number | string };
export const MiniBarChart = ({ data, dataKey, color = "hsl(var(--primary))" }: { data: ChartPoint[]; dataKey: string; color?: string }) => {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const MiniLineChart = ({ data, dataKey, color = "hsl(var(--success))" }: { data: ChartPoint[]; dataKey: string; color?: string }) => {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

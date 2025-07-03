
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ProgressChartProps {
  analytics?: {
    totalFocusAreas: number;
    completedFocusAreas: number;
    avgProgress: number;
    recentDiaryEntries: number;
    submittedQuestionnaires: number;
    totalQuestionnaires: number;
    overdueItems: number;
  };
}

const ProgressChart = ({ analytics }: ProgressChartProps) => {
  if (!analytics) return null;

  const barData = [
    { name: 'Focus Areas', total: analytics.totalFocusAreas, completed: analytics.completedFocusAreas },
    { name: 'Questionnaires', total: analytics.totalQuestionnaires, completed: analytics.submittedQuestionnaires },
    { name: 'Diary Entries', total: analytics.recentDiaryEntries, completed: analytics.recentDiaryEntries },
  ];

  const pieData = [
    { name: 'Completed', value: analytics.completedFocusAreas, color: '#10b981' },
    { name: 'In Progress', value: analytics.totalFocusAreas - analytics.completedFocusAreas - analytics.overdueItems, color: '#3b82f6' },
    { name: 'Overdue', value: analytics.overdueItems, color: '#ef4444' },
  ];

  const chartConfig = {
    total: {
      label: "Total",
      color: "#e2e8f0",
    },
    completed: {
      label: "Completed",
      color: "#10b981",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Progress Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" name="Total" />
                <Bar dataKey="completed" fill="var(--color-completed)" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Focus Areas Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressChart;

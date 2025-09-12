"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { MoodEntry } from "@/lib/types"

const chartConfig = {
  mood: {
    label: "Mood",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

type Props = {
    data: MoodEntry[];
}

export function MoodChart({ data }: Props) {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
          top: 12
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
            domain={[0, 10]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <defs>
            <linearGradient id="fillMood" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-mood)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-mood)"
                stopOpacity={0.1}
              />
            </linearGradient>
        </defs>
        <Area
          dataKey="mood"
          type="natural"
          fill="url(#fillMood)"
          stroke="var(--color-mood)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}

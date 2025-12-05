'use client';

import React, { ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface RechartsLoaderProps {
  children: ReactNode;
}

// This component serves as a wrapper to properly load Recharts in client components
const RechartsLoader: React.FC<RechartsLoaderProps> & {
  ResponsiveContainer: typeof ResponsiveContainer;
  LineChart: typeof LineChart;
  Line: typeof Line;
  AreaChart: typeof AreaChart;
  Area: typeof Area;
  BarChart: typeof BarChart;
  Bar: typeof Bar;
  PieChart: typeof PieChart;
  Pie: typeof Pie;
  Cell: typeof Cell;
  XAxis: typeof XAxis;
  YAxis: typeof YAxis;
  CartesianGrid: typeof CartesianGrid;
  Tooltip: typeof Tooltip;
  Legend: typeof Legend;
} = ({ children }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  );
};

// Export all components as properties of the loader
RechartsLoader.ResponsiveContainer = ResponsiveContainer;
RechartsLoader.LineChart = LineChart;
RechartsLoader.Line = Line;
RechartsLoader.AreaChart = AreaChart;
RechartsLoader.Area = Area;
RechartsLoader.BarChart = BarChart;
RechartsLoader.Bar = Bar;
RechartsLoader.PieChart = PieChart;
RechartsLoader.Pie = Pie;
RechartsLoader.Cell = Cell;
RechartsLoader.XAxis = XAxis;
RechartsLoader.YAxis = YAxis;
RechartsLoader.CartesianGrid = CartesianGrid;
RechartsLoader.Tooltip = Tooltip;
RechartsLoader.Legend = Legend;

export default RechartsLoader; 
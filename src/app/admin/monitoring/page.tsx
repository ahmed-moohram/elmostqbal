'use client';

import { useState, useEffect } from 'react';
import { 
  FaChartLine, FaServer, FaDatabase, FaMemory, 
  FaTachometerAlt, FaNetworkWired, FaClock, FaCheckCircle,
  FaExclamationTriangle, FaTimesCircle, FaChartBar, FaChartPie
} from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  database: {
    connections: number;
    queries: number;
    responseTime: number;
  };
  api: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
}

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  requests: number;
  responseTime: number;
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 23,
    database: {
      connections: 8,
      queries: 3421,
      responseTime: 124
    },
    api: {
      requests: 15234,
      errors: 23,
      avgResponseTime: 187
    }
  });

  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [activeServices, setActiveServices] = useState({
    api: true,
    database: true,
    cache: true,
    cdn: true,
    auth: true,
    storage: true
  });

  useEffect(() => {
    // Generate initial performance history
    const history: PerformanceData[] = [];
    for (let i = 23; i >= 0; i--) {
      history.push({
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        cpu: Math.random() * 30 + 40,
        memory: Math.random() * 20 + 55,
        requests: Math.floor(Math.random() * 500 + 300),
        responseTime: Math.random() * 100 + 100
      });
    }
    setPerformanceHistory(history);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(100, Math.max(0, prev.memory + (Math.random() - 0.5) * 5)),
        network: Math.min(100, Math.max(0, prev.network + (Math.random() - 0.5) * 15)),
        api: {
          ...prev.api,
          requests: prev.api.requests + Math.floor(Math.random() * 10),
          avgResponseTime: Math.max(50, prev.api.avgResponseTime + (Math.random() - 0.5) * 20)
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Chart configurations
  const cpuChartData = {
    labels: performanceHistory.slice(-12).map(d => 
      new Date(d.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'CPU Usage %',
        data: performanceHistory.slice(-12).map(d => d.cpu),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const memoryChartData = {
    labels: performanceHistory.slice(-12).map(d => 
      new Date(d.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'Memory Usage %',
        data: performanceHistory.slice(-12).map(d => d.memory),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const requestsChartData = {
    labels: performanceHistory.slice(-6).map(d => 
      new Date(d.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit' })
    ),
    datasets: [
      {
        label: 'API Requests',
        data: performanceHistory.slice(-6).map(d => d.requests),
        backgroundColor: 'rgba(147, 51, 234, 0.8)'
      }
    ]
  };

  const systemHealthData = {
    labels: ['Healthy', 'Warning', 'Critical'],
    datasets: [
      {
        data: [85, 12, 3],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const getStatusColor = (value: number) => {
    if (value < 60) return 'text-green-600';
    if (value < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBg = (value: number) => {
    if (value < 60) return 'bg-green-100';
    if (value < 80) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaTachometerAlt className="text-4xl" />
              <div>
                <h1 className="text-3xl font-bold">لوحة المراقبة</h1>
                <p className="text-indigo-100 mt-1">مراقبة الأداء والنظام في الوقت الفعلي</p>
              </div>
            </div>
            
            {/* Live Status */}
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <span className="font-medium">Live Monitoring</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">CPU Usage</h3>
              <FaServer className="text-2xl text-blue-500" />
            </div>
            <div className="relative">
              <div className={`text-3xl font-bold ${getStatusColor(metrics.cpu)}`}>
                {metrics.cpu.toFixed(1)}%
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    metrics.cpu < 60 ? 'bg-green-500' :
                    metrics.cpu < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.cpu}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Memory</h3>
              <FaMemory className="text-2xl text-green-500" />
            </div>
            <div className="relative">
              <div className={`text-3xl font-bold ${getStatusColor(metrics.memory)}`}>
                {metrics.memory.toFixed(1)}%
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    metrics.memory < 60 ? 'bg-green-500' :
                    metrics.memory < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.memory}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Disk Usage</h3>
              <FaDatabase className="text-2xl text-purple-500" />
            </div>
            <div className="relative">
              <div className={`text-3xl font-bold ${getStatusColor(metrics.disk)}`}>
                {metrics.disk.toFixed(1)}%
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    metrics.disk < 60 ? 'bg-green-500' :
                    metrics.disk < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.disk}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-600 font-medium">Network</h3>
              <FaNetworkWired className="text-2xl text-orange-500" />
            </div>
            <div className="relative">
              <div className={`text-3xl font-bold ${getStatusColor(metrics.network)}`}>
                {metrics.network.toFixed(1)}%
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    metrics.network < 60 ? 'bg-green-500' :
                    metrics.network < 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics.network}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* CPU Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaChartLine className="text-blue-600" />
              CPU Usage Over Time
            </h3>
            <div className="h-64">
              <Line data={cpuChartData} options={chartOptions} />
            </div>
          </div>

          {/* Memory Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaChartLine className="text-green-600" />
              Memory Usage Over Time
            </h3>
            <div className="h-64">
              <Line data={memoryChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Services & Database Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Services */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">الخدمات النشطة</h3>
            <div className="space-y-3">
              {Object.entries(activeServices).map(([service, active]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="capitalize">{service}</span>
                  <span className={`flex items-center gap-1 ${
                    active ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {active ? <FaCheckCircle /> : <FaTimesCircle />}
                    {active ? 'نشط' : 'متوقف'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Database Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">إحصائيات قاعدة البيانات</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>الاتصالات</span>
                  <span>{metrics.database.connections}/100</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${metrics.database.connections}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">الاستعلامات</span>
                  <span className="font-semibold">{metrics.database.queries}</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">زمن الاستجابة</span>
                  <span className="font-semibold">{metrics.database.responseTime}ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">صحة النظام</h3>
            <div className="h-48">
              <Doughnut data={systemHealthData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* API Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Requests */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaChartBar className="text-purple-600" />
              API Requests (Last 6 Hours)
            </h3>
            <div className="h-64">
              <Bar data={requestsChartData} options={{ ...chartOptions, scales: { y: { beginAtZero: true, max: undefined } } }} />
            </div>
          </div>

          {/* API Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">API Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-blue-600 text-sm font-medium">Total Requests</div>
                <div className="text-2xl font-bold mt-1">{metrics.api.requests.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">+12% from yesterday</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-green-600 text-sm font-medium">Success Rate</div>
                <div className="text-2xl font-bold mt-1">
                  {((1 - metrics.api.errors / metrics.api.requests) * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Very Good</div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-yellow-600 text-sm font-medium">Avg Response</div>
                <div className="text-2xl font-bold mt-1">{metrics.api.avgResponseTime}ms</div>
                <div className="text-xs text-gray-500 mt-1">Within normal range</div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-red-600 text-sm font-medium">Errors</div>
                <div className="text-2xl font-bold mt-1">{metrics.api.errors}</div>
                <div className="text-xs text-gray-500 mt-1">0.15% error rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

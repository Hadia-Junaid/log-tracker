/** @jsx h */
import { h } from 'preact';
import { useMemo, useEffect, useState, useRef } from 'preact/hooks';
import Chart from 'chart.js/auto';
import axios from '../../../api/axios';

type ChartItem = { groupId: string; seriesId: string; value: number };
type Application = { _id: string; name: string; isActive?: boolean };
type LogActivityData = {
  data: ChartItem[];
  groups: string[];
  series: string[];
  applications: Application[];
};

const LogActivityChart = () => {
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [series, setSeries] = useState<string[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          start_time: new Date(Date.now() -  24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date().toISOString()
        };
        if (selectedApplications.length > 0 && !selectedApplications.includes('all')) {
          params.app_ids = selectedApplications.join(',');
        }

        console.log('Fetching data with params:', params);
        const response = await axios.get('/logs/activity', { params });
        const data: LogActivityData = response.data;
        console.log('Received data:', data);
        // if data.series is empty, set it to the default series
        if (data.series.length === 0) {
          data.series = ['error', 'log', 'warn', 'debug'];
        }

        setChartData(data.data);
        setGroups(data.groups);
        setSeries(data.series);
                  if (data.applications) {
                    console.log('Applications:', data.applications);
            // only set applications if they are active
            const activeApplications = data.applications.filter(app => app.isActive !== false);
            setApplications(activeApplications);
          }
                setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load log activity data');
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedApplications]);

  // Handle chart creation and updates
  useEffect(() => {
    console.log('Chart effect:', { 
      groups: groups.length, 
      series: series.length, 
      chartData: chartData.length, 
      isInitialized: isInitializedRef.current,
      hasChart: !!chartInstanceRef.current
    });
    
    if (!chartRef.current || groups.length === 0 || series.length === 0) return;

    // Group data by seriesId
    const groupedData: { [series: string]: number[] } = {};
    series.forEach((s) => {
      groupedData[s] = groups.map((g) => {
        const item = chartData.find((d) => d.groupId === g && d.seriesId === s);
        return item ? item.value : 0;
      });
    });

    const datasets = series.map((s, idx) => ({
      label: s,
      data: groupedData[s],
      borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
      backgroundColor: `hsla(${(idx * 60) % 360}, 70%, 50%, 0.2)`,
      tension: 0.3,
      fill: false
    }));

    if (!chartInstanceRef.current) {
      // Create new chart
      console.log('Creating new chart with data:', { groups, series, datasets });
      chartInstanceRef.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels: groups,
          datasets
        },
        options: {
          responsive: true,
          animation: {
            duration: 750,
            easing: 'easeInOutQuart'
          },
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Log Activity (Last 7 Days)' }
          },
          scales: {
            x: {
              title: { display: true, text: 'Hour Group' },
              ticks: { autoSkip: false }
            },
            y: {
              title: { display: true, text: 'Log Count' },
              beginAtZero: true
            }
          }
        }
      });
      isInitializedRef.current = true;
      console.log('Chart created successfully');
    } else {
      // Update existing chart
      console.log('Updating existing chart with new data:', { groups, series, datasets });
      chartInstanceRef.current.data.labels = groups;
      chartInstanceRef.current.data.datasets = datasets;
      chartInstanceRef.current.update('active');
      console.log('Chart updated successfully');
    }
  }, [chartData, groups, series]);

  const handleApplicationChange = (appId: string) => {
    if (appId === 'all') {
      // If "All logs" is selected, clear other selections
      setSelectedApplications(['all']);
    } else {
      setSelectedApplications((prev) => {
        // Remove 'all' if it exists when selecting specific apps
        const filtered = prev.filter(id => id !== 'all');
        return filtered.includes(appId) 
          ? filtered.filter((id) => id !== appId) 
          : [...filtered, appId];
      });
    }
  };

  const getAppName = (id: string) =>
    applications.find((app) => app._id === id)?.name || 'Unknown';

  if (loading && !isInitializedRef.current) return <div>Loading log activity data...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* App Filter Dropdown */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10, position: 'relative' }}>
        <button onClick={() => setShowDropdown(!showDropdown)} style={{
          padding: '8px 16px',
          borderRadius: 4,
          border: '1px solid #ccc',
          backgroundColor: '#fff',
          cursor: 'pointer'
        }}>
          {selectedApplications.length === 0 || (selectedApplications.length === 1 && selectedApplications[0] === 'all')
            ? 'All Applications'
            : selectedApplications.length === 1
              ? getAppName(selectedApplications[0])
              : `${selectedApplications.length} Applications Selected`} ▼
        </button>
        {showDropdown && (
          <div ref={dropdownRef} style={{
            position: 'absolute', top: '100%', right: 0,
            border: '1px solid #ccc', borderRadius: 4,
            backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000, minWidth: 200, maxHeight: 300, overflowY: 'auto'
          }}>
            {/* All logs option */}
            <label style={{ display: 'block', padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
              <input
                type="checkbox"
                checked={selectedApplications.includes('all') || selectedApplications.length === 0}
                onChange={() => handleApplicationChange('all')}
                style={{ marginRight: 8 }}
              />
              All logs
            </label>
            {applications.map(app => (
              <label key={app._id} style={{ display: 'block', padding: '8px 12px', borderBottom: '1px solid #eee' }}>
                <input
                  type="checkbox"
                  checked={selectedApplications.includes(app._id)}
                  onChange={() => handleApplicationChange(app._id)}
                  style={{ marginRight: 8 }}
                />
                {app.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <canvas ref={chartRef} height={300} style={{ width: '100%', minWidth: '1200px' }} />

      {/* Debug Info */}
      <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
        Debug: Groups: {groups.length}, Series: {series.length}, Data points: {chartData.length}
      </div>
    </div>
  );
};

export default LogActivityChart;

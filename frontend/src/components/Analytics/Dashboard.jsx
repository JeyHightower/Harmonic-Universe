import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './Dashboard.module.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState(new Date());
  const [realtime, setRealtime] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    let interval;

    if (realtime) {
      interval = setInterval(fetchAnalytics, 30 * 1000); // 30 seconds refresh
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realtime, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/summary?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setSummary(data.summary);
      if (!selectedMetric && Object.keys(data.summary).length > 0) {
        setSelectedMetric(Object.keys(data.summary)[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!summary || !selectedMetric) return null;

    const metric = summary[selectedMetric];
    const tags = metric.tags;

    return {
      labels: Object.keys(tags).filter(tag => tag !== 'environment'),
      datasets: [
        {
          label: selectedMetric,
          data: Object.values(tags).map(tag =>
            Object.values(tag).reduce((a, b) => a + b, 0)
          ),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
        },
      ],
    };
  };

  if (loading)
    return <div className={styles.loading}>Loading analytics...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!summary)
    return <div className={styles.empty}>No analytics data available</div>;

  const chartData = getChartData();

  return (
    <div className={styles.dashboard}>
      <h1>Analytics Dashboard</h1>

      <div className={styles.controls}>
        <div className={styles.dateRange}>
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={endDate}
            className={styles.datePicker}
          />
          <span>to</span>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={new Date()}
            className={styles.datePicker}
          />
        </div>

        <div className={styles.realtimeToggle}>
          <label>
            <input
              type="checkbox"
              checked={realtime}
              onChange={e => setRealtime(e.target.checked)}
            />
            Real-time updates
          </label>
        </div>

        <div className={styles.metricSelector}>
          <label htmlFor="metric-select">Select Metric:</label>
          <select
            id="metric-select"
            value={selectedMetric || ''}
            onChange={e => setSelectedMetric(e.target.value)}
          >
            {Object.keys(summary).map(metric => (
              <option key={metric} value={metric}>
                {metric}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedMetric && summary[selectedMetric] && (
        <div className={styles.metricDetails}>
          <h2>{selectedMetric}</h2>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <label>Total</label>
              <value>{summary[selectedMetric].total.toFixed(2)}</value>
            </div>
            <div className={styles.stat}>
              <label>Average</label>
              <value>{summary[selectedMetric].average.toFixed(2)}</value>
            </div>
            <div className={styles.stat}>
              <label>Min</label>
              <value>{summary[selectedMetric].min.toFixed(2)}</value>
            </div>
            <div className={styles.stat}>
              <label>Max</label>
              <value>{summary[selectedMetric].max.toFixed(2)}</value>
            </div>
            <div className={styles.stat}>
              <label>Count</label>
              <value>{summary[selectedMetric].count}</value>
            </div>
          </div>

          {chartData && (
            <div className={styles.chart}>
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: `${selectedMetric} Distribution`,
                    },
                  },
                }}
              />
            </div>
          )}

          <div className={styles.tags}>
            <h3>Tags Distribution</h3>
            {Object.entries(summary[selectedMetric].tags).map(
              ([tag, values]) => (
                <div key={tag} className={styles.tagGroup}>
                  <h4>{tag}</h4>
                  <div className={styles.tagValues}>
                    {Object.entries(values).map(([value, count]) => (
                      <div key={value} className={styles.tagValue}>
                        <span>{value}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

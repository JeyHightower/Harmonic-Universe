import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  clearAnalytics,
  exportAnalytics,
  fetchActivityTimeline,
  fetchAnalytics,
  fetchMetrics,
} from '../../store/slices/analyticsSlice';

const EXPORT_MESSAGE_TIMEOUT = 3000; // 3 seconds

const Dashboard = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    data,
    metrics,
    timeline,
    loading,
    error,
    export: exportState,
  } = useSelector(state => state.analytics);

  const [timeRange, setTimeRange] = useState('7d');
  const [exportFormat, setExportFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMessage, setShowExportMessage] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchAnalytics(id)).unwrap(),
        dispatch(fetchMetrics({ universeId: id, timeRange })).unwrap(),
        dispatch(fetchActivityTimeline({ universeId: id, timeRange })).unwrap(),
      ]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, [dispatch, id, timeRange]);

  useEffect(() => {
    fetchData();
    return () => {
      dispatch(clearAnalytics());
    };
  }, [dispatch, fetchData]);

  const handleExport = async () => {
    setIsExporting(true);
    setShowExportMessage(false);
    try {
      await dispatch(
        exportAnalytics({
          universeId: id,
          format: exportFormat,
        })
      ).unwrap();
      setShowExportMessage(true);
      setTimeout(() => {
        setShowExportMessage(false);
      }, EXPORT_MESSAGE_TIMEOUT);
    } catch (err) {
      console.error('Failed to export analytics:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRetry = async type => {
    switch (type) {
      case 'analytics':
        await dispatch(fetchAnalytics(id));
        break;
      case 'metrics':
        await dispatch(fetchMetrics({ universeId: id, timeRange }));
        break;
      case 'timeline':
        await dispatch(fetchActivityTimeline({ universeId: id, timeRange }));
        break;
      default:
        await fetchData();
    }
  };

  if (loading && !data && !metrics && !timeline) {
    return (
      <div className="loading-container">
        <div data-testid="loading-indicator" className="loading-spinner">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div data-testid="error-message" className="error-message">
          {error}
        </div>
        <button
          data-testid="retry-button"
          className="retry-button"
          onClick={() => handleRetry()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data && !metrics && !timeline) {
    return <div className="no-data">No analytics data available</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="dashboard-controls">
          <select
            data-testid="time-period-select"
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <div className="export-controls">
            <select
              value={exportFormat}
              onChange={e => setExportFormat(e.target.value)}
              className="format-select"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              data-testid="export-button"
              onClick={handleExport}
              disabled={isExporting || exportState.loading}
              className="btn-secondary"
            >
              {isExporting || exportState.loading ? 'Exporting...' : 'Export'}
            </button>
            <button
              data-testid="refresh-button"
              onClick={fetchData}
              className="btn-secondary"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card" data-testid="stat-card">
          <h3>Total Views</h3>
          <div className="stat-value">{metrics?.totalViews || 0}</div>
          <div className="stat-trend">
            {metrics?.viewsTrend > 0 ? '+' : ''}
            {metrics?.viewsTrend || 0}% from previous period
          </div>
        </div>

        <div className="stat-card" data-testid="stat-card">
          <h3>Active Participants</h3>
          <div className="stat-value">{metrics?.activeParticipants || 0}</div>
          <div className="stat-trend">
            {metrics?.participantsTrend > 0 ? '+' : ''}
            {metrics?.participantsTrend || 0}% from previous period
          </div>
        </div>

        <div className="stat-card" data-testid="stat-card">
          <h3>Average Session Duration</h3>
          <div className="stat-value">
            {Math.floor((metrics?.avgSessionDuration || 0) / 60)}m{' '}
            {(metrics?.avgSessionDuration || 0) % 60}s
          </div>
          <div className="stat-trend">
            {metrics?.durationTrend > 0 ? '+' : ''}
            {metrics?.durationTrend || 0}% from previous period
          </div>
        </div>

        <div className="stat-card" data-testid="stat-card">
          <h3>Engagement Rate</h3>
          <div className="stat-value">
            {((metrics?.engagementRate || 0) * 100).toFixed(1)}%
          </div>
          <div className="stat-trend">
            {metrics?.engagementTrend > 0 ? '+' : ''}
            {metrics?.engagementTrend || 0}% from previous period
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <section className="chart-section">
          <h2>Activity Over Time</h2>
          <div className="chart-container">
            <div className="activity-chart">
              {timeline?.activityData?.map((point, index) => (
                <div
                  key={index}
                  className="chart-bar"
                  style={{
                    height: `${
                      (point.value / (timeline?.maxActivity || 1)) * 100
                    }%`,
                  }}
                  title={`${point.date}: ${point.value} activities`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="chart-section">
          <h2>Participant Demographics</h2>
          <div className="chart-container">
            <div className="demographics-chart">
              {Object.entries(data?.demographics || {}).map(([key, value]) => (
                <div key={key} className="demographic-item">
                  <div className="demographic-label">{key}</div>
                  <div className="demographic-bar">
                    <div
                      className="demographic-fill"
                      style={{
                        width: `${
                          (value / (data?.totalParticipants || 1)) * 100
                        }%`,
                      }}
                    />
                    <span className="demographic-value">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="chart-section">
          <h2>Popular Features</h2>
          <div className="chart-container">
            <div className="features-chart">
              {(data?.featureUsage || []).map(feature => (
                <div key={feature.name} className="feature-item">
                  <div className="feature-label">{feature.name}</div>
                  <div className="feature-bar">
                    <div
                      className="feature-fill"
                      style={{
                        width: `${
                          (feature.count / (data?.maxFeatureUsage || 1)) * 100
                        }%`,
                      }}
                    />
                    <span className="feature-value">{feature.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-tables">
        <section className="table-section">
          <h2>Recent Activity</h2>
          <table className="activity-table" data-testid="activity-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentActivity || []).map(activity => (
                <tr key={activity.id}>
                  <td>{new Date(activity.timestamp).toLocaleString()}</td>
                  <td>{activity.user}</td>
                  <td>{activity.action}</td>
                  <td>{activity.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="table-section">
          <h2>Top Contributors</h2>
          <table className="contributors-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contributions</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {data.topContributors.map(contributor => (
                <tr key={contributor.id}>
                  <td>{contributor.username}</td>
                  <td>{contributor.contributions}</td>
                  <td>
                    {new Date(contributor.lastActive).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {showExportMessage && exportState.success && (
        <div className="success-message" data-testid="export-success">
          Export successful!
        </div>
      )}
      {exportState.error && (
        <div className="error-message" data-testid="export-error">
          Export error: {exportState.error}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

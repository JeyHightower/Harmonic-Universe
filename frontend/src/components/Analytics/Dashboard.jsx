import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  clearAnalytics,
  exportAnalytics,
  fetchAnalytics,
} from '../../store/slices/analyticsSlice';

const Dashboard = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const {
    data,
    loading,
    error,
    export: exportState,
  } = useSelector(state => state.analytics);

  const [timeRange, setTimeRange] = useState('7d');
  const [exportFormat, setExportFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    dispatch(fetchAnalytics());
    return () => {
      dispatch(clearAnalytics());
    };
  }, [dispatch]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await dispatch(
        exportAnalytics({
          universeId: id,
          format: exportFormat,
          timeRange,
        })
      ).unwrap();
    } catch (err) {
      console.error('Failed to export analytics:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading analytics...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!data) {
    return <div className="no-data">No analytics data available</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="dashboard-controls">
          <select
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
              onClick={handleExport}
              disabled={isExporting}
              className="btn-secondary"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <h3>Total Views</h3>
          <div className="stat-value">{data.totalViews}</div>
          <div className="stat-trend">
            {data.viewsTrend > 0 ? '+' : ''}
            {data.viewsTrend}% from previous period
          </div>
        </div>

        <div className="stat-card">
          <h3>Active Participants</h3>
          <div className="stat-value">{data.activeParticipants}</div>
          <div className="stat-trend">
            {data.participantsTrend > 0 ? '+' : ''}
            {data.participantsTrend}% from previous period
          </div>
        </div>

        <div className="stat-card">
          <h3>Average Session Duration</h3>
          <div className="stat-value">
            {Math.floor(data.avgSessionDuration / 60)}m{' '}
            {data.avgSessionDuration % 60}s
          </div>
          <div className="stat-trend">
            {data.durationTrend > 0 ? '+' : ''}
            {data.durationTrend}% from previous period
          </div>
        </div>

        <div className="stat-card">
          <h3>Engagement Rate</h3>
          <div className="stat-value">
            {(data.engagementRate * 100).toFixed(1)}%
          </div>
          <div className="stat-trend">
            {data.engagementTrend > 0 ? '+' : ''}
            {data.engagementTrend}% from previous period
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <section className="chart-section">
          <h2>Activity Over Time</h2>
          <div className="chart-container">
            {/* Chart component would go here */}
            <div className="activity-chart">
              {data.activityData.map((point, index) => (
                <div
                  key={index}
                  className="chart-bar"
                  style={{
                    height: `${(point.value / data.maxActivity) * 100}%`,
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
            {/* Chart component would go here */}
            <div className="demographics-chart">
              {Object.entries(data.demographics).map(([key, value]) => (
                <div key={key} className="demographic-item">
                  <div className="demographic-label">{key}</div>
                  <div className="demographic-bar">
                    <div
                      className="demographic-fill"
                      style={{
                        width: `${(value / data.totalParticipants) * 100}%`,
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
            {/* Chart component would go here */}
            <div className="features-chart">
              {data.featureUsage.map(feature => (
                <div key={feature.name} className="feature-item">
                  <div className="feature-label">{feature.name}</div>
                  <div className="feature-bar">
                    <div
                      className="feature-fill"
                      style={{
                        width: `${
                          (feature.count / data.maxFeatureUsage) * 100
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
          <table className="activity-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.map(activity => (
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

      {exportState.success && <div>Export successful!</div>}
      {exportState.error && <div>Export error: {exportState.error}</div>}
    </div>
  );
};

export default Dashboard;

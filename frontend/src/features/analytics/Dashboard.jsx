import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../analyticsSlice';
import './Dashboard.css';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { data, loading, error } = useSelector(state => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(fetchAnalytics());
  };

  if (loading) {
    return (
      <div className="loading-container" data-testid="loading-indicator">
        <div className="loading-spinner" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" data-testid="error-message">
        <p>{error}</p>
        <button onClick={handleRetry} data-testid="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="no-data" data-testid="no-data">
        <p>No analytics data available</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.features.map(f => f.count));

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <div className="dashboard-controls">
          <select
            className="time-range-select"
            data-testid="time-period-select"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <div className="export-controls">
            <select className="format-select">
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
            <button className="btn-secondary" data-testid="export-button">
              Export
            </button>
            <button className="btn-secondary" data-testid="refresh-button">
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" data-testid="stats-grid">
        <div className="stat-card" data-testid="stat-card">
          <h3>Total Views</h3>
          <div className="stat-value">{data.totalViews}</div>
          <div className="stat-trend">
            {data.trends.views >= 0 ? '+' : ''}
            {data.trends.views}% from previous period
          </div>
        </div>
        <div className="stat-card" data-testid="stat-card">
          <h3>Active Participants</h3>
          <div className="stat-value">{data.activeParticipants}</div>
          <div className="stat-trend">
            {data.trends.participants >= 0 ? '+' : ''}
            {data.trends.participants}% from previous period
          </div>
        </div>
        <div className="stat-card" data-testid="stat-card">
          <h3>Average Session Duration</h3>
          <div className="stat-value">
            {Math.floor(data.avgSessionDuration / 60)}m{' '}
            {data.avgSessionDuration % 60}s
          </div>
          <div className="stat-trend">
            {data.trends.sessionDuration}% from previous period
          </div>
        </div>
        <div className="stat-card" data-testid="stat-card">
          <h3>Engagement Rate</h3>
          <div className="stat-value">
            {(data.engagementRate * 100).toFixed(1)}%
          </div>
          <div className="stat-trend">
            {data.trends.engagement >= 0 ? '+' : ''}
            {data.trends.engagement}% from previous period
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <section
          className="chart-section"
          role="region"
          aria-label="Activity Over Time"
        >
          <h2>Activity Over Time</h2>
          <div className="chart-container">
            <div className="activity-chart">
              {data.activityData.map((activity, index) => (
                <div
                  key={index}
                  className="chart-bar"
                  style={{
                    height: `${
                      (activity.count /
                        Math.max(...data.activityData.map(a => a.count))) *
                      100
                    }%`,
                  }}
                  title={`${activity.date}: ${activity.count} activities`}
                />
              ))}
            </div>
          </div>
        </section>

        <section
          className="chart-section"
          role="region"
          aria-label="Participant Demographics"
        >
          <h2>Participant Demographics</h2>
          <div className="chart-container">
            <div className="demographics-chart">
              {Object.entries(data.demographics).map(([key, value]) => (
                <div className="demographic-item" key={key}>
                  <div
                    className="demographic-label"
                    data-testid={`demographic-label-${key}`}
                  >
                    {key}
                  </div>
                  <div className="demographic-bar">
                    <div
                      className="demographic-fill"
                      style={{ width: `${value}%` }}
                    />
                    <span
                      className="demographic-value"
                      data-testid={`demographic-value-${key}`}
                    >
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="chart-section"
          role="region"
          aria-label="Popular Features"
        >
          <h2>Popular Features</h2>
          <div className="chart-container">
            <div className="features-chart">
              {data.features.map(feature => (
                <div
                  className="feature-item"
                  key={feature.name}
                  data-testid={`feature-item-${feature.name}`}
                >
                  <div
                    className="feature-label"
                    data-testid={`feature-label-${feature.name}`}
                  >
                    {feature.name}
                  </div>
                  <div className="feature-bar">
                    <div
                      className="feature-fill"
                      style={{ width: `${(feature.count / maxCount) * 100}%` }}
                    />
                    <span
                      className="feature-value"
                      data-testid={`feature-value-${feature.name}`}
                    >
                      {feature.count}
                    </span>
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
              {data.recentActivity.map((activity, index) => (
                <tr key={index}>
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
          <table
            className="contributors-table"
            role="table"
            aria-label="Top Contributors"
          >
            <thead>
              <tr>
                <th>User</th>
                <th>Contributions</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {data.topContributors.map(contributor => (
                <tr
                  key={contributor.username}
                  data-testid={`contributor-row-${contributor.username}`}
                >
                  <td
                    data-testid={`contributor-username-${contributor.username}`}
                  >
                    {contributor.username}
                  </td>
                  <td data-testid={`contributor-count-${contributor.username}`}>
                    {contributor.contributions}
                  </td>
                  <td data-testid={`contributor-date-${contributor.username}`}>
                    {contributor.lastActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState } from 'react';

/**
 * Dashboard component for user dashboard functionality
 */
function Dashboard() {
    const [isLoaded, setIsLoaded] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Simulate loading user data
        const timer = setTimeout(() => {
            setUserData({
                username: 'user',
                projects: [],
                recentActivity: []
            });
            setIsLoaded(true);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    if (!isLoaded) {
        return (
            <div className="dashboard-loading">
                <h2>Loading dashboard...</h2>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            <div className="dashboard-content">
                <section className="dashboard-welcome">
                    <h2>Welcome to Harmonic Universe</h2>
                    <p>Start exploring the connection between music and physics.</p>
                </section>

                <section className="dashboard-projects">
                    <h3>Your Projects</h3>
                    {userData?.projects?.length ? (
                        <ul className="projects-list">
                            {userData.projects.map((project, index) => (
                                <li key={index}>{project.name}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No projects yet. Create your first project to get started!</p>
                    )}
                </section>

                <section className="dashboard-activity">
                    <h3>Recent Activity</h3>
                    {userData?.recentActivity?.length ? (
                        <ul className="activity-list">
                            {userData.recentActivity.map((activity, index) => (
                                <li key={index}>{activity.description}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No recent activity to display.</p>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Dashboard;

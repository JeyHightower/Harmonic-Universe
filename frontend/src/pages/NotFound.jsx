import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found">
      <div className="content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="home-link">
          Return to Home
        </Link>
      </div>

      <style jsx>{`
        .not-found {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          background: var(--background-color);
        }

        .content {
          padding: 2rem;
        }

        h1 {
          font-size: 6rem;
          color: var(--primary-color);
          margin: 0;
          line-height: 1;
        }

        h2 {
          font-size: 2rem;
          color: var(--text-color);
          margin: 1rem 0;
        }

        p {
          color: #666;
          margin-bottom: 2rem;
        }

        .home-link {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background-color: var(--primary-color);
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.3s;
        }

        .home-link:hover {
          background-color: #357abd;
        }
      `}</style>
    </div>
  );
}

export default NotFound;

function LoadingSpinner({ size = 'medium', color = 'primary' }) {
  const sizeClass = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  }[size];

  const colorClass = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    white: 'border-white',
  }[color];

  return (
    <div className="flex justify-center items-center">
      <div
        className={`spinner ${sizeClass} ${colorClass}`}
        style={{
          border: '4px solid transparent',
          borderTopColor: 'currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .spinner {
          border-top-width: 4px;
          border-right-width: 4px;
          border-bottom-width: 4px;
          border-left-width: 4px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;

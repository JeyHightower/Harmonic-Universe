import '../styles/Spinner.css';

function Spinner({ size = 'medium' }) {
  return (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-inner"></div>
    </div>
  );
}

export default Spinner;

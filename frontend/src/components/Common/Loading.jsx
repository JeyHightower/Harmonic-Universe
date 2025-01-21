import styles from './Loading.module.css';

const Loading = ({ text = 'Loading...' }) => {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <p className={styles.text}>{text}</p>
    </div>
  );
};

export default Loading;

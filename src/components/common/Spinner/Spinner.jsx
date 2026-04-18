import './Spinner.css';
const Spinner = ({ size = 'md', text, fullPage }) => (
  <div className={`spinner-wrap ${fullPage ? 'spinner-wrap--full' : ''}`}>
    <div className={`spinner spinner--${size}`} />
    {text && <p className="spinner__text">{text}</p>}
  </div>
);
export default Spinner;

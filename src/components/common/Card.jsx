import './Card.css';
const Card = ({ children, className = '', padding = 'md', shadow = true }) => (
  <div className={`card card--p${padding} ${shadow ? 'card--shadow' : ''} ${className}`}>{children}</div>
);
export default Card;

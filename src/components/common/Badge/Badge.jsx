import './Badge.css';
const Badge = ({ label, variant = 'default', size = 'md' }) => (
  <span className={`badge badge--${variant} badge--${size}`}>{label}</span>
);
export default Badge;

import './Button.css';

const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, fullWidth,
  className = '', type = 'button', ...props
}) => {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    loading ? 'btn--loading' : '',
    fullWidth ? 'btn--full' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading ? <span className="btn__spinner" /> : icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;

import './Input.css';

const Input = ({
  label, name, type = 'text', value, onChange, placeholder,
  error, required, disabled, icon, rightElement, hint, className = '', ...props
}) => {
  return (
    <div className={`input-field ${error ? 'input-field--error' : ''} ${className}`}>
      {label && (
        <label className="input-field__label" htmlFor={name}>
          {label}{required && <span className="input-field__required">*</span>}
        </label>
      )}
      <div className="input-field__wrapper">
        {icon && <span className="input-field__icon">{icon}</span>}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field__control ${icon ? 'input-field__control--icon' : ''} ${rightElement ? 'input-field__control--right' : ''}`}
          {...props}
        />
        {rightElement && <div className="input-field__right">{rightElement}</div>}
      </div>
      {hint && !error && <p className="input-field__hint">{hint}</p>}
      {error && <p className="input-field__error">{error}</p>}
    </div>
  );
};

export default Input;

import './Select.css';

const Select = ({ label, name, value, onChange, options = [], error, required, disabled, placeholder, className = '' }) => {
  return (
    <div className={`select-field ${error ? 'select-field--error' : ''} ${className}`}>
      {label && (
        <label className="select-field__label" htmlFor={name}>
          {label}{required && <span className="select-field__required">*</span>}
        </label>
      )}
      <select id={name} name={name} value={value} onChange={onChange} disabled={disabled} className="select-field__control">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="select-field__error">{error}</p>}
    </div>
  );
};

export default Select;

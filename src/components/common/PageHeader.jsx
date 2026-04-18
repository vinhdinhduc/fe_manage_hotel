import './PageHeader.css';
const PageHeader = ({ title, subtitle, actions, icon }) => (
  <div className="page-header">
    <div className="page-header__text">
      <div className="page-header__title-row">
        {icon && <span className="page-header__icon">{icon}</span>}
        <h1 className="page-header__title">{title}</h1>
      </div>
      {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="page-header__actions">{actions}</div>}
  </div>
);
export default PageHeader;

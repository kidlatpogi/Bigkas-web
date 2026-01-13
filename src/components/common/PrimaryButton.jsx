import './PrimaryButton.css';

/**
 * Primary Button Component
 * Reusable button with variants
 */
function PrimaryButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  type = 'button',
  className = '',
  ...props 
}) {
  const classNames = [
    'primary-btn',
    `primary-btn-${variant}`,
    `primary-btn-${size}`,
    disabled ? 'primary-btn-disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default PrimaryButton;

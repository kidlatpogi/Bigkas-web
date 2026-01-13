import './Typography.css';

/**
 * Typography Components
 * Consistent text styling
 */

export function Heading({ 
  level = 1, 
  children, 
  className = '',
  ...props 
}) {
  const Tag = `h${level}`;
  const classNames = ['heading', `heading-${level}`, className].filter(Boolean).join(' ');
  
  return (
    <Tag className={classNames} {...props}>
      {children}
    </Tag>
  );
}

export function Text({ 
  variant = 'body', 
  color = 'primary',
  children, 
  className = '',
  as = 'p',
  ...props 
}) {
  const Tag = as;
  const classNames = [
    'text',
    `text-${variant}`,
    `text-color-${color}`,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <Tag className={classNames} {...props}>
      {children}
    </Tag>
  );
}

export function Label({ 
  children, 
  htmlFor,
  required = false,
  className = '',
  ...props 
}) {
  const classNames = ['label', className].filter(Boolean).join(' ');
  
  return (
    <label className={classNames} htmlFor={htmlFor} {...props}>
      {children}
      {required && <span className="label-required">*</span>}
    </label>
  );
}

// Default export for convenience
const Typography = { Heading, Text, Label };
export default Typography;

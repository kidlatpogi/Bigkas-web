import './Card.css';

/**
 * Card Component
 * Reusable card container
 */
function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  ...props 
}) {
  const classNames = [
    'card',
    `card-${variant}`,
    `card-padding-${padding}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

export default Card;

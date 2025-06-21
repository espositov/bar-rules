import React from 'react';

function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  ...props 
}) {
  const baseClasses = 'rounded-xl border transition-all duration-200';
  
  const variants = {
    default: 'bg-white border-gray-200 shadow-sm',
    elevated: 'bg-white border-gray-200 shadow-lg',
    gradient: 'bg-white/90 backdrop-blur-lg border-white/20 shadow-lg',
    colored: 'bg-gradient-to-br border-transparent shadow-md'
  };
  
  const paddings = {
    none: '',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-6'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export default Card;
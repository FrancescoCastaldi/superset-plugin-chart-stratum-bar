import React, { useState } from 'react';

interface ControlAccordionProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const ControlAccordion: React.FC<ControlAccordionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`control-accordion ${isOpen ? 'open' : 'closed'}`}>
      <button
        type="button"
        className="accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="accordion-title-wrap">
          {icon && <span className="accordion-icon">{icon}</span>}
          <span className="accordion-title">{title}</span>
        </span>
        <span className="accordion-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && <div className="accordion-body">{children}</div>}
    </div>
  );
};

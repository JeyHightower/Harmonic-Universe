import PropTypes from 'prop-types';
import React, { useState } from 'react';
import '../styles/Tooltip.css';

const Tooltip = ({ content, position = 'top', children, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className={`tooltip-container ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`tooltip tooltip-${position}`}>
                    {content}
                </div>
            )}
        </div>
    );
};

Tooltip.propTypes = {
    content: PropTypes.node.isRequired,
    position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Tooltip;

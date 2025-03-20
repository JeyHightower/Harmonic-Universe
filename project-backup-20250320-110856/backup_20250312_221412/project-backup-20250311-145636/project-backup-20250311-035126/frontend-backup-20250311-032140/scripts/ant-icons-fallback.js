// Fallback script for Ant Design Icons
console.log("Using Ant Icons fallback script");

// Create minimal mock implementations
window.__ANT_ICONS_VERSION__ = "4.2.1";

// Basic mock icon components
if (window.React) {
    const createIcon = (name) => {
        const IconComponent = (props) => {
            const { className, style, ...restProps } = props;
            return window.React.createElement('span', {
                className: `anticon anticon-${name} ${className || ''}`,
                style: { ...style },
                ...restProps
            });
        };
        IconComponent.displayName = `${name}Icon`;
        return IconComponent;
    };

    // Create common icons
    window.AntIcons = {
        CloseOutlined: createIcon('close'),
        CheckOutlined: createIcon('check'),
        LoadingOutlined: createIcon('loading'),
        SearchOutlined: createIcon('search'),
        UserOutlined: createIcon('user'),
        SettingOutlined: createIcon('setting'),
        MenuOutlined: createIcon('menu'),
        HomeOutlined: createIcon('home'),
        DashboardOutlined: createIcon('dashboard'),
        PlusOutlined: createIcon('plus'),
        EditOutlined: createIcon('edit'),
        DeleteOutlined: createIcon('delete'),
        InfoCircleOutlined: createIcon('info-circle'),
        ExclamationCircleOutlined: createIcon('exclamation-circle'),
        QuestionCircleOutlined: createIcon('question-circle'),
        DownOutlined: createIcon('down'),
        UpOutlined: createIcon('up'),
        LeftOutlined: createIcon('left'),
        RightOutlined: createIcon('right')
    };

    console.log("Created fallback icon components");
}

// Safety code to ensure context is available
function createSafeContext(React) {
    try {
        return (React && React.createContext) ? React.createContext({}) : {
            Provider: function (props) { return props.children; },
            Consumer: function (props) { return props.children({}); }
        };
    } catch (e) {
        console.error("Error creating context:", e);
        return {
            Provider: function (props) { return props.children; },
            Consumer: function (props) { return props.children({}); }
        };
    }
}

// Export context if needed
if (window.React) {
    window.IconContext = createSafeContext(window.React);
}

console.log("Ant Icons fallback script loaded successfully");

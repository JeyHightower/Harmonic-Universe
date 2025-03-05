// Fallback Ant Icons implementation
console.log("Using fallback ant-icons.js");

// Prevent errors by providing mock objects
window.__ANT_ICONS_VERSION__ = "4.2.1";

// Create a mock context
const IconContext = {
    Provider: function (props) { return props.children; },
    Consumer: function (props) { return props.children({}); }
};

// Make available globally
window.IconContext = IconContext;

// Add global exports that match what React code expects
if (typeof exports !== 'undefined') {
    exports.IconContext = IconContext;
    exports.default = { IconContext };
}

// Add a mock for common icons
const createIconMock = function (name) {
    return function (props) {
        // Support both React and preact
        const createElement = window.React ? window.React.createElement : (window.h || function () { });
        return createElement('span', {
            role: 'img',
            'aria-label': name,
            className: `anticon anticon-${name.toLowerCase()} ${props && props.className || ''}`,
            style: props && props.style || {}
        });
    };
};

// Create common icon mocks
window.AntIcons = {
    CloseOutlined: createIconMock('close'),
    CheckOutlined: createIconMock('check'),
    LoadingOutlined: createIconMock('loading'),
    DeleteOutlined: createIconMock('delete'),
    EditOutlined: createIconMock('edit'),
    SearchOutlined: createIconMock('search'),
    UserOutlined: createIconMock('user'),
    HomeOutlined: createIconMock('home'),
    MailOutlined: createIconMock('mail'),
    PhoneOutlined: createIconMock('phone'),
    PlusOutlined: createIconMock('plus'),
    MinusOutlined: createIconMock('minus')
};

// Make common icons globally available
Object.assign(window, window.AntIcons);

// This is a simple test script to verify that our Ant Design icon implementation works
console.log('Testing Ant Design icon imports...');

try {
    // Try to import the icons
    const icons = require('@ant-design/icons');
    console.log('Successfully imported @ant-design/icons');
    console.log('Available exports:', Object.keys(icons));

    // Test specific icons
    const iconNames = [
        'UserOutlined',
        'SettingOutlined',
        'EyeInvisibleOutlined',
        'PaperClipOutlined'
    ];

    iconNames.forEach(iconName => {
        if (icons[iconName]) {
            console.log(`✅ Icon ${iconName} is available`);
        } else {
            console.error(`❌ Icon ${iconName} is NOT available`);
        }
    });

    // Test createFromIconfontCN
    if (typeof icons.createFromIconfontCN === 'function') {
        console.log('✅ createFromIconfontCN is available');
    } else {
        console.error('❌ createFromIconfontCN is NOT available');
    }

} catch (error) {
    console.error('Error importing @ant-design/icons:', error);
}

// Try to import specific icons directly
try {
    const { UserOutlined } = require('@ant-design/icons');
    console.log('Successfully imported UserOutlined directly');
} catch (error) {
    console.error('Error importing UserOutlined directly:', error);
}

// Try to import the Context
try {
    const Context = require('@ant-design/icons/es/components/Context');
    console.log('Successfully imported Context');
} catch (error) {
    console.error('Error importing Context:', error);
}

console.log('Icon import test completed');

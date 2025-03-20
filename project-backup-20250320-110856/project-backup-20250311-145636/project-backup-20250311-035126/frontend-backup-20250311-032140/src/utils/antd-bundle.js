// This file explicitly exports the antd components needed by the application
// instead of importing the entire library
import {
    ConfigProvider, theme, Modal, Form, Input, InputNumber, Select,
    Button, Card, Empty, Spin, Tabs, Col, Row, Space, Image, Tag,
    Typography, App as AntApp, Dropdown, Menu, Slider, Popconfirm,
    Table, message, Result
} from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';

// Export all components
export {
    ConfigProvider,
    theme,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Button,
    Card,
    Empty,
    Spin,
    Tabs,
    Col,
    Row,
    Space,
    Image,
    Tag,
    Typography,
    AntApp,
    Dropdown,
    Menu,
    Slider,
    Popconfirm,
    Table,
    message,
    Result,
    UserOutlined,
    SettingOutlined
};

// Default export for convenience
const antd = {
    ConfigProvider,
    theme,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    Button,
    Card,
    Empty,
    Spin,
    Tabs,
    Col,
    Row,
    Space,
    Image,
    Tag,
    Typography,
    App: AntApp,
    Dropdown,
    Menu,
    Slider,
    Popconfirm,
    Table,
    message,
    Result,
    UserOutlined,
    SettingOutlined
};

export default antd;

// This file explicitly exports the antd components needed by the application
// instead of importing the entire library
import { SettingOutlined, UserOutlined } from '@ant-design/icons';
import {
    App as AntApp,
    Button, Card,
    Col,
    ConfigProvider,
    Dropdown,
    Empty,
    Form,
    Image,
    Input, InputNumber,
    Menu,
    message,
    Modal,
    Popconfirm,
    Result,
    Row,
    Select,
    Slider,
    Space,
    Spin,
    Table,
    Tabs,
    Tag,
    theme,
    Typography
} from 'antd';

// Export all components
export {
    AntApp, Button,
    Card, Col, ConfigProvider, Dropdown, Empty, Form, Image, Input,
    InputNumber, Menu, message, Modal, Popconfirm, Result, Row, Select, SettingOutlined, Slider, Space, Spin, Table, Tabs, Tag, theme, Typography, UserOutlined
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

import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import IconContext from './es/components/Context';

// Add debug log with a unique identifier
console.log('==== ICONS.JSX IS BEING LOADED ====');
console.log('Loading the main Icons.jsx file');

// Basic Icon component with enhanced debugging
const Icon = props => {
  const { 'data-icon-name': iconName, ...restProps } = props;

  // Add logging for successful icon creation
  useEffect(() => {
    if (iconName) {
      console.log(`Successfully imported ${iconName} icon:`, Icon);
    }
  }, [iconName]);

  return <span className="anticon" {...restProps} />;
};

// Add methods expected by Ant Design
Icon.getTwoToneColor = () => '#1890ff';
Icon.setTwoToneColor = () => { };
Icon.Context = IconContext;

// IMPORTANT: Use lowercase 'propTypes' (not 'PropTypes') for React component prop validation
// This is a React standard and using uppercase 'PropTypes' will trigger warnings
Icon.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
  'data-icon-name': PropTypes.string,
};

// Create a function to generate icon components
function createIconComponent(displayName) {
  const IconComponent = React.forwardRef((props, ref) => {
    return <Icon {...props} ref={ref} data-icon-name={displayName} />;
  });
  IconComponent.displayName = displayName;

  // IMPORTANT: Always use lowercase 'propTypes' (not 'PropTypes') for React component prop validation
  IconComponent.propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
  };

  return IconComponent;
}

// Create a cache to avoid recreating the same icon components
const iconCache = new Map();

// Function to get or create an icon component
function getIconComponent(displayName) {
  if (!iconCache.has(displayName)) {
    iconCache.set(displayName, createIconComponent(displayName));
  }
  return iconCache.get(displayName);
}

// Create icon components with display names
export const AccountBookFilled = getIconComponent('AccountBookFilled');
export const AccountBookOutlined = getIconComponent('AccountBookOutlined');
export const AccountBookTwoTone = getIconComponent('AccountBookTwoTone');
export const AlertFilled = getIconComponent('AlertFilled');
export const AlertOutlined = getIconComponent('AlertOutlined');
export const AlertTwoTone = getIconComponent('AlertTwoTone');
export const AlibabaOutlined = getIconComponent('AlibabaOutlined');
export const AlignCenterOutlined = getIconComponent('AlignCenterOutlined');
export const AlignLeftOutlined = getIconComponent('AlignLeftOutlined');
export const AlignRightOutlined = getIconComponent('AlignRightOutlined');
export const AliwangwangFilled = getIconComponent('AliwangwangFilled');
export const AliwangwangOutlined = getIconComponent('AliwangwangOutlined');
export const AmazonOutlined = getIconComponent('AmazonOutlined');
export const AndroidFilled = getIconComponent('AndroidFilled');
export const AndroidOutlined = getIconComponent('AndroidOutlined');
export const AntCloudOutlined = getIconComponent('AntCloudOutlined');
export const AntDesignOutlined = getIconComponent('AntDesignOutlined');
export const ApartmentOutlined = getIconComponent('ApartmentOutlined');
export const ApiFilled = getIconComponent('ApiFilled');
export const ApiOutlined = getIconComponent('ApiOutlined');
export const ApiTwoTone = getIconComponent('ApiTwoTone');
export const AppleFilled = getIconComponent('AppleFilled');
export const AppleOutlined = getIconComponent('AppleOutlined');
export const AppstoreAddOutlined = getIconComponent('AppstoreAddOutlined');
export const AppstoreFilled = getIconComponent('AppstoreFilled');
export const AppstoreOutlined = getIconComponent('AppstoreOutlined');
export const AppstoreTwoTone = getIconComponent('AppstoreTwoTone');
export const AreaChartOutlined = getIconComponent('AreaChartOutlined');
export const ArrowDownOutlined = getIconComponent('ArrowDownOutlined');
export const ArrowLeftOutlined = getIconComponent('ArrowLeftOutlined');
export const ArrowRightOutlined = getIconComponent('ArrowRightOutlined');
export const ArrowUpOutlined = getIconComponent('ArrowUpOutlined');
export const AuditOutlined = getIconComponent('AuditOutlined');
export const AudioFilled = getIconComponent('AudioFilled');
export const AudioMutedOutlined = getIconComponent('AudioMutedOutlined');
export const AudioOutlined = getIconComponent('AudioOutlined');
export const AudioTwoTone = getIconComponent('AudioTwoTone');
export const BarcodeOutlined = getIconComponent('BarcodeOutlined');
export const BugFilled = getIconComponent('BugFilled');
export const CalendarOutlined = getIconComponent('CalendarOutlined');
export const CaretDownFilled = getIconComponent('CaretDownFilled');
export const CaretDownOutlined = getIconComponent('CaretDownOutlined');
export const CaretRightOutlined = getIconComponent('CaretRightOutlined');
export const CaretUpOutlined = getIconComponent('CaretUpOutlined');
export const CarryOutTwoTone = getIconComponent('CarryOutTwoTone');
export const CheckCircleFilled = getIconComponent('CheckCircleFilled');
export const CheckCircleOutlined = getIconComponent('CheckCircleOutlined');
export const CheckCircleTwoTone = getIconComponent('CheckCircleTwoTone');
export const CheckOutlined = getIconComponent('CheckOutlined');
export const CheckSquareFilled = getIconComponent('CheckSquareFilled');
export const CheckSquareOutlined = getIconComponent('CheckSquareOutlined');
export const CheckSquareTwoTone = getIconComponent('CheckSquareTwoTone');
export const ClockCircleOutlined = getIconComponent('ClockCircleOutlined');
export const ClockCircleTwoTone = getIconComponent('ClockCircleTwoTone');
export const CloseCircleFilled = getIconComponent('CloseCircleFilled');
export const CloseCircleOutlined = getIconComponent('CloseCircleOutlined');
export const CloseCircleTwoTone = getIconComponent('CloseCircleTwoTone');
export const CloseOutlined = getIconComponent('CloseOutlined');
export const CloseSquareFilled = getIconComponent('CloseSquareFilled');
export const CloseSquareOutlined = getIconComponent('CloseSquareOutlined');
export const CloseSquareTwoTone = getIconComponent('CloseSquareTwoTone');
export const CloudDownloadOutlined = getIconComponent('CloudDownloadOutlined');
export const CloudUploadOutlined = getIconComponent('CloudUploadOutlined');
export const ClusterOutlined = getIconComponent('ClusterOutlined');
export const CopyOutlined = getIconComponent('CopyOutlined');
export const DeleteOutlined = getIconComponent('DeleteOutlined');
export const DeleteRowOutlined = getIconComponent('DeleteRowOutlined');
export const DiffOutlined = getIconComponent('DiffOutlined');
export const DislikeOutlined = getIconComponent('DislikeOutlined');
export const DollarCircleOutlined = getIconComponent('DollarCircleOutlined');
export const DoubleLeftOutlined = getIconComponent('DoubleLeftOutlined');
export const DoubleRightOutlined = getIconComponent('DoubleRightOutlined');
export const DownloadOutlined = getIconComponent('DownloadOutlined');
export const DribbbleOutlined = getIconComponent('DribbbleOutlined');
export const EditOutlined = getIconComponent('EditOutlined');
export const EllipsisOutlined = getIconComponent('EllipsisOutlined');
export const EnterOutlined = getIconComponent('EnterOutlined');
export const EyeInvisibleOutlined = getIconComponent('EyeInvisibleOutlined');
export const EyeOutlined = getIconComponent('EyeOutlined');
export const FileDoneOutlined = getIconComponent('FileDoneOutlined');
export const FileExclamationTwoTone = getIconComponent(
  'FileExclamationTwoTone'
);
export const FileJpgOutlined = getIconComponent('FileJpgOutlined');
export const FileOutlined = getIconComponent('FileOutlined');
export const FileProtectOutlined = getIconComponent('FileProtectOutlined');
export const FileSearchOutlined = getIconComponent('FileSearchOutlined');
export const FileTextOutlined = getIconComponent('FileTextOutlined');
export const FileTwoTone = getIconComponent('FileTwoTone');
export const FileZipTwoTone = getIconComponent('FileZipTwoTone');
export const FilterFilled = getIconComponent('FilterFilled');
export const FolderOpenOutlined = getIconComponent('FolderOpenOutlined');
export const FolderOutlined = getIconComponent('FolderOutlined');
export const FrownTwoTone = getIconComponent('FrownTwoTone');
export const FullscreenExitOutlined = getIconComponent(
  'FullscreenExitOutlined'
);
export const GitlabOutlined = getIconComponent('GitlabOutlined');
export const GooglePlusCircleFilled = getIconComponent(
  'GooglePlusCircleFilled'
);
export const GroupOutlined = getIconComponent('GroupOutlined');
export const HistoryOutlined = getIconComponent('HistoryOutlined');
export const HolderOutlined = getIconComponent('HolderOutlined');
export const HourglassTwoTone = getIconComponent('HourglassTwoTone');
export const IeCircleFilled = getIconComponent('IeCircleFilled');
export const InfoCircleOutlined = getIconComponent('InfoCircleOutlined');
export const LoadingOutlined = getIconComponent('LoadingOutlined');
export const MacCommandOutlined = getIconComponent('MacCommandOutlined');
export const MehTwoTone = getIconComponent('MehTwoTone');
export const MergeCellsOutlined = getIconComponent('MergeCellsOutlined');
export const MessageOutlined = getIconComponent('MessageOutlined');
export const MinusSquareOutlined = getIconComponent('MinusSquareOutlined');
export const PaperClipOutlined = getIconComponent('PaperClipOutlined');
export const PauseOutlined = getIconComponent('PauseOutlined');
export const PictureTwoTone = getIconComponent('PictureTwoTone');
export const PinterestFilled = getIconComponent('PinterestFilled');
export const PlayCircleOutlined = getIconComponent('PlayCircleOutlined');
export const PlusOutlined = getIconComponent('PlusOutlined');
export const PlusSquareOutlined = getIconComponent('PlusSquareOutlined');
export const PushpinTwoTone = getIconComponent('PushpinTwoTone');
export const QuestionCircleOutlined = getIconComponent(
  'QuestionCircleOutlined'
);
export const ReloadOutlined = getIconComponent('ReloadOutlined');
export const RobotOutlined = getIconComponent('RobotOutlined');
export const RotateLeftOutlined = getIconComponent('RotateLeftOutlined');
export const RotateRightOutlined = getIconComponent('RotateRightOutlined');
export const SafetyCertificateTwoTone = getIconComponent(
  'SafetyCertificateTwoTone'
);
export const SettingOutlined = getIconComponent('SettingOutlined');
export const ShopFilled = getIconComponent('ShopFilled');
export const ShoppingCartOutlined = getIconComponent('ShoppingCartOutlined');
export const SmileTwoTone = getIconComponent('SmileTwoTone');
export const SolutionOutlined = getIconComponent('SolutionOutlined');
export const SoundOutlined = getIconComponent('SoundOutlined');
console.log('SoundOutlined icon exported:', SoundOutlined);
export const StarFilled = getIconComponent('StarFilled');
export const SwapOutlined = getIconComponent('SwapOutlined');
export const SwapRightOutlined = getIconComponent('SwapRightOutlined');
export const SyncOutlined = getIconComponent('SyncOutlined');
export const TikTokFilled = getIconComponent('TikTokFilled');
export const TikTokOutlined = getIconComponent('TikTokOutlined');
export const ToolTwoTone = getIconComponent('ToolTwoTone');
export const TrademarkOutlined = getIconComponent('TrademarkOutlined');
export const TruckOutlined = getIconComponent('TruckOutlined');
export const TwitchFilled = getIconComponent('TwitchFilled');
export const UngroupOutlined = getIconComponent('UngroupOutlined');
export const UnlockTwoTone = getIconComponent('UnlockTwoTone');
export const UpOutlined = getIconComponent('UpOutlined');
export const UserAddOutlined = getIconComponent('UserAddOutlined');
export const UserOutlined = getIconComponent('UserOutlined');
export const UserSwitchOutlined = getIconComponent('UserSwitchOutlined');
export const WalletFilled = getIconComponent('WalletFilled');
export const WalletOutlined = getIconComponent('WalletOutlined');
export const WalletTwoTone = getIconComponent('WalletTwoTone');
export const WarningFilled = getIconComponent('WarningFilled');
export const WarningOutlined = getIconComponent('WarningOutlined');
export const WarningTwoTone = getIconComponent('WarningTwoTone');
export const WechatFilled = getIconComponent('WechatFilled');
export const WechatOutlined = getIconComponent('WechatOutlined');
export const WeiboCircleFilled = getIconComponent('WeiboCircleFilled');
export const WeiboCircleOutlined = getIconComponent('WeiboCircleOutlined');
export const WeiboOutlined = getIconComponent('WeiboOutlined');
export const WeiboSquareFilled = getIconComponent('WeiboSquareFilled');
export const WeiboSquareOutlined = getIconComponent('WeiboSquareOutlined');
export const WhatsAppOutlined = getIconComponent('WhatsAppOutlined');
export const WifiOutlined = getIconComponent('WifiOutlined');
export const WindowsFilled = getIconComponent('WindowsFilled');
export const WindowsOutlined = getIconComponent('WindowsOutlined');
export const WomanOutlined = getIconComponent('WomanOutlined');
export const XFilled = getIconComponent('XFilled');
export const YahooFilled = getIconComponent('YahooFilled');
export const YahooOutlined = getIconComponent('YahooOutlined');
export const YuqueOutlined = getIconComponent('YuqueOutlined');
export const ZhihuOutlined = getIconComponent('ZhihuOutlined');
export const ZoomInOutlined = getIconComponent('ZoomInOutlined');
export const ZoomOutOutlined = getIconComponent('ZoomOutOutlined');

// Create icon font generator
function createFromIconfontCN(options = {}) {
  const IconFont = React.forwardRef((props, ref) => {
    // Use options in the component to avoid the unused variable warning
    const iconProps = {
      ...props,
      // Apply any options from the configuration
      'data-options': JSON.stringify(options),
    };
    return <Icon {...iconProps} ref={ref} />;
  });

  IconFont.displayName = 'IconFont';
  return IconFont;
}

// Create a proxy to handle any requested icon
const handler = {
  get(target, prop) {
    // If we have the component, return it
    if (prop in target) {
      return target[prop];
    }

    // For any other icon name that follows the naming convention, create it on demand
    if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
      return getIconComponent(prop);
    }

    // Return undefined for everything else
    return undefined;
  },
};

// Create a proxied version of Icon that dynamically creates icon components
const ProxiedIcon = new Proxy(Icon, handler);

// Export the Context
export const Context = IconContext;

// Export the createFromIconfontCN function
export { createFromIconfontCN };

// Export default with proxy
export default ProxiedIcon;

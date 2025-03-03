import PropTypes from 'prop-types';
import React from 'react';
import IconContext from './es/components/Context';

// Add debug log with a unique identifier
console.log('==== ICONS.JSX IS BEING LOADED ====');

// Basic Icon component
const Icon = props => {
  return <span className="anticon" {...props} />;
};

// Add methods expected by Ant Design
Icon.getTwoToneColor = () => '#1890ff';
Icon.setTwoToneColor = () => {};
Icon.Context = IconContext;

// Add PropTypes validation to fix the warning
Icon.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object,
  children: PropTypes.node,
};

// Create a function to generate icon components
function createIconComponent(displayName) {
  const IconComponent = React.forwardRef((props, ref) => {
    return <Icon {...props} ref={ref} data-icon-name={displayName} />;
  });
  IconComponent.displayName = displayName;

  // Add PropTypes to each icon component
  IconComponent.propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
  };

  return IconComponent;
}

// Create icon components with display names
export const AccountBookFilled = createIconComponent('AccountBookFilled');
export const AccountBookOutlined = createIconComponent('AccountBookOutlined');
export const AccountBookTwoTone = createIconComponent('AccountBookTwoTone');
export const AlertFilled = createIconComponent('AlertFilled');
export const AlertOutlined = createIconComponent('AlertOutlined');
export const AlertTwoTone = createIconComponent('AlertTwoTone');
export const AlibabaOutlined = createIconComponent('AlibabaOutlined');
export const AlignCenterOutlined = createIconComponent('AlignCenterOutlined');
export const AlignLeftOutlined = createIconComponent('AlignLeftOutlined');
export const AlignRightOutlined = createIconComponent('AlignRightOutlined');
export const AliwangwangFilled = createIconComponent('AliwangwangFilled');
export const AliwangwangOutlined = createIconComponent('AliwangwangOutlined');
export const AmazonOutlined = createIconComponent('AmazonOutlined');
export const AndroidFilled = createIconComponent('AndroidFilled');
export const AndroidOutlined = createIconComponent('AndroidOutlined');
export const AntCloudOutlined = createIconComponent('AntCloudOutlined');
export const AntDesignOutlined = createIconComponent('AntDesignOutlined');
export const ApartmentOutlined = createIconComponent('ApartmentOutlined');
export const ApiFilled = createIconComponent('ApiFilled');
export const ApiOutlined = createIconComponent('ApiOutlined');
export const ApiTwoTone = createIconComponent('ApiTwoTone');
export const AppleFilled = createIconComponent('AppleFilled');
export const AppleOutlined = createIconComponent('AppleOutlined');
export const AppstoreAddOutlined = createIconComponent('AppstoreAddOutlined');
export const AppstoreFilled = createIconComponent('AppstoreFilled');
export const AppstoreOutlined = createIconComponent('AppstoreOutlined');
export const AppstoreTwoTone = createIconComponent('AppstoreTwoTone');
export const AreaChartOutlined = createIconComponent('AreaChartOutlined');
export const ArrowDownOutlined = createIconComponent('ArrowDownOutlined');
export const ArrowLeftOutlined = createIconComponent('ArrowLeftOutlined');
export const ArrowRightOutlined = createIconComponent('ArrowRightOutlined');
export const ArrowUpOutlined = createIconComponent('ArrowUpOutlined');
export const AuditOutlined = createIconComponent('AuditOutlined');
export const AudioFilled = createIconComponent('AudioFilled');
export const AudioMutedOutlined = createIconComponent('AudioMutedOutlined');
export const AudioOutlined = createIconComponent('AudioOutlined');
export const AudioTwoTone = createIconComponent('AudioTwoTone');
export const BarcodeOutlined = createIconComponent('BarcodeOutlined');
export const BugFilled = createIconComponent('BugFilled');
export const CalendarOutlined = createIconComponent('CalendarOutlined');
export const CaretDownFilled = createIconComponent('CaretDownFilled');
export const CaretDownOutlined = createIconComponent('CaretDownOutlined');
export const CaretRightOutlined = createIconComponent('CaretRightOutlined');
export const CaretUpOutlined = createIconComponent('CaretUpOutlined');
export const CarryOutTwoTone = createIconComponent('CarryOutTwoTone');
export const CheckCircleFilled = createIconComponent('CheckCircleFilled');
export const CheckCircleOutlined = createIconComponent('CheckCircleOutlined');
export const CheckCircleTwoTone = createIconComponent('CheckCircleTwoTone');
export const CheckOutlined = createIconComponent('CheckOutlined');
export const CheckSquareFilled = createIconComponent('CheckSquareFilled');
export const CheckSquareOutlined = createIconComponent('CheckSquareOutlined');
export const CheckSquareTwoTone = createIconComponent('CheckSquareTwoTone');
export const ClockCircleOutlined = createIconComponent('ClockCircleOutlined');
export const ClockCircleTwoTone = createIconComponent('ClockCircleTwoTone');
export const CloseCircleFilled = createIconComponent('CloseCircleFilled');
export const CloseCircleOutlined = createIconComponent('CloseCircleOutlined');
export const CloseCircleTwoTone = createIconComponent('CloseCircleTwoTone');
export const CloseOutlined = createIconComponent('CloseOutlined');
export const CloseSquareFilled = createIconComponent('CloseSquareFilled');
export const CloseSquareOutlined = createIconComponent('CloseSquareOutlined');
export const CloseSquareTwoTone = createIconComponent('CloseSquareTwoTone');
export const CloudDownloadOutlined = createIconComponent(
  'CloudDownloadOutlined'
);
export const CloudUploadOutlined = createIconComponent('CloudUploadOutlined');
export const ClusterOutlined = createIconComponent('ClusterOutlined');
export const CopyOutlined = createIconComponent('CopyOutlined');
export const DeleteOutlined = createIconComponent('DeleteOutlined');
export const DeleteRowOutlined = createIconComponent('DeleteRowOutlined');
export const DiffOutlined = createIconComponent('DiffOutlined');
export const DislikeOutlined = createIconComponent('DislikeOutlined');
export const DollarCircleOutlined = createIconComponent('DollarCircleOutlined');
export const DoubleLeftOutlined = createIconComponent('DoubleLeftOutlined');
export const DoubleRightOutlined = createIconComponent('DoubleRightOutlined');
export const DownloadOutlined = createIconComponent('DownloadOutlined');
export const DribbbleOutlined = createIconComponent('DribbbleOutlined');
export const EditOutlined = createIconComponent('EditOutlined');
export const EllipsisOutlined = createIconComponent('EllipsisOutlined');
export const EnterOutlined = createIconComponent('EnterOutlined');
export const EyeInvisibleOutlined = createIconComponent('EyeInvisibleOutlined');
export const EyeOutlined = createIconComponent('EyeOutlined');
export const FileDoneOutlined = createIconComponent('FileDoneOutlined');
export const FileExclamationTwoTone = createIconComponent(
  'FileExclamationTwoTone'
);
export const FileJpgOutlined = createIconComponent('FileJpgOutlined');
export const FileOutlined = createIconComponent('FileOutlined');
export const FileProtectOutlined = createIconComponent('FileProtectOutlined');
export const FileSearchOutlined = createIconComponent('FileSearchOutlined');
export const FileTextOutlined = createIconComponent('FileTextOutlined');
export const FileTwoTone = createIconComponent('FileTwoTone');
export const FileZipTwoTone = createIconComponent('FileZipTwoTone');
export const FilterFilled = createIconComponent('FilterFilled');
export const FolderOpenOutlined = createIconComponent('FolderOpenOutlined');
export const FolderOutlined = createIconComponent('FolderOutlined');
export const FrownTwoTone = createIconComponent('FrownTwoTone');
export const FullscreenExitOutlined = createIconComponent(
  'FullscreenExitOutlined'
);
export const GitlabOutlined = createIconComponent('GitlabOutlined');
export const GooglePlusCircleFilled = createIconComponent(
  'GooglePlusCircleFilled'
);
export const GroupOutlined = createIconComponent('GroupOutlined');
export const HistoryOutlined = createIconComponent('HistoryOutlined');
export const HolderOutlined = createIconComponent('HolderOutlined');
export const HourglassTwoTone = createIconComponent('HourglassTwoTone');
export const IeCircleFilled = createIconComponent('IeCircleFilled');
export const InfoCircleOutlined = createIconComponent('InfoCircleOutlined');
export const LoadingOutlined = createIconComponent('LoadingOutlined');
export const MacCommandOutlined = createIconComponent('MacCommandOutlined');
export const MehTwoTone = createIconComponent('MehTwoTone');
export const MergeCellsOutlined = createIconComponent('MergeCellsOutlined');
export const MessageOutlined = createIconComponent('MessageOutlined');
export const MinusSquareOutlined = createIconComponent('MinusSquareOutlined');
export const PaperClipOutlined = createIconComponent('PaperClipOutlined');
export const PauseOutlined = createIconComponent('PauseOutlined');
export const PictureTwoTone = createIconComponent('PictureTwoTone');
export const PinterestFilled = createIconComponent('PinterestFilled');
export const PlusOutlined = createIconComponent('PlusOutlined');
export const PlusSquareOutlined = createIconComponent('PlusSquareOutlined');
export const PushpinTwoTone = createIconComponent('PushpinTwoTone');
export const QuestionCircleOutlined = createIconComponent(
  'QuestionCircleOutlined'
);
export const ReloadOutlined = createIconComponent('ReloadOutlined');
export const RobotOutlined = createIconComponent('RobotOutlined');
export const RotateLeftOutlined = createIconComponent('RotateLeftOutlined');
export const RotateRightOutlined = createIconComponent('RotateRightOutlined');
export const SafetyCertificateTwoTone = createIconComponent(
  'SafetyCertificateTwoTone'
);
export const SettingOutlined = createIconComponent('SettingOutlined');
export const ShopFilled = createIconComponent('ShopFilled');
export const ShoppingCartOutlined = createIconComponent('ShoppingCartOutlined');
export const SmileTwoTone = createIconComponent('SmileTwoTone');
export const SolutionOutlined = createIconComponent('SolutionOutlined');
export const StarFilled = createIconComponent('StarFilled');
export const SwapOutlined = createIconComponent('SwapOutlined');
export const SwapRightOutlined = createIconComponent('SwapRightOutlined');
export const SyncOutlined = createIconComponent('SyncOutlined');
export const TikTokFilled = createIconComponent('TikTokFilled');
export const TikTokOutlined = createIconComponent('TikTokOutlined');
export const ToolTwoTone = createIconComponent('ToolTwoTone');
export const TrademarkOutlined = createIconComponent('TrademarkOutlined');
export const TruckOutlined = createIconComponent('TruckOutlined');
export const TwitchFilled = createIconComponent('TwitchFilled');
export const UngroupOutlined = createIconComponent('UngroupOutlined');
export const UnlockTwoTone = createIconComponent('UnlockTwoTone');
export const UpOutlined = createIconComponent('UpOutlined');
export const UserAddOutlined = createIconComponent('UserAddOutlined');
export const UserOutlined = createIconComponent('UserOutlined');
export const UserSwitchOutlined = createIconComponent('UserSwitchOutlined');
export const WalletFilled = createIconComponent('WalletFilled');
export const WalletOutlined = createIconComponent('WalletOutlined');
export const WalletTwoTone = createIconComponent('WalletTwoTone');
export const WarningFilled = createIconComponent('WarningFilled');
export const WarningOutlined = createIconComponent('WarningOutlined');
export const WarningTwoTone = createIconComponent('WarningTwoTone');
export const WechatFilled = createIconComponent('WechatFilled');
export const WechatOutlined = createIconComponent('WechatOutlined');
export const WeiboCircleFilled = createIconComponent('WeiboCircleFilled');
export const WeiboCircleOutlined = createIconComponent('WeiboCircleOutlined');
export const WeiboOutlined = createIconComponent('WeiboOutlined');
export const WeiboSquareFilled = createIconComponent('WeiboSquareFilled');
export const WeiboSquareOutlined = createIconComponent('WeiboSquareOutlined');
export const WhatsAppOutlined = createIconComponent('WhatsAppOutlined');
export const WifiOutlined = createIconComponent('WifiOutlined');
export const WindowsFilled = createIconComponent('WindowsFilled');
export const WindowsOutlined = createIconComponent('WindowsOutlined');
export const WomanOutlined = createIconComponent('WomanOutlined');
export const XFilled = createIconComponent('XFilled');
export const YahooFilled = createIconComponent('YahooFilled');
export const YahooOutlined = createIconComponent('YahooOutlined');
export const YuqueOutlined = createIconComponent('YuqueOutlined');
export const ZhihuOutlined = createIconComponent('ZhihuOutlined');
export const ZoomInOutlined = createIconComponent('ZoomInOutlined');
export const ZoomOutOutlined = createIconComponent('ZoomOutOutlined');

// Create icon font generator
function createFromIconfontCN(options = {}) {
  const IconFont = React.forwardRef((props, ref) => {
    return <Icon {...props} ref={ref} />;
  });

  IconFont.displayName = 'IconFont';
  return IconFont;
}

// Add all necessary properties to the Icon object for export
Icon.createFromIconfontCN = createFromIconfontCN;

// Create a proxy to handle any requested icon dynamically
const handler = {
  get(target, prop) {
    // Return existing properties as-is
    if (prop in target) {
      return target[prop];
    }

    // For any requested icon, create it on demand
    if (typeof prop === 'string' && /[A-Z]/.test(prop[0])) {
      return createIconComponent(prop);
    }

    return undefined;
  },
};

// Export the Icon with the proxy to handle dynamic icon requests
const ProxiedIcon = new Proxy(Icon, handler);

// Export Context for use in other components
export { IconContext as Context };

// Export the default with all properties needed by Ant Design
export default ProxiedIcon;

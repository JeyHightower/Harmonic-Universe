/**
 * This file provides shim implementations for Ant Design icon SVGs
 * It creates a simple object structure that matches what the real icons would return
 * but without requiring the actual SVG paths/data
 */

// Create a default SVG icon
export default function createIconSvg(iconName) {
    return {
        name: iconName,
        theme: iconName.endsWith('Filled') ? 'filled' :
            iconName.endsWith('TwoTone') ? 'twotone' : 'outlined',
        icon: {
            tag: 'svg',
            attrs: { viewBox: '64 64 896 896' },
            children: [{ tag: 'path', attrs: { d: 'M64 64h896v896H64z' } }]
        }
    };
}

// Pre-create all the problematic icons that are causing errors
const iconsCache = {};

function getIconSvg(iconName) {
    if (!iconsCache[iconName]) {
        iconsCache[iconName] = createIconSvg(iconName);
    }
    return iconsCache[iconName];
}

// Export a function to dynamically generate any requested icon
export function getIcon(iconName) {
    return getIconSvg(iconName);
}

// List of additional icons from the errors
const additionalIcons = [
    'UsbFilled',
    'WalletTwoTone',
    'WeiboSquareFilled',
    'FileExcelFilled',
    'XFilled',
    'WalletFilled',
    'YahooOutlined',
    'LayoutTwoTone',
    'UploadOutlined',
    'HarmonyOSOutlined',
    'WifiOutlined',
    'LayoutFilled',
    'JavaOutlined',
    'JavaScriptOutlined',
    'VideoCameraFilled',
    'LaptopOutlined',
    'LayoutOutlined',
    'KeyOutlined',
    'ZhihuOutlined'
];

// Generate exports for all additional icons
additionalIcons.forEach(iconName => {
    exports[iconName] = getIcon(iconName);
});

// Export all the specific icons that are causing errors
export const LoadingOutlined = getIconSvg('LoadingOutlined');
export const HolderOutlined = getIconSvg('HolderOutlined');
export const CheckOutlined = getIconSvg('CheckOutlined');
export const ExclamationCircleFilled = getIconSvg('ExclamationCircleFilled');
export const CheckCircleFilled = getIconSvg('CheckCircleFilled');
export const AlertFilled = getIconSvg('AlertFilled');
export const AccountBookTwoTone = getIconSvg('AccountBookTwoTone');
export const AliyunOutlined = getIconSvg('AliyunOutlined');
export const AlertOutlined = getIconSvg('AlertOutlined');
export const AlipayCircleFilled = getIconSvg('AlipayCircleFilled');
export const AimOutlined = getIconSvg('AimOutlined');
export const AccountBookOutlined = getIconSvg('AccountBookOutlined');
export const AlertTwoTone = getIconSvg('AlertTwoTone');
export const AlibabaOutlined = getIconSvg('AlibabaOutlined');
export const ArrowsAltOutlined = getIconSvg('ArrowsAltOutlined');
export const AlignRightOutlined = getIconSvg('AlignRightOutlined');
export const AppleFilled = getIconSvg('AppleFilled');
export const AudioMutedOutlined = getIconSvg('AudioMutedOutlined');
export const AreaChartOutlined = getIconSvg('AreaChartOutlined');
export const ArrowLeftOutlined = getIconSvg('ArrowLeftOutlined');
export const CreditCardTwoTone = getIconSvg('CreditCardTwoTone');
export const BulbOutlined = getIconSvg('BulbOutlined');
export const ArrowUpOutlined = getIconSvg('ArrowUpOutlined');
export const AndroidOutlined = getIconSvg('AndroidOutlined');
export const EuroTwoTone = getIconSvg('EuroTwoTone');
export const AudioTwoTone = getIconSvg('AudioTwoTone');
export const CalculatorFilled = getIconSvg('CalculatorFilled');
export const BulbTwoTone = getIconSvg('BulbTwoTone');
export const BankFilled = getIconSvg('BankFilled');
export const CalendarTwoTone = getIconSvg('CalendarTwoTone');
export const AuditOutlined = getIconSvg('AuditOutlined');
export const CloudFilled = getIconSvg('CloudFilled');
export const CopyrightTwoTone = getIconSvg('CopyrightTwoTone');
export const ExperimentFilled = getIconSvg('ExperimentFilled');
export const CalculatorOutlined = getIconSvg('CalculatorOutlined');
export const CopyrightCircleFilled = getIconSvg('CopyrightCircleFilled');
export const CloudServerOutlined = getIconSvg('CloudServerOutlined');
export const CameraFilled = getIconSvg('CameraFilled');
export const StarOutlined = getIconSvg('StarOutlined');
export const BankTwoTone = getIconSvg('BankTwoTone');
export const DingdingOutlined = getIconSvg('DingdingOutlined');
export const CalendarFilled = getIconSvg('CalendarFilled');
export const DingtalkOutlined = getIconSvg('DingtalkOutlined');
export const FileUnknownTwoTone = getIconSvg('FileUnknownTwoTone');
export const FireTwoTone = getIconSvg('FireTwoTone');
export const FileZipTwoTone = getIconSvg('FileZipTwoTone');
export const FileWordTwoTone = getIconSvg('FileWordTwoTone');
export const FolderAddTwoTone = getIconSvg('FolderAddTwoTone');
export const FileZipOutlined = getIconSvg('FileZipOutlined');
export const FileUnknownOutlined = getIconSvg('FileUnknownOutlined');
export const FolderOutlined = getIconSvg('FolderOutlined');
export const FormatPainterFilled = getIconSvg('FormatPainterFilled');
export const FolderOpenOutlined = getIconSvg('FolderOpenOutlined');
export const FontSizeOutlined = getIconSvg('FontSizeOutlined');
export const FormOutlined = getIconSvg('FormOutlined');
export const FlagFilled = getIconSvg('FlagFilled');
export const FullscreenOutlined = getIconSvg('FullscreenOutlined');
export const FilterFilled = getIconSvg('FilterFilled');
export const FolderFilled = getIconSvg('FolderFilled');
export const FrownOutlined = getIconSvg('FrownOutlined');
export const FileZipFilled = getIconSvg('FileZipFilled');
export const FolderAddFilled = getIconSvg('FolderAddFilled');
export const FolderTwoTone = getIconSvg('FolderTwoTone');
export const FolderOpenTwoTone = getIconSvg('FolderOpenTwoTone');

// Create a special handler for ES module namespace
export const __esModule = true;

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define the output directory and file paths
const distDir = path.resolve(__dirname, '../../dist');
const fallbackPath = path.join(distDir, 'ant-icons-fallback.js');

// Create the fallback script content
const fallbackScript = `
console.log('[Ant Icons] Loading fallback icons...');

// Create a minimal implementation of Ant Design icons
(function() {
  // Basic icon creation function
  function createIcon(name, theme = 'outlined') {
    return function IconComponent(props) {
      const { style = {}, className = '', ...restProps } = props || {};

      // Create a simple SVG element
      const svgProps = {
        ...restProps,
        className: \`anticon anticon-\${name} \${className}\`,
        style: { ...style },
      };

      return {
        $$typeof: Symbol.for('react.element'),
        type: 'span',
        props: {
          ...svgProps,
          children: [
            {
              $$typeof: Symbol.for('react.element'),
              type: 'svg',
              props: {
                viewBox: '64 64 896 896',
                focusable: 'false',
                'data-icon': name,
                width: '1em',
                height: '1em',
                fill: 'currentColor',
                'aria-hidden': 'true',
                children: {
                  $$typeof: Symbol.for('react.element'),
                  type: 'path',
                  props: {
                    d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z'
                  },
                  key: null
                }
              },
              key: null
            }
          ]
        },
        key: null
      };
    };
  }

  // Create a safe context function
  function createSafeContext() {
    try {
      return {
        Provider: function Provider(props) {
          return props.children;
        },
        Consumer: function Consumer(props) {
          return props.children({});
        }
      };
    } catch (e) {
      console.error('[Ant Icons] Error creating context:', e);
      return {
        Provider: function Provider(props) { return props.children; },
        Consumer: function Consumer(props) { return null; }
      };
    }
  }

  // Define common icons
  const icons = {
    CloseOutlined: createIcon('close'),
    CheckOutlined: createIcon('check'),
    LoadingOutlined: createIcon('loading'),
    SearchOutlined: createIcon('search'),
    DownOutlined: createIcon('down'),
    UpOutlined: createIcon('up'),
    LeftOutlined: createIcon('left'),
    RightOutlined: createIcon('right'),
    PlusOutlined: createIcon('plus'),
    MinusOutlined: createIcon('minus'),
    QuestionOutlined: createIcon('question'),
    ExclamationOutlined: createIcon('exclamation'),
    InfoOutlined: createIcon('info'),
    CheckCircleOutlined: createIcon('check-circle'),
    CloseCircleOutlined: createIcon('close-circle'),
    ExclamationCircleOutlined: createIcon('exclamation-circle'),
    InfoCircleOutlined: createIcon('info-circle'),
    DeleteOutlined: createIcon('delete'),
    EditOutlined: createIcon('edit'),
    CopyOutlined: createIcon('copy'),
    EyeOutlined: createIcon('eye'),
    EyeInvisibleOutlined: createIcon('eye-invisible'),
    FileOutlined: createIcon('file'),
    FolderOutlined: createIcon('folder'),
    FolderOpenOutlined: createIcon('folder-open'),
    SettingOutlined: createIcon('setting'),
    UserOutlined: createIcon('user'),
    TeamOutlined: createIcon('team'),
    ArrowLeftOutlined: createIcon('arrow-left'),
    ArrowRightOutlined: createIcon('arrow-right'),
    ArrowUpOutlined: createIcon('arrow-up'),
    ArrowDownOutlined: createIcon('arrow-down'),
    UploadOutlined: createIcon('upload'),
    DownloadOutlined: createIcon('download'),
    MenuOutlined: createIcon('menu'),
    AppstoreOutlined: createIcon('appstore'),
    BarsOutlined: createIcon('bars'),
    CalendarOutlined: createIcon('calendar'),
    HomeOutlined: createIcon('home'),
    StarOutlined: createIcon('star'),
    StarFilled: createIcon('star', 'filled'),
    HeartOutlined: createIcon('heart'),
    HeartFilled: createIcon('heart', 'filled'),
    LockOutlined: createIcon('lock'),
    UnlockOutlined: createIcon('unlock'),
    MailOutlined: createIcon('mail'),
    PhoneOutlined: createIcon('phone'),
    MobileOutlined: createIcon('mobile'),
    ClockCircleOutlined: createIcon('clock-circle'),
    DashboardOutlined: createIcon('dashboard'),
    GlobalOutlined: createIcon('global'),
    PictureOutlined: createIcon('picture'),
    PlayCircleOutlined: createIcon('play-circle'),
    PauseCircleOutlined: createIcon('pause-circle'),
    StopOutlined: createIcon('stop'),
    BellOutlined: createIcon('bell'),
    NotificationOutlined: createIcon('notification'),
    MessageOutlined: createIcon('message'),
    CommentOutlined: createIcon('comment'),
    TagOutlined: createIcon('tag'),
    TagsFilled: createIcon('tags', 'filled'),
    FilterOutlined: createIcon('filter'),
    CaretUpOutlined: createIcon('caret-up'),
    CaretDownOutlined: createIcon('caret-down'),
    CaretLeftOutlined: createIcon('caret-left'),
    CaretRightOutlined: createIcon('caret-right'),
    MoreOutlined: createIcon('more'),
    EllipsisOutlined: createIcon('ellipsis'),
    LinkOutlined: createIcon('link'),
    DisconnectOutlined: createIcon('disconnect'),
    ApiOutlined: createIcon('api'),
    ShoppingCartOutlined: createIcon('shopping-cart'),
    ShoppingOutlined: createIcon('shopping'),
    SaveOutlined: createIcon('save'),
    PrinterOutlined: createIcon('printer'),
    SoundOutlined: createIcon('sound'),
    SoundFilled: createIcon('sound', 'filled'),
    VideoCameraOutlined: createIcon('video-camera'),
    CameraOutlined: createIcon('camera'),
    DesktopOutlined: createIcon('desktop'),
    LaptopOutlined: createIcon('laptop'),
    TabletOutlined: createIcon('tablet'),
    CloudOutlined: createIcon('cloud'),
    CloudUploadOutlined: createIcon('cloud-upload'),
    CloudDownloadOutlined: createIcon('cloud-download'),
    CloudServerOutlined: createIcon('cloud-server'),
    CodeOutlined: createIcon('code'),
    FileTextOutlined: createIcon('file-text'),
    FileImageOutlined: createIcon('file-image'),
    FilePdfOutlined: createIcon('file-pdf'),
    FileExcelOutlined: createIcon('file-excel'),
    FileWordOutlined: createIcon('file-word'),
    FilePptOutlined: createIcon('file-ppt'),
    FileZipOutlined: createIcon('file-zip'),
    FileUnknownOutlined: createIcon('file-unknown'),
    FileAddOutlined: createIcon('file-add'),
    FolderAddOutlined: createIcon('folder-add'),
    HddOutlined: createIcon('hdd'),
    IdcardOutlined: createIcon('idcard'),
    CreditCardOutlined: createIcon('credit-card'),
    BankOutlined: createIcon('bank'),
    MoneyCollectOutlined: createIcon('money-collect'),
    DollarOutlined: createIcon('dollar'),
    EuroOutlined: createIcon('euro'),
    PoundOutlined: createIcon('pound'),
    SmileOutlined: createIcon('smile'),
    FrownOutlined: createIcon('frown'),
    MehOutlined: createIcon('meh'),
    SmileFilled: createIcon('smile', 'filled'),
    FrownFilled: createIcon('frown', 'filled'),
    MehFilled: createIcon('meh', 'filled'),
    TrophyOutlined: createIcon('trophy'),
    GiftOutlined: createIcon('gift'),
    ShakeOutlined: createIcon('shake'),
    LikeOutlined: createIcon('like'),
    DislikeOutlined: createIcon('dislike'),
    LikeFilled: createIcon('like', 'filled'),
    DislikeFilled: createIcon('dislike', 'filled'),
    FireOutlined: createIcon('fire'),
    ThunderboltOutlined: createIcon('thunderbolt'),
    BugOutlined: createIcon('bug'),
    BugFilled: createIcon('bug', 'filled'),
    BulbOutlined: createIcon('bulb'),
    ExperimentOutlined: createIcon('experiment'),
    RocketOutlined: createIcon('rocket'),
    ToolOutlined: createIcon('tool'),
    ToolFilled: createIcon('tool', 'filled'),
    AppstoreAddOutlined: createIcon('appstore-add'),
    CarryOutOutlined: createIcon('carry-out'),
    CarryOutFilled: createIcon('carry-out', 'filled'),
    BoxPlotOutlined: createIcon('box-plot'),
    BoxPlotFilled: createIcon('box-plot', 'filled'),
    BuildOutlined: createIcon('build'),
    BuildFilled: createIcon('build', 'filled'),
    SlackOutlined: createIcon('slack'),
    SlackSquareOutlined: createIcon('slack-square'),
    BehanceOutlined: createIcon('behance'),
    BehanceSquareOutlined: createIcon('behance-square'),
    DribbbleOutlined: createIcon('dribbble'),
    DribbbleSquareOutlined: createIcon('dribbble-square'),
    InstagramOutlined: createIcon('instagram'),
    InstagramFilled: createIcon('instagram', 'filled'),
    YuqueOutlined: createIcon('yuque'),
    YuqueFilled: createIcon('yuque', 'filled'),
    AlibabaOutlined: createIcon('alibaba'),
    GoogleOutlined: createIcon('google'),
    GooglePlusOutlined: createIcon('google-plus'),
    GooglePlusCircleFilled: createIcon('google-plus-circle', 'filled'),
    MediumOutlined: createIcon('medium'),
    MediumWorkmarkOutlined: createIcon('medium-workmark'),
    QqOutlined: createIcon('qq'),
    SkypeOutlined: createIcon('skype'),
    TwitterOutlined: createIcon('twitter'),
    TwitterCircleFilled: createIcon('twitter-circle', 'filled'),
    WeiboOutlined: createIcon('weibo'),
    WeiboCircleFilled: createIcon('weibo-circle', 'filled'),
    YahooOutlined: createIcon('yahoo'),
    YahooFilled: createIcon('yahoo', 'filled'),
    YoutubeOutlined: createIcon('youtube'),
    YoutubeFilled: createIcon('youtube', 'filled'),
    GithubOutlined: createIcon('github'),
    GithubFilled: createIcon('github', 'filled'),
    FacebookOutlined: createIcon('facebook'),
    FacebookFilled: createIcon('facebook', 'filled'),
    LinkedinOutlined: createIcon('linkedin'),
    LinkedinFilled: createIcon('linkedin', 'filled'),
    ZhihuOutlined: createIcon('zhihu'),
    ZhihuCircleFilled: createIcon('zhihu-circle', 'filled'),
    TaobaoOutlined: createIcon('taobao'),
    TaobaoCircleFilled: createIcon('taobao-circle', 'filled'),
    Html5Outlined: createIcon('html5'),
    Html5Filled: createIcon('html5', 'filled'),
    AntDesignOutlined: createIcon('ant-design'),
    AntCloudOutlined: createIcon('ant-cloud'),
    AlipayOutlined: createIcon('alipay'),
    AlipayCircleFilled: createIcon('alipay-circle', 'filled'),
    AmazonOutlined: createIcon('amazon'),
    AppleOutlined: createIcon('apple'),
    AppleFilled: createIcon('apple', 'filled'),
    CodepenOutlined: createIcon('codepen'),
    CodepenCircleFilled: createIcon('codepen-circle', 'filled'),
    CodeSandboxOutlined: createIcon('code-sandbox'),
    CodeSandboxCircleFilled: createIcon('code-sandbox-circle', 'filled'),
    ChromeOutlined: createIcon('chrome'),
    ChromeFilled: createIcon('chrome', 'filled'),
    CodepenSquareFilled: createIcon('codepen-square', 'filled'),
    GitlabOutlined: createIcon('gitlab'),
    GitlabFilled: createIcon('gitlab', 'filled'),
    DingtalkOutlined: createIcon('dingtalk'),
    DingtalkCircleFilled: createIcon('dingtalk-circle', 'filled'),
    AndroidOutlined: createIcon('android'),
    AndroidFilled: createIcon('android', 'filled'),
    WindowsOutlined: createIcon('windows'),
    WindowsFilled: createIcon('windows', 'filled'),
    IeOutlined: createIcon('ie'),
    IeCircleFilled: createIcon('ie-circle', 'filled'),
    AmazonCircleFilled: createIcon('amazon-circle', 'filled'),
    SlackCircleFilled: createIcon('slack-circle', 'filled'),
    BehanceCircleFilled: createIcon('behance-circle', 'filled'),
    DribbbleCircleFilled: createIcon('dribbble-circle', 'filled'),
    DropboxCircleFilled: createIcon('dropbox-circle', 'filled'),
    GithubCircleFilled: createIcon('github-circle', 'filled'),
    GitlabCircleFilled: createIcon('gitlab-circle', 'filled'),
    MediumCircleFilled: createIcon('medium-circle', 'filled'),
    QqCircleFilled: createIcon('qq-circle', 'filled'),
    RedditCircleFilled: createIcon('reddit-circle', 'filled'),
    SkypeCircleFilled: createIcon('skype-circle', 'filled'),
    SketchCircleFilled: createIcon('sketch-circle', 'filled'),
    SlackSquareFilled: createIcon('slack-square', 'filled'),
    BehanceSquareFilled: createIcon('behance-square', 'filled'),
    DribbbleSquareFilled: createIcon('dribbble-square', 'filled'),
    DropboxSquareFilled: createIcon('dropbox-square', 'filled'),
    FacebookSquareFilled: createIcon('facebook-square', 'filled'),
    GooglePlusSquareFilled: createIcon('google-plus-square', 'filled'),
    GoogleSquareFilled: createIcon('google-square', 'filled'),
    InstagramSquareFilled: createIcon('instagram-square', 'filled'),
    LinkedinSquareFilled: createIcon('linkedin-square', 'filled'),
    MediumSquareFilled: createIcon('medium-square', 'filled'),
    QqSquareFilled: createIcon('qq-square', 'filled'),
    RedditSquareFilled: createIcon('reddit-square', 'filled'),
    TwitterSquareFilled: createIcon('twitter-square', 'filled'),
    WeiboSquareFilled: createIcon('weibo-square', 'filled'),
    YahooSquareFilled: createIcon('yahoo-square', 'filled'),
    YoutubeSquareFilled: createIcon('youtube-square', 'filled'),
    ZhihuSquareFilled: createIcon('zhihu-square', 'filled'),
  };

  // Create a context for IconProvider
  const IconContext = createSafeContext();

  // Export all icons and the context
  window.AntDesignIcons = {
    ...icons,
    IconProvider: IconContext.Provider,
    IconContext: IconContext,
    createFromIconfontCN: function() {
      return function() { return null; }
    },
    getTwoToneColor: function() { return '#1890ff'; },
    setTwoToneColor: function() {},
  };

  // Set the loaded flag
  window.antIconsLoaded = true;
  console.log('[Ant Icons] Fallback icons loaded successfully');
})();
`;

// Ensure the dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Write the fallback script to the output file
fs.writeFileSync(fallbackPath, fallbackScript);

console.log(`Ant Design icons fallback script generated at: ${fallbackPath}`);

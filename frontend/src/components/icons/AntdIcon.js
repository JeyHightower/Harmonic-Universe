'use client';

import _defineProperty from '@babel/runtime/helpers/esm/defineProperty';
import _extends from '@babel/runtime/helpers/esm/extends';
import _objectWithoutProperties from '@babel/runtime/helpers/esm/objectWithoutProperties';
import _slicedToArray from '@babel/runtime/helpers/esm/slicedToArray';
import * as React from 'react';
var _excluded = ['className', 'icon', 'spin', 'rotate', 'tabIndex', 'onClick', 'twoToneColor'];
// Fix import to use our shim instead
import { blue } from '@ant-design/colors';
import classNames from '../../../utils/classnames-shim';
import { normalizeTwoToneColors } from '../utils';
import Context from './Context';
import ReactIcon from './IconBase';
import { setTwoToneColor } from './twoTonePrimaryColor';

// Initial setting
// should move it to antd main repo?
setTwoToneColor(blue.primary);

// This is a patched version of AntdIcon.js to fix the classnames import issue

var Icon = /*#__PURE__*/ React.forwardRef(function (props, ref) {
  var _classNames;
  var className = props.className,
    icon = props.icon,
    spin = props.spin,
    rotate = props.rotate,
    tabIndex = props.tabIndex,
    onClick = props.onClick,
    twoToneColor = props.twoToneColor,
    restProps = _objectWithoutProperties(props, _excluded);
  var _React$useContext = React.useContext(Context),
    _React$useContext$pre = _React$useContext.prefixCls,
    prefixCls = _React$useContext$pre === void 0 ? 'anticon' : _React$useContext$pre,
    rootClassName = _React$useContext.rootClassName;
  var classString = classNames(
    rootClassName,
    prefixCls,
    ((_classNames = {}),
    _defineProperty(_classNames, ''.concat(prefixCls, '-').concat(icon.name), !!icon.name),
    _defineProperty(_classNames, ''.concat(prefixCls, '-spin'), !!spin || icon.name === 'loading'),
    _classNames),
    className
  );
  var iconTabIndex = tabIndex;
  if (iconTabIndex === undefined && onClick) {
    iconTabIndex = -1;
  }
  var svgStyle = rotate
    ? {
        msTransform: 'rotate('.concat(rotate, 'deg)'),
        transform: 'rotate('.concat(rotate, 'deg)'),
      }
    : undefined;
  var _normalizeTwoToneColo = normalizeTwoToneColors(twoToneColor),
    _normalizeTwoToneColo2 = _slicedToArray(_normalizeTwoToneColo, 2),
    primaryColor = _normalizeTwoToneColo2[0],
    secondaryColor = _normalizeTwoToneColo2[1];
  return /*#__PURE__*/ React.createElement(
    'span',
    _extends(
      {
        role: 'img',
        'aria-label': icon.name,
      },
      restProps,
      {
        ref: ref,
        tabIndex: iconTabIndex,
        onClick: onClick,
        className: classString,
      }
    ),
    /*#__PURE__*/ React.createElement(ReactIcon, {
      icon: icon,
      primaryColor: primaryColor,
      secondaryColor: secondaryColor,
      style: svgStyle,
    })
  );
});
Icon.displayName = 'AntdIcon';
export default Icon;

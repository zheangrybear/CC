// @ts-nocheck
import debug from 'debug';
import * as React from 'react';
import styled from 'styled-components';

import {
  centerY,
  contentRefKey,
  getRelativeRect,
  linksSvgRefKey,
  Point,
  RefKey,
  twentyPointX,
} from '../../utils';
import { BaseProps, BaseWidget } from '../common';

const RootLinksSvg = styled.svg`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  pointer-events: none;
`;

const log = debug('node:root-sub-links');

interface Props extends BaseProps { }

interface State {
  curves: any[];
}

export class RootSubLinks extends BaseWidget<Props, State> {
  state = {
    curves: [],
  };

  layout() {
    const { props } = this;
    const { model, getRef, topicKey, zoomFactor, controller } = props;
    const topic = model.getTopic(topicKey);
    const content = getRef(contentRefKey(topicKey));
    const svg = getRef(linksSvgRefKey(topicKey));
    const { bigView } = getRef(RefKey.DRAG_SCROLL_WIDGET_KEY);
    const contentRect = getRelativeRect(content, bigView, zoomFactor);
    const svgRect = getRelativeRect(svg, bigView, zoomFactor);
    let p0: Point;
    let p1: Point;
    let p2: Point;

    p0 = {
      x: contentRect.right - svgRect.left,
      y: centerY(contentRect) - svgRect.top,
    };

    p1 = {
      x: contentRect.right - svgRect.left + 30,
      y: centerY(contentRect) - svgRect.top,
    };
    const curves = [];
    topic.subKeys.forEach((key) => {
      const linkStyle = controller.run('getLinkStyle', {
        ...props,
        topicKey: key,
      });
      const { lineType } = linkStyle;
      const subTopicContent = getRef(contentRefKey(key));
      const rect = getRelativeRect(subTopicContent, bigView, zoomFactor);
      if (rect.left > contentRect.right) {
        p2 = {
          x: rect.left,
          y: centerY(rect),
        };
      } else {
        p2 = {
          x: rect.right,
          y: centerY(rect),
        };
      }
      p2 = { x: p2.x - svgRect.left, y: p2.y - svgRect.top };
      let curve;
      let transform;
      let text;
      if (lineType === 'curve') {
        curve = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} C ${twentyPointX(
          p1,
          p2
        )} ${p1.y} ${twentyPointX(p1, p2)} ${p2.y} ${p2.x} ${p2.y} `;
        if (p0.y === p1.y && p1.y === p2.y) {
          transform = `translate(${(p0.x + p1.x) /2 + 10}px,${p1.y + 5}px)`
        } else { transform = `translate(${(twentyPointX(p1, p2) + p2.x) / 2}px,${(p1.y + p2.y) / 2}px)`}
      } else if (lineType === 'line') {
        curve = `M ${p0.x} ${p0.y} L ${p2.x} ${p2.y}`;
        transform = `translate(${(p0.x + p2.x) / 2}px, ${(p0.y + p2.y) / 2 + 5}px)`
      } else if (lineType === 'round') {
        const vDir = p2.y > p1.y ? 1 : -1;
        const hDir = p2.x > p1.x ? 1 : -1;
        const radius = linkStyle.lineRadius;
        if (radius == null) {
          throw new Error(
            'link line type is round, but lineRadius is not provided!'
          );
        }
        if (p2.y === p1.y) {
          curve = `M ${p0.x} ${p0.y} H ${p2.x}`;
          transform = `translate(${(p0.x + p2.x) / 2}px, ${p1.y + 5}px)`
        } else {
          // 0 表示逆时针 1 表示顺时针
          curve = `M ${p0.x} ${p0.y}  V ${p2.y - vDir * radius
            } A ${radius} ${radius} 0 0 ${vDir * hDir === 1 ? 0 : 1} ${p1.x + radius * hDir
            } ${p2.y} H ${p2.x}`;
          transform = `translate(${p1.x + 3}px, ${(p1.y + p2.y - vDir * radius) / 2}px)`
        }
      }
      if (linkStyle.lineLabel && linkStyle.lineLabel.length > 0) {
        text = <g
          style={{ transform: transform }}
          key={`text${key}`}
        >
          <text
            stroke='none'
            fill='rbg(79,79,79)'
            fontSize={12}
            fontWeight='normal'
            dominantBaseline='hanging'
          >
            {linkStyle.lineLabel}
          </text>
        </g>
      } else {
        text = <g key={`text${key}`}/>
      }
      curves.push(
        <path
          key={`link-${key}`}
          d={curve}
          strokeWidth={linkStyle.lineWidth}
          stroke={linkStyle.lineColor}
          fill="none"
          strokeDasharray={linkStyle.lineDasharray ? '3 2' : ''}
        />,
        text
      );
    });
    this.setState({
      curves,
    });
  }

  render() {
    log('render');
    const { topicKey, saveRef } = this.props;
    return (
      <RootLinksSvg ref={saveRef(linksSvgRefKey(topicKey))}>
        <g>{this.state.curves}</g>
      </RootLinksSvg>
    );
  }
}

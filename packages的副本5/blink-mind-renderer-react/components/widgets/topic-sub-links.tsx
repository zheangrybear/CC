// @ts-nocheck
import { TopicDirection } from '@blink-mind/core';
import debug from 'debug';
import * as React from 'react';
import styled from 'styled-components';

import {
  centerPointX,
  centerY,
  collapseRefKey,
  contentRefKey,
  getRelativeRect,
  linksSvgRefKey,
  Point,
  RefKey,
  twentyPointX,
} from '../../utils';
import { BaseProps, BaseWidget } from '../common';

const TopicLinksSvg = styled.svg`
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  pointer-events: none;
`;

const log = debug('node:topic-sub-links');

interface Props extends BaseProps { }

interface State {
  curves: any[];
}

export class TopicSubLinks extends BaseWidget<Props, State> {
  state = {
    curves: [],
  };
  layout() {
    const { props } = this;
    const { model, getRef, topicKey, dir, controller } = props;
    const z = controller.run('getZoomFactor', props);
    const topic = model.getTopic(topicKey);
    const content = getRef(contentRefKey(topicKey));
    const svg = getRef(linksSvgRefKey(topicKey));
    const collapseIcon = getRef(collapseRefKey(topicKey));
    const { bigView } = getRef(RefKey.DRAG_SCROLL_WIDGET_KEY);
    const svgRect = getRelativeRect(svg, bigView, z);
    const collapseRect = getRelativeRect(collapseIcon, bigView, z);
    const contentRect = getRelativeRect(content, bigView, z);
    log(topicKey);
    log('svgRect', svgRect);
    log('collapseRect', collapseRect);
    log('contentRect', contentRect);
    let p1: Point;
    let p2: Point;
    let p3: Point;

    if (dir === TopicDirection.RIGHT) {
      p1 = {
        x: 0,
        y: centerY(contentRect) - svgRect.top,
      };
      p2 = {
        x: collapseRect.right - svgRect.left + 10,
        y: p1.y,
      };
    } else if (dir === TopicDirection.LEFT) {
      p1 = {
        x: svgRect.right - svgRect.left,
        y: centerY(contentRect) - svgRect.top,
      };
      p2 = {
        x: collapseRect.left - svgRect.left - 10,
        y: p1.y,
      };
    }
    const curves = [];

    topic.subKeys.forEach((key) => {
      let curve;
      let transform;
      let text;
      const linkStyle = controller.run('getLinkStyle', {
        ...props,
        topicKey: key,
      });
      // log(key);
      const subContent = getRef(contentRefKey(key));
      if (!subContent) return;
      const rect = getRelativeRect(subContent, bigView, z);

      if (dir === TopicDirection.RIGHT) {
        p3 = {
          x: rect.left - svgRect.left,
          y: centerY(rect) - svgRect.top,
        };
      }
      if (dir === TopicDirection.LEFT) {
        p3 = {
          x: rect.right - svgRect.left,
          y: centerY(rect) - svgRect.top,
        };
      }
      const { lineType } = linkStyle;

      if (lineType === 'curve') {
        curve = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} C ${twentyPointX(
          p2,
          p3
        )} ${p2.y} ${centerPointX(p2, p3)} ${p3.y} ${p3.x} ${p3.y}`;
        if (p1.y === p2.y && p2.y === p3.y) {
          transform = `translate(${(p1.x + p2.x) /2 + 10}px, ${p2.y + 5}px)`
        } else {transform = `translate(${(twentyPointX(p2, p3) + p3.x) / 2}px,${(p2.y + p3.y) / 2}px)`}
      } else if (lineType === 'round') {
        const vDir = p3.y > p1.y ? 1 : -1;
        const hDir = p3.x > p1.x ? 1 : -1;
        const radius = linkStyle.lineRadius;
        // if (p3.y === p1.y) { //这样判断不可靠
        if (topic.subKeys.size === 1 || Math.abs(p3.y - p1.y) <= 1) {
          curve = `M ${p1.x} ${p1.y} L ${p3.x} ${p3.y}`;
          transform = `translate(${(p1.x + p3.x) / 2}px, ${p1.y + 5}px)`
        } else {
          // 0 表示逆时针 1 表示顺时针
          curve = `M ${p1.x} ${p1.y} H ${p2.x} V ${p3.y - vDir * radius
            } A ${radius} ${radius} 0 0 ${vDir * hDir === 1 ? 0 : 1} ${p2.x + radius * hDir
            } ${p3.y} H ${p3.x}`;
          transform = `translate(${p1.x + 3}px, ${(p1.y + p3.y - vDir * radius) / 2}px)`
        }
      } else if (lineType === 'line') {
        curve = `M ${p1.x} ${p1.y} H ${p2.x} L ${p3.x} ${p3.y}`;
        if (p1.y === p3.y) {
          transform = `translate(${(p1.x + p3.x) / 2}px, ${p1.y + 5}px)`
        } else { transform = `translate(${(p1.x + p3.x) / 2}px, ${(p1.y + p3.y) / 2}px)`}
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
    const { topicKey, saveRef } = this.props;
    return (
      <TopicLinksSvg ref={saveRef(linksSvgRefKey(topicKey))}>
        <g>{this.state.curves}</g>
      </TopicLinksSvg>
    );
  }
}

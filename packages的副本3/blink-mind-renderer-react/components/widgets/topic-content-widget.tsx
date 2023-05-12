// @ts-nocheck
import {
  DiagramLayoutType,
  FocusMode,
  OpType,
  TopicDirection,
} from '@blink-mind/core';
import { ContextMenu } from '@blueprintjs/core';
import debug from 'debug';
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import styled from 'styled-components';

import { collapseRefKey, contentRefKey, PropKey } from '../../utils';
import { BaseProps, BaseWidget } from '../common';
import { isMobile } from '@/utils/utils';

const log = debug('node:topic-content-widget');

interface TopicContentProps {
  dragEnter?: boolean;
}

const TopicContent = styled.div<TopicContentProps>`
  display: flex;
  align-items: center;
  flex-flow: column;
  cursor: pointer;
  //overflow: hidden;
  position: relative;
  margin-top: ${(props) => `${props.marginV}px`};
  margin-bottom: ${(props) => `${props.marginV}px`};
`;

const TopicContentBody = styled.div<TopicContentProps>`
  display: flex;
  align-items: center;
  position: relative;
`;

const TopicContentWithDropArea = styled.div`
  position: relative;
`;

interface Props extends BaseProps {
  draggable: boolean;
}

interface State {
  dragEnter: boolean;
}

export class TopicContentWidget extends BaseWidget<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      dragEnter: false,
    };
  }

  onDragStart = (ev) => {
    this.run('handleTopicDragStart', { ...this.props, ev });
  };

  // onDragOver = ev => {
  //   // log('onDragOver');
  //   ev.preventDefault();
  // };

  // onDragEnter = ev => {
  //   log('onDragEnter', this.props.topicKey);
  //   this.run('handleTopicDragEnter', { ...this.props, ev, dropDir: 'in' });
  // };

  // onDragLeave = ev => {
  //   this.run('handleTopicDragLeave', { ...this.props, ev, dropDir: 'in' });
  // };

  // onDrop = ev => {
  //   log('onDrop');
  //   this.run('handleTopicDrop', { ...this.props, ev, dropDir: 'in' });
  // };

  public renderContextMenu() {
    const { controller } = this.props;
    if (
      !controller.getValue(PropKey.TOPIC_CONTEXT_MENU_ENABLED, {
        ...this.props,
      })
    ) {
      return;
    }
    this.operation(OpType.FOCUS_TOPIC, {
      ...this.props,
      focusMode: FocusMode.SHOW_POPUP,
    });
    return controller.run('renderTopicContextMenu', this.props);
  }

  public onContextMenuClose() {
    // Optional method called once the context menu is closed.
  }

  onFocus = () => {
    const { props } = this;
    const { controller } = props;
    controller.run('createEditor', {
      node_id: props.topicKey,
    });
    if (isMobile()) controller.run('extraMenuClick', {
      ...this.props,
      buttonKey: 'media',
    }); 
  };

  onClick = (ev) => {
    const { props } = this;
    const { controller } = props;
    // log('handleTopicClick');
    // 注意这里要传递this.props, 而不是props, 因为会先调用onClick, 再调用其他的topic-content-editor的onClickOutside
    // 其他组件的onClickOutside是个同步的函数,会设置新的model, 如果这里用props传参,会导致model 还是老的model
    controller.run('createEditor', {
      node_id: props.topicKey,
    });
    if (isMobile()) controller.run('extraMenuClick', {
      ...this.props,
      ev,
      buttonKey: 'media',
    });
    controller.run('handleTopicClick', { ...this.props, ev });
  };

  onDoubleClick = (ev) => {
    const { controller } = this.props;
    controller.run('handleTopicDoubleClick', { ...this.props, ev });
  };

  needRelocation: boolean = false;
  oldCollapseIconVector;

  componentDidMount() {
    const topicContentResizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[], observer) => {
        this.props.controller.run('layout', this.props);
      }
    );
    topicContentResizeObserver.observe(
      this.props.getRef(contentRefKey(this.props.topicKey))
    );
  }

  componentDidUpdate() {
    if (this.needRelocation) {
      const { getRef, topicKey, setViewBoxScrollDelta } = this.props;
      const newIcon = getRef(collapseRefKey(topicKey));
      const newRect = newIcon.getBoundingClientRect();
      // const newVector = controller.run('getRelativeVectorFromViewPort', {
      //   ...this.props,
      //   element: getRef(collapseRefKey(topicKey))
      // });
      const newVector = [
        newRect.left + newRect.width / 2,
        newRect.top + newRect.height / 2,
      ];
      log('newVector:', newVector);
      log('oldVector:', this.oldCollapseIconVector);
      // TODO bug
      const vector = [
        newVector[0] - this.oldCollapseIconVector[0],
        newVector[1] - this.oldCollapseIconVector[1],
      ];
      log('vector', vector);
      setViewBoxScrollDelta(vector[0], vector[1]);
      this.needRelocation = false;
    }
  }

  onClickCollapse = (e) => {
    e.stopPropagation();
    const { topicKey, getRef } = this.props;
    this.needRelocation = true;
    const collapseIcon = getRef(collapseRefKey(topicKey));
    const rect = collapseIcon.getBoundingClientRect();
    log('oldRect', rect);
    this.oldCollapseIconVector = [
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    ];
    log('oldCollapseIconVector', this.oldCollapseIconVector);
    // this.oldCollapseIconVector = controller.run('getRelativeVectorFromViewPort', {
    //   ...this.props,
    //   element: collapseIcon
    // });
    this.operation(OpType.TOGGLE_COLLAPSE, this.props);
  };

  render() {
    const { props } = this;
    const { saveRef, topicKey, model, controller, topicStyle, dir } = props;
    log('render', topicKey, model.focusMode);
    const draggable =
      controller.run('isOperationEnabled', props) &&
      model.editingContentKey !== topicKey && this.props.onChange && this.props.onChange.length > 0;
    const collapseIcon = controller.run('renderTopicCollapseIcon', {
      ...props,
      onClickCollapse: this.onClickCollapse.bind(this),
    });
    // const prevDropArea = controller.run('renderTopicDropArea', {
    //   ...props,
    //   dropDir: 'prev'
    // });
    // const nextDropArea = controller.run('renderTopicDropArea', {
    //   ...props,
    //   dropDir: 'next'
    // });
    // const dropEventHandlers = {
    //   onDragEnter: this.onDragEnter,
    //   onDragLeave: this.onDragLeave,
    //   onDragOver: this.onDragOver,
    //   onDrop: this.onDrop
    // };
    // log(topicKey, 'style', topicStyle);
    return (
      <TopicContentWithDropArea
        onContextMenu={(e) => {
          const menu = this.renderContextMenu();
          if (menu != null) {
            e.preventDefault();
            ContextMenu.show(menu, {
              left: e.clientX,
              top: e.clientY,
            });
          }
        }}
      >
        {/* {prevDropArea} */}
        <TopicContent
          className="mindmap-topic"
          style={topicStyle}
          marginV={model.config.theme.marginV / 2}
          draggable={draggable}
          ref={saveRef(contentRefKey(topicKey))}
          onDragStart={this.onDragStart}
          onClick={this.onClick}
          onFocus={this.onFocus}
          onDoubleClick={this.onDoubleClick}
          // {...dropEventHandlers}
        >
          {controller.run('renderTopicCover', props)}
          <TopicContentBody>
            {controller.run('renderEditor', {
              node_id: props.topicKey,
            })}
            {controller.run('renderTopicBlocks', props)}
            {controller.run('renderTopicContentOthers', props)}
          </TopicContentBody>
        </TopicContent>
        {/* {nextDropArea} */}
        {((dir === TopicDirection.MAIN &&
          model.config.layoutDir !== DiagramLayoutType.LEFT_AND_RIGHT) ||
          dir !== TopicDirection.MAIN) &&
          collapseIcon}
      </TopicContentWithDropArea>
    );
  }
}

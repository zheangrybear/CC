import { createKey, OpType } from '@blink-mind/core';

import { HotKeyItem, HotKeyName, HotKeysConfig } from '../types';

function op(opType: string, props) {
  const { topicKey, model, controller } = props;
  if (topicKey === undefined) {
    props = { ...props, topicKey: model.focusKey };
  }
  if (opType === OpType.ADD_CHILD || opType === OpType.ADD_SIBLING || opType === OpType.ADD_SIBLING_ABOVE) {
    props = { ...props, newTopicKey: createKey(), newPosition: opType === 'ADD_SIBLING' ? "behind" : "forward" };
  }
  controller.run('operation', { ...props, opType });
}

export function HotKeyPlugin() {
  return {
    customizeHotKeys(props): HotKeysConfig {
      const handleKeyDown = (opType) => (e) => {
        // log('HotKeyPlugin', opType);
        e.preventDefault();
        op(opType, props);
      };
      const topicHotKeys: HotKeyItem[] = [
        {
          label: 'add child',
          combo: 'tab',
          onKeyDown: handleKeyDown(OpType.ADD_CHILD),
        },
        {
          label: 'add sibling',
          combo: 'enter',
          onKeyDown: handleKeyDown(OpType.ADD_SIBLING),
        },
        {
          label: 'add sibline above',
          combo: 'shift + enter',
          onKeyDown: handleKeyDown(OpType.ADD_SIBLING_ABOVE),
        },
        {
          label: 'delete topic',
          combo: 'del',
          onKeyDown: handleKeyDown(OpType.DELETE_TOPIC),
        },
        {
          label: 'delete topic',
          combo: 'backspace',
          onKeyDown: handleKeyDown(OpType.DELETE_TOPIC),
        },
        {
          label: 'edit content',
          combo: 'space',
          onKeyDown: handleKeyDown(OpType.START_EDITING_CONTENT),
        },
        {
          label: 'set editor root',
          combo: 'alt + shift + f',
          onKeyDown: handleKeyDown(OpType.SET_EDITOR_ROOT),
        },
      ];
      const globalHotKeys: HotKeyItem[] = [];
      return {
        topicHotKeys,
        globalHotKeys,
      };
    },
  };
}

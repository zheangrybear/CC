// @ts-nocheck
import { createKey, OpType } from '@blink-mind/core';
import { ContextMenu, MenuItem } from '@blueprintjs/core';
import * as React from 'react';

import { TopicContextMenu } from '../../components/widgets/topic-context-menu';
import { getI18nText, I18nKey, Icon } from '../../utils';

export type TopicContextMenuItemConfig = {
  icon?: string;
  label?: string;
  shortcut?: string;
  opType?: string;
  rootCanUse?: boolean;
  hotKey?: string;
};

const items: TopicContextMenuItemConfig[] = [
  {
    icon: 'edit',
    label: I18nKey.EDIT,
    shortcut: 'Space',
    rootCanUse: true,
    opType: OpType.START_EDITING_CONTENT,
  },
  {
    icon: 'add-sibling',
    label: I18nKey.ADD_SIBLING,
    shortcut: 'Enter',
    opType: OpType.ADD_SIBLING,
  },
  {
    icon: 'add-sibling',
    label: I18nKey.ADD_SIBLING_ABOVE,
    shortcut: 'Shift + Enter',
    opType: OpType.ADD_SIBLING_ABOVE,
  },
  {
    icon: 'add-child',
    label: I18nKey.ADD_CHILD,
    shortcut: 'Tab',
    rootCanUse: true,
    opType: OpType.ADD_CHILD,
  },
  {
    icon: 'delete-node',
    label: I18nKey.DELETE,
    shortcut: 'Del/Backspace',
    opType: OpType.DELETE_TOPIC,
  },
  {
    icon: 'root',
    label: I18nKey.SET_AS_EDITOR_ROOT,
    shortcut: 'Alt + Shift + F',
    opType: OpType.SET_EDITOR_ROOT,
  },
];

export function ContextMenuPlugin() {
  return {
    renderTopicContextMenu(props) {
      return <TopicContextMenu {...props} />;
    },
    customizeTopicContextMenu(ctx) {
      const { topicKey, model, controller } = ctx;
      const isRoot = topicKey === model.editorRootTopicKey;
      function onClickItem(item) {
        return function (e) {
          if (item.opType) {
            controller.run('operation', {
              ...ctx,
              newTopicKey: createKey(),
              opType: item.opType,
            });
            e.stopPropagation();
            ContextMenu.hide();
          }
        };
      }
      return items.map((item) =>
        isRoot && !item.rootCanUse ? null : (
          <MenuItem
            key={item.label}
            icon={Icon(item.icon)}
            text={getI18nText(ctx, item.label)}
            labelElement={<kbd>{item.shortcut}</kbd>}
            onClick={onClickItem(item)}
          />
        )
      );
    },
  };
}

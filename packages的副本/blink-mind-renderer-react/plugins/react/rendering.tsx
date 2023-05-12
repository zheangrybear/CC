// @ts-nocheck
import { BlockType } from '@blink-mind/core';
import debug from 'debug';
import * as React from 'react';

import { SaveRef } from '../../components/common';
import { DiagramRoot } from '../../components/widgets/diagram-root';
import { EditorRootBreadcrumbs } from '../../components/widgets/editor-root-breadcrumbs';
import { Modals } from '../../components/widgets/modals';
import { RootSubLinks } from '../../components/widgets/root-sublinks';
import { RootWidget } from '../../components/widgets/root-widget';
import { TopicCollapseIcon } from '../../components/widgets/topic-collapse-icon';
import { TopicContent } from '../../components/widgets/topic-content';
import { TopicContentWidget } from '../../components/widgets/topic-content-widget';
import { TopicFocusedTools } from '../../components/widgets/topic-focused-tools';
import { TopicSubLinks } from '../../components/widgets/topic-sub-links';
import { TopicTask } from '../../components/widgets/topic-task';
import { TopicWidget } from '../../components/widgets/topic-widget';
import { ViewPortViewer } from '../../components/widgets/view-port-util';
import { linksRefKey, PropKey, RefKey } from '../../utils';
import Theme from './theme';

const log = debug('plugin:rendering');

export function RenderingPlugin() {
  let diagramProps;
  return {
    getDiagramProps() {
      return diagramProps;
    },
    renderDiagram(props) {
      const { model } = props;
      return (
        <SaveRef>
          {(saveRef, getRef, deleteRef) => {
            diagramProps = {
              ...props,
              saveRef,
              getRef,
              deleteRef,
            };

            log('renderDiagram', model);
            return (
              <Theme theme={model.config.theme}>
                {React.createElement(DiagramRoot, diagramProps)}
              </Theme>
            );
          }}
        </SaveRef>
      );
    },

    getInitialDiagramState(props) {
      return {
        rightTopPanel: { isOpen: false, selectedTabId: 'topic-style' },
      };
    },

    renderDiagramCustomize(props) {
      const { controller, model } = props;
      const zIndex = controller.getValue(
        PropKey.DIAGRAM_CUSTOMIZE_BASE_Z_INDEX
      );
      const nProps = {
        ...props,
        zIndex,
        topicKey: model.focusKey,
      };
      const breadcrumbs = controller.run('renderEditorRootBreadcrumbs', nProps);
      // const styleEditor = controller.run('renderStyleEditor', nProps);
      // const rightTopPanel = controller.run('renderRightTopPanel', nProps);
      const modals = controller.run('renderModals', {
        ...nProps,
        zIndex: zIndex + 1,
      });
      const viewportViewer = controller.run('renderViewPortViewer', nProps);
      return [breadcrumbs, modals, viewportViewer];
    },

    renderEditorRootBreadcrumbs(props) {
      return <EditorRootBreadcrumbs key="EditorRootBreadcrumbs" {...props} />;
    },

    renderModals(props) {
      return <Modals key="modals" {...props} />;
    },

    renderModal(props) {
      return null;
    },

    getActiveModalProps(props) {
      return null;
    },

    renderDoc({ children }) {
      return children;
    },

    renderRootWidget(props) {
      return <RootWidget {...props} />;
    },

    renderTopicWidget(props) {
      return <TopicWidget {...props} />;
    },

    renderTopicContent(props) {
      return <TopicContentWidget {...props} />;
    },

    renderTopicCollapseIcon(props) {
      return <TopicCollapseIcon {...props} />;
    },

    renderTopicContentOthers(props) {
      return [];
    },

    renderTopicBlocks(props) {
      const { model, topicKey, controller } = props;
      const topic = model.getTopic(topicKey);
      const { blocks } = topic;
      const res = [];
      let i = 0;
      blocks.forEach((block) => {
        const b = controller.run('renderTopicBlock', {
          ...props,
          block,
          blockKey: `block-${i}`,
        });
        if (b) {
          res.push(<React.Fragment key={`block-${i}`}>{b}</React.Fragment>);
          i++;
        }
      });
      return res;
    },

    renderTopicBlock(props) {
      const { controller, block } = props;
      switch (block.type) {
        case BlockType.CONTENT:
          return controller.run('renderTopicBlockContent', props);
        case BlockType.TASK:
          return controller.run('renderTopicBlockTask', props);
        default:
          return controller.run('renderTopicBlockExtra', props);
      }
    },

    renderTopicBlockContent(props) {
      return <TopicContent {...props} />;
    },

    renderTopicBlockTask(props) {
      return <TopicTask {...props} />;
    },

    renderSubLinks(props) {
      const { saveRef, topicKey, model } = props;
      const topic = model.getTopic(topicKey);
      if (topic.subKeys.size === 0 || topic.collapse) return null;
      return <TopicSubLinks ref={saveRef(linksRefKey(topicKey))} {...props} />;
    },

    renderRootSubLinks(props) {
      // log('renderRootSubLinks');
      const { saveRef, topicKey } = props;
      // 这里逻辑有问题,会导致layout 错误
      // const topic = model.getTopic(topicKey);
      // if (topic.subKeys.size === 0) return null;
      return <RootSubLinks ref={saveRef(linksRefKey(topicKey))} {...props} />;
    },

    renderFocusItemTools(props) {
      const { saveRef, editable } = props;
      if (editable) {
        return (
          <TopicFocusedTools ref={saveRef(RefKey.FOCUS_TOOL_KEY)} {...props} />
        );
      }
    },

    renderRootWidgetOtherChildren(props) {
      const { controller } = props;
      const zoomFactor = controller.run('getZoomFactor', props);
      props = { ...props, zoomFactor };
      return (
        <>
          {controller.run('renderRootSubLinks', props)}
          {controller.run('renderFocusItemTools', props)}
          {controller.run('renderDragAndDropEffect', props)}
        </>
      );
    },

    renderViewPortViewer(props) {
      return <ViewPortViewer key="view-port-viewer" {...props} />;
    },
  };
}

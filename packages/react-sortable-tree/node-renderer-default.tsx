import React from 'react';

import type { ButtonStyle, NodeRendererProps } from '@/packages/react-sortable-tree';
import classnames from '@/utils/classnames';

import { isDescendant } from './utils/tree-data-utils';

const NodeRendererDefault = ({
  isSearchMatch = false,
  isSearchFocus = false,
  canDrag = false,
  toggleChildrenVisibility,
  buttons = [],
  className = '',
  style = {},
  scaffoldBlockPxWidth,
  canDrop = false,
  rowDirection = 'ltr',
  // more...
  connectDragPreview,
  connectDragSource,
  didDrop,
  isDragging,
  listIndex,
  lowerSiblingCounts,
  node,
  title,
  subtitle,
  draggedNode,
  path,
  treeId, // Not needed, but preserved for other renderers
  treeIndex,
  parentNode,
  isOver, // Not needed, but preserved for other renderers
  ...otherProps
}: NodeRendererProps) => {
  const nodeTitle = title || node.title;
  const nodeSubtitle = subtitle || node.subtitle;
  const rowDirectionClass = rowDirection === 'rtl' ? 'rst__rtl' : null;

  let handle;
  if (canDrag) {
    if (typeof node.children === 'function' && node.expanded) {
      // Show a loading symbol on the handle when the children are expanded
      //  and yet still defined by a function (a callback to fetch the children)
      handle = (
        <div className="rst__loadingHandle">
          <div className="rst__loadingCircle">
            {[...new Array(12)].map((_, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className={classnames('rst__loadingCirclePoint', rowDirectionClass)}
              />
            ))}
          </div>
        </div>
      );
    } else {
      // Show the handle used to initiate a drag-and-drop
      handle = connectDragSource(<div className="rst__moveHandle" />, {
        dropEffect: 'copy',
      });
    }
  }

  const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node);
  const isLandingPadActive = !didDrop && isDragging;

  let buttonStyle: ButtonStyle = { left: -0.5 * scaffoldBlockPxWidth };
  if (rowDirection === 'rtl') {
    buttonStyle = { right: -0.5 * scaffoldBlockPxWidth };
  }
  return (
    <div style={{ height: '100%' }} {...otherProps}>
      {toggleChildrenVisibility && node.children && (node.children.length > 0 || typeof node.children === 'function') && (
        <div>
          <button
            type="button"
            aria-label={node.expanded ? 'Collapse' : 'Expand'}
            className={classnames(node.expanded ? 'rst__collapseButton' : 'rst__expandButton', rowDirectionClass)}
            style={buttonStyle}
            onClick={() =>
              toggleChildrenVisibility({
                node,
                path,
                treeIndex,
              })
            }
          />

          {node.expanded && !isDragging && (
            <div
              style={{ width: scaffoldBlockPxWidth }}
              className={classnames('rst__lineChildren', rowDirectionClass)}
            />
          )}
        </div>
      )}

      <div className={classnames('rst__rowWrapper', rowDirectionClass)}>
        {/* Set the row preview to be used during drag and drop */}
        {connectDragPreview(
          <div
            className={classnames(
              'rst__row',
              isLandingPadActive && 'rst__rowLandingPad',
              isLandingPadActive && !canDrop && 'rst__rowCancelPad',
              isSearchMatch && 'rst__rowSearchMatch',
              isSearchFocus && 'rst__rowSearchFocus',
              rowDirectionClass,
              className
            )}
            style={{
              opacity: isDraggedDescendant ? 0.5 : 1,
              ...style,
            }}
          >
            {handle}

            <div
              className={classnames('rst__rowContents', !canDrag && 'rst__rowContentsDragDisabled', rowDirectionClass)}
            >
              <div className={classnames('rst__rowLabel', rowDirectionClass)}>
                <span className={classnames('rst__rowTitle', node.subtitle && 'rst__rowTitleWithSubtitle')}>
                  {typeof nodeTitle === 'function'
                    ? nodeTitle({
                        node,
                        path,
                        treeIndex,
                      })
                    : nodeTitle}
                </span>

                {nodeSubtitle && (
                  <span className="rst__rowSubtitle">
                    {typeof nodeSubtitle === 'function'
                      ? nodeSubtitle({
                          node,
                          path,
                          treeIndex,
                        })
                      : nodeSubtitle}
                  </span>
                )}
              </div>

              <div className="rst__rowToolbar">
                {buttons.map((btn, index) => (
                  <div
                    key={index} // eslint-disable-line react/no-array-index-key
                    className="rst__toolbarButton"
                  >
                    {btn}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeRendererDefault;

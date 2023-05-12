import React, { Children, cloneElement, useRef } from 'react';

import classnames from '@/utils/classnames';

import type { TreeNodeRendererProps } from '.';

const defaultProps = {
  swapFrom: undefined,
  swapDepth: undefined,
  swapLength: undefined,
  canDrop: false,
  draggedNode: undefined,
  rowDirection: 'ltr',
};

const TreeNodeRenderer: React.FC<TreeNodeRendererProps> = (props) => {
  const node = useRef<HTMLDivElement | null>(null);
  const {
    children,
    listIndex,
    swapFrom,
    swapLength,
    swapDepth,
    scaffoldBlockPxWidth,
    lowerSiblingCounts,
    connectDropTarget,
    isOver,
    draggedNode,
    canDrop,
    treeIndex,
    rowHeight,
    treeId: _treeId, // Delete from otherProps
    getPrevRow: _getPrevRow, // Delete from otherProps
    node: _node, // Delete from otherProps
    path: _path, // Delete from otherProps
    rowDirection,
    ...otherProps
  } = { ...defaultProps, ...props };

  const rowDirectionClass = rowDirection === 'rtl' ? 'rst__rtl' : undefined;

  // Construct the scaffold representing the structure of the tree
  const scaffoldBlockCount = lowerSiblingCounts.length;
  const scaffold: any[] = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [i, lowerSiblingCount] of lowerSiblingCounts.entries()) {
    let lineClass = '';
    if (lowerSiblingCount > 0) {
      // At this level in the tree, the nodes had sibling nodes further down

      if (listIndex === 0) {
        // Top-left corner of the tree
        // +-----+
        // |     |
        // |  +--+
        // |  |  |
        // +--+--+
        lineClass = 'rst__lineHalfHorizontalRight rst__lineHalfVerticalBottom';
      } else if (i === scaffoldBlockCount - 1) {
        // Last scaffold block in the row, right before the row content
        // +--+--+
        // |  |  |
        // |  +--+
        // |  |  |
        // +--+--+
        lineClass = 'rst__lineHalfHorizontalRight rst__lineFullVertical';
      } else {
        // Simply connecting the line extending down to the next sibling on this level
        // +--+--+
        // |  |  |
        // |  |  |
        // |  |  |
        // +--+--+
        lineClass = 'rst__lineFullVertical';
      }
    } else if (listIndex === 0) {
      // Top-left corner of the tree, but has no siblings
      // +-----+
      // |     |
      // |  +--+
      // |     |
      // +-----+
      lineClass = 'rst__lineHalfHorizontalRight';
    } else if (i === scaffoldBlockCount - 1) {
      // The last or only node in this level of the tree
      // +--+--+
      // |  |  |
      // |  +--+
      // |     |
      // +-----+
      lineClass = 'rst__lineHalfVerticalTop rst__lineHalfHorizontalRight';
    }

    scaffold.push(
      <div
        key={`pre_${1 + i}`}
        style={{ width: scaffoldBlockPxWidth }}
        className={classnames('rst__lineBlock', lineClass, rowDirectionClass ?? '')}
      />
    );

    if (treeIndex !== listIndex && i === swapDepth) {
      // This row has been shifted, and is at the depth of
      // the line pointing to the new destination
      let highlightLineClass = '';

      if (listIndex === swapFrom! + swapLength! - 1) {
        // This block is on the bottom (target) line
        // This block points at the target block (where the row will go when released)
        highlightLineClass = 'rst__highlightBottomLeftCorner';
      } else if (treeIndex === swapFrom) {
        // This block is on the top (source) line
        highlightLineClass = 'rst__highlightTopLeftCorner';
      } else {
        // This block is between the bottom and top
        highlightLineClass = 'rst__highlightLineVertical';
      }

      const style =
        rowDirection === 'rtl'
          ? {
              width: scaffoldBlockPxWidth,
              right: scaffoldBlockPxWidth * i,
            }
          : {
              width: scaffoldBlockPxWidth,
              left: scaffoldBlockPxWidth * i,
            };

      scaffold.push(
        <div
          key={i}
          style={style}
          className={classnames('rst__absoluteLineBlock', highlightLineClass, rowDirectionClass ?? '')}
        />
      );
    }
  }

  const style =
    rowDirection === 'rtl'
      ? { right: scaffoldBlockPxWidth * scaffoldBlockCount }
      : { left: scaffoldBlockPxWidth * scaffoldBlockCount };

  return connectDropTarget(
    <div
      {...otherProps}
      style={props.style}
      className={classnames('rst__node', rowDirectionClass ?? '')}
      ref={(n) => {
        node.current = n;
      }}
    >
      {scaffold}

      <div className="rst__nodeContent" style={style}>
        {Children.map(children, (child: any) =>
          cloneElement(child, {
            isOver,
            canDrop,
            draggedNode,
          })
        )}
      </div>
    </div>
  );
};

export default TreeNodeRenderer;

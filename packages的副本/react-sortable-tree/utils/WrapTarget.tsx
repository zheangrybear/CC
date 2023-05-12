import { useCallback, useMemo, useRef, useState } from 'react';
import type { DropTargetMonitor, XYCoord } from 'react-dnd';
import { useDrop } from 'react-dnd';

import type { DragItem, InstanceRef, TreeItem, TreeNodeRendererProps } from '..';
import { getDepth } from './tree-data-utils';

let rafId = 0;

const getTargetDepth = (dropTargetProps, monitor, ref, canNodeHaveChildren, treeId, maxDepth) => {
  let dropTargetDepth = 0;

  const rowAbove = dropTargetProps.getPrevRow();
  if (rowAbove) {
    const { node } = rowAbove;
    let { path } = rowAbove;
    const aboveNodeCannotHaveChildren = !canNodeHaveChildren(node);
    if (aboveNodeCannotHaveChildren) {
      path = path.slice(0, -1);
    }

    // Limit the length of the path to the deepest possible
    dropTargetDepth = Math.min(path.length, dropTargetProps.path.length);
  }

  let blocksOffset;
  let dragSourceInitialDepth = (monitor.getItem().path || []).length;

  // When adding node from external source
  if (monitor.getItem().treeId !== treeId) {
    // Ignore the tree depth of the source, if it had any to begin with
    dragSourceInitialDepth = 0;

    if (ref.current) {
      const relativePosition = ref.current.getBoundingClientRect();
      const leftShift = monitor.getSourceClientOffset().x - relativePosition.left;
      blocksOffset = Math.round(leftShift / dropTargetProps.scaffoldBlockPxWidth);
    } else {
      blocksOffset = dropTargetProps.path.length;
    }
  } else {
    // handle row direction support
    const direction = dropTargetProps.rowDirection === 'rtl' ? -1 : 1;

    blocksOffset = Math.round(
      (direction * monitor.getDifferenceFromInitialOffset().x) / dropTargetProps.scaffoldBlockPxWidth
    );
  }

  let targetDepth = Math.min(dropTargetDepth, Math.max(0, dragSourceInitialDepth + blocksOffset - 1));

  // If a maxDepth is defined, constrain the target depth
  if (typeof maxDepth !== 'undefined' && maxDepth !== undefined) {
    const draggedNode = monitor.getItem().node;
    const draggedChildDepth = getDepth(draggedNode);

    targetDepth = Math.max(0, Math.min(targetDepth, maxDepth - draggedChildDepth - 1));
  }

  return targetDepth;
};
const WrapTarget = ({
  TreeNodeRenderer,
  rstRef,
  canNodeHaveChildren,
  treeId,
  maxDepth,
  dndType,
  roottype = 'space',
  parenttypes = ['folder'],
  ...props
}: Omit<TreeNodeRendererProps, 'connectDropTarget' | 'isOver'> & {
  TreeNodeRenderer: React.FC<TreeNodeRendererProps>;
  rstRef: InstanceRef;
  dndType: string;
  maxDepth?: number;
  canNodeHaveChildren?: (node: TreeItem) => boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [draggingBorder, setDraggingBorder] = useState<number | undefined>(undefined);
  const borderStyle = useMemo(() => {
    if (draggingBorder === undefined) {
      return {};
    }
    if (draggingBorder > 1 / 3 && draggingBorder < 2 / 3 && [...parenttypes, roottype].includes(props.node.type)) {
      return { backgroundColor: 'var(--ant-primary-4)' };
    }
    if (draggingBorder < 1 / 2) {
      return { borderTopWidth: 2, paddingTop: 0 };
    }
    if (draggingBorder > 1 / 2) {
      return { borderBottomWidth: 2, paddingBottom: 0 };
    }
    return {};
  }, [draggingBorder, parenttypes, props.node.type, roottype]);

  const getDropPosition = useCallback(
    (item: { node: File.File }, monitor: DropTargetMonitor) => {
      if (!ref.current) {
        return undefined;
      }

      if (item.node.id === props.node.id) {
        return undefined;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverBoundingRectHeight = hoverBoundingRect.top - hoverBoundingRect.bottom;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.bottom;
      return (hoverBoundingRectHeight - hoverClientY) / hoverBoundingRectHeight;
      // >1/2 means down, <1/2 means up
    },
    [props.node.id]
  );

  const [{ isOver, canDrop, draggedNode }, connectDropTarget] = useDrop({
    accept: dndType,
    drop: (i, monitor) => {
      const item = i as DragItem;
      const draggingDirection = getDropPosition(item, monitor);
      let directionIndex = 0;
      if (props.treeIndex > item.treeIndex) {
        if (draggingDirection && draggingDirection < 1 / 2) {
          directionIndex = -1;
        }
      } else if (draggingDirection && draggingDirection > 1 / 2) {
        directionIndex = 1;
      }

      let result = {
        node: item.node,
        path: item.path,
        treeIndex: item.treeIndex,
        treeId,
        minimumTreeIndex: props.treeIndex + directionIndex,
        depth: props.node.path.length - 1,
      };

      if (
        draggingBorder &&
        draggingBorder > 1 / 3 &&
        draggingBorder < 2 / 3 &&
        [...parenttypes, roottype].includes(props.node.type)
      ) {
        directionIndex = 0;
        if (props.treeIndex < item.treeIndex) {
          directionIndex = 1;
        }
        result = {
          node: { ...item.node, parent_id: props.node.id },
          path: [...props.node.path, item.node.id],
          treeIndex: item.treeIndex,
          treeId,
          minimumTreeIndex: props.treeIndex + directionIndex,
          depth: props.node.path.length,
        };
      }

      rstRef.current.drop(result);

      return result;
    },

    hover: (i, monitor) => {
      const item = i as DragItem;
      const targetDepth = getTargetDepth(props, monitor, ref, canNodeHaveChildren, treeId, maxDepth);
      const draggedNodeNow = item.node;
      const needsRedraw =
        // Redraw if hovered above different nodes
        props.node !== draggedNodeNow ||
        // Or hovered above the same node but at a different depth
        targetDepth !== props.path.length - 1;

      const position = getDropPosition(item, monitor);
      if (draggingBorder !== position) setDraggingBorder(position);

      if (!needsRedraw) {
        return;
      }

      // throttle `dragHover` work to available animation frames
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // skip if drag already ended before the animation frame
        if (!item || !monitor.isOver()) {
          return;
        }
        if (![...parenttypes, roottype].includes(props.node.type) && props.node.id !== item.node.id) {
          return;
        }
        rstRef.current.dragHover({
          node: draggedNodeNow,
          path: item.path,
          minimumTreeIndex: props.listIndex,
          depth: targetDepth,
        });
      });
    },

    canDrop: (i, monitor) => {
      const item = i as DragItem;
      if (!monitor.isOver()) {
        return false;
      }

      const rowAbove = props.getPrevRow();
      const abovePath = rowAbove ? rowAbove.path : [];
      const targetDepth = getTargetDepth(props, monitor, ref, canNodeHaveChildren, treeId, maxDepth);

      // Cannot drop if we're adding to the children of the row above and
      //  the row above is a function
      if (targetDepth >= abovePath.length && typeof rowAbove?.node.children === 'function') {
        return false;
      }

      let forceDrop;

      if (props.node.type === roottype) {
        if (item.node.type === roottype) {
          forceDrop = draggingBorder !== undefined && (draggingBorder <= 1 / 3 || draggingBorder >= 2 / 3);
        } else {
          forceDrop = draggingBorder !== undefined && draggingBorder > 1 / 3 && draggingBorder < 2 / 3;
        }
      }

      if (typeof rstRef.current.canDrop === 'function') {
        const { node } = item;

        return rstRef.current.canDrop({
          node,
          forceDrop,
          prevPath: item.path,
          prevParent: item.parentNode,
          prevTreeIndex: item.treeIndex, // Equals -1 when dragged from external tree
          nextPath: props.children.props.path,
          nextParent: props.children.props.parentNode,
          nextTreeIndex: props.children.props.treeIndex,
        });
      }

      return true;
    },

    collect: (monitor) => {
      const dragged = monitor.getItem() as DragItem;
      if (!monitor.isOver()) {
        setDraggingBorder(undefined);
      }
      return {
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
        draggedNode: dragged ? dragged.node : undefined,
      };
    },
  });

  return (
    <div ref={ref} style={{ paddingTop: 2, paddingBottom: 2, ...borderStyle, borderColor: 'var(--ant-primary-color)' }}>
      <TreeNodeRenderer
        isOver={isOver}
        canDrop={canDrop}
        draggedNode={draggedNode}
        treeId={treeId}
        connectDropTarget={connectDropTarget}
        roottype={roottype}
        parenttypes={parenttypes}
        {...props}
      />
    </div>
  );
};

export default WrapTarget;

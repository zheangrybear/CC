import { useDrag } from 'react-dnd';

import type { NodeRendererProps } from '@/packages/react-sortable-tree';

import type { DragItem, InstanceRef, NodeRenderer } from '..';

const WrapSource = ({
  rstRef,
  dndType,
  nodeContentRenderer: NodeContentRenderer,
  ...props
}: Omit<NodeRendererProps, 'isDragging' | 'didDrop' | 'connectDragSource' | 'connectDragPreview'> & {
  rstRef: InstanceRef;
  dndType: string;
  nodeContentRenderer: NodeRenderer;
}) => {
  const [{ isDragging, didDrop }, connectDragSource, connectDragPreview] = useDrag({
    type: dndType,
    item: (): DragItem => {
      rstRef.current.startDrag(props);
      return {
        node: props.node,
        parentNode: props.parentNode,
        path: props.path,
        treeIndex: props.treeIndex,
        treeId: props.treeId,
      };
    },
    isDragging: (monitor) => {
      const dropTargetNode = monitor.getItem().node;
      const draggedNode = props.node;

      return draggedNode === dropTargetNode;
    },
    end: (__, monitor) => {
      rstRef.current.endDrag(monitor.getDropResult());
    },
    options: {
      dropEffect: props.canDrop ? 'copy' : '',
    },
    collect: (monitor) => {
      return {
        didDrop: monitor.didDrop(),
        isDragging: monitor.isDragging(),
      };
    },
  });
  return (
    <NodeContentRenderer
      isDragging={isDragging}
      didDrop={didDrop}
      connectDragSource={connectDragSource}
      connectDragPreview={connectDragPreview}
      {...props}
    />
  );
};

export default WrapSource;

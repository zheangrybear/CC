import type * as React from 'react';
import type { ConnectDragPreview, ConnectDragSource, ConnectDropTarget, DropTargetMonitor } from 'react-dnd';

export * from './utils/default-handlers';
export * from './utils/tree-data-utils';

export interface GetTreeItemChildren {
  done: (children: TreeItem[]) => void;
  node: TreeItem;
  path: File.Path;
  lowerSiblingCounts: number[];
  treeIndex: number;
}

export interface DragItem {
  node: TreeItem;
  parentNode?: TreeItem;
  path: File.Path;
  treeIndex: number;
  treeId: string;
}

export type GetTreeItemChildrenFn = (data: GetTreeItemChildren) => void;

type ButtonKeys = 'left' | 'right';
export type ButtonStyle = {
  [K in Keys]?: number;
};

export type TreeItem = File.File;

export interface TreeNode {
  node: TreeItem;
}

export interface TreePath {
  path: File.Path;
}

export interface TreeIndex {
  treeIndex: number;
}

export interface FullTree {
  treeData?: TreeItem[];
}

export interface NodeData extends TreeNode, TreePath, TreeIndex {}

export interface FlatDataItem extends TreeNode, TreePath {
  lowerSiblingCounts: number[];
  parentNode: TreeItem;
}

export interface SearchData extends NodeData {
  searchQuery: any;
}

export interface ExtendedNodeData extends NodeData {
  parentNode: TreeItem;
  lowerSiblingCounts: number[];
  isSearchMatch: boolean;
  isSearchFocus: boolean;
}

export interface OnVisibilityToggleData extends FullTree, TreeNode {
  expanded: boolean;
}

export interface OnDragStateChangedData {
  isDragging: boolean;
  draggedNode: TreeItem;
}

interface PreviousAndNextLocation {
  prevTreeIndex: number;
  prevPath: File.Path;
  nextTreeIndex: number;
  nextPath: File.Path;
  forceDrop?: boolean;
}

export interface CanDropParams extends PreviousAndNextLocation {
  node: TreeItem;
  prevPath: File.Path;
  prevParent?: TreeItem;
  nextParent?: TreeItem;
  forceDrop?: boolean;
}

export interface OnDragPreviousAndNextLocation extends PreviousAndNextLocation {
  prevParent: TreeItem | null;
  nextParent: TreeItem | null;
}

export interface ShouldCopyData {
  node: TreeNode;
  prevPath: File.Path;
  prevTreeIndex: number;
}

export interface OnMovePreviousAndNextLocation extends PreviousAndNextLocation {
  nextParentNode: TreeItem | null;
}

export type InstanceRef = React.MutableRefObject<{
  canDrop: (data: CanDropParams) => boolean;
  drop: (dropResult: any) => void;
  dragHover: ({ node, depth, minimumTreeIndex }: any) => void;
  startDrag: ({ path }: any) => void;
  endDrag: (dropResult?: any) => void;
}>;

export interface NodeRendererProps {
  active: boolean;
  node: TreeItem;
  path: File.Path;
  treeIndex: number;
  isSearchMatch: boolean;
  isSearchFocus: boolean;
  canDrag: boolean;
  scaffoldBlockPxWidth: number;
  toggleChildrenVisibility?: (data: NodeData) => void;
  buttons?: JSX.Element[] | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
  title?: ((data: NodeData) => JSX.Element | JSX.Element) | undefined;
  subtitle?: ((data: NodeData) => JSX.Element | JSX.Element) | undefined;
  icons?: JSX.Element[] | undefined;
  lowerSiblingCounts: number[];
  swapDepth?: number | undefined;
  swapFrom?: number | undefined;
  swapLength?: number | undefined;
  listIndex: number;
  treeId: string;
  rowDirection?: 'ltr' | 'rtl' | undefined;

  connectDragPreview: ConnectDragPreview;
  connectDragSource: ConnectDragSource;
  parentNode?: TreeItem;
  startDrag: any;
  endDrag: any;
  isDragging: boolean;
  didDrop: boolean;
  draggedNode?: TreeItem;
  isOver: boolean;
  canDrop?: boolean | undefined;
}

export type NodeRenderer = React.FC<NodeRendererProps>;

export interface TreeNodeRendererProps {
  treeIndex: number;
  treeId: string;
  swapFrom?: number | undefined;
  swapDepth?: number | undefined;
  swapLength?: number | undefined;
  scaffoldBlockPxWidth: number;
  lowerSiblingCounts: number[];
  rowDirection?: 'ltr' | 'rtl' | undefined;
  rowHeight?: number | ((treeIndex: number, node: any, path: any[]) => number);

  listIndex: number;
  children: JSX.Element;
  style?: React.CSSProperties | undefined;

  // used in dndManager
  getPrevRow: () => FlatDataItem | null;
  node: TreeItem;
  path: File.Path;
  // Drop target
  connectDropTarget: ConnectDropTarget;
  isOver?: boolean;
  canDrop?: boolean | undefined;
  draggedNode?: TreeItem | undefined;
  roottype?: string;
  parenttypes?: string[];
}

interface ThemeTreeProps {
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  scaffoldBlockPxWidth?: number;
  slideRegionSize?: number;
  rowHeight?: ((info: NodeData) => number) | number;
  nodeContentRenderer?: NodeRenderer;
}

export interface ThemeProps extends ThemeTreeProps {
  treeNodeRenderer?: TreeRenderer;
}

export interface ReactSortableTreeInstanceProps {
  treeData?: any[];
  ignoreOneTreeUpdate?: boolean;
  searchQuery?: string;
  searchFocusOffset?: number;
}

export interface SearchResult {
  searchMatches?: any[];
  searchFocusTreeIndex?: number;
  instanceProps?: ReactSortableTreeInstanceProps;
}

export interface ReactSortableTreeState {
  draggingTreeData?: TreeItem[];
  draggedNode?: TreeItem;
  draggedMinimumTreeIndex?: number;
  draggedDepth?: number;
  searchMatches: any[];
  searchFocusTreeIndex?: number;
  dragging: boolean;
  // props that need to be used in gDSFP or static functions will be stored here
  instanceProps: ReactSortableTreeInstanceProps;
}

export interface ReactSortableTreeProps extends ThemeTreeProps {
  treeData: TreeItem[];
  onChange?: (treeData: TreeItem[]) => void;
  getNodeKey?: (data: TreeNode & TreeIndex) => string | number;
  generateNodeProps?: (data: ExtendedNodeData) => Record<string, any>;
  onMoveNode?: (data: NodeData & FullTree & OnMovePreviousAndNextLocation) => void;
  onVisibilityToggle?: (data: OnVisibilityToggleData) => void;
  onDragStateChanged?: (data: OnDragStateChangedData) => void;
  maxDepth?: number;
  rowDirection?: 'ltr' | 'rtl' | undefined;
  canDrag?: ((data: ExtendedNodeData) => boolean) | boolean | undefined;
  canDrop?: (data: OnDragPreviousAndNextLocation & NodeData) => boolean;
  canNodeHaveChildren?: (node: TreeItem) => boolean;
  theme?: ThemeProps;
  searchMethod?: (data: SearchData) => boolean;
  searchQuery?: string | any | undefined;
  searchFocusOffset?: number;
  onlyExpandSearchedNodes?: boolean | undefined;
  searchFinishCallback?: (matches: NodeData[]) => void;
  dndType?: string | undefined;
  shouldCopyOnOutsideDrop?: boolean | ((data: ShouldCopyData) => boolean) | undefined;
  className?: string | undefined;
  dragDropManager?: {
    getMonitor: () => DropTargetMonitor;
  };
  roottype?: string;
  parenttypes?: string[];
}

// tslint:disable-next-line:no-unnecessary-generics
declare function ReactSortableTree(props: React.PropsWithChildren<ReactSortableTreeProps>): JSX.Element;
export default ReactSortableTree;

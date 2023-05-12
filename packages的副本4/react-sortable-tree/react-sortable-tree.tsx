import type { DragDropMonitor, Unsubscribe } from 'dnd-core';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DndProvider, useDragDropManager } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useMount, useRendersCount } from 'react-use';

import classnames from '@/utils/classnames';

import type { ReactSortableTreeProps, ReactSortableTreeState, SearchResult } from './index';
import NodeRendererDefault from './node-renderer-default';
import TreeNodeRendererDefault from './tree-node-renderer-default';
import { defaultGetNodeKey, defaultSearchMethod } from './utils/default-handlers';
import { slideRows } from './utils/generic-utils';
import {
  memoizedGetDescendantCount,
  memoizedGetFlatDataFromTree,
  memoizedInsertNode,
} from './utils/memoized-tree-data-utils';
import {
  changeNodeAtPath,
  find,
  getFlatDataFromTree,
  insertNode,
  removeNode,
  toggleExpandedForAll,
  walk,
} from './utils/tree-data-utils';
import WrapSource from './utils/WrapSource';
import WrapTarget from './utils/WrapTarget';

let treeIdCounter = 0;

// Load any children in the tree that are given by a function
// calls the onChange callback on the new treeData
const loadLazyChildren = (props, state) => {
  const { instanceProps } = state;

  let newTreeData = props.treeData;
  walk({
    treeData: instanceProps.treeData,
    getNodeKey: props.getNodeKey,
    callback: ({ node, path, lowerSiblingCounts, treeIndex }) => {
      // If the node has children defined by a function, and is either expanded
      //  or set to load even before expansion, run the function.
      if (node.children && typeof node.children === 'function' && (node.expanded || props.loadCollapsedLazyChildren)) {
        // Call the children fetching function
        node.children({
          node,
          path,
          lowerSiblingCounts,
          treeIndex,

          // Provide a helper to append the new data when it is received
          done: (childrenArray) => {
            newTreeData = changeNodeAtPath({
              treeData: newTreeData,
              path,
              newNode: ({ node: oldNode }) =>
                // Only replace the old node if it's the one we set off to find children
                //  for in the first place
                oldNode === node
                  ? {
                      ...oldNode,
                      children: childrenArray,
                    }
                  : oldNode,
              getNodeKey: props.getNodeKey,
            });
          },
        });
      }
    },
  });
};

// returns the new state after search
const search = (props, state: ReactSortableTreeState, seekIndex, expand, singleSearch): SearchResult => {
  const {
    onChange,
    getNodeKey,
    searchFinishCallback,
    searchQuery,
    searchMethod,
    searchFocusOffset,
    onlyExpandSearchedNodes,
  } = props;

  const { instanceProps } = state;

  // Skip search if no conditions are specified
  if (!searchQuery && !searchMethod) {
    if (searchFinishCallback) {
      searchFinishCallback([]);
    }

    return { searchMatches: [] };
  }

  const newState: SearchResult = {
    instanceProps: {},
  };
  const { treeData: expandedTreeData, matches: searchMatches } = find({
    getNodeKey,
    treeData: onlyExpandSearchedNodes
      ? toggleExpandedForAll({
          treeData: instanceProps.treeData,
          expanded: false,
        })
      : instanceProps.treeData,
    searchQuery,
    searchMethod: searchMethod || defaultSearchMethod,
    searchFocusOffset,
    expandAllMatchPaths: expand && !singleSearch,
    expandFocusMatchPaths: !!expand,
  });

  // Update the tree with data leaving all paths leading to matching nodes open
  if (expand) {
    newState.instanceProps!.ignoreOneTreeUpdate = true; // Prevents infinite loop
    onChange(expandedTreeData);
  }

  let searchFocusTreeIndex;
  if (seekIndex && searchFocusOffset !== null && searchFocusOffset < searchMatches.length) {
    searchFocusTreeIndex = searchMatches[searchFocusOffset].treeIndex;
  }
  newState.searchMatches = searchMatches;
  newState.searchFocusTreeIndex = searchFocusTreeIndex;
  if (searchFinishCallback) {
    searchFinishCallback(searchMatches, searchFocusTreeIndex);
  }

  return newState;
};
const defaultTheme = {
  rowHeight: 62,
  scaffoldBlockPxWidth: 44,
  slideRegionSize: 100,
  nodeContentRenderer: NodeRendererDefault,
  treeNodeRenderer: TreeNodeRendererDefault,
};

const ReactSortableTree = (rawProps: ReactSortableTreeProps) => {
  const treeId = useRef(`rst__${treeIdCounter++}`).current; // eslint-disable-line no-plusplus
  const rendersCount = useRendersCount();
  if (process.env.NEXT_PUBLIC_PRODUCTION === 'yes') {
    console.info(`RST[${treeId}]: rendered ${rendersCount} times`);
  }
  const style = useMemo(() => ({ ...rawProps.theme?.style, ...rawProps.style }), [rawProps.theme, rawProps.style]);
  const innerStyle = useMemo(
    () => ({ ...rawProps.theme?.innerStyle, ...rawProps.innerStyle }),
    [rawProps.theme, rawProps.innerStyle]
  );
  const props = useMemo(() => {
    // defaultTheme < rawProps.theme < rawProps
    return {
      canDrag: true,
      className: '',
      generateNodeProps: null,
      rowDirection: 'ltr',
      shouldCopyOnOutsideDrop: false,
      searchFocusOffset: null,
      onChange: () => {},
      getNodeKey: defaultGetNodeKey,
      ...defaultTheme,
      ..._.pick(rawProps.theme, Object.keys(defaultTheme)),
      ...rawProps,
      style,
      innerStyle,
    };
  }, [rawProps, style, innerStyle]);
  const {
    canDrop,
    maxDepth,
    nodeContentRenderer,
    treeNodeRenderer,
    canDrag,
    className,
    generateNodeProps,
    getNodeKey,
    onChange,
    onDragStateChanged,
    onMoveNode = () => {},
    onVisibilityToggle = () => {},
    rowDirection,
    rowHeight,
    scaffoldBlockPxWidth,
    searchFocusOffset,
    shouldCopyOnOutsideDrop,
  } = props;
  const dragDropManager = useDragDropManager();
  const monitor: DragDropMonitor = dragDropManager.getMonitor();
  const getRows = useCallback(
    (treeData) => {
      return memoizedGetFlatDataFromTree({
        ignoreCollapsed: true,
        getNodeKey,
        treeData,
      });
    },
    [getNodeKey]
  );
  const dndType = props.dndType || treeId;
  const [prevState, setPrevState] = useState<ReactSortableTreeState>({
    draggingTreeData: undefined,
    draggedNode: undefined,
    draggedMinimumTreeIndex: undefined,
    draggedDepth: undefined,
    searchMatches: [],
    searchFocusTreeIndex: undefined,
    dragging: false,
    // props that need to be used in gDSFP or static functions will be stored here
    instanceProps: {
      treeData: [],
      ignoreOneTreeUpdate: false,
      searchQuery: undefined,
      searchFocusOffset: undefined,
    },
  });

  const state = useMemo(() => {
    // hook implementation of getDerivedStateFromProps
    const { instanceProps } = prevState;
    const newState: ReactSortableTreeState = {
      dragging: false,
      searchMatches: [],
      instanceProps: {},
    };

    const isTreeDataEqual = _.isEqual(instanceProps.treeData, props.treeData);

    // make sure we have the most recent version of treeData
    instanceProps.treeData = props.treeData;

    if (!isTreeDataEqual) {
      if (instanceProps.ignoreOneTreeUpdate) {
        instanceProps.ignoreOneTreeUpdate = false;
      } else {
        newState.searchFocusTreeIndex = undefined;
        loadLazyChildren(props, prevState);
        Object.assign(newState, search(props, prevState, false, false, false));
      }

      newState.draggingTreeData = undefined;
      newState.draggedNode = undefined;
      newState.draggedMinimumTreeIndex = undefined;
      newState.draggedDepth = undefined;
      newState.dragging = false;
    } else if (!_.isEqual(instanceProps.searchQuery, props.searchQuery)) {
      Object.assign(newState, search(props, prevState, true, true, false));
    } else if (instanceProps.searchFocusOffset !== props.searchFocusOffset) {
      Object.assign(newState, search(props, prevState, true, true, true));
    }

    instanceProps.searchQuery = props.searchQuery;
    instanceProps.searchFocusOffset = props.searchFocusOffset;
    newState.instanceProps = { ...instanceProps, ...newState.instanceProps };
    return { ...prevState, ...newState };
  }, [props, prevState]);

  useMount(() => {
    loadLazyChildren(props, state);
    const stateUpdate = search(props, state, true, true, false);
    setPrevState({ ...state, ...stateUpdate });
  });

  const {
    searchMatches,
    draggedNode,
    draggedDepth,
    draggedMinimumTreeIndex,
    instanceProps,
    draggingTreeData,
    dragging,
  } = state;

  const endDrag = useCallback(
    (dropResult?: any) => {
      const resetTree = () =>
        setPrevState({
          ...state,
          draggingTreeData: undefined,
          draggedNode: undefined,
          draggedMinimumTreeIndex: undefined,
          draggedDepth: undefined,
          dragging: false,
        });

      // Drop was cancelled
      if (!dropResult) {
        resetTree();
      } else if (dropResult.treeId !== treeId) {
        // The node was dropped in an external drop target or tree
        const { node, path, treeIndex } = dropResult;
        let shouldCopy = shouldCopyOnOutsideDrop;
        if (typeof shouldCopy === 'function') {
          shouldCopy = shouldCopy({
            node,
            prevTreeIndex: treeIndex,
            prevPath: path,
          });
        }

        let newTreeData = draggingTreeData || instanceProps.treeData;

        // If copying is enabled, a drop outside leaves behind a copy in the
        //  source tree
        if (shouldCopy) {
          newTreeData = changeNodeAtPath({
            treeData: instanceProps.treeData, // use treeData unaltered by the drag operation
            path,
            newNode: ({ node: copyNode }) => ({ ...copyNode }), // create a shallow copy of the node
            getNodeKey,
          });
        }

        onChange(newTreeData);
        onMoveNode({
          treeData: newTreeData,
          node,
          treeIndex: null,
          path: null,
          nextPath: null,
          nextTreeIndex: null,
          prevPath: path,
          prevTreeIndex: treeIndex,
        });
      }
    },
    [draggingTreeData, getNodeKey, instanceProps.treeData, onChange, onMoveNode, shouldCopyOnOutsideDrop, state, treeId]
  );

  const startDrag = useCallback(
    ({ path }) => {
      setPrevState((pState) => {
        const { treeData, node, treeIndex } = removeNode({
          treeData: pState.instanceProps.treeData,
          path,
          getNodeKey,
        });

        return {
          ...pState,
          draggingTreeData: treeData,
          draggedNode: node,
          draggedDepth: path.length - 1,
          draggedMinimumTreeIndex: treeIndex,
          dragging: true,
        };
      });
    },
    [getNodeKey]
  );

  const dragHover = useCallback(
    ({ node, depth, minimumTreeIndex }) => {
      // disable the state change
      return;
      // Ignore this hover if it is at the same position as the last hover
      if (state.draggedDepth === depth && state.draggedMinimumTreeIndex === minimumTreeIndex) {
        return;
      }

      setPrevState((s) => {
        // Fall back to the tree data if something is being dragged in from
        //  an external element
        let newDraggingTreeData = s.draggingTreeData || s.instanceProps.treeData;
        let newDraggedDepth = depth;
        let newDraggedMinimumTreeIndex = minimumTreeIndex;
        const flatDraggingTreeData = getFlatDataFromTree({
          treeData: newDraggingTreeData,
          getNodeKey,
          ignoreCollapsed: false,
        });
        const flatDataIDs = flatDraggingTreeData.map((v) => v.node.id);
        if (flatDataIDs.includes(node.id)) {
          const draggedNodePath = flatDraggingTreeData.find((v) => v.node.id === node.id).path;
          const { treeData: filtedDraggingTreeData, treeIndex: filtedDraggedMinimumTreeIndex } = removeNode({
            treeData: newDraggingTreeData,
            path: draggedNodePath,
            getNodeKey,
          });
          newDraggingTreeData = filtedDraggingTreeData;
          newDraggedMinimumTreeIndex = filtedDraggedMinimumTreeIndex;
          newDraggedDepth = draggedNodePath.length - 1;
        }

        const addedResult = memoizedInsertNode({
          treeData: newDraggingTreeData,
          newNode: node,
          depth: newDraggedDepth,
          minimumTreeIndex: newDraggedMinimumTreeIndex,
          expandParent: true,
          getNodeKey,
        });

        const rows = getRows(addedResult.treeData);
        const expandedParentPath = rows[addedResult.treeIndex].path;

        return {
          ...state,
          draggedNode: node,
          draggedDepth: newDraggedDepth,
          draggedMinimumTreeIndex: newDraggedMinimumTreeIndex,
          draggingTreeData: changeNodeAtPath({
            treeData: newDraggingTreeData,
            path: expandedParentPath.slice(0, -1),
            newNode: ({ node: nodeToExpand }) => ({ ...nodeToExpand, expanded: true }),
            getNodeKey,
          }),
          // reset the scroll focus so it doesn't jump back
          // to a search result while dragging
          searchFocusTreeIndex: undefined,
          dragging: true,
        };
      });
    },
    [getNodeKey, getRows, state]
  );

  const moveNode = useCallback(
    ({ node, treeIndex: prevTreeIndex, depth, minimumTreeIndex }) => {
      const {
        treeData,
        treeIndex,
        path,
        parentNode: nextParentNode,
      } = insertNode({
        treeData: draggingTreeData,
        newNode: node,
        depth,
        minimumTreeIndex,
        expandParent: true,
        getNodeKey,
      });

      onChange(treeData);
      onMoveNode({
        treeData,
        node,
        treeIndex,
        path,
        nextPath: path,
        nextTreeIndex: treeIndex,
        prevPath: node.path,
        prevTreeIndex,
        nextParentNode,
      });
      setPrevState({
        ...state,
        dragging: false,
      });
    },
    [draggingTreeData, getNodeKey, onChange, onMoveNode, state]
  );

  const clearMonitorSubscriptionRef = useRef<Unsubscribe>();

  const handleDndMonitorChange = useCallback(() => {
    // TODO deal with endDrag elegantly later
    // If the drag ends and the tree is still in a mid-drag state,
    // it means that the drag was canceled or the dragSource dropped
    // elsewhere, and we should reset the state of this tree
    if (!monitor.isDragging() && draggingTreeData) {
      setTimeout(() => {
        endDrag();
      });
    }
  }, [draggingTreeData, endDrag, monitor]);

  useEffect(() => {
    // Hook into react-dnd state changes to detect when the drag ends
    // TODO: This is very brittle, so it needs to be replaced if react-dnd
    // offers a more official way to detect when a drag ends
    clearMonitorSubscriptionRef.current = monitor.subscribeToStateChange(handleDndMonitorChange);
    return () => {
      if (clearMonitorSubscriptionRef.current) clearMonitorSubscriptionRef.current();
    };
  }, [handleDndMonitorChange, monitor]);

  useEffect(() => {
    if (onDragStateChanged) {
      onDragStateChanged({
        isDragging: dragging,
        draggedNode,
      });
    }
  }, [draggedNode, dragging, onDragStateChanged]);

  const drop = useCallback(
    (dropResult) => {
      moveNode(dropResult);
    },
    [moveNode]
  );
  const rstRef = useRef({
    canDrop,
    drop,
    dragHover,
    startDrag,
    endDrag,
  });
  useEffect(() => {
    rstRef.current = {
      dragHover,
      drop,
      endDrag,
      startDrag,
      canDrop,
    };
  }, [drop, dragHover, startDrag, endDrag, canDrop]);
  const treeData = draggingTreeData || instanceProps.treeData;
  const rowDirectionClass = rowDirection === 'rtl' ? 'rst__rtl' : null;
  const toggleChildrenVisibility = useCallback(
    ({ node: targetNode, path }) => {
      const newTreeData = changeNodeAtPath({
        treeData: instanceProps.treeData,
        path,
        newNode: ({ node }) => ({ ...node, expanded: !node.expanded }),
        getNodeKey,
      });
      onChange(newTreeData);
      onVisibilityToggle({
        node: targetNode,
        expanded: !targetNode.expanded,
        treeData: newTreeData,
        path,
      });
    },
    [getNodeKey, instanceProps.treeData, onChange, onVisibilityToggle]
  );

  let rows;
  let swapFrom = null;
  let swapLength;
  if (draggedNode && draggedMinimumTreeIndex !== null) {
    const addedResult = memoizedInsertNode({
      treeData,
      newNode: draggedNode,
      depth: draggedDepth,
      minimumTreeIndex: draggedMinimumTreeIndex,
      expandParent: true,
      getNodeKey,
    });

    const swapTo = draggedMinimumTreeIndex;
    swapFrom = addedResult.treeIndex;
    swapLength = 1 + memoizedGetDescendantCount({ node: draggedNode });
    rows = slideRows(getRows(addedResult.treeData), swapFrom, swapTo, swapLength);
  } else {
    rows = getRows(treeData);
  }

  const renderRow = useCallback(
    (row, { listIndex, style: _style, getPrevRow, matchKeys, swapFrom: sFrom, swapDepth, swapLength: sLength }) => {
      const { node, parentNode, path, lowerSiblingCounts, treeIndex } = row;
      const nodeKey = path[path.length - 1];
      const isSearchMatch = nodeKey in matchKeys;
      const isSearchFocus = isSearchMatch && matchKeys[nodeKey] === searchFocusOffset;
      const callbackParams = {
        node,
        parentNode,
        path,
        lowerSiblingCounts,
        treeIndex,
        isSearchMatch,
        isSearchFocus,
      };
      const nodeProps = !generateNodeProps ? {} : generateNodeProps(callbackParams);
      const rowCanDrag = typeof canDrag !== 'function' ? canDrag : canDrag(callbackParams);

      const sharedProps = {
        treeIndex,
        scaffoldBlockPxWidth,
        node,
        path,
        treeId,
        rowDirection,
      };

      return (
        <WrapTarget
          TreeNodeRenderer={treeNodeRenderer}
          rstRef={rstRef}
          dndType={dndType}
          maxDepth={maxDepth}
          canNodeHaveChildren={props.canNodeHaveChildren}
          style={_style}
          key={nodeKey}
          listIndex={listIndex}
          getPrevRow={getPrevRow}
          lowerSiblingCounts={lowerSiblingCounts}
          swapFrom={sFrom}
          swapLength={sLength}
          swapDepth={swapDepth}
          roottype={props.roottype}
          parenttypes={props.parenttypes}
          {...sharedProps}
        >
          <WrapSource
            rstRef={rstRef}
            dndType={dndType}
            nodeContentRenderer={nodeContentRenderer}
            parentNode={parentNode}
            isSearchMatch={isSearchMatch}
            isSearchFocus={isSearchFocus}
            canDrag={rowCanDrag}
            toggleChildrenVisibility={toggleChildrenVisibility}
            lowerSiblingCounts={lowerSiblingCounts}
            {...sharedProps}
            {...nodeProps}
          />
        </WrapTarget>
      );
    },
    [
      canDrag,
      dndType,
      generateNodeProps,
      maxDepth,
      nodeContentRenderer,
      props.canNodeHaveChildren,
      props.parenttypes,
      props.roottype,
      rowDirection,
      scaffoldBlockPxWidth,
      searchFocusOffset,
      toggleChildrenVisibility,
      treeId,
      treeNodeRenderer,
    ]
  );

  // Get indices for rows that match the search conditions
  const matchKeys = {};
  searchMatches.forEach(({ path }, i) => {
    matchKeys[path[path.length - 1]] = i;
  });
  let list = null;
  if (rows.length >= 1) {
    // Render list without react-virtualized

    list = rows.map((row, index) =>
      renderRow(row, {
        listIndex: index,
        style: {
          height:
            typeof rowHeight !== 'function'
              ? rowHeight
              : rowHeight({
                  treeIndex: index,
                  node: row.node,
                  path: row.path,
                }),
        },
        getPrevRow: () => rows[index - 1] || null,
        matchKeys,
        swapFrom,
        swapDepth: draggedDepth,
        swapLength,
      })
    );
  }

  return (
    <div className={classnames('rst__tree', className, rowDirectionClass)} style={style}>
      {list}
    </div>
  );
};

export const ReactSortableTreeWithProvider = (props: ReactSortableTreeProps) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <ReactSortableTree {...props} />
    </DndProvider>
  );
};
export default ReactSortableTree;

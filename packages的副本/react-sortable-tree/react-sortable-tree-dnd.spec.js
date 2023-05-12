import { mount } from 'enzyme';
import React from 'react';
import { DndContext, DndProvider } from 'react-dnd';
import { TestBackend } from 'react-dnd-test-backend';

import { SortableTreeWithoutDndContext } from './react-sortable-tree';

describe('<SortableTree />', () => {
  it.skip('drag node with SortableTreeWithoutDndContext', () => {
    const onDragStateChanged = jest.fn();
    const treeData = [{ title: 'a' }, { title: 'b' }];
    let manager = null;

    const wrapper = mount(
      <DndProvider backend={TestBackend}>
        <DndContext.Consumer>
          {({ dragDropManager }) => {
            manager = dragDropManager;
          }}
        </DndContext.Consumer>
        <SortableTreeWithoutDndContext
          treeData={treeData}
          onDragStateChanged={onDragStateChanged}
          onChange={() => {}}
        />
      </DndProvider>
    );

    // Obtain a reference to the backend
    const backend = manager.getBackend();

    // Retrieve our DnD-wrapped node component type
    const wrappedNodeType = wrapper.find('ReactSortableTree').instance().nodeContentRenderer;

    // And get the first such component
    const nodeInstance = wrapper.find(wrappedNodeType).first().instance();

    backend.simulateBeginDrag([nodeInstance.getHandlerId()]);

    expect(onDragStateChanged).toHaveBeenCalledWith({
      isDragging: true,
      draggedNode: treeData[0],
    });

    backend.simulateEndDrag([nodeInstance.getHandlerId()]);

    expect(onDragStateChanged).toHaveBeenCalledWith({
      isDragging: false,
      draggedNode: null,
    });
    expect(onDragStateChanged).toHaveBeenCalledTimes(2);
  });
});

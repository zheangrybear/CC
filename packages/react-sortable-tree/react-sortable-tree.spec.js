/* eslint-disable react/no-multi-comp, react/prefer-stateless-function */
import { render } from '@testing-library/react';
import { mount } from 'enzyme';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import renderer from 'react-test-renderer';

import DefaultNodeRenderer from './node-renderer-default';
import { ReactSortableTreeWithProvider } from './react-sortable-tree';
import TreeNodeRendererDefault from './tree-node-renderer-default';

describe('<SortableTree />', () => {
  it('should render tree correctly', () => {
    const tree = renderer.create(<ReactSortableTreeWithProvider treeData={[{}]} onChange={() => {}} />).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('should render nodes for flat data', () => {
    let wrapper;

    // No nodes
    wrapper = mount(<ReactSortableTreeWithProvider treeData={[]} onChange={() => {}} />);
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(0);

    // Single node
    wrapper = mount(<ReactSortableTreeWithProvider treeData={[{}]} onChange={() => {}} />);
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(1);

    // Two nodes
    wrapper = mount(<ReactSortableTreeWithProvider treeData={[{}, {}]} onChange={() => {}} />);
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(2);
  });

  it('should render nodes for nested, expanded data', () => {
    let wrapper;

    // Single Nested
    wrapper = mount(
      <ReactSortableTreeWithProvider treeData={[{ expanded: true, children: [{}] }]} onChange={() => {}} />
    );
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(2);

    // Double Nested
    wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[{ expanded: true, children: [{ expanded: true, children: [{}] }] }]}
        onChange={() => {}}
      />
    );
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(3);

    // 2x Double Nested Siblings
    wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[
          { expanded: true, children: [{ expanded: true, children: [{}] }] },
          { expanded: true, children: [{ expanded: true, children: [{}] }] },
        ]}
        onChange={() => {}}
      />
    );
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(6);
  });

  it('should render nodes for nested, collapsed data', () => {
    let wrapper;

    // Single Nested
    wrapper = mount(
      <ReactSortableTreeWithProvider treeData={[{ expanded: false, children: [{}] }]} onChange={() => {}} />
    );
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(1);

    // Double Nested
    wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[{ expanded: false, children: [{ expanded: false, children: [{}] }] }]}
        onChange={() => {}}
      />
    );
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(1);

    // 2x Double Nested Siblings, top level of first expanded
    wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[
          { expanded: true, children: [{ expanded: false, children: [{}] }] },
          { expanded: false, children: [{ expanded: false, children: [{}] }] },
        ]}
        onChange={() => {}}
      />
    );
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(3);
  });

  it('should reveal hidden nodes when visibility toggled', () => {
    let treeData;
    const wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[{ title: 'a', children: [{ title: 'b' }] }]}
        onChange={(d) => {
          treeData = d;
        }}
      />
    );

    // Check nodes in collapsed state
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(1);
    // Expand node and check for the existence of the revealed child
    wrapper.find('.rst__expandButton').first().simulate('click');
    wrapper.setProps({ treeData });
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(2);

    // Collapse node and make sure the child has been hidden
    wrapper.find('.rst__collapseButton').first().simulate('click');
    wrapper.setProps({ treeData });
    expect(wrapper.find(TreeNodeRendererDefault).length).toEqual(1);
  });

  it('should change outer wrapper style via `style` and `className` props', () => {
    const wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[{ title: 'a' }]}
        onChange={() => {}}
        style={{ borderWidth: 42 }}
        className="extra-classy"
      />
    );

    expect(wrapper.find('.rst__tree')).toHaveStyle('borderWidth', 42);
    expect(wrapper.find('.rst__tree')).toHaveClassName('extra-classy');
  });

  it('should change height according to rowHeight prop', () => {
    const wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[{ title: 'a' }, { title: 'b', extraHeight: 2 }]}
        onChange={() => {}}
        rowHeight={12}
      />
    );

    // Works with static value
    expect(wrapper.find(TreeNodeRendererDefault).first()).toHaveStyle('height', 12);

    // Works with function callback
    wrapper.setProps({ rowHeight: ({ node }) => 42 + (node.extraHeight || 0) });
    expect(wrapper.find(TreeNodeRendererDefault).first()).toHaveStyle('height', 42);
    expect(wrapper.find(TreeNodeRendererDefault).last()).toHaveStyle('height', 44);
  });

  it('should change scaffold width according to scaffoldBlockPxWidth prop', () => {
    const wrapper = mount(
      <ReactSortableTreeWithProvider treeData={[{ title: 'a' }]} onChange={() => {}} scaffoldBlockPxWidth={12} />
    );

    expect(wrapper.find('.rst__lineBlock')).toHaveStyle('width', 12);
  });

  it('should pass props to the node renderer from `generateNodeProps`', () => {
    const title = 42;
    const wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[{ title }]}
        onChange={() => {}}
        generateNodeProps={({ node }) => ({ buttons: [node.title] })}
      />
    );

    expect(wrapper.find(DefaultNodeRenderer)).toHaveProp('buttons', [title]);
  });

  it('should call the callback in `onVisibilityToggle` when visibility toggled', () => {
    let out = null;
    let treeData;
    const wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[{ title: 'a', children: [{ title: 'b' }] }]}
        onChange={(d) => {
          treeData = d;
        }}
        onVisibilityToggle={({ expanded }) => {
          out = expanded ? 'expanded' : 'collapsed';
        }}
      />
    );

    wrapper.find('.rst__expandButton').first().simulate('click');
    wrapper.setProps({ treeData });
    expect(out).toEqual('expanded');
    wrapper.find('.rst__collapseButton').first().simulate('click');
    wrapper.setProps({ treeData });
    expect(out).toEqual('collapsed');
  });

  it('should render with a custom `nodeContentRenderer`', () => {
    class FakeNode extends Component {
      render() {
        return <div>{this.props.node.title}</div>;
      }
    }
    FakeNode.propTypes = {
      node: PropTypes.shape({ title: PropTypes.string }).isRequired,
    };

    const wrapper = mount(
      <ReactSortableTreeWithProvider treeData={[{ title: 'a' }]} onChange={() => {}} nodeContentRenderer={FakeNode} />
    );

    expect(wrapper.find(FakeNode).length).toEqual(1);
  });

  it('search should call searchFinishCallback', () => {
    const searchFinishCallback = jest.fn();
    render(
      <ReactSortableTreeWithProvider
        treeData={[{ title: 'a', children: [{ title: 'b' }] }]}
        searchQuery="b"
        searchFocusOffset={0}
        searchFinishCallback={searchFinishCallback}
        onChange={() => {}}
      />
    );

    expect(searchFinishCallback).toHaveBeenCalledWith(
      [
        // Node should be found expanded
        { node: { title: 'b' }, path: [0, 1], treeIndex: 1 },
      ],
      1
    );
  });

  it('search should expand all matches and seek out the focus offset', () => {
    const searchFinishCallback = jest.fn();
    const { rerender } = render(
      <ReactSortableTreeWithProvider
        treeData={[
          { title: 'a', children: [{ title: 'b' }] },
          { title: 'a', children: [{ title: 'be' }] },
        ]}
        searchQuery="b"
        onChange={() => {}}
        searchFinishCallback={searchFinishCallback}
      />
    );
    expect(searchFinishCallback).toHaveBeenCalledWith(
      [
        { node: { title: 'b' }, path: [0, 1], treeIndex: 1 },
        { node: { title: 'be' }, path: [2, 3], treeIndex: 3 },
      ],
      undefined
    );

    rerender(
      <ReactSortableTreeWithProvider
        treeData={[
          { title: 'a', children: [{ title: 'b' }] },
          { title: 'a', children: [{ title: 'be' }] },
        ]}
        searchQuery="b"
        searchFocusOffset={0}
        onChange={() => {}}
        searchFinishCallback={searchFinishCallback}
      />
    );
    expect(searchFinishCallback).toHaveBeenCalledWith(
      [
        { node: { title: 'b' }, path: [0, 1], treeIndex: 1 },
        { node: { title: 'be' }, path: [2, 3], treeIndex: null },
      ],
      1
    );

    rerender(
      <ReactSortableTreeWithProvider
        treeData={[
          { title: 'a', children: [{ title: 'b' }] },
          { title: 'a', children: [{ title: 'be' }] },
        ]}
        searchQuery="b"
        searchFocusOffset={1}
        onChange={() => {}}
        searchFinishCallback={searchFinishCallback}
      />
    );
    // As the empty `onChange` we use here doesn't actually change
    // the tree, the expansion of all nodes doesn't get preserved
    // after the first mount, and this change in searchFocusOffset
    // only triggers the opening of a single path.
    // Therefore it's 2 instead of 3.
    expect(searchFinishCallback).toHaveBeenCalledWith(
      [
        { node: { title: 'b' }, path: [0, 1], treeIndex: null },
        { node: { title: 'be' }, path: [1, 2], treeIndex: 2 },
      ],
      2
    );
  });

  it('search onlyExpandSearchedNodes should collapse all nodes except matches', () => {
    let treeData;
    const wrapper = mount(
      <ReactSortableTreeWithProvider
        treeData={[
          {
            title: 'a',
            children: [{ title: 'b', children: [{ title: 'c' }] }],
          },
          {
            title: 'b',
            children: [{ title: 'd', children: [{ title: 'be' }] }],
          },
          {
            title: 'c',
            children: [{ title: 'f', children: [{ title: 'dd' }] }],
          },
        ]}
        onChange={(t) => {
          treeData = t;
        }}
        onlyExpandSearchedNodes
      />
    );
    wrapper.setProps({ searchQuery: 'be' });
    expect(treeData).toEqual([
      {
        title: 'a',
        children: [
          {
            title: 'b',
            children: [
              {
                title: 'c',
                expanded: false,
              },
            ],
            expanded: false,
          },
        ],
        expanded: false,
      },
      {
        title: 'b',
        children: [
          {
            title: 'd',
            children: [
              {
                title: 'be',
                expanded: false,
              },
            ],
            expanded: true,
          },
        ],
        expanded: true,
      },
      {
        title: 'c',
        children: [
          {
            title: 'f',
            children: [
              {
                title: 'dd',
                expanded: false,
              },
            ],
            expanded: false,
          },
        ],
        expanded: false,
      },
    ]);
  });
});

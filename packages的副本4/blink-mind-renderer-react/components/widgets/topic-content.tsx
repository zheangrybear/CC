import debug from 'debug';
import * as React from 'react';
import styled from 'styled-components';

const log = debug('node:topic-content2');

const EditingRoot = styled.div`
  position: relative;
`;

const cancelEvent = (e) => {
  log('cancelEvent');
  e.preventDefault();
  e.stopPropagation();
};

export function TopicContent(props) {
  const { controller, model, topicKey, getRef } = props;
  const readOnly = model.editingContentKey !== topicKey;
  const editor = controller.run('renderTopicContentEditor', {
    ...props,
    readOnly,
  });

  return (
    <EditingRoot onDragEnter={cancelEvent} onDragOver={cancelEvent}>
      {editor}
    </EditingRoot>
  );
}

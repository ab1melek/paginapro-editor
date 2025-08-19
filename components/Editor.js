import { createReactEditorJS } from 'react-editor-js';
import { EDITOR_JS_TOOLS } from './utils/tools.js';

const ReactEditorJS = createReactEditorJS();

const blocks = {
  time: new Date().getTime(),
  blocks: [
    {
      type: "paragraph",
      data: {
        text: "Escribe algo aquí..."
      }
    }
  ]
};

const Editor = () => {
  return <ReactEditorJS defaultValue={blocks} tools={EDITOR_JS_TOOLS} />;
};

export default Editor;
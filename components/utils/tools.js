import CheckList from '@editorjs/checklist'
import Code from '@editorjs/code'
import Delimiter from '@editorjs/delimiter'
import Embed from '@editorjs/embed'
import Header from '@editorjs/header'
import InlineCode from '@editorjs/inline-code'
import List from '@editorjs/list'
import Marker from '@editorjs/marker'
import Paragraph from '@editorjs/paragraph'
import Quote from '@editorjs/quote'
import Raw from '@editorjs/raw'
import SimpleImage from '@editorjs/simple-image'
import Table from '@editorjs/table'
import Warning from '@editorjs/warning'
import ColorPicker from 'editorjs-color-picker'
import FontEditorTool from '../editorPlugins/FontEditorTool'


export const EDITOR_JS_TOOLS = {
  paragraph: {
    class: Paragraph,
    inlineToolbar: true,
  },
  header: {
    class: Header,
    inlineToolbar: true,
    config: {
      levels: [2, 3, 4],
      defaultLevel: 2,
    },
  },
  list: {
    class: List,
    inlineToolbar: true,
  },
  checklist: CheckList,
  quote: {
    class: Quote,
    inlineToolbar: true,
  },
  ColorPicker: {
      class: ColorPicker,
   },
  fontEditor: {
    class: FontEditorTool,
    inlineToolbar: true
  },
  code: Code,
  inlineCode: InlineCode,
  embed: Embed,
  table: Table,
  warning: Warning,
  // linkTool: LinkTool,
  // image: Image,
  simpleImage: SimpleImage,
  raw: Raw,
  delimiter: Delimiter,
  marker: Marker,
}

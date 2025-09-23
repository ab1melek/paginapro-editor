import Columns from "@aaaalrashd/editorjs-columns"
import CheckList from '@editorjs/checklist'
import Code from '@editorjs/code'
import Delimiter from '@editorjs/delimiter'
import Embed from '@editorjs/embed'
import Header from '@editorjs/header'
import ImageTool from '@editorjs/image'
import InlineCode from '@editorjs/inline-code'
import List from '@editorjs/list'
import Marker from '@editorjs/marker'
import Paragraph from '@editorjs/paragraph'
import Quote from '@editorjs/quote'
import Raw from '@editorjs/raw'
import Table from '@editorjs/table'
import Warning from '@editorjs/warning'
import ColorPicker from 'editorjs-color-picker'
import AlignmentTuneTool from "editorjs-text-alignment-blocktune"
import ColorButtonTool from '../editorPlugins/ColorButtonTool'
import ColumnsStyleTune from '../editorPlugins/ColumnsStyleTune'
import FontEditorTool from '../editorPlugins/FontEditorTool'

export const EDITOR_JS_TOOLS = {
  paragraph: {
    class: Paragraph,
    inlineToolbar: true,
    tunes: ["alignment"],
  },
  header: {
    class: Header,
    inlineToolbar: true,
    tunes: ["alignment"],
    config: {
      levels: [1, 2, 3, 4],
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
  image: {
    class: ImageTool,
    config: {
      endpoints: {
        byFile: '/api/images', // Endpoint para subir imágenes por archivo
      },
      features: {
        border: false,
        caption: 'optional',
        stretch: false,
      },
    },
  },
  alignment: {
    class: AlignmentTuneTool,
    config: {
      default: "left",
      blocks: {
        header: "center",
        paragraph: "left",
      },
    },
  },
  raw: Raw,
  delimiter: Delimiter,
  marker: Marker,
  button: {
    class: ColorButtonTool,
  },
  // Tune global para permitir estilos por columna en el bloque columns
  columnsStyle: {
    class: ColumnsStyleTune,
  },
  // Nota: el bloque PageSettingsTool fue removido del toolbox para evitar duplicidad con la barra superior
  columns: {
        class: Columns,
        tunes: ['columnsStyle'],
        config: {
          maxColumns: 4,
          tools: {
            // Titulos (Headers)
            header: {
              class: Header,
              inlineToolbar: true,
              tunes: ["alignment"],
              config: {
                levels: [1, 2, 3, 4],
                defaultLevel: 2,
              },
            },
            // Párrafos (Texto)
            paragraph: {
              class: Paragraph,
              inlineToolbar: true,
              tunes: ["alignment"],
            },
            // Imagenes
            image: {
              class: ImageTool,
              config: {
                endpoints: {
                  byFile: '/api/images',
                },
                features: {
                  border: false,
                  caption: 'optional',
                  stretch: false,
                },
              },
            },
            // Selector de color
            ColorPicker: { class: ColorPicker },
            // Editor de fuente (tamaños, estilos, etc.)
            fontEditor: { class: FontEditorTool, inlineToolbar: true },
            // Alineación (tune)
            alignment: {
              class: AlignmentTuneTool,
              config: {
                default: 'left',
                blocks: {
                  header: 'center',
                  paragraph: 'left',
                },
              },
            },
            list: { class: List, inlineToolbar: true },
            button: { class: ColorButtonTool },
          },
        },
      },
}

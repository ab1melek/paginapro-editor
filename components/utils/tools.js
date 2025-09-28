import Columns from "@aaaalrashd/editorjs-columns"
import CheckList from '@editorjs/checklist'
import Code from '@editorjs/code'
import Delimiter from '@editorjs/delimiter'
import Embed from '@editorjs/embed'
import ImageTool from '@editorjs/image'
import InlineCode from '@editorjs/inline-code'
import Marker from '@editorjs/marker'
import Raw from '@editorjs/raw'
import Table from '@editorjs/table'
import Warning from '@editorjs/warning'
import ColorPicker from 'editorjs-color-picker'
import AlignmentTuneTool from "editorjs-text-alignment-blocktune"
import ColorButtonTool from '../editorPlugins/ColorButtonTool'
import ColumnsStyleTune from '../editorPlugins/ColumnsStyleTune'
import FontEditorTool from '../editorPlugins/FontEditorTool'
import HeaderWithColor from '../editorPlugins/HeaderWithColor'
import ListWithColor from '../editorPlugins/ListWithColor'
import ParagraphWithColor from '../editorPlugins/ParagraphWithColor'
import QuoteWithColor from '../editorPlugins/QuoteWithColor'
import TextColorInlineTool from '../editorPlugins/TextColorInlineTool'

export const EDITOR_JS_TOOLS = {
  paragraph: {
    class: ParagraphWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor'],
    tunes: ["alignment"],
  },
  header: {
    class: HeaderWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor'],
    tunes: ["alignment"],
    config: {
      levels: [1, 2, 3, 4],
      defaultLevel: 2, 
    },
  },
  list: {
    class: ListWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor'],
  },
  checklist: CheckList,
  quote: {
    class: QuoteWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor'],
  },
  // Color picker de bloques (no inline). Se mantiene disponible en toolbox general si lo deseas.
  ColorPicker: {
      class: ColorPicker,
   },
  // Herramienta inline de color propia (estable)
  textColor: {
    class: TextColorInlineTool,
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
              class: HeaderWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor'],
              tunes: ["alignment"],
              config: {
                levels: [1, 2, 3, 4],
                defaultLevel: 2,
              },
            },
            // Párrafos (Texto)
            paragraph: {
              class: ParagraphWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor'],
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
            // Inline tools necesarias para inlineToolbar
            textColor: { class: TextColorInlineTool },
            marker: { class: Marker },
            inlineCode: { class: InlineCode },
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
            list: { class: ListWithColor, inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor'] },
            button: { class: ColorButtonTool },
          },
        },
      },
}

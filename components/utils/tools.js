import Columns from "@aaaalrashd/editorjs-columns"
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
import ChecklistWithColor from '../editorPlugins/ChecklistWithColor'
import ColorButtonTool from '../editorPlugins/ColorButtonTool'
import ColumnsStyleTune from '../editorPlugins/ColumnsStyleTune'
import FontEditorTool from '../editorPlugins/FontEditorTool'
import HeaderWithColor from '../editorPlugins/HeaderWithColor'
import HeroTool from '../editorPlugins/HeroTool'
import ListWithColor from '../editorPlugins/ListWithColor'
import ParagraphWithColor from '../editorPlugins/ParagraphWithColor'
import QuoteWithColor from '../editorPlugins/QuoteWithColor'
import SocialIconsTool from '../editorPlugins/SocialIconsTool'
import TextColorInlineTool from '../editorPlugins/TextColorInlineTool'

export const EDITOR_JS_TOOLS = {
  paragraph: {
    class: ParagraphWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
    tunes: ["alignment"],
  },
  header: {
    class: HeaderWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
    tunes: ["alignment"],
    config: {
      levels: [1, 2, 3, 4],
      defaultLevel: 2, 
    },
  },
  list: {
    class: ListWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
  },
  checklist: {
    class: ChecklistWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
  },
  quote: {
    class: QuoteWithColor,
    inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
  },
  ColorPicker: {
      class: ColorPicker,
   },
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
  columnsStyle: {
    class: ColumnsStyleTune,
  },
  columns: {
        class: Columns,
        tunes: ['columnsStyle'],
        config: {
          maxColumns: 4,
          tools: {
            header: {
              class: HeaderWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
              tunes: ["alignment"],
              config: {
                levels: [1, 2, 3, 4],
                defaultLevel: 2,
              },
            },
            paragraph: {
              class: ParagraphWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
              tunes: ["alignment"],
            },
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
            ColorPicker: { class: ColorPicker },
            textColor: { class: TextColorInlineTool },
            marker: { class: Marker },
            inlineCode: { class: InlineCode },
            fontEditor: { class: FontEditorTool, inlineToolbar: true },
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
            list: { class: ListWithColor, inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'] },
            quote: {
              class: QuoteWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
            },
            checklist: {
              class: ChecklistWithColor,
              inlineToolbar: ['bold', 'italic', 'link', 'marker', 'inlineCode', 'textColor', 'fontEditor'],
            },
            button: { class: ColorButtonTool },
          },
        },
      },
  socialIcons: {
    class: SocialIconsTool,
  },
  hero: {
    class: HeroTool,
  },
}

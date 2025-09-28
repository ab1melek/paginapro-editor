import Paragraph from '@editorjs/paragraph';

export default class ParagraphWithColor extends Paragraph {
  static get sanitize() {
    return {
      text: {
        span: { style: true, class: true },
        mark: { style: true, class: true },
        a: { href: true, target: true, rel: true },
        b: true,
        i: true,
        u: true,
        s: true,
        br: true
      }
    };
  }
}

import Header from '@editorjs/header';

export default class HeaderWithColor extends Header {
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

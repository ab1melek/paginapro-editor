import List from '@editorjs/list';

export default class ListWithColor extends List {
  static get sanitize() {
    return {
      items: {
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

import CheckList from '@editorjs/checklist';

export default class ChecklistWithColor extends CheckList {
  static get sanitize() {
    return {
      items: {
        text: {
          span: { style: true, class: true },
          mark: { style: true, class: true },
          a: { href: true, target: true, rel: true },
          b: true,
          i: true,
          u: true,
          s: true,
          br: true,
        },
        checked: true,
      },
    };
  }
}

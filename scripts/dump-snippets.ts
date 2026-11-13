import { CODE } from '../src/guide/linreg/code';
console.log(JSON.stringify(Object.entries(CODE).flatMap(([k, v]) => v.map((s) => ({ key: k, title: s.title, code: s.code, AD_CSV: s.globals!.AD_CSV })))));

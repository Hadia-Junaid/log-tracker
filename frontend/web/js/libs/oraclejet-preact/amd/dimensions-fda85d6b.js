define(['exports', './size-f0e638ec', './colorUtils-7c069766'], (function(i,e,t){"use strict";const n=["height","maxHeight","maxWidth","minHeight","minWidth","width"],s=i=>n=>{const s=n[i];return t.isNil(n[i])?{}:{[i]:e.sizeToCSS(s)}},o=n.reduce(((i,e)=>Object.assign(i,{[e]:s(e)})),{});i.dimensionInterpolations=o,i.dimensions=n}));
//# sourceMappingURL=dimensions-fda85d6b.js.map

define(['exports', './stringUtils-0ae982c2', './useUser-797287de'], (function(e,i,s){"use strict";e.usePrefixSuffix=({baseId:e,hasEndContent:t,hasInsideLabel:d,hasStartContent:r,hasValue:a,isDisabled:n,isFocused:f,labelId:o,prefix:u,suffix:l,value:x})=>{const{direction:$}=s.useUser(),v=`${e}-prefix`,c=`${e}-suffix`,h=void 0!==u&&""!==u,b=void 0!==l&&""!==l,p=h&&!n&&(a||f),I=b&&!n&&(a||f),P=h||b?function(e,i,s,t,d){if(!i)return d;const r="ltr"===e,a=void 0===s?"":r?`${s} `:` ${s}`,n=void 0===t?"":r?` ${t}`:`${t} `,f=`${a}${d}${n}`,o=`${n}${d}${a}`;return r?f:o}($,a,u,l,x):x;return{shouldRenderPrefix:p,shouldRenderSuffix:I,prefixProps:{id:v,hasEndContent:t,hasInsideLabel:d,hasStartContent:r,isDisabled:n,isFocused:f,text:u??"",variant:"prefix"},suffixProps:{id:c,hasInsideLabel:d,isDisabled:n,isFocused:f,text:l??"",variant:"suffix"},valuePrefixSuffix:P,ariaLabelledBy:h||b?i.merge([o,h?v:void 0,b?c:void 0]):void 0}}}));
//# sourceMappingURL=usePrefixSuffix-5147bdc9.js.map

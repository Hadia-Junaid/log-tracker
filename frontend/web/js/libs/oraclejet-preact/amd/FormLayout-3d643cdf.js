define(['exports', 'preact/jsx-runtime', './vanilla-extract-dynamic.esm-eceadd82', './useComponentTheme-5aa41a8f', './FormContext-5130e198', './useFormContext-30acdd33', './UNSAFE_FormLayout/themes/FormLayoutStyles.css', './LayoutStyles.css-c8bc984d', './UNSAFE_FormLayout/themes/redwood/FormLayoutTheme', './classNames-08d99695', './useTestId-c286f212'], (function(e,s,t,a,o,l,n,i,r,u,d){"use strict";e.FormLayout=({columns:e=1,columnBehavior:m="responsive",columnSpan:c=1,direction:y="row",isFullWidth:p,isReadonly:h,labelEdge:F,labelStartWidth:b,labelWrapping:x,userAssistanceDensity:S,children:C,testId:L})=>{const{isDisabled:W,isFormLayout:g,isReadonly:v,labelEdge:T,labelStartWidth:A,labelWrapping:f,textAlign:D,userAssistanceDensity:E}=l.useFormContext(),I=d.useTestId(L),j=d.useTestId(`${L}_layout`),N=h??v,R=F??T,w=b??A,V=x??f,$=S??(g?E:"efficient"),_=t.assignInlineVars({[i.layoutLocalVars.maxColumnCount]:`${e}`,[i.layoutLocalVars.minColumnCount]:`${"responsive"===m?1:e}`}),{baseTheme:B,classes:U}=a.useComponentTheme(r.FormLayoutRedwoodTheme,{columnBehavior:m,direction:y});return s.jsx(o.FormContext.Provider,{value:{isDisabled:W,isFormLayout:!0,isReadonly:N,labelEdge:R,labelStartWidth:w,labelWrapping:V,textAlign:D,userAssistanceDensity:$},children:s.jsx("div",{class:u.classNames([B,n.styles.rootWrapperStyle,p&&n.styles.rootWrapperFullWidthStyle,i.layoutSpanStyles.layoutSpanColumn[c]]),...I,style:_,children:s.jsx("div",{class:U,...j,children:C})})})}}));
//# sourceMappingURL=FormLayout-3d643cdf.js.map

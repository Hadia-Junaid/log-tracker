define(["require", "exports", "preact/jsx-runtime", '@oracle/oraclejet-preact/translationBundle', "preact/hooks", "preact/compat", "ojs/ojvcomponent", "oj-c/editable-value/UNSAFE_useAssistiveText/useAssistiveText", "ojs/ojcontext", "oj-c/hooks/UNSAFE_useMergedFormContext/useMergedFormContext", "@oracle/oraclejet-preact/UNSAFE_RichRadioSet", "@oracle/oraclejet-preact/utils/UNSAFE_styles/Layout", "@oracle/oraclejet-preact/hooks/UNSAFE_useTabbableMode", "@oracle/oraclejet-preact/hooks/UNSAFE_useFormContext", "@oracle/oraclejet-preact/UNSAFE_RichSelectionItem", "./useRichRadiosetPreact", "css!oj-c/rich-radioset/rich-radioset-styles.css"], function (require, exports, jsx_runtime_1, translationBundle_1, hooks_1, compat_1, ojvcomponent_1, useAssistiveText_1, Context, useMergedFormContext_1, UNSAFE_RichRadioSet_1, Layout_1, UNSAFE_useTabbableMode_1, UNSAFE_useFormContext_1, UNSAFE_RichSelectionItem_1, useRichRadiosetPreact_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RichRadioset = void 0;
    const displayOptionsDefault = {
        messages: 'display'
    };
    const helpDefault = {
        instruction: ''
    };
    const helpHintsDefault = {
        definition: '',
        source: ''
    };
    const messagesCustomDefault = [];
    const FunctionalRichRadioset = (0, compat_1.forwardRef)(({ id, options, containerReadonly: propContainerReadonly, displayOptions = displayOptionsDefault, help = helpDefault, helpHints = helpHintsDefault, disabled = false, layout, messagesCustom = messagesCustomDefault, columnSpan = 1, readonly: propReadonly, userAssistanceDensity: propUserAssistanceDensity, required = false, value, ...otherProps }, ref) => {
        const rootRef = (0, hooks_1.useRef)();
        const richRadiosetRef = (0, hooks_1.useRef)();
        const addBusyState = (0, hooks_1.useCallback)((description) => {
            return rootRef.current
                ? Context.getContext(rootRef.current)
                    .getBusyContext()
                    .addBusyState({ description: `oj-c-rich-radioset id=${id} is ${description}` })
                : () => { };
        }, [id]);
        const { containerProps, uadValue, readonlyValue } = (0, useMergedFormContext_1.useMergedFormContext)({
            propContainerReadonly,
            propLabelWrapping: 'wrap',
            propReadonly,
            propUserAssistanceDensity
        });
        const { richRadiosetProps, methods } = (0, useRichRadiosetPreact_1.useRichRadiosetPreact)({
            displayOptions,
            readonly: readonlyValue,
            required,
            messagesCustom,
            disabled,
            value,
            userAssistanceDensity: uadValue,
            ...otherProps
        }, addBusyState);
        (0, hooks_1.useImperativeHandle)(ref, () => ({
            blur: () => richRadiosetRef.current?.blur(),
            focus: () => richRadiosetRef.current?.focus(),
            ...methods
        }), [methods]);
        const { value: hookValue, ...richRadiosetRest } = richRadiosetProps;
        const assistiveTextProps = (0, useAssistiveText_1.useAssistiveText)({
            displayOptions,
            help,
            helpHints,
            userAssistanceDensity: uadValue
        });
        const memoizedOptions = (0, hooks_1.useMemo)(() => (options ? [...options] : []), [options]);
        return ((0, jsx_runtime_1.jsx)(ojvcomponent_1.Root, { id: id, ref: rootRef, class: Layout_1.layoutSpanStyles.layoutSpanColumn[columnSpan], children: (0, jsx_runtime_1.jsx)(UNSAFE_useFormContext_1.FormContext.Provider, { value: containerProps, children: (0, jsx_runtime_1.jsx)(UNSAFE_RichRadioSet_1.RichRadioSet, { ref: richRadiosetRef, ...assistiveTextProps, ...richRadiosetRest, layout: layout, userAssistanceDensity: uadValue, value: hookValue, children: memoizedOptions.map(({ secondaryText, thumbnailSrc, iconClass, avatar, label, value }) => {
                        const mediaObj = iconClass
                            ? { iconClass }
                            : thumbnailSrc
                                ? { thumbnailSrc }
                                : avatar
                                    ? { avatar }
                                    : {};
                        return ((0, jsx_runtime_1.jsx)(UNSAFE_RichSelectionItem_1.RichSelectionItem, { label: label, secondaryText: secondaryText, value: value, ...mediaObj }, value));
                    }) }) }) }));
    });
    const RichRadioset = (0, ojvcomponent_1.registerCustomElement)('oj-c-rich-radioset', FunctionalRichRadioset, "RichRadioset", { "properties": { "containerReadonly": { "type": "boolean", "binding": { "consume": { "name": "containerReadonly" } } }, "columnSpan": { "type": "number" }, "disabled": { "type": "boolean" }, "displayOptions": { "type": "object", "properties": { "messages": { "type": "string", "enumValues": ["none", "display"] } } }, "help": { "type": "object", "properties": { "instruction": { "type": "string" } } }, "helpHints": { "type": "object", "properties": { "definition": { "type": "string" }, "source": { "type": "string" }, "sourceText": { "type": "string" } } }, "labelEdge": { "type": "string", "enumValues": ["none", "start", "top", "inside"], "binding": { "consume": { "name": "containerLabelEdge" } } }, "labelHint": { "type": "string" }, "labelStartWidth": { "type": "number|string", "binding": { "consume": { "name": "labelWidth" } } }, "layout": { "type": "string", "enumValues": ["sm", "md", "xl"] }, "messagesCustom": { "type": "Array<object>", "writeback": true }, "readonly": { "type": "boolean", "binding": { "consume": { "name": "containerReadonly" } } }, "required": { "type": "boolean" }, "userAssistanceDensity": { "type": "string", "enumValues": ["compact", "reflow", "efficient"], "binding": { "consume": { "name": "containerUserAssistanceDensity" } } }, "options": { "type": "Array<object>" }, "requiredMessageDetail": { "type": "string" }, "valid": { "type": "string", "enumValues": ["pending", "valid", "invalidHidden", "invalidShown"], "readOnly": true, "writeback": true }, "value": { "type": "string|number|null", "writeback": true } }, "extension": { "_WRITEBACK_PROPS": ["messagesCustom", "valid", "value"], "_READ_ONLY_PROPS": ["valid"], "_OBSERVED_GLOBAL_PROPS": ["aria-describedby", "id"] }, "methods": { "blur": {}, "focus": {}, "showMessages": {}, "reset": {}, "validate": {} } }, { "displayOptions": { "messages": "display" }, "help": { "instruction": "" }, "helpHints": { "definition": "", "source": "" }, "disabled": false, "messagesCustom": [], "columnSpan": 1, "required": false }, {
        '@oracle/oraclejet-preact': translationBundle_1.default
    }, { consume: [UNSAFE_useTabbableMode_1.TabbableModeContext] });
    exports.RichRadioset = RichRadioset;
});

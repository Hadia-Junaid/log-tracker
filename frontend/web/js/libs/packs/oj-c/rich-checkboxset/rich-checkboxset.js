define(["require", "exports", "preact/jsx-runtime", '@oracle/oraclejet-preact/translationBundle', "preact/compat", "preact/hooks", "ojs/ojvcomponent", "oj-c/editable-value/UNSAFE_useAssistiveText/useAssistiveText", "oj-c/hooks/UNSAFE_useMergedFormContext/useMergedFormContext", "ojs/ojcontext", "@oracle/oraclejet-preact/UNSAFE_RichCheckboxSet", "@oracle/oraclejet-preact/hooks/UNSAFE_useTabbableMode", "@oracle/oraclejet-preact/hooks/UNSAFE_useFormContext", "@oracle/oraclejet-preact/UNSAFE_RichSelectionItem", "@oracle/oraclejet-preact/utils/UNSAFE_styles/Layout", "./useRichCheckboxsetPreact", "css!oj-c/rich-checkboxset/rich-checkboxset-styles.css"], function (require, exports, jsx_runtime_1, translationBundle_1, compat_1, hooks_1, ojvcomponent_1, useAssistiveText_1, useMergedFormContext_1, Context, UNSAFE_RichCheckboxSet_1, UNSAFE_useTabbableMode_1, UNSAFE_useFormContext_1, UNSAFE_RichSelectionItem_1, Layout_1, useRichCheckboxsetPreact_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RichCheckboxset = void 0;
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
    const FunctionalRichCheckboxset = (0, compat_1.forwardRef)(({ columnSpan = 1, containerReadonly: propContainerReadonly, disabled = false, displayOptions = displayOptionsDefault, help = helpDefault, helpHints = helpHintsDefault, id, layout, maxSelected, messagesCustom = messagesCustomDefault, minSelected, options, readonly: propReadonly, required = false, userAssistanceDensity: propUserAssistanceDensity, value = null, ...otherProps }, ref) => {
        const rootRef = (0, hooks_1.useRef)();
        const richCheckboxsetRef = (0, hooks_1.useRef)();
        const hasMin = minSelected != null;
        const hasMax = maxSelected != null;
        const hasValue = value != null;
        if (hasMin && minSelected < 2) {
            throw new Error('RichCheckboxSet: minSelected should be equal to or greater than 2.');
        }
        if (hasMax && maxSelected < 2) {
            throw new Error('RichCheckboxSet: maxSelected should be equal to or greater than 2.');
        }
        const addBusyState = (0, hooks_1.useCallback)((description) => {
            return rootRef.current
                ? Context.getContext(rootRef.current)
                    .getBusyContext()
                    .addBusyState({ description: `oj-c-rich-checkboxset id=${id} is ${description}` })
                : () => { };
        }, [id]);
        const { containerProps, uadValue, readonlyValue } = (0, useMergedFormContext_1.useMergedFormContext)({
            propContainerReadonly,
            propLabelWrapping: 'wrap',
            propReadonly,
            propUserAssistanceDensity
        });
        const { richCheckboxsetProps, methods, outerProps } = (0, useRichCheckboxsetPreact_1.useRichCheckboxsetPreact)({
            disabled,
            displayOptions,
            readonly: readonlyValue,
            required,
            maxSelected,
            messagesCustom,
            minSelected,
            value,
            userAssistanceDensity: uadValue,
            ...otherProps
        }, addBusyState);
        (0, hooks_1.useImperativeHandle)(ref, () => ({
            blur: () => richCheckboxsetRef.current?.blur(),
            focus: () => richCheckboxsetRef.current?.focus(),
            ...methods
        }), [methods]);
        const assistiveTextProps = (0, useAssistiveText_1.useAssistiveText)({
            displayOptions,
            help,
            helpHints,
            userAssistanceDensity: uadValue
        });
        const { value: hookValue, ...richCheckboxsetRest } = richCheckboxsetProps;
        const memoizedSetValue = (0, hooks_1.useMemo)(() => (hookValue ? new Set(hookValue) : undefined), [hookValue]);
        const memoizedOptions = (0, hooks_1.useMemo)(() => (options ? [...options] : []), [options]);
        const hasMaxSelected = hasValue && hasMax && maxSelected === memoizedSetValue?.size;
        return ((0, jsx_runtime_1.jsx)(ojvcomponent_1.Root, { id: id, ref: rootRef, class: Layout_1.layoutSpanStyles.layoutSpanColumn[columnSpan], children: (0, jsx_runtime_1.jsx)(UNSAFE_useFormContext_1.FormContext.Provider, { value: containerProps, children: (0, jsx_runtime_1.jsx)("div", { ...outerProps, children: (0, jsx_runtime_1.jsx)(UNSAFE_RichCheckboxSet_1.RichCheckboxSet, { ...assistiveTextProps, ...richCheckboxsetRest, ref: richCheckboxsetRef, layout: layout, userAssistanceDensity: uadValue, value: memoizedSetValue, children: memoizedOptions.map(({ secondaryText, thumbnailSrc, iconClass, avatar, label, value }) => {
                            const mediaObj = iconClass
                                ? { iconClass }
                                : thumbnailSrc
                                    ? { thumbnailSrc }
                                    : avatar
                                        ? { avatar }
                                        : {};
                            const isItemReadonly = readonlyValue || (hasMaxSelected && !memoizedSetValue?.has(value));
                            return ((0, jsx_runtime_1.jsx)(UNSAFE_RichSelectionItem_1.RichSelectionItem, { isReadonly: isItemReadonly, label: label, secondaryText: secondaryText, value: value, ...mediaObj }, value));
                        }) }) }) }) }));
    });
    const RichCheckboxset = (0, ojvcomponent_1.registerCustomElement)('oj-c-rich-checkboxset', FunctionalRichCheckboxset, "RichCheckboxset", { "properties": { "containerReadonly": { "type": "boolean", "binding": { "consume": { "name": "containerReadonly" } } }, "columnSpan": { "type": "number" }, "disabled": { "type": "boolean" }, "displayOptions": { "type": "object", "properties": { "messages": { "type": "string", "enumValues": ["none", "display"] } } }, "help": { "type": "object", "properties": { "instruction": { "type": "string" } } }, "helpHints": { "type": "object", "properties": { "definition": { "type": "string" }, "source": { "type": "string" }, "sourceText": { "type": "string" } } }, "labelEdge": { "type": "string", "enumValues": ["none", "start", "top", "inside"], "binding": { "consume": { "name": "containerLabelEdge" } } }, "labelHint": { "type": "string" }, "labelStartWidth": { "type": "number|string", "binding": { "consume": { "name": "labelWidth" } } }, "layout": { "type": "string", "enumValues": ["sm", "md", "xl"] }, "maxSelected": { "type": "number" }, "messagesCustom": { "type": "Array<object>", "writeback": true }, "minSelected": { "type": "number" }, "readonly": { "type": "boolean", "binding": { "consume": { "name": "containerReadonly" } } }, "required": { "type": "boolean" }, "selectionExactMessageDetail": { "type": "function" }, "selectionOverflowMessageDetail": { "type": "function" }, "selectionRangeMessageDetail": { "type": "function" }, "selectionUnderflowMessageDetail": { "type": "function" }, "userAssistanceDensity": { "type": "string", "enumValues": ["compact", "reflow", "efficient"], "binding": { "consume": { "name": "containerUserAssistanceDensity" } } }, "options": { "type": "Array<object>" }, "requiredMessageDetail": { "type": "string" }, "valid": { "type": "string", "enumValues": ["pending", "valid", "invalidHidden", "invalidShown"], "readOnly": true, "writeback": true }, "value": { "type": "Array<string|number>|null", "writeback": true } }, "extension": { "_WRITEBACK_PROPS": ["messagesCustom", "valid", "value"], "_READ_ONLY_PROPS": ["valid"], "_OBSERVED_GLOBAL_PROPS": ["aria-describedby", "id"] }, "methods": { "blur": {}, "focus": {}, "showMessages": {}, "reset": {}, "validate": {} } }, { "columnSpan": 1, "disabled": false, "displayOptions": { "messages": "display" }, "help": { "instruction": "" }, "helpHints": { "definition": "", "source": "" }, "messagesCustom": [], "required": false, "value": null }, {
        '@oracle/oraclejet-preact': translationBundle_1.default
    }, { consume: [UNSAFE_useTabbableMode_1.TabbableModeContext] });
    exports.RichCheckboxset = RichCheckboxset;
});

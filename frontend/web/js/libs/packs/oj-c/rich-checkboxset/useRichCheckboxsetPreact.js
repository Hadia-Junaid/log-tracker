define(["require", "exports", "preact/hooks", "@oracle/oraclejet-preact/hooks/UNSAFE_useTranslationBundle", "oj-c/hooks/UNSAFE_useEditableValue/index", "oj-c/editable-value/UNSAFE_useDeferredValidators/useDeferredValidators", "oj-c/editable-value/UNSAFE_useSelectionRangeValidator/useSelectionRangeValidator"], function (require, exports, hooks_1, UNSAFE_useTranslationBundle_1, index_1, useDeferredValidators_1, useSelectionRangeValidator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.useRichCheckboxsetPreact = useRichCheckboxsetPreact;
    function useRichCheckboxsetPreact({ 'aria-describedby': ariaDescribedBy, disabled, displayOptions, labelEdge, labelHint, labelStartWidth, maxSelected, messagesCustom, minSelected, onMessagesCustomChanged, onValidChanged, onValueChanged, readonly, required, requiredMessageDetail: propRequiredMessageDetail, selectionExactMessageDetail, selectionOverflowMessageDetail, selectionRangeMessageDetail, selectionUnderflowMessageDetail, userAssistanceDensity, value: propValue }, addBusyState) {
        const translations = (0, UNSAFE_useTranslationBundle_1.useTranslationBundle)('@oracle/oraclejet-preact');
        const requiredMessageDetail = propRequiredMessageDetail || translations.checkboxSet_requiredMessageDetail?.();
        const deferredValidators = (0, useDeferredValidators_1.useDeferredValidators)({
            labelHint,
            required,
            requiredMessageDetail
        });
        const selectionRangeValidators = (0, useSelectionRangeValidator_1.useSelectionRangeValidator)({
            defaultSelectionExactMessageDetail: translations.formControl_selectionExactMessageDetail,
            defaultSelectionOverflowMessageDetail: translations.formControl_selectionOverflowMessageDetail,
            defaultSelectionRangeMessageDetail: translations.formControl_selectionRangeMessageDetail,
            defaultSelectionUnderflowMessageDetail: translations.formControl_selectionUnderflowMessageDetail,
            max: maxSelected,
            min: minSelected,
            selectionExactMessageDetail,
            selectionOverflowMessageDetail,
            selectionRangeMessageDetail,
            selectionUnderflowMessageDetail
        });
        const { addMessage, clearInteractionFlags, displayValue, methods, onCommitValue, refreshDisplayValue, textFieldProps } = (0, index_1.useEditableValue)({
            addBusyState,
            ariaDescribedBy,
            defaultDisplayValue: null,
            deferredValidators,
            disabled,
            displayOptions,
            messagesCustom,
            onMessagesCustomChanged,
            onValidChanged,
            onValueChanged,
            readonly,
            validators: selectionRangeValidators,
            value: propValue
        });
        const isInteractedRef = (0, hooks_1.useRef)(false);
        const isFocusedRef = (0, hooks_1.useRef)(false);
        const onFocusIn = (0, hooks_1.useCallback)(() => {
            if (!isFocusedRef.current) {
                isFocusedRef.current = true;
            }
        }, []);
        const onFocusOut = (0, hooks_1.useCallback)((event) => {
            if (isFocusedRef.current &&
                (event.relatedTarget == null ||
                    !event.currentTarget.contains(event.relatedTarget))) {
                isFocusedRef.current = false;
                if (isInteractedRef.current) {
                    methods.showMessages();
                }
                isInteractedRef.current = false;
                clearInteractionFlags();
            }
        }, [clearInteractionFlags, methods]);
        const onCommitHandler = (0, hooks_1.useCallback)(async ({ value }) => {
            const valueAsArray = value ? Array.from(value) : null;
            const numSelected = valueAsArray ? valueAsArray.length : 0;
            isInteractedRef.current = true;
            if (maxSelected && numSelected > maxSelected) {
                return;
            }
            await onCommitValue(valueAsArray);
            refreshDisplayValue(valueAsArray);
            if (numSelected === maxSelected) {
                addMessage({
                    severity: 'info',
                    detail: translations.formControl_selectionOverflowMessageDetail({
                        max: maxSelected.toString()
                    })
                });
            }
        }, [addMessage, onCommitValue, maxSelected, refreshDisplayValue, translations]);
        return {
            methods,
            outerProps: disabled || readonly
                ? {}
                : {
                    onFocusIn,
                    onFocusOut
                },
            richCheckboxsetProps: {
                'aria-describedby': textFieldProps['aria-describedby'],
                isRequired: required,
                isReadonly: readonly,
                isDisabled: disabled,
                label: labelHint,
                labelEdge,
                labelStartWidth,
                messages: textFieldProps.messages,
                onCommit: onCommitHandler,
                userAssistanceDensity,
                value: displayValue
            }
        };
    }
});

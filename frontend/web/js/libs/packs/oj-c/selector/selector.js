define(["require", "exports", "preact/jsx-runtime", '@oracle/oraclejet-preact/translationBundle', "@oracle/oraclejet-preact/UNSAFE_Selector", "preact/hooks", "ojs/ojvcomponent", "../utils/PRIVATE_keyUtils/keySetUtils", "@oracle/oraclejet-preact/hooks/UNSAFE_useCollectionInteractionContext", "@oracle/oraclejet-preact/hooks/UNSAFE_useTabbableMode", "../hooks/PRIVATE_useSelectionContext/useSelectionContext", "../hooks/PRIVATE_useSelectionContext/SelectionContext", "../hooks/PRIVATE_useSelectionContext/useItemKeyContext", "../hooks/PRIVATE_useSelectionContext/ItemKeyContext"], function (require, exports, jsx_runtime_1, translationBundle_1, UNSAFE_Selector_1, hooks_1, ojvcomponent_1, keySetUtils_1, UNSAFE_useCollectionInteractionContext_1, UNSAFE_useTabbableMode_1, useSelectionContext_1, SelectionContext_1, useItemKeyContext_1, ItemKeyContext_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Selector = void 0;
    const SelectorImpl = ({ rowKey, selectedKeys, indeterminate = false, selectionMode, onSelectedKeysChanged, ...otherProps }) => {
        const itemKey = (0, useItemKeyContext_1.useItemKeyContext)();
        if (itemKey !== undefined) {
            rowKey = itemKey;
        }
        const selectionInfo = (0, useSelectionContext_1.useSelectionContext)();
        let keys = selectedKeys;
        let mode = selectionMode;
        let selectedListener;
        if (selectionInfo) {
            if (selectionInfo.selected) {
                keys = selectionInfo.selected;
            }
            if (selectionInfo.selectionMode !== 'none') {
                mode = selectionInfo.selectionMode;
            }
            selectedListener = selectionInfo.onSelectedChange;
        }
        (0, hooks_1.useLayoutEffect)(() => {
            if (onSelectedKeysChanged &&
                selectedKeys &&
                selectionInfo &&
                selectionInfo.selected &&
                !(0, keySetUtils_1.isEqual)(selectionInfo.selected, selectedKeys)) {
                onSelectedKeysChanged(selectionInfo.selected);
            }
        }, [onSelectedKeysChanged, selectionInfo, selectedKeys]);
        return ((0, jsx_runtime_1.jsx)(ojvcomponent_1.Root, { children: (0, jsx_runtime_1.jsx)(UNSAFE_Selector_1.Selector, { isPartial: indeterminate, rowKey: rowKey, selectedKeys: (0, keySetUtils_1.keySetToKeys)(keys), selectionMode: mode == null ? 'multiple' : mode, "aria-label": otherProps['aria-label'], onChange: (0, hooks_1.useCallback)((detail) => {
                    const keySet = (0, keySetUtils_1.keysToKeySet)(detail.value);
                    selectedListener?.(keySet);
                    onSelectedKeysChanged?.(keySet);
                }, [selectedListener, onSelectedKeysChanged]) }, rowKey) }));
    };
    exports.Selector = (0, ojvcomponent_1.registerCustomElement)('oj-c-selector', SelectorImpl, "Selector", { "properties": { "rowKey": { "type": "string|number" }, "selectedKeys": { "type": "object", "writeback": true }, "indeterminate": { "type": "boolean" }, "selectionMode": { "type": "string", "enumValues": ["multiple", "single"] } }, "extension": { "_WRITEBACK_PROPS": ["selectedKeys"], "_READ_ONLY_PROPS": [], "_OBSERVED_GLOBAL_PROPS": ["aria-label"] } }, { "indeterminate": false }, {
        '@oracle/oraclejet-preact': translationBundle_1.default
    }, {
        consume: [UNSAFE_useCollectionInteractionContext_1.CollectionInteractionContext, UNSAFE_useTabbableMode_1.TabbableModeContext, SelectionContext_1.SelectionContext, ItemKeyContext_1.ItemKeyContext]
    });
});

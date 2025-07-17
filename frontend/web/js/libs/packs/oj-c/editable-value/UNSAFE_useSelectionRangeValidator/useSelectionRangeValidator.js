define(["require", "exports", "preact/hooks", "./SelectionRangeValidator"], function (require, exports, hooks_1, SelectionRangeValidator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.useSelectionRangeValidator = useSelectionRangeValidator;
    function useSelectionRangeValidator({ defaultSelectionExactMessageDetail, defaultSelectionOverflowMessageDetail, defaultSelectionRangeMessageDetail, defaultSelectionUnderflowMessageDetail, max, min, selectionExactMessageDetail, selectionOverflowMessageDetail, selectionRangeMessageDetail, selectionUnderflowMessageDetail }) {
        return (0, hooks_1.useMemo)(() => {
            const selectionValidator = !min && !max
                ? null
                : new SelectionRangeValidator_1.SelectionRangeValidator({
                    defaultSelectionExactMessageDetail,
                    defaultSelectionOverflowMessageDetail,
                    defaultSelectionRangeMessageDetail,
                    defaultSelectionUnderflowMessageDetail,
                    max,
                    min,
                    selectionExactMessageDetail,
                    selectionOverflowMessageDetail,
                    selectionRangeMessageDetail,
                    selectionUnderflowMessageDetail
                });
            return [selectionValidator].filter(Boolean);
        }, [
            defaultSelectionExactMessageDetail,
            defaultSelectionOverflowMessageDetail,
            defaultSelectionRangeMessageDetail,
            defaultSelectionUnderflowMessageDetail,
            max,
            min,
            selectionExactMessageDetail,
            selectionOverflowMessageDetail,
            selectionRangeMessageDetail,
            selectionUnderflowMessageDetail
        ]);
    }
});

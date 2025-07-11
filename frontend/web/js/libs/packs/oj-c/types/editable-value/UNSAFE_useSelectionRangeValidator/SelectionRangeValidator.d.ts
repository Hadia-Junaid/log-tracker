import type { BundleType } from '@oracle/oraclejet-preact/resources/nls/bundle';
import type Validator = require('ojs/ojvalidator');
type MessageDetailFn<T> = (p: T) => string;
export type OverflowMessageDetailParameters = {
    max: number;
};
export type UnderflowMessageDetailParameters = {
    min: number;
};
export type ExactMessageDetailParameters = {
    exact: number;
};
export type RangeMessageDetailParameters = {
    max: number;
    min: number;
};
export type SelectionRangeValidatorOptions = {
    defaultSelectionExactMessageDetail: BundleType['formControl_selectionExactMessageDetail'];
    defaultSelectionOverflowMessageDetail: BundleType['formControl_selectionOverflowMessageDetail'];
    defaultSelectionRangeMessageDetail: BundleType['formControl_selectionRangeMessageDetail'];
    defaultSelectionUnderflowMessageDetail: BundleType['formControl_selectionUnderflowMessageDetail'];
    max?: number;
    min?: number;
    selectionExactMessageDetail?: MessageDetailFn<ExactMessageDetailParameters>;
    selectionOverflowMessageDetail?: MessageDetailFn<OverflowMessageDetailParameters>;
    selectionRangeMessageDetail?: MessageDetailFn<RangeMessageDetailParameters>;
    selectionUnderflowMessageDetail?: MessageDetailFn<UnderflowMessageDetailParameters>;
};
export declare class SelectionRangeValidator<V extends Array<string | number>> implements Validator<V> {
    #private;
    private options;
    constructor(options: SelectionRangeValidatorOptions);
    validate(value: V): void;
}
export {};

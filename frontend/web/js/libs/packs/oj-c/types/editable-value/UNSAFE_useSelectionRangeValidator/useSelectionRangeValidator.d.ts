import type { SelectionRangeValidatorOptions } from './SelectionRangeValidator';
import Validator = require('ojs/ojvalidator');
export declare function useSelectionRangeValidator<V>({ defaultSelectionExactMessageDetail, defaultSelectionOverflowMessageDetail, defaultSelectionRangeMessageDetail, defaultSelectionUnderflowMessageDetail, max, min, selectionExactMessageDetail, selectionOverflowMessageDetail, selectionRangeMessageDetail, selectionUnderflowMessageDetail }: SelectionRangeValidatorOptions): Validator<V>[];

import { ReferenceLine as PreactReferenceLine, Threshold as PreactThreshold } from '@oracle/oraclejet-preact/utils/UNSAFE_meterUtils';
type ReferenceLineLabelStyle = {
    color?: NonNullable<PreactReferenceLine['labelStyle']>['color'];
} & Omit<NonNullable<PreactReferenceLine['labelStyle']>, 'color'>;
export type ReferenceLine = {
    color?: PreactReferenceLine['color'];
    position?: PreactReferenceLine['position'];
    value: PreactReferenceLine['value'];
    label?: PreactReferenceLine['label'];
    style?: ReferenceLineLabelStyle;
};
export type Threshold = {
    accessibleLabel?: PreactThreshold['accessibleLabel'];
    color?: PreactThreshold['color'];
    max: PreactThreshold['max'];
};
export {};

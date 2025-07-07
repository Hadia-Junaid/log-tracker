import { JetElement, JetSettableProperties, JetElementCustomEventStrict, JetSetPropertyType } from 'ojs/index';
import { GlobalProps } from 'ojs/ojvcomponent';
import 'ojs/oj-jsx-interfaces';
import { ComponentProps, ComponentType } from 'preact';
import { ExtendGlobalProps, ObservedGlobalProps, PropertyChanged, ReadOnlyPropertyChanged } from 'ojs/ojvcomponent';
import { DisplayOptions, Help, HelpHints } from 'oj-c/editable-value/UNSAFE_useAssistiveText/useAssistiveText';
import { ExactMessageDetailParameters, OverflowMessageDetailParameters, RangeMessageDetailParameters, UnderflowMessageDetailParameters } from 'oj-c/editable-value/UNSAFE_useSelectionRangeValidator';
import { RichCheckboxSet as PreactRichCheckboxSet } from '@oracle/oraclejet-preact/UNSAFE_RichCheckboxSet';
import { type RichSelectionItemData } from '@oracle/oraclejet-preact/UNSAFE_RichSelectionItem';
import { LayoutColumnSpan } from '@oracle/oraclejet-preact/utils/UNSAFE_styles/Layout';
import { Size } from '@oracle/oraclejet-preact/utils/UNSAFE_size';
import 'css!oj-c/rich-checkboxset/rich-checkboxset-styles.css';
type ValidState = 'valid' | 'pending' | 'invalidHidden' | 'invalidShown';
type PreactRichCheckboxSetProps = ComponentProps<typeof PreactRichCheckboxSet>;
type DisplayOptionsProps = Pick<DisplayOptions, 'messages'>;
type RichCheckboxsetProps<V extends string | number> = ObservedGlobalProps<'aria-describedby' | 'id'> & {
    containerReadonly?: boolean;
    columnSpan?: LayoutColumnSpan;
    disabled?: boolean;
    displayOptions?: DisplayOptionsProps;
    help?: Help;
    helpHints?: HelpHints;
    labelEdge?: 'none' | 'top' | 'inside' | 'start';
    labelHint: string;
    labelStartWidth?: Size;
    layout: PreactRichCheckboxSetProps['layout'];
    maxSelected?: number;
    messagesCustom?: PreactRichCheckboxSetProps['messages'];
    minSelected?: number;
    readonly?: boolean;
    required?: boolean;
    selectionExactMessageDetail?: (p: ExactMessageDetailParameters) => string;
    selectionOverflowMessageDetail?: (p: OverflowMessageDetailParameters) => string;
    selectionRangeMessageDetail?: (p: RangeMessageDetailParameters) => string;
    selectionUnderflowMessageDetail?: (p: UnderflowMessageDetailParameters) => string;
    userAssistanceDensity?: PreactRichCheckboxSetProps['userAssistanceDensity'];
    options: Array<RichSelectionItemData<V>>;
    requiredMessageDetail?: string;
    onMessagesCustomChanged?: PropertyChanged<PreactRichCheckboxSetProps['messages']>;
    onValidChanged?: ReadOnlyPropertyChanged<ValidState>;
    onValueChanged?: PropertyChanged<Array<V> | null>;
    value?: Array<V> | null;
};
declare const RichCheckboxset: ComponentType<ExtendGlobalProps<RichCheckboxsetProps<string | number>>>;
export { RichCheckboxset };
export type { RichSelectionItemData, RichCheckboxsetProps };
export interface CRichCheckboxsetElement<V extends string | number> extends JetElement<CRichCheckboxsetElementSettableProperties<V>>, CRichCheckboxsetElementSettableProperties<V> {
    readonly valid?: Parameters<Required<RichCheckboxsetProps<V>>['onValidChanged']>[0];
    addEventListener<T extends keyof CRichCheckboxsetElementEventMap<V>>(type: T, listener: (this: HTMLElement, ev: CRichCheckboxsetElementEventMap<V>[T]) => any, options?: (boolean | AddEventListenerOptions)): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: (boolean | AddEventListenerOptions)): void;
    getProperty<T extends keyof CRichCheckboxsetElementSettableProperties<V>>(property: T): CRichCheckboxsetElement<V>[T];
    getProperty(property: string): any;
    setProperty<T extends keyof CRichCheckboxsetElementSettableProperties<V>>(property: T, value: CRichCheckboxsetElementSettableProperties<V>[T]): void;
    setProperty<T extends string>(property: T, value: JetSetPropertyType<T, CRichCheckboxsetElementSettableProperties<V>>): void;
    setProperties(properties: CRichCheckboxsetElementSettablePropertiesLenient<V>): void;
    blur: () => void;
    focus: () => void;
    reset: () => void;
    showMessages: () => void;
    validate: () => Promise<'invalid' | 'valid'>;
}
export namespace CRichCheckboxsetElement {
    type columnSpanChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['columnSpan']>;
    type containerReadonlyChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['containerReadonly']>;
    type disabledChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['disabled']>;
    type displayOptionsChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['displayOptions']>;
    type helpChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['help']>;
    type helpHintsChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['helpHints']>;
    type labelEdgeChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['labelEdge']>;
    type labelHintChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['labelHint']>;
    type labelStartWidthChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['labelStartWidth']>;
    type layoutChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['layout']>;
    type maxSelectedChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['maxSelected']>;
    type messagesCustomChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['messagesCustom']>;
    type minSelectedChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['minSelected']>;
    type optionsChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['options']>;
    type readonlyChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['readonly']>;
    type requiredChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['required']>;
    type requiredMessageDetailChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['requiredMessageDetail']>;
    type selectionExactMessageDetailChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['selectionExactMessageDetail']>;
    type selectionOverflowMessageDetailChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['selectionOverflowMessageDetail']>;
    type selectionRangeMessageDetailChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['selectionRangeMessageDetail']>;
    type selectionUnderflowMessageDetailChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['selectionUnderflowMessageDetail']>;
    type userAssistanceDensityChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['userAssistanceDensity']>;
    type validChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['valid']>;
    type valueChanged<V extends string | number> = JetElementCustomEventStrict<CRichCheckboxsetElement<V>['value']>;
}
export interface CRichCheckboxsetElementEventMap<V extends string | number> extends HTMLElementEventMap {
    'columnSpanChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['columnSpan']>;
    'containerReadonlyChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['containerReadonly']>;
    'disabledChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['disabled']>;
    'displayOptionsChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['displayOptions']>;
    'helpChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['help']>;
    'helpHintsChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['helpHints']>;
    'labelEdgeChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['labelEdge']>;
    'labelHintChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['labelHint']>;
    'labelStartWidthChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['labelStartWidth']>;
    'layoutChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['layout']>;
    'maxSelectedChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['maxSelected']>;
    'messagesCustomChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['messagesCustom']>;
    'minSelectedChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['minSelected']>;
    'optionsChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['options']>;
    'readonlyChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['readonly']>;
    'requiredChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['required']>;
    'requiredMessageDetailChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['requiredMessageDetail']>;
    'selectionExactMessageDetailChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['selectionExactMessageDetail']>;
    'selectionOverflowMessageDetailChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['selectionOverflowMessageDetail']>;
    'selectionRangeMessageDetailChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['selectionRangeMessageDetail']>;
    'selectionUnderflowMessageDetailChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['selectionUnderflowMessageDetail']>;
    'userAssistanceDensityChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['userAssistanceDensity']>;
    'validChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['valid']>;
    'valueChanged': JetElementCustomEventStrict<CRichCheckboxsetElement<V>['value']>;
}
export interface CRichCheckboxsetElementSettableProperties<V extends string | number> extends JetSettableProperties {
    columnSpan?: RichCheckboxsetProps<V>['columnSpan'];
    containerReadonly?: RichCheckboxsetProps<V>['containerReadonly'];
    disabled?: RichCheckboxsetProps<V>['disabled'];
    displayOptions?: RichCheckboxsetProps<V>['displayOptions'];
    help?: RichCheckboxsetProps<V>['help'];
    helpHints?: RichCheckboxsetProps<V>['helpHints'];
    labelEdge?: RichCheckboxsetProps<V>['labelEdge'];
    labelHint: RichCheckboxsetProps<V>['labelHint'];
    labelStartWidth?: RichCheckboxsetProps<V>['labelStartWidth'];
    layout: RichCheckboxsetProps<V>['layout'];
    maxSelected?: RichCheckboxsetProps<V>['maxSelected'];
    messagesCustom?: RichCheckboxsetProps<V>['messagesCustom'];
    minSelected?: RichCheckboxsetProps<V>['minSelected'];
    options: RichCheckboxsetProps<V>['options'];
    readonly?: RichCheckboxsetProps<V>['readonly'];
    required?: RichCheckboxsetProps<V>['required'];
    requiredMessageDetail?: RichCheckboxsetProps<V>['requiredMessageDetail'];
    selectionExactMessageDetail?: RichCheckboxsetProps<V>['selectionExactMessageDetail'];
    selectionOverflowMessageDetail?: RichCheckboxsetProps<V>['selectionOverflowMessageDetail'];
    selectionRangeMessageDetail?: RichCheckboxsetProps<V>['selectionRangeMessageDetail'];
    selectionUnderflowMessageDetail?: RichCheckboxsetProps<V>['selectionUnderflowMessageDetail'];
    userAssistanceDensity?: RichCheckboxsetProps<V>['userAssistanceDensity'];
    value?: RichCheckboxsetProps<V>['value'];
}
export interface CRichCheckboxsetElementSettablePropertiesLenient<V extends string | number> extends Partial<CRichCheckboxsetElementSettableProperties<V>> {
    [key: string]: any;
}
export interface RichCheckboxsetIntrinsicProps extends Partial<Readonly<CRichCheckboxsetElementSettableProperties<any>>>, GlobalProps, Pick<preact.JSX.HTMLAttributes, 'ref' | 'key'> {
    valid?: never;
    oncolumnSpanChanged?: (value: CRichCheckboxsetElementEventMap<any>['columnSpanChanged']) => void;
    oncontainerReadonlyChanged?: (value: CRichCheckboxsetElementEventMap<any>['containerReadonlyChanged']) => void;
    ondisabledChanged?: (value: CRichCheckboxsetElementEventMap<any>['disabledChanged']) => void;
    ondisplayOptionsChanged?: (value: CRichCheckboxsetElementEventMap<any>['displayOptionsChanged']) => void;
    onhelpChanged?: (value: CRichCheckboxsetElementEventMap<any>['helpChanged']) => void;
    onhelpHintsChanged?: (value: CRichCheckboxsetElementEventMap<any>['helpHintsChanged']) => void;
    onlabelEdgeChanged?: (value: CRichCheckboxsetElementEventMap<any>['labelEdgeChanged']) => void;
    onlabelHintChanged?: (value: CRichCheckboxsetElementEventMap<any>['labelHintChanged']) => void;
    onlabelStartWidthChanged?: (value: CRichCheckboxsetElementEventMap<any>['labelStartWidthChanged']) => void;
    onlayoutChanged?: (value: CRichCheckboxsetElementEventMap<any>['layoutChanged']) => void;
    onmaxSelectedChanged?: (value: CRichCheckboxsetElementEventMap<any>['maxSelectedChanged']) => void;
    onmessagesCustomChanged?: (value: CRichCheckboxsetElementEventMap<any>['messagesCustomChanged']) => void;
    onminSelectedChanged?: (value: CRichCheckboxsetElementEventMap<any>['minSelectedChanged']) => void;
    onoptionsChanged?: (value: CRichCheckboxsetElementEventMap<any>['optionsChanged']) => void;
    onreadonlyChanged?: (value: CRichCheckboxsetElementEventMap<any>['readonlyChanged']) => void;
    onrequiredChanged?: (value: CRichCheckboxsetElementEventMap<any>['requiredChanged']) => void;
    onrequiredMessageDetailChanged?: (value: CRichCheckboxsetElementEventMap<any>['requiredMessageDetailChanged']) => void;
    onselectionExactMessageDetailChanged?: (value: CRichCheckboxsetElementEventMap<any>['selectionExactMessageDetailChanged']) => void;
    onselectionOverflowMessageDetailChanged?: (value: CRichCheckboxsetElementEventMap<any>['selectionOverflowMessageDetailChanged']) => void;
    onselectionRangeMessageDetailChanged?: (value: CRichCheckboxsetElementEventMap<any>['selectionRangeMessageDetailChanged']) => void;
    onselectionUnderflowMessageDetailChanged?: (value: CRichCheckboxsetElementEventMap<any>['selectionUnderflowMessageDetailChanged']) => void;
    onuserAssistanceDensityChanged?: (value: CRichCheckboxsetElementEventMap<any>['userAssistanceDensityChanged']) => void;
    onvalidChanged?: (value: CRichCheckboxsetElementEventMap<any>['validChanged']) => void;
    onvalueChanged?: (value: CRichCheckboxsetElementEventMap<any>['valueChanged']) => void;
}
declare global {
    namespace preact.JSX {
        interface IntrinsicElements {
            'oj-c-rich-checkboxset': RichCheckboxsetIntrinsicProps;
        }
    }
}

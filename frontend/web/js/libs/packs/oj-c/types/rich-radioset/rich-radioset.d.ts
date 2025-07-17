import { JetElement, JetSettableProperties, JetElementCustomEventStrict, JetSetPropertyType } from 'ojs/index';
import { GlobalProps } from 'ojs/ojvcomponent';
import 'ojs/oj-jsx-interfaces';
import { ComponentProps, ComponentType } from 'preact';
import { ExtendGlobalProps, ObservedGlobalProps, PropertyChanged, ReadOnlyPropertyChanged } from 'ojs/ojvcomponent';
import { DisplayOptions, Help, HelpHints } from 'oj-c/editable-value/UNSAFE_useAssistiveText/useAssistiveText';
import { RichRadioSet as PreactRichRadioSet } from '@oracle/oraclejet-preact/UNSAFE_RichRadioSet';
import { LayoutColumnSpan } from '@oracle/oraclejet-preact/utils/UNSAFE_styles/Layout';
import { type RichSelectionItemData } from '@oracle/oraclejet-preact/UNSAFE_RichSelectionItem';
import { Size } from '@oracle/oraclejet-preact/utils/UNSAFE_size';
import 'css!oj-c/rich-radioset/rich-radioset-styles.css';
type ValidState = 'valid' | 'pending' | 'invalidHidden' | 'invalidShown';
type PreactRichRadiosetProps = ComponentProps<typeof PreactRichRadioSet>;
type DisplayOptionsProps = Pick<DisplayOptions, 'messages'>;
type RichRadiosetProps<V extends string | number> = ObservedGlobalProps<'aria-describedby' | 'id'> & {
    containerReadonly?: boolean;
    columnSpan?: LayoutColumnSpan;
    disabled?: boolean;
    displayOptions?: DisplayOptionsProps;
    help?: Help;
    helpHints?: HelpHints;
    labelEdge?: 'none' | 'top' | 'inside' | 'start';
    labelHint: string;
    labelStartWidth?: Size;
    layout: PreactRichRadiosetProps['layout'];
    messagesCustom?: PreactRichRadiosetProps['messages'];
    readonly?: boolean;
    required?: boolean;
    userAssistanceDensity?: PreactRichRadiosetProps['userAssistanceDensity'];
    options: Array<RichSelectionItemData<V>>;
    requiredMessageDetail?: string;
    onMessagesCustomChanged?: PropertyChanged<PreactRichRadiosetProps['messages']>;
    onValidChanged?: ReadOnlyPropertyChanged<ValidState>;
    onValueChanged?: PropertyChanged<V | null>;
    value?: V | null;
};
declare const RichRadioset: ComponentType<ExtendGlobalProps<RichRadiosetProps<string | number>>>;
export { RichRadioset };
export type { RichSelectionItemData, RichRadiosetProps };
export interface CRichRadiosetElement<V extends string | number> extends JetElement<CRichRadiosetElementSettableProperties<V>>, CRichRadiosetElementSettableProperties<V> {
    readonly valid?: Parameters<Required<RichRadiosetProps<V>>['onValidChanged']>[0];
    addEventListener<T extends keyof CRichRadiosetElementEventMap<V>>(type: T, listener: (this: HTMLElement, ev: CRichRadiosetElementEventMap<V>[T]) => any, options?: (boolean | AddEventListenerOptions)): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: (boolean | AddEventListenerOptions)): void;
    getProperty<T extends keyof CRichRadiosetElementSettableProperties<V>>(property: T): CRichRadiosetElement<V>[T];
    getProperty(property: string): any;
    setProperty<T extends keyof CRichRadiosetElementSettableProperties<V>>(property: T, value: CRichRadiosetElementSettableProperties<V>[T]): void;
    setProperty<T extends string>(property: T, value: JetSetPropertyType<T, CRichRadiosetElementSettableProperties<V>>): void;
    setProperties(properties: CRichRadiosetElementSettablePropertiesLenient<V>): void;
    blur: () => void;
    focus: () => void;
    reset: () => void;
    showMessages: () => void;
    validate: () => Promise<'invalid' | 'valid'>;
}
export namespace CRichRadiosetElement {
    type columnSpanChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['columnSpan']>;
    type containerReadonlyChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['containerReadonly']>;
    type disabledChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['disabled']>;
    type displayOptionsChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['displayOptions']>;
    type helpChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['help']>;
    type helpHintsChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['helpHints']>;
    type labelEdgeChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['labelEdge']>;
    type labelHintChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['labelHint']>;
    type labelStartWidthChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['labelStartWidth']>;
    type layoutChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['layout']>;
    type messagesCustomChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['messagesCustom']>;
    type optionsChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['options']>;
    type readonlyChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['readonly']>;
    type requiredChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['required']>;
    type requiredMessageDetailChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['requiredMessageDetail']>;
    type userAssistanceDensityChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['userAssistanceDensity']>;
    type validChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['valid']>;
    type valueChanged<V extends string | number> = JetElementCustomEventStrict<CRichRadiosetElement<V>['value']>;
}
export interface CRichRadiosetElementEventMap<V extends string | number> extends HTMLElementEventMap {
    'columnSpanChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['columnSpan']>;
    'containerReadonlyChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['containerReadonly']>;
    'disabledChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['disabled']>;
    'displayOptionsChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['displayOptions']>;
    'helpChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['help']>;
    'helpHintsChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['helpHints']>;
    'labelEdgeChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['labelEdge']>;
    'labelHintChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['labelHint']>;
    'labelStartWidthChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['labelStartWidth']>;
    'layoutChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['layout']>;
    'messagesCustomChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['messagesCustom']>;
    'optionsChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['options']>;
    'readonlyChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['readonly']>;
    'requiredChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['required']>;
    'requiredMessageDetailChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['requiredMessageDetail']>;
    'userAssistanceDensityChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['userAssistanceDensity']>;
    'validChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['valid']>;
    'valueChanged': JetElementCustomEventStrict<CRichRadiosetElement<V>['value']>;
}
export interface CRichRadiosetElementSettableProperties<V extends string | number> extends JetSettableProperties {
    columnSpan?: RichRadiosetProps<V>['columnSpan'];
    containerReadonly?: RichRadiosetProps<V>['containerReadonly'];
    disabled?: RichRadiosetProps<V>['disabled'];
    displayOptions?: RichRadiosetProps<V>['displayOptions'];
    help?: RichRadiosetProps<V>['help'];
    helpHints?: RichRadiosetProps<V>['helpHints'];
    labelEdge?: RichRadiosetProps<V>['labelEdge'];
    labelHint: RichRadiosetProps<V>['labelHint'];
    labelStartWidth?: RichRadiosetProps<V>['labelStartWidth'];
    layout: RichRadiosetProps<V>['layout'];
    messagesCustom?: RichRadiosetProps<V>['messagesCustom'];
    options: RichRadiosetProps<V>['options'];
    readonly?: RichRadiosetProps<V>['readonly'];
    required?: RichRadiosetProps<V>['required'];
    requiredMessageDetail?: RichRadiosetProps<V>['requiredMessageDetail'];
    userAssistanceDensity?: RichRadiosetProps<V>['userAssistanceDensity'];
    value?: RichRadiosetProps<V>['value'];
}
export interface CRichRadiosetElementSettablePropertiesLenient<V extends string | number> extends Partial<CRichRadiosetElementSettableProperties<V>> {
    [key: string]: any;
}
export interface RichRadiosetIntrinsicProps extends Partial<Readonly<CRichRadiosetElementSettableProperties<any>>>, GlobalProps, Pick<preact.JSX.HTMLAttributes, 'ref' | 'key'> {
    valid?: never;
    oncolumnSpanChanged?: (value: CRichRadiosetElementEventMap<any>['columnSpanChanged']) => void;
    oncontainerReadonlyChanged?: (value: CRichRadiosetElementEventMap<any>['containerReadonlyChanged']) => void;
    ondisabledChanged?: (value: CRichRadiosetElementEventMap<any>['disabledChanged']) => void;
    ondisplayOptionsChanged?: (value: CRichRadiosetElementEventMap<any>['displayOptionsChanged']) => void;
    onhelpChanged?: (value: CRichRadiosetElementEventMap<any>['helpChanged']) => void;
    onhelpHintsChanged?: (value: CRichRadiosetElementEventMap<any>['helpHintsChanged']) => void;
    onlabelEdgeChanged?: (value: CRichRadiosetElementEventMap<any>['labelEdgeChanged']) => void;
    onlabelHintChanged?: (value: CRichRadiosetElementEventMap<any>['labelHintChanged']) => void;
    onlabelStartWidthChanged?: (value: CRichRadiosetElementEventMap<any>['labelStartWidthChanged']) => void;
    onlayoutChanged?: (value: CRichRadiosetElementEventMap<any>['layoutChanged']) => void;
    onmessagesCustomChanged?: (value: CRichRadiosetElementEventMap<any>['messagesCustomChanged']) => void;
    onoptionsChanged?: (value: CRichRadiosetElementEventMap<any>['optionsChanged']) => void;
    onreadonlyChanged?: (value: CRichRadiosetElementEventMap<any>['readonlyChanged']) => void;
    onrequiredChanged?: (value: CRichRadiosetElementEventMap<any>['requiredChanged']) => void;
    onrequiredMessageDetailChanged?: (value: CRichRadiosetElementEventMap<any>['requiredMessageDetailChanged']) => void;
    onuserAssistanceDensityChanged?: (value: CRichRadiosetElementEventMap<any>['userAssistanceDensityChanged']) => void;
    onvalidChanged?: (value: CRichRadiosetElementEventMap<any>['validChanged']) => void;
    onvalueChanged?: (value: CRichRadiosetElementEventMap<any>['valueChanged']) => void;
}
declare global {
    namespace preact.JSX {
        interface IntrinsicElements {
            'oj-c-rich-radioset': RichRadiosetIntrinsicProps;
        }
    }
}

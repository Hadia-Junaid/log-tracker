      // Add custom element entries to preact.JSX.IntrinsicElements for custom elements
      // used in JSX that do not have the required type definitions
      declare namespace preact.JSX {
        interface IntrinsicElements {
          'oj-input-text': any;
          'oj-input-search': any;
          'oj-c-checkbox': any;
          'oj-button': any;
          'oj-avatar': any;
          'oj-label': any;
          'oj-option': any;
          "oj-card": any;
          "oj-vcomponent-elements": any;
          "ojactioncard": any;
          "oj-c-card": any;
          "oj-checkbox-set": any;
          "ojselectsingle": any;
          "ojselectcombobox": any;
          "oj-form-layout": any;
          "oj-form-item": any;
          "oj-form-message": any;
          "oj-c-message-banner": any;
          "oj-c-message-toast": any;
          "oj-c-flex": any;
    "oj-c-list-item-layout": any;
    "oj-c-flex": any;
          "ojselectsingle": any;
          "ojselectcombobox": any;
        }
      }

      // Add module declarations for image imports
      declare module "*.png" {
        const value: string;
        export default value;
      }

      declare module "*.jpg" {
        const value: string;
        export default value;
      }

      declare module "*.jpeg" {
        const value: string;
        export default value;
      }

      declare module "*.gif" {
        const value: string;
        export default value;
      }

      declare module "*.svg" {
        const value: string;
        export default value;
      }

      // Add custom element entries to preact.JSX.IntrinsicElements for custom elements
      // used in JSX that do not have the required type definitions
      declare namespace preact.JSX {
        interface IntrinsicElements {
        }
      }

      // Add module declarations for image imports
      declare module "*.png" {
        const value: string;
        export default value;
      }

      declare module "*.jpg" {
        const value: string;
        export default value;
      }

      declare module "*.jpeg" {
        const value: string;
        export default value;
      }

      declare module "*.gif" {
        const value: string;
        export default value;
      }

      declare module "*.svg" {
        const value: string;
        export default value;
      }
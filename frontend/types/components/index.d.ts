      // Add custom element entries to preact.JSX.IntrinsicElements for custom elements
      // used in JSX that do not have the required type definitions
      declare namespace preact.JSX {
        interface IntrinsicElements {
          'oj-input-text': any;
          'oj-input-search': any;
          'oj-checkboxset': any;
          'oj-c-checkbox': any;
          'oj-button': any;
          'oj-avatar': any;
          'oj-label': any;
          'oj-option': any;
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
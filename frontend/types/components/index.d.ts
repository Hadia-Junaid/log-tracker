      // Add custom element entries to preact.JSX.IntrinsicElements for custom elements
      // used in JSX that do not have the required type definitions
      declare namespace preact.JSX {
        interface IntrinsicElements {
          "oj-c-select-multiple"?: any;
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
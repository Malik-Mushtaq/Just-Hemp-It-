declare global {
  interface SecureTradingConfig {
    jwt?: string;
    errorReporting?: boolean;
    submitOnSuccess?: boolean;
    submitOnError?: boolean;
    submitOnCancel?: boolean;
    disabledAutoPaymentStart?: string[];
    componentIds?: Record<string, string>;
    submitCallback?: (payload: unknown) => void;
    errorCallback?: (payload: unknown) => void;
    components?: {
      callbacks?: {
        onPaymentFormValidityChange?: (payload: unknown) => void;
        [key: string]: ((payload: unknown) => void) | undefined;
      };
    };
    [key: string]: unknown;
  }

  interface SecureTradingInstance {
    on: (event: string, callback: (data: unknown) => void) => void;
    Components: (options?: unknown) => void;
    destroy?: () => void;
    [key: string]: unknown;
  }

  interface Window {
    SecureTrading?: (config: SecureTradingConfig) => SecureTradingInstance;
  }
}

export {};

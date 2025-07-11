import * as ko from "knockout";
declare class LoginViewModel {
    errorMessage: ko.Observable<string>;
    isProcessingAuth: ko.Observable<boolean>;
    constructor();
    private checkUrlParameters;
    private exchangeAuthCode;
    handleLogin: () => Promise<void>;
    connected(): void;
    disconnected(): void;
    transitionCompleted(): void;
}
export = LoginViewModel;

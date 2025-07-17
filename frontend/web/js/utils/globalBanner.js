define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class GlobalBannerService {
        getBannerElement() {
            return document.getElementById('globalBanner');
        }
        showSuccess(message, duration = 5000) {
            this.displayBanner(message, ['#dff0d8', 'green'], duration);
        }
        showError(message, duration = 5000) {
            this.displayBanner(message, ['#efd7d7', 'red'], duration);
        }
        displayBanner(message, colors, duration) {
            const bannerElement = this.getBannerElement();
            if (bannerElement) {
                bannerElement.textContent = message;
                bannerElement.style.display = 'block';
                bannerElement.style.backgroundColor = colors[0];
                bannerElement.style.color = colors[1];
                setTimeout(() => {
                    if (bannerElement)
                        bannerElement.style.display = 'none';
                }, duration);
            }
        }
    }
    exports.default = new GlobalBannerService();
});
//# sourceMappingURL=globalBanner.js.map
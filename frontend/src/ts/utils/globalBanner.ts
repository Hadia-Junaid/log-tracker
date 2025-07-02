class GlobalBannerService {
    private bannerElement: HTMLElement | null;

    constructor() {
        this.bannerElement = document.getElementById('globalBanner');
    }

    showSuccess(message: string, duration: number = 5000) {
        this.displayBanner(message, 'green', duration);
    }

    showError(message: string, duration: number = 5000) {
        this.displayBanner(message, 'red', duration);
    }

    private displayBanner(message: string, color: string, duration: number) {
        if (!this.bannerElement) {
            this.bannerElement = document.getElementById('globalBanner');
        }
        if (this.bannerElement) {
            this.bannerElement.textContent = message;
            this.bannerElement.style.display = 'block';
            this.bannerElement.style.color = color;

            setTimeout(() => {
                if (this.bannerElement) this.bannerElement.style.display = 'none';
            }, duration);
        }
    }
}

export default new GlobalBannerService();

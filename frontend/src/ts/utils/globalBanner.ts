class GlobalBannerService {
    private bannerElement: HTMLElement | null;

    constructor() {
        this.bannerElement = document.getElementById('globalBanner');
    }

    showSuccess(message: string, duration: number = 5000) {
        this.displayBanner(message, ['#dff0d8', 'green'], duration);
    }

    showError(message: string, duration: number = 5000) {
        this.displayBanner(message, ['#efd7d7', 'red'], duration);
    }

    private displayBanner(message: string, colors: [string, string], duration: number) {
        if (!this.bannerElement) {
            this.bannerElement = document.getElementById('globalBanner');
        }
        if (this.bannerElement) {
            this.bannerElement.textContent = message;
            this.bannerElement.style.display = 'block';
            this.bannerElement.style.backgroundColor = colors[0];
            this.bannerElement.style.color = colors[1];


            setTimeout(() => {
                if (this.bannerElement) this.bannerElement.style.display = 'none';
            }, duration);
        }
    }
}

export default new GlobalBannerService();

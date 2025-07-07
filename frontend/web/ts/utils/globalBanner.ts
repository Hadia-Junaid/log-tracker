class GlobalBannerService {

    private getBannerElement(): HTMLElement | null {
        return document.getElementById('globalBanner');
    }

    showSuccess(message: string, duration: number = 5000) {
        this.displayBanner(message, ['#dff0d8', 'green'], duration);
    }

    showError(message: string, duration: number = 5000) {
        this.displayBanner(message, ['#efd7d7', 'red'], duration);
    }

    private displayBanner(message: string, colors: [string, string], duration: number) {

        const bannerElement = this.getBannerElement();
        if (bannerElement) {
            bannerElement.textContent = message;
            bannerElement.style.display = 'block';
            bannerElement.style.backgroundColor = colors[0];
            bannerElement.style.color = colors[1];


            setTimeout(() => {
                if (bannerElement) bannerElement.style.display = 'none';
            }, duration);
        }
    }
}

export default new GlobalBannerService();

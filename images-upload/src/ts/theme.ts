const signElement = document.querySelector('[for="dark-mode"]') as HTMLLabelElement;

const Theme = (themeKey: string, attributTheme: string) => ({
    icon: (localStorage.getItem("sign-theme") as 'Midnight Mode' | 'Daylight Mode') || 'Midnight Mode',
    currentStatus: (localStorage.getItem(themeKey) as 'active' | 'inactive') || 'inactive',

    applyTheme(): void {
        if (localStorage.getItem(themeKey) !== this.currentStatus) {
            localStorage.setItem(themeKey, this.currentStatus);
        }
        if (document.body.getAttribute(attributTheme) !== this.currentStatus) {
            document.body.setAttribute(themeKey, this.currentStatus);
        }
    },

    changeTheme(status: 'active' | 'inactive'): void {
        if (this.currentStatus !== status) {
            this.currentStatus = status;
            this.applyTheme();
        }
    },

    applySign(): void {
        if (signElement) signElement.textContent = this.icon;
    },

    changeSign(sign: 'Midnight Mode' | 'Daylight Mode') {
        if (this.icon !== sign) {
            this.icon = sign;
            localStorage.setItem("sign-theme", sign);
            this.applySign();
        }
    },

    get isActive() {
        return localStorage.getItem(themeKey) === 'active';
    },

    debounce(fn: Function, delay: number): Function {
        let timeout: number;
        return (...args: any[]): void => {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => fn(...args), delay);
        }
    }
});

export default Theme;
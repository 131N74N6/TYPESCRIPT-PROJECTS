const signElement = document.querySelector('[for="dark-mode"]') as HTMLLabelElement;

class Theme {
    private themeKey: string;
    private attributTheme: string;
    private icon: 'Midnight Mode' | 'Daylight Mode';
    private currentStatus: 'active' | 'inactive';

    constructor(themeKey: string, attributTheme: string) {
        this.themeKey = themeKey;
        this.attributTheme = attributTheme;
        this.currentStatus = (localStorage.getItem(this.themeKey) as 'active' | 'inactive') || 'inactive';
        this.icon = (localStorage.getItem("sign-theme") as 'Midnight Mode' | 'Daylight Mode') || 'Midnight Mode';
        this.applyTheme();
        this.applySign();
    }

    applyTheme(): void {
        if (localStorage.getItem(this.themeKey) !== this.currentStatus) {
            localStorage.setItem(this.themeKey, this.currentStatus);
        }
        if (document.body.getAttribute(this.attributTheme) !== this.currentStatus) {
            document.body.setAttribute(this.themeKey, this.currentStatus);
        }
    }

    changeTheme(status: 'active' | 'inactive'): void {
        if (this.currentStatus !== status) {
            this.currentStatus = status;
            this.applyTheme();
        }
    }

    applySign(): void {
        if (signElement) signElement.textContent = this.icon;
    }

    changeSign(sign: 'Midnight Mode' | 'Daylight Mode') {
        if (this.icon !== sign) {
            this.icon = sign;
            localStorage.setItem("sign-theme", sign);
            this.applySign();
        }
    }

    get isActive() {
        return localStorage.getItem(this.themeKey) === 'active';
    }

    debounce(fn: Function, delay: number): Function {
        let timeout: number;
        return (...args: any[]): void => {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => fn(...args), delay);
        }
    }
}

export default Theme;
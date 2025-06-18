class Theme {
    private key: string;
    private attrTheme: string;
    private currentState: 'active' | 'inactive';

    constructor(themeKey: string, attribute: string) {
        this.key = themeKey;
        this.attrTheme = attribute;
        this.currentState = (localStorage.getItem(this.key) as 'active' | 'inactive') || 'inactive';
        this.applyTheme();
    }

    applyTheme(): void {
        if (localStorage.getItem(this.key) !== this.currentState) {
            localStorage.setItem(this.key, this.currentState);
        }

        if (document.body.getAttribute(this.attrTheme) !== this.currentState) {
            document.body.setAttribute(this.attrTheme, this.currentState);
        }
    }

    changeTheme(status: 'active' | 'inactive'): void {
        if (this.currentState !== status) {
            this.currentState = status;
            this.applyTheme();
        }
    }

    get isActive() {
        return this.currentState === "active";
    }

    debounce(fn: Function, delay: number): Function {
        let timeoutId: number;
        return (...args: any[]): void => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => fn(...args), delay);
        }
    }
}

export default Theme;
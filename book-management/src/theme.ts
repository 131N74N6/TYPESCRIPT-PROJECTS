const signElement = document.querySelector('[for="dark-mode"]') as HTMLLabelElement;

class Theme {
    private keyTheme: string;
    private attrTheme: string;
    private currentStatus: 'active' | 'inactive';
    private signTheme: 'Dark Mode' | 'Light Mode';

    constructor(keyTheme: string, attrTheme: string) {
        this.keyTheme = keyTheme;
        this.attrTheme = attrTheme;
        this.currentStatus = (localStorage.getItem(this.keyTheme) as 'active' | 'inactive') || 'inactive';
        this.signTheme = (localStorage.getItem("sign-theme") as 'Dark Mode' | 'Light Mode') || 'Dark Mode';
        this.applyTheme();
        this.applySign();
    }

    applyTheme(): void {
        if (localStorage.getItem(this.keyTheme) !== this.currentStatus) {
            localStorage.setItem(this.keyTheme, this.currentStatus);
        }

        if (document.body.getAttribute(this.attrTheme) !== this.currentStatus) {
            document.body.setAttribute(this.keyTheme, this.currentStatus);
        }
    }

    changeTheme(status: 'active' | 'inactive'): void {
        if (this.currentStatus !== status) {
            this.currentStatus = status;
            this.applyTheme();
        }
    }

    applySign(): void {
        if (signElement) signElement.textContent = this.signTheme;
    }

    changeSign(sign: 'Dark Mode' | 'Light Mode') {
        if (this.signTheme !== sign) {
            this.signTheme = sign;
            localStorage.setItem("sign-theme", sign);
            this.applySign();
        }
    }

    get isActive() {
        return localStorage.getItem(this.keyTheme) === 'active';
    }

    debounce(fn: Function, delay: number): Function {
        let timeout: number;
        return(...args: any[]): void => {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(() => fn(...args), delay);
        }
    }
}

export default Theme;
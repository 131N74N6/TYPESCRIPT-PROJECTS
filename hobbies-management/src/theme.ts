class ThemeChanger {
    private key: string;
    private attrTheme: string;
    private iconElement = document.querySelector('[for="dark-mode"]') as HTMLLabelElement;
    private currentState: 'active' | 'inactive';
    private currentThemeIcon: '🌙' | '☀️';

    constructor(themeKey: string, attribute: string) {
        this.key = themeKey;
        this.attrTheme = attribute;
        this.currentThemeIcon = (localStorage.getItem("theme-icon") as '🌙' | '☀️') || '🌙';
        this.currentState = (localStorage.getItem(this.key) as 'active' | 'inactive') || 'inactive';
        this.updateIconElement();
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

    private updateIconElement() {
        if(this.iconElement) {
            this.iconElement.textContent = this.currentThemeIcon;
        }
    }
    
    changeIcon(icon: '🌙' | '☀️'): void {
        if (this.currentThemeIcon !== icon) {
            this.currentThemeIcon = icon;
            localStorage.setItem("theme-icon", icon);
            this.updateIconElement(); // Update DOM 
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

export default ThemeChanger;
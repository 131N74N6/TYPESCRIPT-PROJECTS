class ThemeSetter {
    private themeKey: string;
    private attr: string;
    private currentState: 'active' | 'inactive';

    constructor(key: string, attrKey: string) {
        this.themeKey = key;
        this.attr = attrKey;
        this.currentState = (localStorage.getItem(this.themeKey) as 'active' | 'inactive') || 'inactive';
        this.applyTheme(); 
    }

    private applyTheme(): void {
        // Update DOM hanya jika state berubah
        if (document.body.getAttribute(this.attr) !== this.currentState) {
            document.body.setAttribute(this.attr, this.currentState);
        }
        
        // Update localStorage hanya jika diperlukan
        if (localStorage.getItem(this.themeKey) !== this.currentState) {
            localStorage.setItem(this.themeKey, this.currentState);
        }
    }

    setTheme(state: 'active' | 'inactive'): void {
        if (this.currentState !== state) {
            this.currentState = state;
            this.applyTheme();
        }
    }

    get isActive(): boolean {
        return this.currentState === 'active';
    }
}

class DarkTheme extends ThemeSetter {
    constructor() {
        super("dark-mode", "dark-mode");
    }
}

// Event Handler dengan Debouncing
const debounce = (fn: Function, delay: number) => {
    let timeoutId: number;
    return (...args: any[]): void => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => fn(...args), delay);
    };
};

document.addEventListener("DOMContentLoaded", (): void => {
    const darkTheme = new DarkTheme();
    const darkToggle = document.getElementById("dark-toggle") as HTMLInputElement;
    const icon = document.querySelector('[for="dark-toggle"]') as HTMLLabelElement;

    // Sync checkbox dengan state awal
    darkToggle.checked = darkTheme.isActive;

    // Handle perubahan tema dengan debounce 100ms
    const handleThemeChange = debounce((isChecked: boolean) => {
        darkTheme.setTheme(isChecked ? 'active' : 'inactive');
        icon.textContent = darkToggle.checked ? "☀️" : "🌙";
    }, 100);

    darkToggle.addEventListener("change", (e) => {
        handleThemeChange((e.target as HTMLInputElement).checked);
    });
});
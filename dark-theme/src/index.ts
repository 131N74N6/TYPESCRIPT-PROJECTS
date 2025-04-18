class ThemeSetter {
    private themeKey: string;
    private attr: string;
    private currentState: string;

    constructor(key: string, attrKey: string) {
        this.themeKey = key;
        this.attr = attrKey;
        this.currentState = localStorage.getItem(this.themeKey) || 'inactive';
        this.applyThemeState(); // Initial apply
    }

    private applyThemeState(): void {
        const newState = this.currentState === 'active' ? 'active' : 'inactive';
        
        // Update DOM hanya jika state berubah
        if (document.body.getAttribute(this.attr) !== newState) {
            document.body.setAttribute(this.attr, newState);
        }
        
        // Update localStorage hanya jika diperlukan
        if (localStorage.getItem(this.themeKey) !== newState) {
            localStorage.setItem(this.themeKey, newState);
        }
    }

    setTheme(state: 'active' | 'inactive'): void {
        if (this.currentState !== state) {
            this.currentState = state;
            this.applyThemeState();
        }
    }

    toggleTheme(): void {
        this.setTheme(this.currentState === 'active' ? 'inactive' : 'active');
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
    return (...args: any[]) => {
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => fn(...args), delay);
    };
};

document.addEventListener("DOMContentLoaded", (): void => {
    const darkTheme = new DarkTheme();
    const darkToggle = document.getElementById("dark-toggle") as HTMLInputElement;

    // Sync checkbox dengan state awal
    darkToggle.checked = darkTheme.isActive;

    // Handle perubahan tema dengan debounce 100ms
    const handleThemeChange = debounce((isChecked: boolean) => {
        darkTheme.setTheme(isChecked ? 'active' : 'inactive');
    }, 100);

    darkToggle.addEventListener("change", (e) => {
        handleThemeChange((e.target as HTMLInputElement).checked);
    });
});
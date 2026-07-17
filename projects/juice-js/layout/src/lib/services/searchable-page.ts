/**
 * Implemented by a routed page to declare that it supports search.
 *
 * The shell's toolbar hosts one search box, shared by every page. It appears only
 * while the displayed page implements this interface, and disappears otherwise —
 * there is nothing else to opt in to and no flag to set.
 *
 * Implementing `onSearch` IS the declaration: support and handling cannot be
 * declared apart, so a box that accepts typing no page listens to is impossible.
 *
 * @example
 * export class OrdersComponent implements SearchablePage {
 *   onSearch(query: string): void {
 *     this.filter = query;   // '' means the box was cleared — show everything
 *   }
 * }
 */
export interface SearchablePage {
    /**
     * Called as the user types, and once with `''` when the box is cleared.
     * An empty query means "show everything" — it is not the same as the box being
     * absent, which calls nothing at all.
     *
     * Called on every keystroke: the shell does not debounce, impose a minimum
     * length, or wait for Enter. A page that wants any of those owns them.
     * Must not throw — the shell does not catch.
     *
     * @param query What the user has typed. Never null; `''` when cleared.
     * @param event The originating DOM event, when there is one.
     */
    onSearch(query: string, event?: Event): void;
}

/**
 * Structural type guard used by the shell to detect {@link SearchablePage}.
 *
 * TypeScript interfaces are erased at runtime, so support is detected by shape
 * rather than by nominal type. See research.md Decision 1 for the trade-off.
 */
export function isSearchablePage(value: unknown): value is SearchablePage {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as SearchablePage).onSearch === 'function'
    );
}

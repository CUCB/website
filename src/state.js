export const cache = (fn) => {
    let cached = new Map();
    return (...args) => {
        let key = JSON.stringify(args);
        if (!cached.has(key)) {
            cached.set(key, fn(...args));
        }
        return cached.get(key);
    }
}

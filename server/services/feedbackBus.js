// In-process pub/sub para eventos de feedback.
// Uma instancia basta enquanto roda um unico container backend; se escalar
// para multiplos workers, trocar a implementacao por Redis pub/sub.

const subscribers = new Map(); // key -> Set<fn>

function subscribe(key, fn) {
    let set = subscribers.get(key);
    if (!set) {
        set = new Set();
        subscribers.set(key, set);
    }
    set.add(fn);
    return () => {
        set.delete(fn);
        if (set.size === 0) subscribers.delete(key);
    };
}

function publish(message) {
    const { thread_id } = message;
    const direct = subscribers.get(thread_id);
    if (direct) for (const fn of direct) try { fn(message); } catch {}
    const wildcard = subscribers.get('*');
    if (wildcard) for (const fn of wildcard) try { fn(message); } catch {}
}

module.exports = { subscribe, publish };

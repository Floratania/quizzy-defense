let database;
function open() {
    if (!database) database = new Promise((resolve, reject) => {
        const request = indexedDB.open('quizzy-drafts', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('drafts');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => { database = null; reject(request.error); };
    });
    return database;
}
async function transaction(key, mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('drafts', mode);
        const request = action(tx.objectStore('drafts'), key);
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}
export const loadQuizDraft = (key) => transaction(key, 'readonly', (store, id) => store.get(id));
export const saveQuizDraft = (key, draft) => transaction(key, 'readwrite', (store, id) => store.put(draft, id));
export const deleteQuizDraft = (key) => transaction(key, 'readwrite', (store, id) => store.delete(id));

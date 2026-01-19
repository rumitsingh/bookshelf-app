// IndexedDB Storage Handler
class BookStorage {
    constructor() {
        this.dbName = 'BookshelfDB';
        this.dbVersion = 1;
        this.storeName = 'books';
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // Create indexes for searching
                    objectStore.createIndex('title', 'title', { unique: false });
                    objectStore.createIndex('author', 'author', { unique: false });
                    objectStore.createIndex('genre', 'genre', { unique: false });
                    objectStore.createIndex('yearRead', 'yearRead', { unique: false });
                }
            };
        });
    }

    // Get all books
    async getAllBooks() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get book by ID
    async getBook(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Add new book
    async addBook(book) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);

            // Add timestamp
            book.dateAdded = book.dateAdded || new Date().toISOString();

            const request = objectStore.add(book);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Update existing book
    async updateBook(book) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.put(book);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete book
    async deleteBook(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Search books
    async searchBooks(query) {
        const allBooks = await this.getAllBooks();
        const lowerQuery = query.toLowerCase();

        return allBooks.filter(book => {
            return (
                book.title.toLowerCase().includes(lowerQuery) ||
                book.author.toLowerCase().includes(lowerQuery) ||
                (book.genre && book.genre.toLowerCase().includes(lowerQuery)) ||
                (book.isbn && book.isbn.toLowerCase().includes(lowerQuery))
            );
        });
    }

    // Export all books to JSON
    async exportToJSON() {
        const books = await this.getAllBooks();
        const exportData = {
            books: books,
            exportDate: new Date().toISOString(),
            totalBooks: books.length,
            version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    // Import books from JSON
    async importFromJSON(jsonData, mode = 'replace') {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            if (!data.books || !Array.isArray(data.books)) {
                throw new Error('Invalid backup file format');
            }

            if (mode === 'replace') {
                // Clear all existing books
                const existingBooks = await this.getAllBooks();
                for (const book of existingBooks) {
                    await this.deleteBook(book.id);
                }
            }

            // Import all books
            let importedCount = 0;
            for (const book of data.books) {
                // Remove the id to avoid conflicts (IndexedDB will auto-generate)
                const { id, ...bookWithoutId } = book;
                await this.addBook(bookWithoutId);
                importedCount++;
            }

            return {
                success: true,
                imported: importedCount,
                mode: mode
            };
        } catch (error) {
            throw new Error('Failed to import books: ' + error.message);
        }
    }

    // Import mock data (first launch only)
    async importMockData() {
        // Disabled - start with empty bookshelf
        // Users will add their own books
        return;
    }
}

// Create global storage instance
const storage = new BookStorage();

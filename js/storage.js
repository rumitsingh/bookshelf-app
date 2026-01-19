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

    // Import mock data (first launch only)
    async importMockData() {
        const books = await this.getAllBooks();
        if (books.length > 0) {
            return; // Already have books
        }

        const mockBooks = [
            {
                title: "1984",
                author: "George Orwell",
                isbn: "9780451524935",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
                yearRead: 2023,
                publicationYear: 1949,
                genre: "Dystopian Fiction",
                notes: null
            },
            {
                title: "To Kill a Mockingbird",
                author: "Harper Lee",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
                yearRead: 2023,
                publicationYear: 1960,
                genre: "Classic Fiction",
                notes: null
            },
            {
                title: "The Great Gatsby",
                author: "F. Scott Fitzgerald",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
                yearRead: 2022,
                publicationYear: 1925,
                genre: "Classic Fiction",
                notes: null
            },
            {
                title: "Dune",
                author: "Frank Herbert",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
                yearRead: 2024,
                publicationYear: 1965,
                genre: "Science Fiction",
                notes: null
            },
            {
                title: "The Hobbit",
                author: "J.R.R. Tolkien",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
                yearRead: 2021,
                publicationYear: 1937,
                genre: "Fantasy",
                notes: null
            },
            {
                title: "Pride and Prejudice",
                author: "Jane Austen",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
                yearRead: 2023,
                publicationYear: 1813,
                genre: "Romance",
                notes: null
            },
            {
                title: "The Catcher in the Rye",
                author: "J.D. Salinger",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780316769174-L.jpg",
                yearRead: 2022,
                publicationYear: 1951,
                genre: "Coming of Age",
                notes: null
            },
            {
                title: "Harry Potter and the Philosopher's Stone",
                author: "J.K. Rowling",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780439708180-L.jpg",
                yearRead: 2020,
                publicationYear: 1997,
                genre: "Fantasy",
                notes: null
            },
            {
                title: "The Lord of the Rings",
                author: "J.R.R. Tolkien",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780544003415-L.jpg",
                yearRead: 2021,
                publicationYear: 1954,
                genre: "Fantasy",
                notes: null
            },
            {
                title: "Animal Farm",
                author: "George Orwell",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780451526342-L.jpg",
                yearRead: 2023,
                publicationYear: 1945,
                genre: "Political Satire",
                notes: null
            },
            {
                title: "Brave New World",
                author: "Aldous Huxley",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg",
                yearRead: 2024,
                publicationYear: 1932,
                genre: "Dystopian Fiction",
                notes: null
            },
            {
                title: "The Hitchhiker's Guide to the Galaxy",
                author: "Douglas Adams",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780345391803-L.jpg",
                yearRead: 2022,
                publicationYear: 1979,
                genre: "Science Fiction",
                notes: null
            },
            {
                title: "Fahrenheit 451",
                author: "Ray Bradbury",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9781451673319-L.jpg",
                yearRead: 2023,
                publicationYear: 1953,
                genre: "Dystopian Fiction",
                notes: null
            },
            {
                title: "The Alchemist",
                author: "Paulo Coelho",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
                yearRead: 2024,
                publicationYear: 1988,
                genre: "Philosophical Fiction",
                notes: null
            },
            {
                title: "Moby-Dick",
                author: "Herman Melville",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780142437247-L.jpg",
                yearRead: 2021,
                publicationYear: 1851,
                genre: "Adventure Fiction",
                notes: null
            },
            {
                title: "Jane Eyre",
                author: "Charlotte Brontë",
                coverImageURL: "https://covers.openlibrary.org/b/isbn/9780142437209-L.jpg",
                yearRead: 2022,
                publicationYear: 1847,
                genre: "Gothic Romance",
                notes: null
            }
        ];

        // Add all mock books
        for (const book of mockBooks) {
            await this.addBook(book);
        }
    }
}

// Create global storage instance
const storage = new BookStorage();

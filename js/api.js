// Open Library API Integration
class OpenLibraryAPI {
    constructor() {
        this.baseURL = 'https://openlibrary.org/api/books';
        this.searchURL = 'https://openlibrary.org/search.json';
        this.coverURL = 'https://covers.openlibrary.org/b/isbn';
        this.coverIdURL = 'https://covers.openlibrary.org/b/id';
    }

    // Fetch book by ISBN
    async fetchBook(isbn, yearRead) {
        const cleanISBN = this.cleanISBN(isbn);
        const url = `${this.baseURL}?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const key = `ISBN:${cleanISBN}`;

            if (!data[key]) {
                // Fallback: try search API which has broader coverage
                return await this.searchByISBN(cleanISBN, yearRead);
            }

            return this.parseBookData(data[key], cleanISBN, yearRead);
        } catch (error) {
            if (error.message.includes('not found') || error.message.includes('manual entry')) {
                throw error;
            }
            throw new Error(`Failed to fetch book: ${error.message}`);
        }
    }

    // Fallback: search Open Library by ISBN using the search API
    async searchByISBN(isbn, yearRead) {
        const url = `${this.searchURL}?isbn=${isbn}&limit=1&fields=title,author_name,subject,first_publish_year,cover_i`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Book not found. Try manual entry instead.');
        }

        const data = await response.json();
        if (!data.docs || data.docs.length === 0) {
            throw new Error('Book not found in Open Library. Try manual entry instead.');
        }

        return this.parseSearchDoc(data.docs[0], isbn, yearRead);
    }

    // Search Open Library by title/query string
    async fetchBookByTitle(query, yearRead) {
        const url = `${this.searchURL}?q=${encodeURIComponent(query)}&limit=1&fields=title,author_name,subject,first_publish_year,cover_i,isbn`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Search failed. Try manual entry instead.');
        }

        const data = await response.json();
        if (!data.docs || data.docs.length === 0) {
            throw new Error('No book found for that search. Try entering the ISBN directly or use manual entry.');
        }

        const doc = data.docs[0];
        const isbn = doc.isbn?.[0] || '';
        return this.parseSearchDoc(doc, isbn, yearRead);
    }

    // Parse a search.json doc into a book object
    parseSearchDoc(doc, isbn, yearRead) {
        const coverURL = doc.cover_i
            ? `${this.coverIdURL}/${doc.cover_i}-L.jpg`
            : (isbn ? `${this.coverURL}/${isbn}-L.jpg` : '');

        return {
            title: doc.title || 'Untitled',
            author: doc.author_name?.[0] || 'Unknown Author',
            isbn,
            coverImageURL: coverURL,
            yearRead: parseInt(yearRead),
            publicationYear: doc.first_publish_year || null,
            genre: doc.subject?.[0] || null,
            notes: null
        };
    }

    // Parse /api/books response to book object
    parseBookData(data, isbn, yearRead) {
        const title = data.title || 'Untitled';
        const author = data.authors && data.authors.length > 0
            ? data.authors[0].name
            : 'Unknown Author';

        const coverURL = data.cover?.large || data.cover?.medium || data.cover?.small ||
            `${this.coverURL}/${isbn}-L.jpg`;

        // Extract publication year
        let publicationYear = null;
        if (data.publish_date) {
            const yearMatch = data.publish_date.match(/\d{4}/);
            if (yearMatch) {
                publicationYear = parseInt(yearMatch[0]);
            }
        }

        // Extract genre from subjects
        let genre = null;
        if (data.subjects && data.subjects.length > 0) {
            genre = data.subjects[0].name;
        }

        return {
            title,
            author,
            isbn,
            coverImageURL: coverURL,
            yearRead: parseInt(yearRead),
            publicationYear,
            genre,
            notes: null
        };
    }

    // Clean ISBN (remove hyphens, spaces)
    cleanISBN(isbn) {
        return isbn.replace(/[-\s]/g, '');
    }

    // Get cover URL for ISBN
    getCoverURL(isbn, size = 'L') {
        const cleanISBN = this.cleanISBN(isbn);
        return `${this.coverURL}/${cleanISBN}-${size}.jpg`;
    }
}

// URL Parser - Extract ISBN from various book URLs
class URLParser {
    static extractISBN(input) {
        const trimmedInput = input.trim();

        // Try direct ISBN first
        const directISBN = this.extractDirectISBN(trimmedInput);
        if (directISBN) return directISBN;

        // Parse as URL
        if (trimmedInput.includes('amazon')) {
            return this.extractFromAmazon(trimmedInput);
        } else if (trimmedInput.includes('goodreads')) {
            return this.extractFromGoodreads(trimmedInput);
        } else if (trimmedInput.includes('google')) {
            return this.extractFromGoogleBooks(trimmedInput);
        } else if (trimmedInput.includes('openlibrary')) {
            return this.extractFromOpenLibrary(trimmedInput);
        }

        // Last resort: try to find ISBN pattern anywhere
        return this.extractDirectISBN(trimmedInput);
    }

    // Extract a title search query from URLs that don't contain an ISBN
    static extractSearchQuery(input) {
        try {
            const parsed = new URL(input.trim());
            // Amazon search results: ?k=thinking+fast+and+slow
            if (parsed.hostname.includes('amazon') && parsed.searchParams.has('k')) {
                return parsed.searchParams.get('k');
            }
            // Google Books search: ?q=...
            if (parsed.hostname.includes('google') && parsed.searchParams.has('q')) {
                return parsed.searchParams.get('q');
            }
        } catch (e) {}
        return null;
    }

    static extractDirectISBN(text) {
        // ISBN-13: 978 or 979 followed by 10 digits
        const isbn13Match = text.match(/\b(97[89][\d\-\s]{10,})\b/);
        if (isbn13Match) {
            const cleaned = isbn13Match[1].replace(/[-\s]/g, '');
            if (cleaned.length === 13) return cleaned;
        }

        // ISBN-10: 9 digits followed by digit or X
        const isbn10Match = text.match(/\b(\d{9}[\dX])\b/i);
        if (isbn10Match) {
            return isbn10Match[1].toUpperCase();
        }

        // ISBN with hyphens (more flexible)
        const isbnHyphenMatch = text.match(/\b(97[89][\d\-\s]{10,}|\d[\d\-\s]{8,}[\dX])\b/i);
        if (isbnHyphenMatch) {
            const cleaned = isbnHyphenMatch[1].replace(/[-\s]/g, '').toUpperCase();
            if (cleaned.length === 10 || cleaned.length === 13) {
                return cleaned;
            }
        }

        return null;
    }

    static extractFromAmazon(url) {
        // Amazon ASIN/ISBN pattern: /dp/{ASIN} or /gp/product/{ASIN}
        const patterns = [
            /\/dp\/([A-Z0-9]{10})/i,
            /\/gp\/product\/([A-Z0-9]{10})/i,
            /\/product\/([A-Z0-9]{10})/i
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const asin = match[1];
                // Only numeric ASINs are ISBNs — B-prefixed ASINs are Kindle/digital editions
                if (/^\d/.test(asin)) {
                    return asin;
                }
                // B-prefixed ASIN: not an ISBN, can't look up in Open Library
                return null;
            }
        }

        // Fallback to direct ISBN extraction
        return this.extractDirectISBN(url);
    }

    static extractFromGoodreads(url) {
        return this.extractDirectISBN(url);
    }

    static extractFromGoogleBooks(url) {
        // Try to find isbn parameter
        const isbnParam = url.match(/isbn=([^&]+)/);
        if (isbnParam) {
            return isbnParam[1];
        }
        return this.extractDirectISBN(url);
    }

    static extractFromOpenLibrary(url) {
        // Open Library: /books/{identifier} or /isbn/{isbn}
        const isbnMatch = url.match(/\/isbn\/([^/]+)/);
        if (isbnMatch) {
            return isbnMatch[1].replace(/[-\s]/g, '');
        }
        return this.extractDirectISBN(url);
    }

    static isValidISBN(isbn) {
        const cleaned = isbn.replace(/[-\s]/g, '');

        if (cleaned.length === 10) {
            return true;
        }

        if (cleaned.length === 13 && (cleaned.startsWith('978') || cleaned.startsWith('979'))) {
            return true;
        }

        return false;
    }
}

// Create global API instance
const openLibraryAPI = new OpenLibraryAPI();

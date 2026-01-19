// Main App State and Logic
let currentBooks = [];
let currentSortOption = 'genre';
let currentSearchQuery = '';
let currentBookForAction = null;
let fetchedBookData = null;
let importFileData = null;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await storage.init();
        await storage.importMockData();
        await loadAndDisplayBooks();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to initialize app', 'error');
    }
});

// Load and display all books
async function loadAndDisplayBooks() {
    try {
        currentBooks = await storage.getAllBooks();
        displayBooks(currentBooks);
    } catch (error) {
        console.error('Failed to load books:', error);
        showToast('Failed to load books', 'error');
    }
}

// Display books in shelf layout
function displayBooks(books) {
    const container = document.getElementById('booksContainer');
    const emptyState = document.getElementById('emptyState');
    const searchEmptyState = document.getElementById('searchEmptyState');

    // Handle empty states
    if (books.length === 0) {
        container.style.display = 'none';
        searchEmptyState.style.display = 'none';
        if (currentSearchQuery) {
            searchEmptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'flex';
        }
        return;
    }

    emptyState.style.display = 'none';
    searchEmptyState.style.display = 'none';
    container.style.display = 'block';

    // Group books based on sort option
    const groupedBooks = groupBooks(books, currentSortOption);

    // Render shelves
    container.innerHTML = '';
    for (const [groupName, groupBooks] of groupedBooks) {
        const shelf = createShelfSection(groupName, groupBooks);
        container.appendChild(shelf);
    }
}

// Group books by sort option
function groupBooks(books, sortOption) {
    const groups = new Map();

    switch (sortOption) {
        case 'genre':
            books.forEach(book => {
                const genre = book.genre || 'Uncategorized';
                if (!groups.has(genre)) groups.set(genre, []);
                groups.get(genre).push(book);
            });
            return new Map([...groups.entries()].sort());

        case 'yearNewest':
        case 'yearOldest':
            books.forEach(book => {
                const year = `Year ${book.yearRead}`;
                if (!groups.has(year)) groups.set(year, []);
                groups.get(year).push(book);
            });
            const sorted = [...groups.entries()].sort((a, b) => {
                const yearA = parseInt(a[0].replace('Year ', ''));
                const yearB = parseInt(b[0].replace('Year ', ''));
                return sortOption === 'yearNewest' ? yearB - yearA : yearA - yearB;
            });
            return new Map(sorted);

        case 'titleAZ':
            const titleSorted = [...books].sort((a, b) => a.title.localeCompare(b.title));
            groups.set('All Books', titleSorted);
            return groups;

        case 'authorAZ':
            books.forEach(book => {
                const firstLetter = book.author.charAt(0).toUpperCase();
                if (!groups.has(firstLetter)) groups.set(firstLetter, []);
                groups.get(firstLetter).push(book);
            });
            return new Map([...groups.entries()].sort());

        default:
            groups.set('All Books', books);
            return groups;
    }
}

// Create shelf section HTML
function createShelfSection(title, books) {
    const section = document.createElement('div');
    section.className = 'shelf-section';

    const header = document.createElement('div');
    header.className = 'shelf-header';
    header.innerHTML = `<h3 class="shelf-title">${title}</h3>`;

    const booksContainer = document.createElement('div');
    booksContainer.className = 'shelf-books';

    books.forEach(book => {
        const bookCard = createBookCard(book);
        booksContainer.appendChild(bookCard);
    });

    const divider = document.createElement('div');
    divider.className = 'shelf-divider';

    section.appendChild(header);
    section.appendChild(booksContainer);
    section.appendChild(divider);

    return section;
}

// Create book card HTML
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.onclick = () => showBookDetail(book);

    const coverContainer = document.createElement('div');
    coverContainer.className = 'book-cover-container';

    if (book.coverImageURL) {
        const img = document.createElement('img');
        img.className = 'book-cover';
        img.src = book.coverImageURL;
        img.alt = book.title;
        img.onerror = () => {
            img.style.display = 'none';
            coverContainer.appendChild(createPlaceholderCover(book.title));
        };
        coverContainer.appendChild(img);
    } else {
        coverContainer.appendChild(createPlaceholderCover(book.title));
    }

    const info = document.createElement('div');
    info.className = 'book-info';
    info.innerHTML = `
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
    `;

    card.appendChild(coverContainer);
    card.appendChild(info);

    return card;
}

// Create placeholder cover
function createPlaceholderCover(title) {
    const placeholder = document.createElement('div');
    placeholder.className = 'book-cover-placeholder';
    placeholder.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <div class="placeholder-title">${title}</div>
    `;
    return placeholder;
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('menuBtn').onclick = () => openModal('menuModal');
    document.getElementById('addBtn').onclick = () => openAddBookModal();
    document.getElementById('addFirstBook').onclick = () => openAddBookModal();

    // Menu options
    document.getElementById('sortMenuBtn').onclick = () => {
        closeModal('menuModal');
        openModal('sortModal');
    };
    document.getElementById('exportBtn').onclick = exportBooks;
    document.getElementById('importBtn').onclick = () => {
        closeModal('menuModal');
        document.getElementById('importFileInput').click();
    };

    // Import file handling
    document.getElementById('importFileInput').onchange = handleImportFile;
    document.getElementById('replaceAllBtn').onclick = () => importBooks('replace');
    document.getElementById('mergeBtn').onclick = () => importBooks('merge');

    // Sort options - ONLY attach to sort modal buttons
    document.querySelectorAll('#sortModal .sort-option').forEach(btn => {
        btn.onclick = () => {
            currentSortOption = btn.dataset.sort;
            displayBooks(currentBooks);
            closeModal('sortModal');
        };
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');

    searchInput.oninput = async (e) => {
        currentSearchQuery = e.target.value;
        clearSearch.style.display = currentSearchQuery ? 'block' : 'none';

        if (currentSearchQuery.trim()) {
            const results = await storage.searchBooks(currentSearchQuery);
            displayBooks(results);
        } else {
            displayBooks(currentBooks);
        }
    };

    clearSearch.onclick = () => {
        searchInput.value = '';
        currentSearchQuery = '';
        clearSearch.style.display = 'none';
        displayBooks(currentBooks);
    };

    // Add book modal
    document.getElementById('fetchBtn').onclick = fetchBookMetadata;
    document.getElementById('manualEntryBtn').onclick = () => {
        closeModal('addBookModal');
        openModal('manualEntryModal');
    };
    document.getElementById('saveBookBtn').onclick = saveBookFromFetch;
    document.getElementById('saveManualBookBtn').onclick = saveManualBook;

    // Edit book
    document.getElementById('saveEditBtn').onclick = saveEditedBook;

    // Context menu
    document.getElementById('contextEdit').onclick = editCurrentBook;
    document.getElementById('contextDelete').onclick = deleteCurrentBook;

    // Book menu
    document.getElementById('bookMenuBtn').onclick = (e) => {
        e.stopPropagation();
        showContextMenu(e.clientX, e.clientY);
    };

    // Close context menu on outside click
    document.addEventListener('click', () => {
        document.getElementById('contextMenu').style.display = 'none';
    });
}

// Modal Management
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';

    // Reset forms
    if (modalId === 'addBookModal') {
        document.getElementById('urlInput').value = '';
        document.getElementById('yearInput').value = '';
        document.getElementById('fetchError').style.display = 'none';
        document.getElementById('bookPreview').style.display = 'none';
        fetchedBookData = null;
    } else if (modalId === 'manualEntryModal') {
        document.querySelectorAll('#manualEntryModal input, #manualEntryModal textarea').forEach(el => el.value = '');
    }
}

// Add Book Functionality
function openAddBookModal() {
    fetchedBookData = null;
    openModal('addBookModal');
}

async function fetchBookMetadata() {
    const urlInput = document.getElementById('urlInput').value.trim();
    const yearInput = document.getElementById('yearInput').value.trim();
    const errorDiv = document.getElementById('fetchError');
    const previewDiv = document.getElementById('bookPreview');

    errorDiv.style.display = 'none';
    previewDiv.style.display = 'none';

    if (!urlInput || !yearInput) {
        errorDiv.textContent = 'Please enter both URL/ISBN and year';
        errorDiv.style.display = 'block';
        return;
    }

    showLoading(true);

    try {
        // Extract ISBN
        const isbn = URLParser.extractISBN(urlInput);
        if (!isbn) {
            throw new Error('Could not extract ISBN from URL. Try entering the ISBN directly or use manual entry.');
        }

        // Fetch book data
        const bookData = await openLibraryAPI.fetchBook(isbn, yearInput);
        fetchedBookData = bookData;

        // Show preview
        document.getElementById('previewCover').src = bookData.coverImageURL;
        document.getElementById('previewTitle').textContent = bookData.title;
        document.getElementById('previewAuthor').textContent = `by ${bookData.author}`;

        if (bookData.genre) {
            document.getElementById('previewGenre').textContent = bookData.genre;
            document.getElementById('previewGenre').style.display = 'inline-block';
        } else {
            document.getElementById('previewGenre').style.display = 'none';
        }

        previewDiv.style.display = 'block';
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        showLoading(false);
    }
}

async function saveBookFromFetch() {
    if (!fetchedBookData) return;

    showLoading(true);
    try {
        await storage.addBook(fetchedBookData);
        await loadAndDisplayBooks();
        closeModal('addBookModal');
        showToast('Book added successfully!', 'success');
    } catch (error) {
        showToast('Failed to save book', 'error');
    } finally {
        showLoading(false);
    }
}

async function saveManualBook() {
    const title = document.getElementById('manualTitle').value.trim();
    const author = document.getElementById('manualAuthor').value.trim();
    const yearRead = document.getElementById('manualYear').value.trim();

    if (!title || !author || !yearRead) {
        showToast('Please fill in required fields', 'error');
        return;
    }

    const book = {
        title,
        author,
        yearRead: parseInt(yearRead),
        isbn: document.getElementById('manualISBN').value.trim() || null,
        genre: document.getElementById('manualGenre').value.trim() || null,
        publicationYear: document.getElementById('manualPubYear').value.trim()
            ? parseInt(document.getElementById('manualPubYear').value.trim()) : null,
        coverImageURL: document.getElementById('manualCoverURL').value.trim() || null,
        notes: document.getElementById('manualNotes').value.trim() || null
    };

    showLoading(true);
    try {
        await storage.addBook(book);
        await loadAndDisplayBooks();
        closeModal('manualEntryModal');
        showToast('Book added successfully!', 'success');
    } catch (error) {
        showToast('Failed to save book', 'error');
    } finally {
        showLoading(false);
    }
}

// Book Detail
function showBookDetail(book) {
    currentBookForAction = book;

    document.getElementById('detailCover').src = book.coverImageURL || '';
    document.getElementById('detailTitle').textContent = book.title;
    document.getElementById('detailAuthor').textContent = book.author;
    document.getElementById('detailYear').textContent = book.yearRead;

    // Optional fields
    if (book.publicationYear) {
        document.getElementById('detailPubYear').textContent = book.publicationYear;
        document.getElementById('detailPubYearContainer').style.display = 'block';
    } else {
        document.getElementById('detailPubYearContainer').style.display = 'none';
    }

    if (book.genre) {
        document.getElementById('detailGenre').textContent = book.genre;
        document.getElementById('detailGenreContainer').style.display = 'block';
    } else {
        document.getElementById('detailGenreContainer').style.display = 'none';
    }

    if (book.isbn) {
        document.getElementById('detailISBN').textContent = book.isbn;
        document.getElementById('detailISBNContainer').style.display = 'block';
    } else {
        document.getElementById('detailISBNContainer').style.display = 'none';
    }

    if (book.notes) {
        document.getElementById('detailNotes').textContent = book.notes;
        document.getElementById('detailNotesContainer').style.display = 'block';
    } else {
        document.getElementById('detailNotesContainer').style.display = 'none';
    }

    openModal('bookDetailModal');
}

// Edit Book
function editCurrentBook() {
    if (!currentBookForAction) return;

    document.getElementById('contextMenu').style.display = 'none';
    closeModal('bookDetailModal');

    const book = currentBookForAction;
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editTitle').value = book.title;
    document.getElementById('editAuthor').value = book.author;
    document.getElementById('editYear').value = book.yearRead;
    document.getElementById('editISBN').value = book.isbn || '';
    document.getElementById('editGenre').value = book.genre || '';
    document.getElementById('editPubYear').value = book.publicationYear || '';
    document.getElementById('editCoverURL').value = book.coverImageURL || '';
    document.getElementById('editNotes').value = book.notes || '';

    openModal('editBookModal');
}

async function saveEditedBook() {
    const id = parseInt(document.getElementById('editBookId').value);
    const book = await storage.getBook(id);

    book.title = document.getElementById('editTitle').value.trim();
    book.author = document.getElementById('editAuthor').value.trim();
    book.yearRead = parseInt(document.getElementById('editYear').value);
    book.isbn = document.getElementById('editISBN').value.trim() || null;
    book.genre = document.getElementById('editGenre').value.trim() || null;
    book.publicationYear = document.getElementById('editPubYear').value.trim()
        ? parseInt(document.getElementById('editPubYear').value.trim()) : null;
    book.coverImageURL = document.getElementById('editCoverURL').value.trim() || null;
    book.notes = document.getElementById('editNotes').value.trim() || null;

    showLoading(true);
    try {
        await storage.updateBook(book);
        await loadAndDisplayBooks();
        closeModal('editBookModal');
        showToast('Book updated successfully!', 'success');
    } catch (error) {
        showToast('Failed to update book', 'error');
    } finally {
        showLoading(false);
    }
}

// Delete Book
async function deleteCurrentBook() {
    if (!currentBookForAction) return;

    if (!confirm(`Are you sure you want to delete "${currentBookForAction.title}"?`)) {
        return;
    }

    document.getElementById('contextMenu').style.display = 'none';
    closeModal('bookDetailModal');

    showLoading(true);
    try {
        await storage.deleteBook(currentBookForAction.id);
        await loadAndDisplayBooks();
        showToast('Book deleted', 'success');
    } catch (error) {
        showToast('Failed to delete book', 'error');
    } finally {
        showLoading(false);
        currentBookForAction = null;
    }
}

// Context Menu
function showContextMenu(x, y) {
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    // Adjust if off-screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
}

// Loading Indicator
function showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export Books
async function exportBooks() {
    try {
        const books = await storage.getAllBooks();

        if (books.length === 0) {
            showToast('No books to export', 'error');
            closeModal('menuModal');
            return;
        }

        showLoading(true);
        const json = await storage.exportToJSON();

        // Create download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookshelf-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        closeModal('menuModal');
        showToast(`Exported ${books.length} books successfully!`, 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Failed to export books', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle Import File Selection
async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        showLoading(true);
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.books || !Array.isArray(data.books)) {
            throw new Error('Invalid backup file');
        }

        // Store data temporarily
        importFileData = data;

        // Show info in modal
        document.getElementById('importFileInfo').textContent =
            `Found ${data.books.length} book${data.books.length !== 1 ? 's' : ''} from ${new Date(data.exportDate).toLocaleDateString()}`;

        // Show import modal
        openModal('importModal');
    } catch (error) {
        console.error('Import file error:', error);
        showToast('Invalid backup file', 'error');
    } finally {
        showLoading(false);
        event.target.value = ''; // Reset file input
    }
}

// Import Books
async function importBooks(mode) {
    if (!importFileData) return;

    try {
        showLoading(true);
        const result = await storage.importFromJSON(importFileData, mode);

        await loadAndDisplayBooks();
        closeModal('importModal');

        const modeText = mode === 'replace' ? 'Replaced all books with' : 'Merged';
        showToast(`${modeText} ${result.imported} imported books!`, 'success');

        importFileData = null;
    } catch (error) {
        console.error('Import failed:', error);
        showToast(error.message || 'Failed to import books', 'error');
    } finally {
        showLoading(false);
    }
}

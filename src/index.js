const init = () => {
    let quotes = [];
    let likesMap = {};
    const list = document.getElementById("quote-list");
    const form = document.getElementById("new-quote-form");
    const editTitle = document.getElementById("editTitle");
    const newQuote = document.getElementById("new-quote");
    const author = document.getElementById("author");

    let inEditMode = false;

    let formData = { quote: '', author: '' };
    let quotePayload = { id: '', quote: '', author: '' };

    function clearForm() {
        inEditMode = false;
        newQuote.value = '';
        author.value = '';
        editTitle.textContent = 'Add My Favorite Quotes:'
    }

    async function fetchQuotes() {
        try {
            const r = await fetch(`http://localhost:3000/quotes`);
            if (!r.ok) throw new Error('Error fetching quotes');
            quotes = await r.json();
            await fetchLikes();
            renderList(quotes);
        } catch (error) {
            console.error("Error fetching quotes:", error);
        }
    }

    async function fetchLikes() {
        try {
            const r = await fetch(`http://localhost:3000/likes`);
            if (!r.ok) throw new Error('Error fetching likes');
            const likes = await r.json();
            likesMap = {};
            likes.forEach((like) => {
                likesMap[like.quoteId] = like.count || 0;
            });
        } catch (error) {
            console.error("Error fetching likes:", error);
        }
    }

    function renderList(data) {
        const quoteItem = data.map((item) => {
            const likeCount = likesMap[item.id] || 0;
            return `
            <li class='quote-card'>
                <blockquote class="blockquote">
                    <p class="mb-0">${item.quote}</p>
                    <footer class="blockquote-footer">${item.author}</footer>
                    <br>
                    <button id=${item.id} class='btn-success'>Likes: <span>${likeCount}</span></button>
                    <button id=${item.id} class='btn-info'>Edit</button>
                    <button id=${item.id} class='btn-danger'>Delete</button>
                </blockquote>
            </li>`;
        });
        list.innerHTML = quoteItem.join('');
    }

    list.addEventListener('click', function (e) {
        const { id, className } = e.target;
        const quoteObject = quotes.find((quote) => String(quote.id) === id);

        switch (className) {
            case 'btn-danger':
                quotePayload = {
                    id: String(quoteObject.id),
                    quote: quoteObject.quote,
                    author: quoteObject.author,
                };
                deleteQuote(quotePayload);
                break;
            case 'btn-info':
                inEditMode = true;
                editTitle.textContent = 'Edit My Favorite Quotes:';
                quotePayload = {
                    id: String(quoteObject.id),
                    quote: quoteObject.quote,
                    author: quoteObject.author,
                };
                newQuote.value = quoteObject.quote;
                author.value = quoteObject.author;
                break;
            case 'btn-success':
                updateLike(id);
                break;
            default:
                break;
        }
    });

    async function updateLike(id) {
        likesMap[id] = (likesMap[id] || 0) + 1;
        await syncLikesToServer(id, likesMap[id]);
        renderList(quotes);
    }

    async function syncLikesToServer(id, count) {
        try {
            const r = await fetch(`http://localhost:3000/likes/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quoteId: parseInt(id), count }),
            });
            if (!r.ok) throw new Error('Error syncing likes');
        } catch (error) {
            console.error("Error syncing likes:", error)
        }
    }

    form.addEventListener('input', function () {
        if (inEditMode) {
            quotePayload = {
                ...quotePayload,
                quote: newQuote.value,
                author: author.value,
            };
        } else {
            formData = {
                quote: newQuote.value,
                author: author.value,
            };
        }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        inEditMode ? updateQuote(quotePayload) : createQuote(formData);
        clearForm();
    });

    async function createQuote(newQuote) {
        try {
            const r = await fetch(`http://localhost:3000/quotes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newQuote),
            });
            if (!r.ok) throw new Error('Error creating quote');
            const data = await r.json();
            quotes.push(data);
            await fetchLikes();
            renderList(quotes);
        } catch (error) {
            console.error("Error creating quote:", error)
        }
    }

    async function deleteQuote(quotePayload) {
        try {
            const r = await fetch(`http://localhost:3000/quotes/${quotePayload.id}`, {
                method: 'DELETE',
            });
            if (!r.ok) throw new Error('Error deleting quote');
            quotes = quotes.filter((quote) => quote.id !== quotePayload.id);
            await fetchLikes();
            renderList(quotes);
        } catch (error) {
             console.error("Error deleting quote:", error)
        }
    }

    async function updateQuote(quotePayload) {
        try {
            const r = await fetch(`http://localhost:3000/quotes/${quotePayload.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quotePayload),
            });
            if (!r.ok) throw new Error('Error updating quote');
            const data = await r.json();
            quotes = quotes.map((quote) =>
                quote.id === data.id ? data : quote
            );
            await fetchLikes();
            renderList(quotes);
        } catch (error) {
            console.error("Error updating quote:", error)
        }
    }

    fetchQuotes();
};

window.addEventListener("DOMContentLoaded", init);
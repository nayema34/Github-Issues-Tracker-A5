// API Endpoints
const BASE_URL = "https://phi-lab-server.vercel.app/api/v1/lab/issues";
const FIND_URL = "https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=";
const DETAIL_URL = "https://phi-lab-server.vercel.app/api/v1/lab/issue/";

// Global data store
let masterIssueList = [];

/**
 * Fetches all issues on initial load
 */
const fetchProjectIssues = () => {
    const listContainer = document.getElementById("issue-gallery");
    
    listContainer.innerHTML = `
        <div id="ux-loading-overlay" class="fixed inset-0 flex flex-col items-center justify-center bg-white/90 z-50">
            <div class="flex flex-col items-center p-10">
                <span class="loading loading-spinner w-24 text-primary"></span>
                <h2 class="text-2xl font-bold text-gray-800 mt-6">Loading Issues...</h2>
                <p class="text-gray-500 mt-2">Fetching the latest data from the tracker</p>
            </div>
        </div>
    `;

    fetch(BASE_URL)
        .then((response) => response.json())
        .then((payload) => {
            masterIssueList = payload.data;
            renderIssueCards(masterIssueList);
            refreshCounter(masterIssueList);
        })
        .catch((error) => {
            console.error("Fetch Error:", error);
            listContainer.innerHTML = `<div class="col-span-4 text-center py-20"><p class="text-red-500">Failed to load issues.</p></div>`;
        });
};

/**
 * Handles opening the detailed view modal
 */
const showIssueDetails = (ticketId) => {
    // 1. Toggle modal open
    const modalToggle = document.getElementById("details-view-trigger");
    modalToggle.checked = true;

    // 2. Set UI loading state
    document.getElementById("view-title").innerText = "Loading details...";
    document.getElementById("view-body-text").innerText = "";
    document.getElementById("view-tags-list").innerHTML = '<span class="loading loading-dots loading-md"></span>';

    // 3. Request specific ticket data
    fetch(`${DETAIL_URL}${ticketId}`)
        .then(res => res.json())
        .then(response => {
            const item = response.data;

            document.getElementById("view-title").innerText = item.title;
            document.getElementById("view-body-text").innerText = item.description;

            const badge = document.getElementById("view-status-badge");
            badge.innerText = item.status;
            badge.className = `px-4 py-1 rounded-full text-white text-sm capitalize ${
                item.status === "open" ? "bg-green-500" : "bg-purple-500"
            }`;

            document.getElementById("view-meta-info").innerText = 
                `Opened by ${item.author} • ${new Date(item.createdAt).toLocaleDateString()}`;

            const tagBox = document.getElementById("view-tags-list");
            tagBox.innerHTML = item.labels
                .map((tag) => {
                    if (tag === "bug") return `<span class="text-red-500 bg-red-50 border border-red-200 px-3 py-1 rounded-full text-sm font-bold">BUG</span>`;
                    if (tag === "help wanted") return `<span class="text-orange-500 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-sm font-bold">HELP WANTED</span>`;
                    if (tag === "enhancement") return `<span class="text-green-500 bg-green-50 border border-green-200 px-3 py-1 rounded-full text-sm font-bold">ENHANCEMENT</span>`;
                    return "";
                }).join("");

            document.getElementById("view-user-assigned").innerText = item.author;
            const rankBadge = document.getElementById("view-priority-level");
            rankBadge.innerText = item.priority.toUpperCase();
            rankBadge.className = `px-6 py-1.5 rounded-lg text-white font-bold inline-block ${
                item.priority === "high" ? "bg-red-500" : 
                item.priority === "medium" ? "bg-yellow-500" : "bg-gray-400"
            }`;
        })
        .catch(err => {
            console.error("Detail Fetch Error:", err);
            document.getElementById("view-title").innerText = "Error Loading Issue";
        });
};

/**
 * Renders list of cards into the gallery
 */
const renderIssueCards = (dataArray) => {
    const gallery = document.getElementById("issue-gallery");
    gallery.innerHTML = ""; 

    if (!dataArray || dataArray.length === 0) {
        gallery.innerHTML = `<p class="text-gray-500 text-center mt-10 col-span-full text-lg">No issues found.</p>`;
        return;
    }

    dataArray.forEach((obj) => {
        const borderStyle = obj.status === "open" ? "border-green-500" : "border-purple-500";
        const rankStyle =
            obj.priority === "high" ? "bg-red-100 text-red-500" : 
            obj.priority === "medium" ? "bg-yellow-100 text-yellow-600" : 
            "bg-gray-200 text-gray-500";

        const tagsMarkup = obj.labels
            .map((tag) => {
                if (tag === "bug") return `<span class="text-red-500 bg-red-100 px-2 py-1 rounded-full text-[10px] font-bold">BUG</span>`;
                if (tag === "help wanted") return `<span class="text-orange-500 bg-orange-100 px-2 py-1 rounded-full text-[10px] font-bold">HELP WANTED</span>`;
                if (tag === "enhancement") return `<span class="text-green-500 bg-green-100 px-2 py-1 rounded-full text-[10px] font-bold">ENHANCEMENT</span>`;
                return "";
            }).join("");

        const cardElement = document.createElement("div");
        cardElement.className = `bg-white shadow-md rounded-lg border-t-4 ${borderStyle} cursor-pointer hover:shadow-lg transition-all h-full`;

        cardElement.innerHTML = `
            <div class="flex flex-col h-full p-5">
                <div class="flex justify-between items-start mb-4">
                    <div class="${obj.status === 'open' ? 'text-green-500' : 'text-purple-500'} text-xl">
                        <i class="fa-regular fa-circle-check"></i>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${rankStyle}">
                        ${obj.priority.toUpperCase()}
                    </span>
                </div>
                <div class="flex-grow mb-6">
                    <h2 class="font-bold text-[16px] leading-tight text-gray-800">${obj.title}</h2>
                    <p class="text-gray-500 text-[13px] mt-2 leading-relaxed">${obj.description.substring(0, 80)}...</p>
                    <div class="flex flex-wrap gap-2 mt-4">${tagsMarkup}</div>
                </div>
                <div class="border-t pt-4 text-[12px] text-slate-400 space-y-1">
                    <div class="font-medium">#${obj.id} by ${obj.author}</div>
                    <div>${new Date(obj.createdAt).toLocaleDateString()}</div>
                </div>
            </div>
        `;

        cardElement.addEventListener("click", () => showIssueDetails(obj.id));
        gallery.appendChild(cardElement);
    });
};

/**
 * Updates the visual counter
 */
const refreshCounter = (items) => {
    const counter = document.getElementById("total-issue-ticker");
    if (counter) counter.innerText = items.length;
};

// Filter Selection Logic
const categoryButtons = document.querySelectorAll("#filter-tab-group button");

categoryButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        categoryButtons.forEach((b) => {
            b.classList.remove("btn-primary", "text-white"); 
            b.classList.add("bg-white", "border-gray-200", "text-gray-700"); 
        });

        btn.classList.add("btn-primary", "text-white");
        btn.classList.remove("bg-white", "border-gray-200", "text-gray-700");

        const filterValue = btn.innerText.trim().toLowerCase();
        let filteredResults = (filterValue === "all") 
            ? masterIssueList 
            : masterIssueList.filter((item) => item.status.toLowerCase() === filterValue);

        renderIssueCards(filteredResults);
        refreshCounter(filteredResults);
    });
});

/**
 * Search Execution Logic
 */
const initiateSearch = () => {
    const searchField = document.getElementById("query-input");
    const query = searchField.value.trim();
    const gallery = document.getElementById("issue-gallery");

    if (!query) {
        renderIssueCards(masterIssueList);
        refreshCounter(masterIssueList);
        return;
    }

    gallery.innerHTML = `<div class="col-span-4 flex flex-col items-center py-10"><span class="loading loading-spinner loading-lg text-primary"></span></div>`;

    fetch(`${FIND_URL}${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(payload => {
            renderIssueCards(payload.data);
            refreshCounter(payload.data);
        })
        .catch(err => console.error("Search failure:", err));
};

// Event Listeners for search
const searchTrigger = document.getElementById("execute-search");
const inputField = document.getElementById("query-input");

if (searchTrigger && inputField) {
    searchTrigger.addEventListener("click", initiateSearch);
    inputField.addEventListener("keypress", (event) => { 
        if (event.key === "Enter") initiateSearch(); 
    });
}

// Kickstart the app
fetchProjectIssues();
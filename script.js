
const form = document.getElementById("itemForm");
const itemName = document.getElementById("itemName");
const itemCategory = document.getElementById("itemCategory");
const importantDate = document.getElementById("importantDate");
const submitButton = document.getElementById("submitButton");
const itemList = document.getElementById("itemList");

let items = JSON.parse(localStorage.getItem("saveItItems")) || [];
let editingIndex = -1;

function getDateStatus(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const importantDay = new Date(dateString + "T00:00:00");

    if (importantDay < today) {
        return "Overdue";
    } else if (importantDay.getTime() === today.getTime()) {
        return "Due today";
    } else {
        return "Upcoming";
    }
}
function updateReminders() {
    const remindersList = document.getElementById("remindersList");

    const attentionItems = items.filter(function(item) {
        const status = getDateStatus(item.date);
        return status === "Overdue" || status === "Due today";
    });

    remindersList.innerHTML = "";

    if (attentionItems.length === 0) {
        remindersList.innerHTML = `
            <p class="no-reminders">
                You're all caught up! No items need attention today.
            </p>
        `;
        return;
    }

    attentionItems.forEach(function(item) {
        const status = getDateStatus(item.date);
        const card = document.createElement("div");

        card.className = status === "Overdue"
            ? "reminder-card overdue-reminder"
            : "reminder-card today-reminder";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const details = document.createElement("p");
        details.textContent = status + " · Important date: " + item.date;

        card.appendChild(name);
        card.appendChild(details);
        remindersList.appendChild(card);
    });
}
function updateDashboard() {
    const total = items.length;

    const overdue = items.filter(item =>
        getDateStatus(item.date) === "Overdue"
    ).length;

    const dueToday = items.filter(item =>
        getDateStatus(item.date) === "Due today"
    ).length;

    const upcoming = items.filter(item =>
        getDateStatus(item.date) === "Upcoming"
    ).length;

    document.getElementById("dashboard").innerHTML = `
        <p class="total-card">Total Items: ${total}</p>
        <p class="overdue-card">Overdue: ${overdue}</p>
        <p class="today-card">Due Today: ${dueToday}</p>
        <p class="upcoming-card">Upcoming: ${upcoming}</p>
        `;
    updateReminders();
}

function displayItems() {
    itemList.innerHTML = "";
    if (items.length === 0) {
        itemList.innerHTML = `
            <li class="empty-state">
                <div>
                    <h3>Your space is ready!</h3>
                    <p>You haven't saved any items yet.</p>
                    <p>Add your first item to start keeping track of what matters.</p>
                </div>
            </li>
        `;
        return;
    }
    const searchText = document.getElementById("searchInput")
        .value.toLowerCase().trim();

    const selectedCategory =
        document.getElementById("categoryFilter").value;

    items.forEach(function(item, index) {
        if (!item.name.toLowerCase().includes(searchText)) {
            return;
        }

        if (selectedCategory && item.category !== selectedCategory) {
            return;
        }

        const listItem = document.createElement("li");
        const itemDetails = document.createElement("div");

        const itemText = document.createElement("strong");
        itemText.textContent = item.name;

        const dateText = document.createElement("p");
        dateText.textContent = "Date: " + item.date;

        const categoryText = document.createElement("p");
        categoryText.textContent =
            "Category: " + (item.category || "Not selected");

        const statusText = document.createElement("p");
        statusText.textContent = getDateStatus(item.date);
        statusText.className =
            getDateStatus(item.date).toLowerCase().replace(" ", "-");

        itemDetails.appendChild(itemText);
        itemDetails.appendChild(dateText);
        itemDetails.appendChild(categoryText);
        itemDetails.appendChild(statusText);

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editingIndex = index;
            itemName.value = item.name;
            itemCategory.value = item.category || "";
            importantDate.value = item.date;
            submitButton.textContent = "Update Item";
            form.scrollIntoView({ behavior: "smooth" });
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";

       
deleteButton.addEventListener("click", function() {
    const confirmed = confirm(
        `Are you sure you want to delete "${item.name}"?`
    );

    if (!confirmed) return;

    items.splice(index, 1);
    localStorage.setItem("saveItItems", JSON.stringify(items));
    displayItems();
    updateDashboard();
});


        listItem.appendChild(itemDetails);
        listItem.appendChild(editButton);
        listItem.appendChild(deleteButton);
         itemList.appendChild(listItem);
    });

    // Show a message when search or category filters match nothing
    if (itemList.children.length === 0) {
        itemList.innerHTML = `
            <li class="empty-state">
                <div>
                    <h3>No items found</h3>
                    <p>Try another search or choose a different category.</p>
                </div>
            </li>
        `;
    }
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const itemData = {
        name: itemName.value.trim(),
        category: itemCategory.value,
        date: importantDate.value
    };

    if (editingIndex !== -1) {
        items[editingIndex] = itemData;
        editingIndex = -1;
    } else {
        items.push(itemData);
    }

    localStorage.setItem("saveItItems", JSON.stringify(items));

    displayItems();
    updateDashboard();
    form.reset();
    submitButton.textContent = "Add Item";
});

document.getElementById("searchInput")
    .addEventListener("input", displayItems);

document.getElementById("categoryFilter")
    .addEventListener("change", displayItems);

const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const importFile = document.getElementById("importFile");
const backupMessage = document.getElementById("backupMessage");

// Download a backup of saved items
exportButton.addEventListener("click", function () {
    const savedItems = localStorage.getItem("saveItItems");
    const items = savedItems ? JSON.parse(savedItems) : [];

    const backup = {
        app: "SaveIt",
        version: 1,
        exportedAt: new Date().toISOString(),
        items: items
    };

    const file = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "SaveIt-Backup.json";
    link.click();

    URL.revokeObjectURL(url);
    backupMessage.textContent = "Backup downloaded successfully!";
});

// Open the file picker
importButton.addEventListener("click", function () {
    importFile.click();
});

// Restore items from a backup file
importFile.addEventListener("change", function () {
    const file = importFile.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function () {
        try {
            const backup = JSON.parse(reader.result);

            if (
                backup.app !== "SaveIt" ||
                !Array.isArray(backup.items) ||
                !backup.items.every(item =>
                    item &&
                    typeof item.name === "string" &&
                    typeof item.category === "string" &&
                    typeof item.date === "string" &&
                    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
                    !Number.isNaN(
                        new Date(item.date + "T00:00:00").getTime()
                    )
                )
            ) {
                throw new Error("Invalid backup");
            }

            const confirmed = confirm(
                "Restoring this backup will replace your current SaveIt items. Continue?"
            );

            if (!confirmed) {
                backupMessage.textContent = "Restore cancelled.";
                return;
            }

            localStorage.setItem(
                "saveItItems",
                JSON.stringify(backup.items)
            );

            displayItems();
            updateDashboard();

            backupMessage.textContent = "Backup restored successfully!";
        } catch (error) {
            backupMessage.textContent =
                "That backup file is invalid. Your saved items were not changed.";
        } finally {
            importFile.value = "";
        }
    };

    reader.readAsText(file);
});

displayItems();
updateDashboard();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
        navigator.serviceWorker.register("./service-worker.js")
            .then(function() {
                console.log("SaveIt offline support is ready!");
            })
            .catch(function(error) {
                console.error("Service worker registration failed:", error);
            });
    });
}

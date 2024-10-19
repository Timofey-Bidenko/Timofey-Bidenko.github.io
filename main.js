// I decided to make a to-do list web-app. Most of the code is very well commented.
// Available in browser: https://timofey-bidenko.github.io/


// Check if user is on mobile, used later for visual improvements. (Taken somewhere from internet)
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent)

// Required to chnage CSS variables
const root = document.documentElement

// Required for modals
const SM = document.getElementById("secondaryModal")
const closeSMBtn = document.getElementById("closeSecondaryModal")

// Modal Setup
function openSecModal() {
    root.style.setProperty("--secModalClosed", "0")
    SM.classList.remove("none")
}

function closeSecModal() {
    root.style.setProperty("--secModalClosed", "1")
    SM.classList.add("none")
}
closeSecModal()


// Required for prompts
const secondaryOverlay = document.getElementById("secondaryOverlay")
const deletePrompt = document.getElementById("deletePrompt")
const infoPrompt = document.getElementById("infoPrompt")

let currentlyOpenedModal = null

// Prompt Setup
function closeOverlay() {
    secondaryOverlay.classList.add("none")
}
function closeAllPrompts(closePromptsOverlay = false) {
    currentlyOpenedModal = null
    deletePrompt.classList.add("none")
    infoPrompt.classList.add("none")
    if (closePromptsOverlay) {
        closeOverlay()
    } else {
        secondaryOverlay.classList.remove("none")
    }
}
function openDeletePrompt() {
    closeAllPrompts()
    deletePrompt.classList.remove("none")
    currentlyOpenedModal = deletePrompt
}
function openInfoPrompt() {
    closeAllPrompts()
    infoPrompt.classList.remove("none")
    currentlyOpenedModal = infoPrompt
}
// If secondary overlay opened, make prompts work like modal tabs, so that if you click somewhere on the screen (not inside prompt) the prompt will close
secondaryOverlay.addEventListener('click', function (event) {
    if (!currentlyOpenedModal) {
        closeOverlay() 
        return
    }
    const rect = currentlyOpenedModal.getBoundingClientRect() // get the bounding box of the modal

    const mouseX = event.clientX
    const mouseY = event.clientY

    // Check if mouse is inside the element
    const isInside = mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom

    if (!isInside) {
        closeOverlay()
    }
})



// Note class
let totalNotes = 0

// SOME METHODS OF NOTE CLASS ARE LEFT UNUSED (editTodo, removeTodo)
// These methods are left here to fulfill the first part of the console-app task
// I decided to make a web-app instead

class Note {
    #name = ""

    constructor(name) {
        this.id = ++totalNotes
        this.#name = typeof(name) === "string" && name ? name : `Unnamed${this.id}`
        this.creationDate = new Date().toLocaleString()
        this.lastRedactionDate = this.creationDate
        this.todos = []
    }

    set name(newName) {
        this.#name = typeof(newName) === "string" && newName ? newName : `Unnamed${this.id}`
    }
    get name() {return this.#name}

    #indexExists(i) {
        return i in this.todos && this.todos[i] !== null
    }

    addTodo(content) {
        if (!(typeof(String(content)) === "string" && content)) return false;

        this.todos.push({todo: String(content), completed: false})
        return this.todos.length - 1
    }
    editTodo(todoIndex, newContent) {
        if (!(typeof(String(newContent)) === "string" && newContent)) return;
        if (!this.#indexExists(todoIndex)) return;
        this.todos[todoIndex]({todo: String(newContent), completed: this.todos[todoIndex]["completed"]})
    }
    setTodoStatus(todoIndex, newStatus) {
        if (!this.#indexExists(todoIndex)) return;

        this.todos[todoIndex]["completed"] = newStatus
    }
    removeTodo(todoIndex) {
        if (!this.#indexExists(todoIndex)) return;

        const temp = this.todos
        this.todos = []
        temp.forEach( (td, index) => {
            if (index !== todoIndex) {
                this.todos.push(td)
            }
        })
    }
    getAmountsByStatus() {
        let completed = 0
        this.todos.forEach( (td) => {
            completed += (td["completed"] === true ? 1 : 0)
        })
        return {done: completed, left: this.todos.length - completed}
    }
    getAllInfos() {
        const temp = this.getAmountsByStatus()
        const doneP = temp["done"] > 0 && this.todos.length > 0 ? `(${Math.round( (temp["done"] / this.todos.length) * 10000) / 100}%)` : "(0%)"
        const leftP = temp["left"] > 0 && this.todos.length > 0 ? `(${Math.round( (temp["left"] / this.todos.length) * 10000) / 100}%)` : "(0%)"
        return {
            ["Note Id"]: this.id,
            ["Note Name"]: this.#name,
            ["Creation Date"]: this.creationDate,
            ["Last Edited Date"]: this.lastRedactionDate,
            ["Total To-Do's"]: this.todos.length,
            ["To-Do's Done"]: `${temp["done"]} / ${this.todos.length} ${doneP}`,
            ["To-Do's Left"]: `${temp["left"]} / ${this.todos.length} ${leftP}`,
        }
    }
}

// Storage for different data, used for different functions to access everything.
const notes = {} // The object where every note is saved, keys are note id's. Using object because it's easy to delete from it, unlike in Arrays
let lastOpenedId // Used to track the key (id) of the last note that was opened. Used for checking, saving notes, etc.. Important variable.
let todosCreatedInputs = [] // Used to read DOM while saving note. Also used for checking when trying to add a new to-do.

// DOM Elements declaration, to enable user interaction with the web-app.
const createNote = document.getElementById("createNote")
const noteListChildTemplate = document.getElementById("noteListChildTemplate")
const nameField = document.getElementById("setName")
const todoTemplate = document.getElementById("todoTemplate")
const addToDo = document.getElementById("addToDo")
const secMTitle = document.getElementById("secMTitle")
const infoboxTemplate = document.getElementById("infoboxTemplate")

// Both used to store temporary DOM objects.
const genStuff = []
const genInfs = []

// Making a clone of DOM instance with logic that fits idea of Temporary DOM Objects.
// Function is here to make code more readable, since we will need this block of code very often.
function createInstance(cloneFrom, temporary = true, newParent = null, pushTo = genStuff) {
    const instanceNew = cloneFrom.cloneNode(true) // Clone the template with all of its child DOM elements.
    newParent = newParent === null ? cloneFrom.parentElement : newParent // If no parent given, parent to where the template is parented.
    newParent.appendChild(instanceNew) // Append the Clone as child to parent object
    instanceNew.classList.remove("none") // Make the Clone visible, by removing the "none" class. "none" class just given display: none; to a DOM Object.

    if (temporary) { // If clone supposed to be temporary, add it into temporary storage.
        pushTo.push(instanceNew) // Pushing temporary clone into desired temporary storage.
    }

    return instanceNew // return cloned instance for further editing/connecting events
}

// Save the note into its class object, update its edit date. By default, delete if empty.
function saveCurrentNote(deleteIfEmpty = true) {
    if (!(lastOpenedId in notes)) return; // If the last opened note already deleted, exit the function.

    const n = notes[lastOpenedId].noteClass // Get the note class Object
    n.todos = [] // Clear all previous to-do's

    for (let i = 0; i < todosCreatedInputs.length; i++) { // read all of the (saved into an Array) DOM inputs.
        if (i === 0) { // The first saved Input is always expected to be for the Note Name.
            n.name = todosCreatedInputs[i].value // Set the note name, the logic of setting a name is defined by setter inside Note Class. The note name will never be an empty String.
            continue // Instead of doing else, for better readability.
        }

        if (todosCreatedInputs[i].classList.contains("DeletedOne")) continue; // Ignore every DOM input marked as "DeletedOne"

        const addSuccess = n.addTodo(todosCreatedInputs[i].value) // addTodo, if successful, returns index of newly added to do. If unsuccessful, returns undefined.
        if (typeof(addSuccess) === "number") { // Check if addTodo was successful and returned the to-do index.
            n.setTodoStatus(addSuccess, todosCreatedInputs[i].parentElement.classList.contains("done")) // Update to do status based on DOM element classes.
        }
    }

    n.lastRedactionDate = new Date().toLocaleString() // Update the edit date.

    sortNotesByParams() // Dynamically sort the notes, as fast as some changes were saved.

    // If note has no to-do's and the deleteIfEmpty is true, delete the note. We ignore the note name, when checking.
    if (deleteIfEmpty) {
        const forCheck = n.getAmountsByStatus()
        if (forCheck["done"] === 0 && forCheck["left"] === 0) {
            notes[lastOpenedId].noteDOM.remove()
            delete notes[lastOpenedId]
        }
    }
}

function reloadNote(noteToOpen = null) {
    openSecModal() // open the secondary modal, this is where the magic happens
    if (lastOpenedId === noteToOpen) return; // If trying to open the current note, exit function. (No need in deleting and creting same things)
    saveCurrentNote() // Save the current note, it doesn't matter if it's visible or not.
    // clear every DOM that was generated previously, for the note we just saved.
    todosCreatedInputs = []
    genStuff.forEach( (instance) => {
        instance.remove()
    })

    // Declare very important variables.
    let n // note class object
    let noteOverview // DOM object associated with the note class.

    if (noteToOpen === null) { // generate new note
        n = new Note()
        noteOverview = createInstance(noteListChildTemplate, false)
        noteOverview.addEventListener("click", function () { // connect the click on the note overview to open this note
            reloadNote(n.id)
        })
        notes[n.id] = {noteClass: n, noteDOM: noteOverview}
    } else if (noteToOpen in notes) { // load the existing note
        n = notes[noteToOpen].noteClass
        noteOverview = notes[noteToOpen].noteDOM
    } else return; // Is not expected to happen, never happened in testing. Guard clause. (Because if n and noteOverview not defined, will trigger errors.)

    lastOpenedId = n.id // Note class loaded, update the lastOpenedId.

    // Note Name text Input generation.
    const newNameInput = createInstance(nameField) // Clone the name input template, store clone as variable.
    const inp = newNameInput.querySelector("input") // Get the input
    inp.value = n.name === `Unnamed${n.id}` ? "" : n.name // Set inputs value to Note Name set by user, or nothing if unnamed.

    // Update the text of the note class object, secondaryModalTitle (secMTitle) and the noteOverview DOM.
    function updateText() {
        n.name = inp.value
        secMTitle.innerText = n.name
        noteOverview.querySelector("h4").innerText = n.name
    }
    updateText() // Update text when loading the note.

    inp.addEventListener("input", updateText) // Connect name input changes to updateText() function.
    todosCreatedInputs.push(inp) // Push as the first element of inputs, for reading when saving.

    // Create a clone of a to-do element, apply logic of interactive DOM buttons like delete and done toggle
    function addTodoElement(content = "", isDone = false) {
        
        const newTodo = createInstance(todoTemplate)
        let done = isDone ? 0 : 1
        const input = newTodo.querySelector("input")
        input.value = content
        todosCreatedInputs.push(input)

        const d = newTodo.querySelector("div")
        const del = newTodo.querySelectorAll("div")[1]

        function toggle() {
            done++
            if (done % 2 === 1) {
                d.classList.remove("xIcon")
                d.classList.add("cIcon")
                newTodo.classList.add("done")
            } else {
                d.classList.add("xIcon")
                d.classList.remove("cIcon")
                newTodo.classList.remove("done")
            }
            saveCurrentNote(false)
        }
        toggle()
        
        d.addEventListener("click", toggle)

        del.addEventListener("click", function() {
            input.classList.add("DeletedOne")
            newTodo.remove()
            saveCurrentNote(false)
        })
    }
    
    // Load the to-do's if any were saved, else create an empty one (triggers on newly created notes).
    if (n.todos.length > 0) {
        n.todos.forEach( (tdInfo) => {
            addTodoElement(tdInfo.todo, tdInfo.completed)
        })
    } else {
        addTodoElement()
    }

    const atd = createInstance(addToDo) // Clone the add to-do insatnce, to ensure cool visual effects of pop up, connect to current note class data.
    atd.addEventListener("click", function () {
        if (todosCreatedInputs.slice(1).every((input) => (typeof(input.value) === "string" && input.value) || input.classList.contains("DeletedOne"))) { // Before adding an empty to-do element, make sure every existing to-do is not empty, ignore deleted to-do's (by input.classList.contains("DeletedOne")), ignore the note name input (by slice(1)).
            addTodoElement()
        }
    })
}

document.getElementById("deleteNote").addEventListener("click", function() {
    saveCurrentNote() // note will be auto deleted, if empty

    if (lastOpenedId in notes) { // if note still there, this means its not deleted and has some contents, prompt deletion
        openDeletePrompt() 
    } else {
        closeSecModal() // note was deleted, so the DOM objects should become invisible.
    }
})

document.getElementById("deleteNoteConfirmed").addEventListener("click", function() {
    // Confirmation delete button in the delete prompt was pressed, delete the current note.
    if (lastOpenedId in notes) { // check if the note still exists
        notes[lastOpenedId].noteDOM.remove()
        delete notes[lastOpenedId]
    }
    closeSecModal() // note was deleted, so the DOM objects should become invisible.
    closeOverlay() // close prompts.
})

document.getElementById("noteInfo").addEventListener("click", function() { //load note info
    if (lastOpenedId in notes) { // if the current note exists, load its info.
        // clear the temporary info boxes, created by last time loading info.
        genInfs.forEach( (instance) => {
            instance.remove()
        })
        // save current note to ensure the information is up-to-date
        saveCurrentNote(false) // save without deleting, even if its empty.
        const n = notes[lastOpenedId].noteClass
        // generate info boxes based on all infos of the note.
        const allInfos = n.getAllInfos() // get all infos of the note.
        for (const key in allInfos) {
            const infBox = createInstance(infoboxTemplate, true, null, genInfs)
            infBox.querySelector("h2").innerText = key
            infBox.querySelector("h3").innerText = allInfos[key]
        }
        openInfoPrompt() // show the info prompt
    }
})

document.getElementById("closeInfoPrompt").addEventListener("click", closeOverlay) // close of all prompts, on the click of closeInfoPrompt button located inside the info prompt.

createNote.addEventListener("click", () => { // new note creation
    reloadNote()
})

closeSMBtn.addEventListener("click", function() { // close secondary modal (the red X button in the top right), save current note to ensure if user leaves, it's saved.
    saveCurrentNote()
    closeSecModal()
})



// Search by name input sorting.
const mainSearch = document.getElementById("mainSearchInput")

function searchFilter() {
    const searchingFor = mainSearch.value
    if (searchingFor) { // show by given string + date clues
        for (const key in notes) {
            const value = notes[key]
            const n = value.noteClass
            if (n.name.toLowerCase().indexOf(searchingFor.toLowerCase()) === -1 && n.creationDate.indexOf(searchingFor) === -1 && n.lastRedactionDate.indexOf(searchingFor) === -1) {
                value.noteDOM.classList.add("none")
            } else {
                value.noteDOM.classList.remove("none")
            }
        }
    } else { // show all, since no string clue given
        for (const key in notes) {
            notes[key].noteDOM.classList.remove("none")
        }
    }
}



// More sorting features.
const primarySelect = document.getElementById("primarySelect")
const categorySelect = document.getElementById("categorySelect")
const subCategorySelect = document.getElementById("subCategorySelect")

// make the select DOM object align into a column intead of row, if user is mobile.
if (isMobile) {
    primarySelect.parentElement.classList.remove("fTitle")
    primarySelect.parentElement.classList.add("fMTitle")
}

// apply cool border radius based on amount of visible select DOM objects.
// the isMobie is used here too, because border radius should behave differently in a column.
function applyCoolBorderRadius(amount = 1) {
    root.style.setProperty("--amountOfSelects", amount)
    if (amount === 1) {
        primarySelect.style.setProperty("border-radius", "8px")
    } else if (amount === 3) {
        primarySelect.style.setProperty("border-radius", isMobile ? "8px 8px 0px 0px" : "8px 0px 0px 8px")
        categorySelect.style.setProperty("border-radius", "0px")
        subCategorySelect.style.setProperty("border-radius", isMobile ? "0px 0px 8px 8px" : "0px 8px 8px 0px")
    }
}

// Sort notes + toggle visibility of all non-primary selects, also adjust the select options for them.
function primarySelectionChange() {
    const curVal = primarySelect.value

    if (curVal === "comp") {
        primarySelect.classList.add("textShadowCyan")
        subCategorySelect.innerHTML = `
            <option value="percentage">Percentage Done</option>
            <option value="amount">Amount Done</option>
        `
        categorySelect.innerHTML = `
            <option value="highToLow">High to Low</option>
            <option value="lowToHigh">Low to High</option>
        `
        applyCoolBorderRadius(3)
        categorySelect.classList.remove("none")
        subCategorySelect.classList.remove("none")

    } else if (curVal === "date") {
        primarySelect.classList.add("textShadowGreen")
        subCategorySelect.innerHTML = `
            <option value="lastEdited">Last Edited</option>
            <option value="creation">Creation Date</option>
        `
        categorySelect.innerHTML = `
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
        `
        applyCoolBorderRadius(3)
        categorySelect.classList.remove("none")
        subCategorySelect.classList.remove("none")

    } else {
        primarySelect.classList.remove("textShadowCyan", "textShadowGreen")
        categorySelect.classList.add("none")
        subCategorySelect.classList.add("none")
        applyCoolBorderRadius()
    }

    sortNotesByParams()
}

// sorting algorithm based on the theree DOM selects.
function sortNotesByParams() {
    const sortBy = primarySelect.value
    const order = categorySelect.value
    const subOrder = subCategorySelect.value

    if (sortBy === "comp") {
        const sortedNotes = Object.values(notes).sort((a, b) => {
            const aCompletion = subOrder === "percentage" ? a.noteClass.getAmountsByStatus().done / a.noteClass.todos.length || 0 : a.noteClass.getAmountsByStatus().done
            const bCompletion = subOrder === "percentage" ? b.noteClass.getAmountsByStatus().done / b.noteClass.todos.length || 0 : b.noteClass.getAmountsByStatus().done
            return order === "highToLow" ? bCompletion - aCompletion : aCompletion - bCompletion
        })

        sortedNotes.forEach( (note, index) => {
            note.noteDOM.style.order = index
        })
        createNote.style.setProperty("order", `${sortedNotes.length + 99}`)
    } else if (sortBy === "date") {
        const sortedNotes = Object.values(notes).sort((a, b) => {
            const aDateStrings = subOrder === "creation" ? a.noteClass.creationDate.split(", ") : a.noteClass.lastRedactionDate.split(", ")
            const bDateStrings = subOrder === "creation" ? b.noteClass.creationDate.split(", ") : b.noteClass.lastRedactionDate.split(", ")
            
            const aDateYMDHMS = aDateStrings[0].split("/").reverse().join("") + aDateStrings[1].split(":").join("")
            const bDateYMDHMS = bDateStrings[0].split("/").reverse().join("") + bDateStrings[1].split(":").join("")

            return (order === "newest" ? bDateYMDHMS - aDateYMDHMS : aDateYMDHMS - bDateYMDHMS)
        })

        sortedNotes.forEach( (note, index) => {
            note.noteDOM.style.setProperty("order", `${index}`)
        })
        createNote.style.setProperty("order", `${sortedNotes.length + 99}`)
    }
}

applyCoolBorderRadius() // apply the cool border radius once the webpage loads.
//
//
//
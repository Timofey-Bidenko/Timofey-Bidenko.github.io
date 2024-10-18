const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry/i.test(navigator.userAgent)

// Required for modals

const MM = document.getElementById("mainModal")
const SM = document.getElementById("secondaryModal")
const closeSMBtn = document.getElementById("closeSecondaryModal")
const root = document.documentElement

let sModalOpen = false

// modals
function openMainModal() {
    MM.classList.remove("none")
}

openMainModal()

function openSecModal() {
    root.style.setProperty("--secModalClosed", "0")
    sModalOpen = true
    SM.classList.remove("none")
}

function closeSecModal() {
    root.style.setProperty("--secModalClosed", "1")
    SM.classList.add("none")
    sModalOpen = false
}
closeSecModal()

closeSMBtn.addEventListener("click", closeSecModal)



const secondaryOverlay = document.getElementById("secondaryOverlay")
const deletePrompt = document.getElementById("deletePrompt")
const infoPrompt = document.getElementById("infoPrompt")

let currentlyOpenedModal = null

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

secondaryOverlay.addEventListener('click', function (event) {
    if (!currentlyOpenedModal) {
        closeOverlay() 
        return
    };
    const rect = currentlyOpenedModal.getBoundingClientRect() // get the bounding box of the modal

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Check if mouse is inside the element
    const isInside = mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom;

    if (!isInside) {
        //console.log("closedModal")
        closeOverlay()
    }
});



let totalNotes = 0

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

const notes = {}
let lastOpenedId
let todosCreatedInputs = []

const noteListChildTemplate = document.getElementById("noteListChildTemplate")
const nameField = document.getElementById("setName")
const todoTemplate = document.getElementById("todoTemplate")
const addToDo = document.getElementById("addToDo")
const secMTitle = document.getElementById("secMTitle")
const infoboxTemplate = document.getElementById("infoboxTemplate")

const genStuff = []
const genInfs = []

function createInstance(cloneFrom, permanent = false, newParent = null, pushTo = genStuff) {
    const instanceNew = cloneFrom.cloneNode(true)
    newParent = newParent === null ? cloneFrom.parentElement :newParent
    newParent.appendChild(instanceNew)
    instanceNew.classList.remove("none")

    if (!permanent) {
        pushTo.push(instanceNew)
    }

    return instanceNew // return cloned instance for further editing/connecting events
}

function saveCurrentNote(deleteIfEmpty = true) {
    if (!(lastOpenedId in notes)) return;

    const n = notes[lastOpenedId].noteClass
    n.todos = []

    for (let i = 0; i < todosCreatedInputs.length; i++) {
        if (i === 0) {
            n.name = todosCreatedInputs[i].value
            continue
        }
        if (todosCreatedInputs[i].classList.contains("DeletedOne")) continue;
        const addSuccess = n.addTodo(todosCreatedInputs[i].value)
        
        if (typeof(addSuccess) === "number") {
            console.log("Saving with status", todosCreatedInputs[i].parentElement.classList.contains("done"), todosCreatedInputs[i].parentElement.classList);
            
            n.setTodoStatus(addSuccess, todosCreatedInputs[i].parentElement.classList.contains("done"))
        }
    }

    n.lastRedactionDate = new Date().toLocaleString()

    if (deleteIfEmpty) {
        const forCheck = n.getAmountsByStatus()
        if (forCheck["done"] === 0 && forCheck["left"] === 0) {
            notes[lastOpenedId].noteDOM.remove()
            delete notes[lastOpenedId]
        }
    }
}

function reloadNote(noteToOpen = null) {
    openSecModal() // open the secondary modal where the magic happens
    if (lastOpenedId === noteToOpen) return;
    // clear everything that was generated previously
    saveCurrentNote()
    todosCreatedInputs = []
    genStuff.forEach( (instance) => {
        instance.remove()
    })

    // nameField.classList.remove("none") // show the note name field
    // nameField.value = "" // make sure to clear the older inputs

    let n
    let noteOverview

    if (noteToOpen === null) { // generate new note
        n = new Note()
        noteOverview = createInstance(noteListChildTemplate, true)
        noteOverview.addEventListener("click", function () {
            reloadNote(n.id)
        })
        notes[n.id] = {noteClass: n, noteDOM: noteOverview}
    } else if (noteToOpen in notes) { // load the existing note
        n = notes[noteToOpen].noteClass
        noteOverview = notes[noteToOpen].noteDOM
    } else return;

    const newNameInput = createInstance(nameField)
    const inp = newNameInput.querySelector("input")
    inp.value = n.name === `Unnamed${n.id}` ? "" : n.name

    function updateText() {
        n.name = inp.value
        secMTitle.innerText = n.name
        noteOverview.querySelector("h4").innerText = n.name
    }
    updateText()

    inp.addEventListener("input", updateText)
    todosCreatedInputs.push(inp)

    function addTodoElement(content = "", isDone = false) {
        console.log("Adding", content, isDone);
        
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
        }
        toggle()
        
        d.addEventListener("click", toggle)

        del.addEventListener("click", function() {
            input.classList.add("DeletedOne")
            newTodo.remove()
        })
    }
    
    if (n.todos.length > 0) {
        console.log(n.todos)
        n.todos.forEach( (tdInfo) => {
            console.log(tdInfo)
            addTodoElement(tdInfo.todo, tdInfo.completed)
        })
    } else {
        addTodoElement()
    };

    const atd = createInstance(addToDo)
    atd.addEventListener("click", function () {
        if (todosCreatedInputs.every((input) => (typeof(input.value) === "string" && input.value) || input.classList.contains("DeletedOne"))) {
            addTodoElement()
        }
    })

    lastOpenedId = n.id
}

document.getElementById("deleteNote").addEventListener("click", function() {
    console.log(lastOpenedId in notes);
    saveCurrentNote() // note will be auto deleted, if empty
    console.log(lastOpenedId in notes);

    if (lastOpenedId in notes) { // if note still there, this means its not deleted and has some contents, prompt deletion
        console.log("prompt");
        
        openDeletePrompt() 
        return
    }
    console.log("run");
    
    closeSecModal()
})

document.getElementById("deleteNoteConfirmed").addEventListener("click", function() {
    if (lastOpenedId in notes) {
        notes[lastOpenedId].noteDOM.remove()
        delete notes[lastOpenedId]
    }
    closeSecModal()
    closeOverlay()
})

document.getElementById("noteInfo").addEventListener("click", function() { //load note info
    if (lastOpenedId in notes) {
        genInfs.forEach( (instance) => {
            instance.remove()
        })

        saveCurrentNote(false)
        const n = notes[lastOpenedId].noteClass
        const allInfos = n.getAllInfos()
        for (const key in allInfos) {
            const infBox = createInstance(infoboxTemplate, false, null, genInfs)
            infBox.querySelector("h2").innerText = key
            infBox.querySelector("h3").innerText = allInfos[key]
        }
        openInfoPrompt()
    }
})

document.getElementById("closeInfoPrompt").addEventListener("click", closeOverlay)

document.getElementById("createNote").addEventListener("click", () => {
    reloadNote()
})
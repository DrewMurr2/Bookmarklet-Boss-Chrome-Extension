let files = []
    //set initial click even handlers for buttons that do not need to be dynamically changed
document.getElementById('addNew').onclick = switchToAddNewSection
document.getElementById('cancelEdittingButton').onclick = cancelEditting
document.getElementById('cancelSaveButton').onclick = cancelEditting
document.getElementById('saveNewButton').onclick = () => saveNew(document.getElementById("newName").value, document.getElementById("newUrl").value)
let getNewFileId = async() => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['maxFileId'], function (result) {
            let maxFileId = result.maxFileId ? result.maxFileId + 1 : 1
            console.log('maxFileId is ', maxFileId);
            chrome.storage.sync.set({
                maxFileId
            }, function () {
                console.log('callback from setting maxFileId');
            });
            resolve(maxFileId)
        });
    })
}
let newFile = async(name, url) => {
    let newFileId = await getNewFileId()
    files.push({
        id: newFileId
        , name
        , url
    })
}

function findFileById(id) {
    for (file of files)
        if (file.id == id) return file
}
//sections in the DOM
let listSection = document.getElementById('listHolder')
let edittingSection = document.getElementById('editting')
let createNewSection = document.getElementById('createNew')
let allSections = [listSection, edittingSection, createNewSection]
    //element in the DOM
let listContainer = document.getElementById("list")
let newEdittedName = document.getElementById('newEdittedName')
let newEdittedUrl = document.getElementById('newEdittedUrl')
let edittingButtons = document.getElementById('edittingButtons')
    //buttons in the DOM that have the click event handler overridden 
let saveEdittedFileButton = document.getElementById('saveEdittedFileButton')
let deleteFileButton = document.getElementById('deleteFileButton')
    //override button onclick functions
let updateDeleteFileButtonOnclick = (file) => deleteFileButton.onclick = () => delete_(file)
    //section functions
let allSectionsOff = () => allSections.forEach(section => section.style.display = 'none')
let sectionOn = (sectionSelected) => allSections.forEach(section => section.style.display = section === sectionSelected ? 'block' : 'none')
    //DOM element factories
let generateLine = (file) => `
<li><span class="name"  id="line_edit_${file.id}"> ${file.name}</span> <button style="float:right" id="line_run_${file.id}">run now</button></li>
`
    //DOM manipulation 
let showEdittingSection = (fileSelected) => {
        sectionOn(edittingSection)
        newEdittedName.value = fileSelected.name
        newEdittedUrl.value = fileSelected.url
        saveEdittedFileButton.onclick = () => saveEditted(fileSelected, document.getElementById("newEdittedName").value, document.getElementById("newEdittedUrl").value)
        updateDeleteFileButtonOnclick(fileSelected)
    }
    //utility functions
function loadList() {
    listContainer.innerHTML = files.map(file => generateLine(file)).join('')
    files.forEach(file => {
        document.getElementById(`line_edit_${file.id}`).onclick = () => edit(file)
        document.getElementById(`line_run_${file.id}`).onclick = () => run(file)
    })
    sectionOn(listSection)
}
//button press event handlers
function switchToAddNewSection() {
    sectionOn(createNewSection)
}

function run(fileSelected) {
    console.log('running run')
    sendMessageToCurrentTab(fileSelected)
}

function delete_(selectedFile) {
    files = files.filter(file => file !== selectedFile)
    loadList()
    saveFiles()
}

function toggleStatus(id) {
    console.log('running toggle')
    let fileSelected = findFileById(id)
    fileSelected.status = fileSelected.status == 'on' ? 'off' : 'on'
}
async function saveNew(name, url) {
    await newFile(name, url)
    loadList()
    saveFiles()
}

function edit(fileSelected) {
    showEdittingSection(fileSelected)
}

function saveEditted(fileSelected, newName, newUrl) {
    if (newName) fileSelected.name = newName
    if (newUrl) fileSelected.url = newUrl
    loadList()
    saveFiles()
}

function cancelEditting() {
    console.log('cancelling editting')
    sectionOn(listSection)
}

function sendMessageToCurrentTab(file) {
    let params = {
        active: true
        , currentWindow: true
    }
    chrome.tabs.query(params, gotTabs);

    function gotTabs(tabs) {
        console.log("got tabs");
        console.log(tabs);
        // send a message to the content script
        chrome.tabs.sendMessage(tabs[0].id, file);
    }
}
async function saveFiles() {
    chrome.storage.sync.set({
        files
    }, function () {
        console.log('callback from setting');
    });
}
async function getFiles() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['files'], function (result) {
            files = result.files || []
            console.log('files = ', files)
            resolve()
        });
    })
}
getFiles().then(() => loadList())
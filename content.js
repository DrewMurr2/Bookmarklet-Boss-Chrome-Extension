console.log("Chrome extension go?");
chrome.runtime.onMessage.addListener(gotMessage);

function gotMessage(message, sender, sendResponse) {
    console.log("Running script named: ", message.name)
    runExternalScript(message.url)
}

function runExternalScript(url) {
    console.log('running external script at url:', url)
    let script = document.createElement('script')
    script.src = url
    document.body.appendChild(script)
}
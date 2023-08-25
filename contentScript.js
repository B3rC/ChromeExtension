

var extpay = ExtPay('cosmo'); 


let context = ''; // Variable to store the user's command
let existingCommands = {}; // To be populated with the commands saved in chrome.storage.sync
let conversationHistory = [];
let apiKey = null;
let conversationHistories = {}; // Initialize an object to store conversation histories for different tabs
const extensionId = chrome.runtime.id;
console.log("Extension ID:", extensionId);





chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.userMessage) {
    const userMessage = request.userMessage;
    const tabId = request.tabId; // Get the tab ID from the request

    // Retrieve tab-specific conversation history from storage
    chrome.storage.local.get({ conversationHistories: {} }, function (result) {
      const conversationHistories = result.conversationHistories;
      const tabConversationHistory = conversationHistories[tabId] || [];

      // Process the user input and generate the AI response
      generateChatResponse(userMessage, tabConversationHistory)
        .then(generatedChatResponse => {
          tabConversationHistory.push({ role: 'user', content: userMessage });

          tabConversationHistory.push({ role: 'assistant', content: generatedChatResponse });

          // Update the conversation history for the tab
          conversationHistories[tabId] = tabConversationHistory;

          // Store updated conversation histories
          chrome.storage.local.set({ conversationHistories });
          sendResponse({ aiResponse: generatedChatResponse });

          console.log('Generated Response:', generatedChatResponse);
          console.log('Conversation History for Tab', tabId, ':', JSON.stringify(tabConversationHistory));
        })
        .catch(error => {
          console.error('Error:', error);
        });

      // Return true to indicate that the response will be sent asynchronously
    });
    return true;

  }
});



//replace command with the AI generated output
function replaceCommandWithResponse(generatedResponse, contentEditableElement) {

  //gmail
  if(window.location.href.includes('mail.google.com')){
    if (!contentEditableElement) {
      console.error('No active contenteditable element found.');
      return;
    }
  
    const commandText = contentEditableElement.textContent;
    const commandRegex = /\/\w+\b[\s\S]*?;/;

    const commands = commandText.match(commandRegex);
    if (!commands) {
      console.error('No commands found in the contenteditable element.');
      return;
    }
  
    const updatedContent = commands.reduce((acc, command) => {
      const trimmedCommand = command.trim();
      if (trimmedCommand.match(commandRegex)) {
        return acc.replace(trimmedCommand, generatedResponse);
      }
      return acc;
    }, commandText);
  
    contentEditableElement.textContent = updatedContent;
    placeCaretAtEnd(contentEditableElement);
  }

  //twitter, reddit
  else if (window.location.href.includes('twitter.com') || window.location.href.includes('reddit.com')) {
    const parentEle = document.querySelector('[data-text="true"]')?.parentElement;
  if (parentEle) {
    const commandText = parentEle.textContent;
    const commandRegex = /\/\w+\b[\s\S]*?;/;
    const replacedText = commandText.replace(commandRegex, generatedResponse);

    parentEle.textContent = replacedText;
      parentEle.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  }
  }

  //google docs
  else if (window.location.href.includes('docdadas.google.com')) {
    const contentEditableElement = document.querySelector(".kix-canvas-tile-content");
    console.log("455"+contentEditableElement.innerHTML);
  }


  //medium
  else if (window.location.href.includes('medium.com')) {
    //GOOGLE DOCS API
    const currentElement = document.querySelector('.is-selected');

    console.log(currentElement+"CURRENTELE");
    console.log(currentElement.textContent+"TEXSTON");
    if(currentElement){
      const commandText = currentElement.textContent;
      const commandRegex = /\/\w+\b[\s\S]*?;/;
      const replacedText = commandText.replace(commandRegex, generatedResponse);
  
      currentElement.textContent = replacedText;
        currentElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        placeCaretAtEnd(currentElement);

    }
  }

  //facebook
  
  //facebook
  else if (window.location.href.includes('wordpress.com')) {
    //GOOGLE DOCS API
    const activeContentEditable = getActiveContentEditable();
  }
  else{
    // Check if the website currently has an active element where the user typed
    const activeContentEditable = getActiveContentEditable();
    const commandRegex = /\/\w+\b[\s\S]*?;/;

  if (activeContentEditable) {
    console.log("THIS RUNS22222");

    const commandText = activeContentEditable.textContent;
    const replacedText = commandText.replace(commandRegex, generatedResponse);

    if (activeContentEditable.tagName.toLowerCase() === "input" || activeContentEditable.tagName.toLowerCase() === "textarea") {
      console.log("FOIUND");
  
    console.log(activeContentEditable.value);
    
    const commandText = activeContentEditable.value;
    const replacedText = commandText.replace(commandRegex, generatedResponse);
    
    activeContentEditable.value = replacedText;

    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
    activeContentEditable.dispatchEvent(inputEvent);

    } else {
      console.log("THIS RUNS");
      const commandText = activeContentEditable.textContent;
      const replacedText = commandText.replace(commandRegex, generatedResponse);
      activeContentEditable.textContent = replacedText;
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      activeContentEditable.dispatchEvent(inputEvent);

      
    }

   

    placeCaretAtEnd(activeContentEditable);
  }
  else{
    console.log("EGYIK SEM");
    console.log("GENERATED"+generatedResponse);
    chrome.runtime.sendMessage({ responseText: generatedResponse });
    displayGeneratedResponse(generatedResponse);

  }
 
  }

}







// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "getGeneratedResponse") {
    // Replace 'generatedResponse' with the actual generated response you have
    const generatedResponse = generatedResponse;
    sendResponse({ responseText: generatedResponse });
  }
  
});


function generateChatResponse(userInput, conversationHistory) {
  return new Promise((resolve, reject) => {
    // Send a message to the background script with userInput and conversationHistory
    chrome.runtime.sendMessage({ action: 'generateChatResponse', userInput, conversationHistory }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }

      // Resolve the Promise with the response from the background script
      resolve(response.generatedResponse);
    });
  });
}

function generateResponse(context, actionToDo) {
  console.log("MW"+context, actionToDo);
  return new Promise((resolve, reject) => {
    // Send a message to the background script with userInput and conversationHistory
    chrome.runtime.sendMessage({ action: 'generateResponse', context, actionToDo }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }

      // Resolve the Promise with the response from the background script
      resolve(response.generatedResponse);
    });
  });
}

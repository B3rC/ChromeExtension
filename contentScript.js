

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

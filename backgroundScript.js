

// This background script is not directly involved in tweet generation
// You can add any other functionality or tasks specific to your extension
console.log("Background script is running.");


importScripts('ExtPay.js') // or `import` / `require` if using a bundler

var extpay = ExtPay('cosmo'); // Careful! See note below
extpay.startBackground(); 





// Example: Perform an action when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Perform any necessary setup or initialization tasks
  } else if (details.reason === 'update') {
    console.log('Extension updated');
    // Perform any necessary tasks specific to an extension update
  }
});

// Function to inject content script into a tab
function injectContentScript(tabId) {
  chrome.tabs.executeScript(tabId, { file: 'contentScript.js' });
  chrome.tabs.executeScript(tabId, { file: 'gmail-content.js' });

}


// Add event listener to detect tab updates
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // Check if the tab has finished loading
  if (changeInfo.status === 'complete') {
    // Inject the content script into the tab
    injectContentScript(tabId);
  }
});

// Add event listener to detect tab switching
chrome.tabs.onActivated.addListener(function(activeInfo) {
  // Get the details of the newly activated tab
  const newTabId = activeInfo.tabId;

  // Inject the content script into the newly activated tab
  injectContentScript(newTabId);
});


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'openExtension') {
    
      const optionsUrl = chrome.extension.getURL('popup.html');
      chrome.tabs.create({ url: optionsUrl });
    

}
});

chrome.runtime.onInstalled.addListener(function() {
  const defaultToggles = {
      askAI_feature: true,
      twitter_feature: true,
      linkedin_feature: true,
      gmail_feature: true,

      // Add more toggle defaults as needed
  };

  chrome.storage.sync.set(defaultToggles, function() {
      console.log('Default toggles set.');
  });
});



// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'generateChatResponse') {
    const { userInput, conversationHistory } = message; // Extract userInput and conversationHistory
    console.log("MW"+JSON.stringify(message));

    extpay.getUser().then(user => {

      if(user.paid){
        fetch('https://cosmoapi.onrender.com/generate-chat-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user,
        userInput,
        conversationHistory,
        
      }),
    })
      .then(response => response.json())
      .then(data => {
        const generatedResponse = data.generatedResponse;
        console.log('Generated Response:', generatedResponse);

        // Send the response back to the content script
        sendResponse({ generatedResponse });
      })
      .catch(error => {
        console.error('Error generating response:', error);
        // Send an error response back to the content script
        sendResponse({ error: 'Error generating response' });
      });

      }
    })
    // Fetch data from your server
    
    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
  if (message.action === 'generateResponse') {
    console.log("CALLED");
    const { context, actionToDo } = message; // Extract userInput and conversationHistory
    console.log("MW"+JSON.stringify(message));
    extpay.getUser().then(user => {

      if(user.paid){
        fetch('https://cosmoapi.onrender.com/generate-response', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user,
        actionToDo,
        context,
      }),
    })
      .then(response => response.json())
      .then(data => {
        const generatedResponse = data.generatedResponse;
        console.log('Generated Response:', generatedResponse);

        // Send the response back to the content script
        sendResponse({ generatedResponse });
      })
      .catch(error => {
        console.error('Error generating response:', error);
        // Send an error response back to the content script
        sendResponse({ error: 'Error generating response' });
      });

      }
    })
    // Fetch data from your server
    

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
  
});


extpay.onPaid.addListener(user => {
  if (user.paid) {
   
  chrome.runtime.sendMessage({ action: 'userPaid' })

  }

})

/*chrome.browserAction.onClicked.addListener((tab) => {
  if (tab.url.includes("chrome://") || tab.url.includes("edge://") || tab.url.includes("extension://") ) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup.html")
    });
  } 
  
});*/


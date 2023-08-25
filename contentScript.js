

var extpay = ExtPay('cosmo'); 


let context = ''; // Variable to store the user's command
let existingCommands = {}; // To be populated with the commands saved in chrome.storage.sync
let conversationHistory = [];
let apiKey = null;
let conversationHistories = {}; // Initialize an object to store conversation histories for different tabs
const extensionId = chrome.runtime.id;
console.log("Extension ID:", extensionId);



// Add an event listener to detect changes to chrome storage
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && 'usedPrompt' in changes) {
    if(changes.usedPrompt.value !== null || changes.usedPrompt.value !== " " || changes.usedPrompt.value !== ""){

      const newUsedPrompt = changes.usedPrompt.newValue;
      console.log('usedPrompt has been updated:', newUsedPrompt);
      context = "/"+newUsedPrompt;
    }
    
    // Do something with the newUsedPrompt value here
  }
  
});






  // Default commands
  const defaultCommands = [
    { command: 'ai', action: '' },
    { command: 'translate', action: 'Translate the text provided to English.' },
    { command: 'hiring', action: 'Write a hiring post to LinkedIn. Output should be crisp and clear. Write in a way that can go viral on Linkedin.' },
    { command: 'companyupdate', action: ' Write a LinkedIn post for Company Updates or a post template if no additional info is provided. Output should be crisp and clear. Write in a way that can go viral on Linkedin.' },
    { command: 'linkedinmilestone', action: 'Write a LinkedIn post for personal milestones or a post template if no additional info is provided. Output should be crisp and clear. Write in a way that can go viral on Linkedin.' },
    { command: 'joketweet', action: 'Write a tweet that incorporates a joke. It should be a banger and so funny that even grandads would be proud of.. The answer should be with in 280 characters. The output should be crisp and clear. Try to be creative and use your imagination. Write in a way that can go viral on Twitter.' }

  
   
    
    // Add more default commands here as needed
  ];




//Update commands
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'updateCommands') {
    existingCommands = message.commands;
    console.log('Updated existingCommands:', existingCommands);
  }
});

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

document.addEventListener('paste', function (pasteEvent) {
  const pastedText = (pasteEvent.clipboardData || window.clipboardData).getData('text');
  console.log("Pasted text: " + pastedText);
  pastedContext = pastedText.toLowerCase(); // Assuming you have a pastedContext variable
  context = context + pastedContext;
});



// Load the saved custom commands when the content script starts
chrome.storage.sync.get('customCommands', ({ customCommands }) => {
  extpay.getUser().then(user => {
    if (user.paid) {
      if (customCommands || existingCommands) {
        existingCommands = defaultCommands.concat(customCommands);
        console.log("ASDER");
        console.log("EXIST" + JSON.stringify(existingCommands));
    
        // Add event listener to capture keydown events
        window.addEventListener('keydown', async function (event) {
          const key = event.key;
    
          // Check if the key pressed is '/' or an alphanumeric character
          if (key === '/') {
            // Append the key to the command
            context = ' ';
    
            context = '/';
          }else if (/^[a-zA-Z0-9]$/.test(key) || key === ' ') {
            context += key.toLowerCase();
            console.log(context);
          }
          
          
          else if (key === 'Backspace') {
            context = context.slice(0, -1);
          } 
          else if (key === ';') {
            context += key.toLowerCase();
            console.log("COMOM"+context);
            
            chrome.storage.local.get('usedPrompt', ({ usedPrompt }) => {
              if (usedPrompt) {
                console.log("ASDSADAD"+usedPrompt);
                context = usedPrompt + context;
               
              }
            });
    
            console.log("CONT"+context);
            // ';' symbol detected, the command ends here
            // Check if the command is valid
            const { action, extractedContext } = isCommandValid(context);
            context = ' ';
            console.log("CONTEXT"+context);
    
            console.log("ACTIONNN"+action);
            if(isCommandValid){
              generateResponse(extractedContext, action)
              .then(generatedContent => {
                replaceCommandWithResponse(generatedContent, getActiveContentEditable());
              })
              .catch(error => {
                console.error('Error:', error);
              });
            }
           
          }
    
        }, true);
    
        
      }
    }
  })
 
 
});


var previousSelection = 'easterEGGG';
var translateButton = null;


var translateDiv = null;
var translateButton = null;
var closeBtn = null;

var selectedText = null;
var previousSelected = null; // Initialize with null

chrome.storage.sync.get('askAI_feature', function (data) {
  const isFeatureEnabled = data.askAI_feature || false;
  extpay.getUser().then(user => {
    if (user.paid) {

      if (isFeatureEnabled) {
        document.addEventListener('mouseup', function (event) {
          selectedText = getSelectedText();
          if (selectedText.trim() !== '' && selectedText.trim() !== ' ' && selectedText.trim() !== '  ' && selectedText.length > 2) {
            console.log("TEXT"+selectedText+previousSelected);
            if (!translateDiv && selectedText !== previousSelected) {
              showTranslateButton(selectedText, event.clientX, event.clientY);
              previousSelected = selectedText; // Update the previous selected text
              console.log("CALLED"+previousSelected);
        
            }
          } else if (translateDiv && (event.target !== translateButton && event.target !== translateDiv) && !closeBtn) {
            translateDiv.remove();
            translateDiv = null;
            console.log("CALLED1");
        
            //previousSelected = null; // Reset the previous selected text
          }
        });
        
        document.addEventListener('mousedown', function (event) {
           if (translateDiv && (event.target !== translateButton && event.target !== translateDiv) && !closeBtn) {
            translateDiv.remove();
            translateDiv = null;
            console.log("CALLED2");
        
            //previousSelected = null; // Reset the previous selected text
          }
        });
        
        document.addEventListener("keydown", function(event) {
          if ((event.key === "Backspace" || event.key === "Delete") && translateDiv) {
            translateDiv.remove();
            translateDiv = null;
            console.log("CALLED3");

          }
        });
        
        // Function to get selected text
        function getSelectedText() {
          const selection = window.getSelection();
          return selection.toString();
        }
        
        
        
        
        // Function to show a translate button next to cursor
        function showTranslateButton(selectedText, x, y) {
          translateDiv = document.createElement('div');
          translateDiv.style.position = 'fixed';
          translateDiv.style.top = `${y - 10}px`;
          translateDiv.style.left = `${x + 10}px`;
          translateDiv.classList.add("ask-cosmo-container");
          
        
          translateButton = document.createElement('button');
          translateButton.textContent = 'ASK COSMO';
          translateButton.style.position = 'relative';
          translateButton.classList.add("prompt-button");
          translateButton.onclick = function () {
            translateButton.textContent = "Loading..."
            translateText(selectedText, x, y);
            createPopup(x + 10, y - 10, "Translation or information goes here...");
            translateDiv.remove();
          };
        
          translateDiv.appendChild(translateButton);
          document.body.appendChild(translateDiv);
        }
        
        // Function to translate text (replace with your translation logic)
        function translateText(text, x, y) {
          if(text.length < 100){
            generateResponse(text, "If the text is not in English, translate it. Else, provide information about this text. If it is a question, try to answer it. ")
                .then(generatedContent => {
                  const generatedSpan = document.createElement('span');
                  generatedSpan.textContent = generatedContent;
              
                  translateDiv.appendChild(generatedSpan);                  
                  translateDiv.style.backgroundColor = "green";
                  translateDiv.style.userSelect = "none";
                  // Add event listeners for dragging the div
                  let isDragging = false;
                  let offsetX = 0;
                  let offsetY = 0;
        
                  translateDiv.addEventListener("mousedown", (e) => {
                   isDragging = true;
                 offsetX = e.clientX - translateDiv.offsetLeft;
                 offsetY = e.clientY - translateDiv.offsetTop;
                });
        
                document.addEventListener("mousemove", (e) => {
                 if (isDragging) {
                 const newX = e.clientX - offsetX;
                 const newY = e.clientY - offsetY;
        
                  translateDiv.style.left = `${newX}px`;
                 translateDiv.style.top = `${newY}px`;
                  }
                });
        
                  document.addEventListener("mouseup", () => {
                    isDragging = false;
                  });
        
                  translateButton.remove();
                  translateButton = null;
                  closeBtn = document.createElement('button');
                  closeBtn.textContent = 'CLOSE';
                  closeBtn.style.position = 'relative';
                  closeBtn.classList.add("prompt-button");

                  closeBtn.onclick = function () {
                    translateDiv.remove();
                    translateButton = null;
                    closeBtn = null;
                    translateDiv = null;
                  };
                 
        
                  const copyBtn = document.createElement('button');
                  copyBtn.textContent = 'COPY';
                  copyBtn.style.position = 'relative';
                  copyBtn.classList.add("prompt-button");

                  copyBtn.onclick = function () {
                    copyToClipboard(generatedContent);
                    copyBtn.innerText = "COPIED";
                  };
                  translateDiv.appendChild(copyBtn);
                  translateDiv.appendChild(closeBtn);
        
                })
                .catch(error => {
                  console.error('Error:', error);
                });
          }
          else{
             console.log("Text is too long for translation.");
            displayGeneratedResponse("Text is too long for translation.",x, y);
            
          }
        }
        }
    else{
      console.log("NOT EN");
    }

    }
  
  
  })
  

  
});












// iframe
var iframe = document.getElementsByTagName('iframe')[0];

extpay.getUser().then(user => {
  if (user.paid) {
    if (iframe) {
      iframe.contentDocument.addEventListener('keydown', function (evt) {
        console.log('iframe keypress: ' + evt.which);
        const key = event.key;
    
        // Check if the key pressed is '/' or an alphanumeric character
        if (key === '/') {
          // Append the key to the command
          context = ' ';
    
          context = '/';
        }else if (/^[a-zA-Z0-9]$/.test(key) || key === ' ') {
          context += key.toLowerCase();
          console.log(context);
        }
        
        
        else if (key === 'Backspace') {
          context = context.slice(0, -1);
        } 
        else if (key === ';') {
          context += key.toLowerCase();
          console.log("COMOM"+context);
         
    
          // ';' symbol detected, the command ends here
          // Check if the command is valid
          const { action, extractedContext } = isCommandValid(context);
          console.log("ACTIONNN"+action);
          generateResponse(extractedContext, action)
          .then(generatedContent => {
            replaceCommandWithResponse(generatedContent, getActiveContentEditable());
          })
          .catch(error => {
            console.error('Error:', error);
          });
          command = '';
        }
        
      }, true);
    
    }

  }

})





function getActiveContentEditable() {
  const activeElement = document.activeElement;
  if (activeElement && activeElement.isContentEditable) {
    console.log("CONTEDITABLE FOUND");

    return activeElement;
  }
  else if (activeElement && activeElement.tagName.toLowerCase() === "textarea") {
    console.log("TEXTAREA FOUND");
    return activeElement;
  }
  
  return null;
}




//check if command is valid
function isCommandValid(input) {
  // Check if the input starts with any of the commands from existingCommands
  const matchingCommand = existingCommands.find(({ command }) => input.startsWith("/" + command));
  let extractedContext = '';
  // If a matching command is found, return the corresponding action
  if (matchingCommand) {
    console.log("MATXCHING"+JSON.stringify(matchingCommand.command));
    
      console.log("INPUT"+input);
      extractedContext = input.substring(JSON.stringify(matchingCommand.command).length);
      extractedContext = extractedContext.slice(0, -1);

      console.log("EXTRACTED" + extractedContext);
    
    return { action: matchingCommand.action, extractedContext };

  }
  else{
    console.log("NOT MATCHING");
  }
 
}

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


let popupDiv = null;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;


function displayGeneratedResponse(generatedResponse,x, y) {
  if (popupDiv) {
    // If the popupDiv exists, remove it from the DOM before creating a new one
    popupDiv.remove();
  }

  // Create the new popupDiv
  popupDiv = document.createElement("div");
  popupDiv.id = "popupDivAI"; // Set the id attribute
  popupDiv.style.userSelect = "none";
  popupDiv.innerText = generatedResponse;
  popupDiv.style.position = "fixed";
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  // Position the popupDiv in the center of the screen
  popupDiv.style.top = `${centerY}px`;
  popupDiv.style.left = `${centerX}px`;
  popupDiv.style.backgroundColor = "white";
  popupDiv.style.borderRadius = "25px";
  popupDiv.style.padding = "10px";
  popupDiv.style.border = "1px solid black";
  popupDiv.style.zIndex = "9999";
  popupDiv.style.cursor = "move"; // Set the cursor to "move" to indicate it's draggable
  popupDiv.style.boxShadow = "rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px";
  popupDiv.style.fontFamily = "Arial, sans-serif"; // Replace with your desired font-family
  popupDiv.style.userSelect = "none";

  // Create a copy button
  const copyButton = document.createElement("button");
  copyButton.innerText = "Copy";
  copyButton.style.marginRight = "10px";
  copyButton.style.marginLeft = "10px";
  copyButton.style.borderRadius = "25px";

  // Add an event listener to the copy button
  copyButton.addEventListener("click", () => {
    copyToClipboard(generatedResponse);
    copyButton.innerText = "Copied";
  });

  // Create a close button
  const closeButton = document.createElement("button");
  closeButton.innerText = "Close";
  closeButton.style.marginTop = "10px";
  closeButton.style.borderRadius = "25px";

  // Add an event listener to the close button
  closeButton.addEventListener("click", () => {
    popupDiv.remove();
  });

  // ... your existing code ...

  // Add event listeners for dragging the div
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  popupDiv.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - popupDiv.offsetLeft;
    offsetY = e.clientY - popupDiv.offsetTop;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      const newX = e.clientX - offsetX;
      const newY = e.clientY - offsetY;

      popupDiv.style.left = `${newX}px`;
      popupDiv.style.top = `${newY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  

  // Append the copy and close buttons to the popup div
  popupDiv.appendChild(copyButton);
  popupDiv.appendChild(closeButton);

  // Append the popupDiv to the body
  document.body.appendChild(popupDiv);
}




function copyToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}






// Listen for messages from the popup script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "getGeneratedResponse") {
    // Replace 'generatedResponse' with the actual generated response you have
    const generatedResponse = generatedResponse;
    sendResponse({ responseText: generatedResponse });
  }
  
});

//place cursor at the end of the generated output
function placeCaretAtEnd(el) {
  el.focus();
  if (typeof window.getSelection != 'undefined' && typeof document.createRange != 'undefined') {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else if (typeof document.body.createTextRange != 'undefined') {
    const textRange = document.body.createTextRange();
    textRange.moveToElementText(el);
    textRange.collapse(false);
    textRange.select();
  }
}




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
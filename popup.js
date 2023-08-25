
const extpay = ExtPay('cosmo') 



document.addEventListener('DOMContentLoaded', () => {


  
  

  extpay.getUser().then(user => {
    if (user.paid) {
      hidePayOverlay();

    }
    else{
      showPayOverlay();
      document.getElementById('getStartedButton').addEventListener('click', function() {
        extpay.openPaymentPage();

      
      });

      document.getElementById('loginButton').addEventListener('click', function() {
        extpay.openLoginPage();

      
      });
       



    }
}).catch(err => {
    document.querySelector('p').innerHTML = "Error fetching data :( Check that your ExtensionPay id is correct and you're connected to the internet"
})

 

   
  const sendBtn = document.getElementById('sendBtn');
 
  sendBtn.addEventListener('click', () => {
      sendMessage();
  });

  // Get the current tab's ID using chrome.tabs.query
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
          const tabId = tabs[0].id;

          // Retrieve tab-specific conversation history from storage
          chrome.storage.local.get({ conversationHistories: {} }, function (result) {
              const conversationHistories = result.conversationHistories;
              const tabConversationHistory = conversationHistories[tabId] || [];
              displayConversationHistory(tabConversationHistory); // Display the conversation history
          });
      }
  });
});

function sendMessage() {
  const inputTextarea = document.getElementById('inputTextarea');
  const userMessage = inputTextarea.value.trim();

  if (userMessage !== '') {
    const chatWindow = document.getElementById('chatWindow');
    const userMessageDiv = document.createElement('div');
    userMessageDiv.style.paddingBottom = '10px';

    userMessageDiv.className = 'user-message';
    userMessageDiv.textContent = userMessage;
    chatWindow.appendChild(userMessageDiv);

    chatWindow.scrollTop = chatWindow.scrollHeight;


    // Get the current tab's ID using chrome.tabs.query
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0) {
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage(
          tabId, // Pass the tab ID
          { userMessage: userMessage, tabId: tabId }, // Pass the userMessage and tabId
          function (response) {
            if (response && response.aiResponse) {
              console.log('AI Response:', response.aiResponse);
              displayAIResponse(response.aiResponse);
            }
          }
        );
      }
    });

    inputTextarea.value = '';
  }
}


function displayAIResponse(aiResponse) {
  const chatWindow = document.getElementById('chatWindow');
  const aiMessage = document.createElement('div');
  aiMessage.className = 'ai-message';

  // Check if output contains code
  const regex = /```(?:[^\n]+)?\n([\s\S]*?)```/g;
  const matches = aiResponse.match(regex);

  if (matches) {
    // Split response into code and text sections
    const sections = aiResponse.split(regex);

    for (let i = 0; i < sections.length; i++) {
      if (i % 2 === 1) {
        // Create and append code block element
        const codeElement = document.createElement('pre');
        codeElement.className = 'code-block';
        codeElement.textContent = sections[i];
        
        aiMessage.appendChild(codeElement);
      } else {
        // Create and append regular text element
        const textElement = document.createElement('div');
        textElement.textContent = sections[i];
        textElement.style.paddingBottom = "10px";
        aiMessage.appendChild(textElement);
      }
    }
  } else {
    // Display regular text response
    aiMessage.textContent = aiResponse;
    aiMessage.style.paddingBottom = "10px";
  }

  chatWindow.appendChild(aiMessage);

  chatWindow.scrollTop = chatWindow.scrollHeight;

}

function displayConversationHistory(conversationHistory) {
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.innerHTML = ''; // Clear previous messages

  for (const message of conversationHistory) {
    const messageDiv = document.createElement('div');
    messageDiv.className = message.role === 'user' ? 'user-message' : 'ai-message';

    // Check if the message content contains code blocks
    const regex = /```(?:[^\n]+)?\n([\s\S]*?)```/g;
    const matches = message.content.match(regex);

    if (matches) {
      // Split message content into code and text sections
      const sections = message.content.split(regex);

      for (let i = 0; i < sections.length; i++) {
        if (i % 2 === 1) {
          // Create and append code block element
          const codeElement = document.createElement('pre');
          codeElement.className = 'code-block';
          codeElement.textContent = sections[i];
          messageDiv.appendChild(codeElement);
        } else {
          // Create and append regular text element
          const textElement = document.createElement('div');
          textElement.textContent = sections[i];
          textElement.style.paddingBottom = '10px';
          messageDiv.appendChild(textElement);
        }
      }
    } else {
      messageDiv.textContent = message.content;
      messageDiv.style.paddingBottom = '10px';
    }

    chatWindow.appendChild(messageDiv);

  }
}



document.addEventListener('DOMContentLoaded', () => {
  
  
    // Toggle menu container visibility when the menu button is clicked
    const menuButton = document.getElementById('menuButton');
    const menuContainer = document.getElementById('menuContainer');
  
    menuButton.addEventListener('click', (event) => {
      if (menuContainer.style.display === 'none') {
        menuContainer.style.display = 'block';
      } else {
        menuContainer.style.display = 'none';
      }
    });
  
    // Close the menu container when clicking outside
    document.addEventListener('click', (event) => {
      if (!menuButton.contains(event.target) && !menuContainer.contains(event.target)) {
        menuContainer.style.display = 'none';
      }
    });
  });


   // Show the overlay
   function showPayOverlay() {
    const registerOverlay = document.getElementById('registerOverlay');

    registerOverlay.style.display = 'block';
  }

  // Hide the overlay
  function hidePayOverlay() {
    const registerOverlay = document.getElementById('registerOverlay');

    registerOverlay.style.display = 'none';
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'userPaid') {
      hidePayOverlay();
    }
  });



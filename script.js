/*
  TODO::
    - cancel user typing animation on message send - needs refactor
    - message time
    - database (MongoDB/ firebase??)
    - user
    - links
    - photos

    RESOURCES::
      -- Tutorials
      - https://www.freecodecamp.org/news/simple-chat-application-in-node-js-using-express-mongoose-and-socket-io-ee62d94f5804/
      - https://www.youtube.com/watch?v=rxzOqP9YwmM

      -- Emoji
      https://afeld.github.io/emoji-css/
*/

// Socket IO
const socket = io('http://localhost:3000');

socket.on('chat-message', data => {
  // Cancel the user typing indicator
  controller.CancelTypingAnimationTimer();

  uiController.DisplayMessage(data, false);
});

socket.on('userJoinChatMessage', data => {
  uiController.DisplayRoomMessage(data + ' has joined the chat', true);
  uiController.ClearUserList();
});

socket.on('userLeftChatMessage', data => {
  uiController.DisplayRoomMessage(data + ' has left the chat', false);
  uiController.ClearUserList();
});

socket.on('connectedUserCount', data => {
  uiController.UpdateUserCount(data);
});

socket.on('connectedUsers', data => {
  uiController.ClearUserList();

  for (let user in data) {
    uiController.AppnedUserTolist(data[user]);
  }
});

socket.on('userTyping', data => {
  controller.OtherUserTyping();
})

// Classes
class User {
  constructor(userId, userName, isRoomAdmin) {
    this.userId = userId;
    this.userName = userName;
    this.isRoomAdmin = isRoomAdmin;
  }

  get userName() {
    return this._userName;
  }

  set userName(value) {
    this._userName = value;
  }

  static InitUser() {
    // let userName = prompt('Enter username');
    let userName = 'test_' + Math.floor(Math.random() * Math.floor(100));

    return new User(0, userName, false);
  }

  static JoinChatMessage(userName) {
    socket.emit('userJoinChat', userName);
  }
}
class Message {
  constructor(messageText, senderName) {
    this.messageText = messageText;
    this.recordCreated = new Date();
    this.senderName = senderName;
  }

  get messageText() {
    return this._messageText;
  }

  set messageText(value) {
    this._messageText = value;
  }

  static GetPreviousMessage() {
    return messageArr[messageArr.length - 2];
  }
}

// Global variables
let messageArr = [];
let currentUser;
let isTypingIndicatorTimerRunning = false;
let typingIndicatorTimer = null;

let uiController = function() {
  const DOMStrings = {
    txtMessage: 'txtMessage',
    btnSendMessage: 'btnSendMessage',
    MessagesContainer: 'MessagesContainer',
    txtConnectedUserCount: 'txtConnectedUserCount',
    userList: 'userList',
    typingIndicator: 'typingIndicator',
    txtValidation: 'txtValidation',
    txtUserName: 'txtUserName',
    WelcomeModal: 'WelcomeModal',
    btnJoinChat: 'btnJoinChat',
    txtUserNameInfo: 'txtUserNameInfo',
    txtLogOut: 'txtLogOut',
    btnEmoji: 'btnEmoji'
  }

  function CreateMessageContainer(isCurrentUser) {
    let divElem = document.createElement("div");
    let classList;

    classList = "messageContainer row";
    classList +=
      isCurrentUser === true ?
      " userMessageContainer float-right" :
      " otherUserMessageContainer float-left";

    divElem.className = classList;

    return divElem;
  }

  function CreateMessageGroupContainer(isCurrentUser) {
    let divElem = document.createElement("div");
    let classList = isCurrentUser === true ? "float-right" : "float-left";

    classList += " messageGroup row";
    divElem.className = classList;

    return divElem;
  }

  function CreatTimestampConatiner(isCurrentUser) {
    let timestampContainer = document.createElement("div");
    let classList = "timestampContainer row";

    classList += isCurrentUser === true ? " float-right" : " float-left";
    timestampContainer.className = classList;

    return timestampContainer;
  }

  function CreateMessageTimestamp(userName, recordCreated, isCurrentUser) {
    let pElem = document.createElement("p");
    let str = "";

    if (!isCurrentUser) {
      str += `${userName} `;
    }

    //str += recordCreated.getUTCHours() + ":" + recordCreated.getUTCMinutes();

    pElem.innerHTML = str;
    pElem.className = "timestamp";

    return pElem;
  }

  function CreatemessageParagraph(message, isCurrentUser) {
    let pElem = document.createElement("p");
    let classList;

    pElem.innerHTML = message._messageText;

    // Element class
    classList =
      isCurrentUser === true ?
      "currentUserMessage float-right" :
      "otherUserMessage float-left";
    classList += " message";

    pElem.className = classList;

    return pElem;
  }

  function AppendHTMLToMessageBox(htmlToAppend) {
    txtMessage = document.getElementById(DOMStrings.txtMessage).innerHTML += htmlToAppend + ' ';
  }

  function setEndOfContenteditable(contentEditableElement) {
    let range, selection;

    range = document.createRange(); //Create a range (a range is a like the selection but invisible)
    range.selectNodeContents(contentEditableElement); //Select the entire contents of the element with the range
    range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
    selection = window.getSelection(); //get the selection object (allows you to change selection)
    selection.removeAllRanges(); //remove any selections already made
    selection.addRange(range); //make the range you have just created the visible selection
  }

  return {

    GetDOMStrings: function() {
      return DOMStrings;
    },

    DisplayMessage: function(message, isCurrentUser) {
      let messageGroupContainer = CreateMessageGroupContainer(isCurrentUser);
      let messagesContainer = document.getElementById(DOMStrings.MessagesContainer);
      let messageDiv = CreateMessageContainer(isCurrentUser);
      let messageParagraph = CreatemessageParagraph(message, isCurrentUser);
      let timestampContainer = CreatTimestampConatiner(isCurrentUser);
      let timestampElement = CreateMessageTimestamp(
        message.senderName,
        message.recordCreated,
        isCurrentUser
      );
      let lastMessage = Message.GetPreviousMessage();

      messagesContainer.appendChild(messageGroupContainer);
      messageGroupContainer.appendChild(messageDiv);
      messageDiv.appendChild(timestampContainer);
      timestampContainer.appendChild(timestampElement);
      messageDiv.appendChild(messageParagraph);
    },

    OpenWelcomeModal: function() {
      document.getElementById(DOMStrings.txtUserName).value = '';
      document.getElementById(DOMStrings.txtUserName).focus();
      $('#' + DOMStrings.WelcomeModal).modal('show');
    },

    ResizeTextBox: function() {
      let txtMessage, offset;

      txtMessage = document.getElementById(DOMStrings.txtMessage);
      txtMessage.style.boxSizing = 'border-box';

      offset = txtMessage.offsetHeight - txtMessage.clientHeight;

      txtMessage.style.height = 'auto';
      txtMessage.style.height = txtMessage.scrollHeight + offset + 'px';
    },

    ClearTextBox: function(textBoxId) {
      document.getElementById(textBoxId).innerHTML = '';
    },

    ClearUserList: function() {
      document.getElementById(DOMStrings.userList).innerHTML = '';
    },

    UpdateUserCount: function(userCount) {
      document.getElementById(DOMStrings.txtConnectedUserCount).innerHTML = userCount;
    },

    DisplayUserTypingIndicator: function(isDisplayMessage) {
      let typingIndicatorElement = document.getElementById(DOMStrings.typingIndicator);

      if (isDisplayMessage) {
        typingIndicatorElement.style.display = 'block';
      } else {
        typingIndicatorElement.style.display = 'none';
      }
    },

    SetElementDisplayProperty: function(elementId, isShow) {
      document.getElementById(elementId).style.display = isShow ? 'block' : 'none';
    },

    SetPElementText: function(elementId, value) {
      document.getElementById(elementId).innerHTML = value;
    },

    ToggleModal: function(modaliD, isShow) {

      if (isShow) {
        $('#' + modaliD).modal('show');
      } else {
        $('#' + modaliD).modal('hide');
      }
    },

    ScrollToBottomOfMessageContainer: function() {
      let messagesContainer = document.getElementById(DOMStrings.MessagesContainer);

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    AppnedUserTolist: function(user) {
      let lstUser = document.getElementById(DOMStrings.userList);
      let liElem = document.createElement("li");

      liElem.className = "list-group-item d-flex justify-content-between align-items-center";
      liElem.appendChild(document.createTextNode(user));

      lstUser.appendChild(liElem);
    },

    DisplayRoomMessage: function(messageText, isSuccess) {
      let messageGroupElem = document.createElement("div");

      messageGroupElem.className = "messageGroup row float-left";

      let divElem = document.createElement("div");
      divElem.className = "messageContainer row channelInfoMessageContainer float-left";

      let messagesContainer = document.getElementById(DOMStrings.MessagesContainer);
      let pElem = document.createElement("p");
      let classList = "message"
      classList += isSuccess === true ? " channelInfoMessageSuccess" : " channellInfoMessageDanger";
      pElem.className = classList;

      pElem.innerHTML = messageText;

      messagesContainer.appendChild(messageGroupElem);
      messageGroupElem.appendChild(divElem);
      divElem.appendChild(pElem);

      this.ScrollToBottomOfMessageContainer();
    },

    AddEmoji: function(e) {
      let emojiContainer = document.createElement('div');
      emojiContainer.innerHTML = this.innerHTML

      let txtMessage = document.getElementById(DOMStrings.txtMessage);
      txtMessage.innerHTML += this.innerHTML + '&nbsp;';

      setEndOfContenteditable(txtMessage);
    }
  }
}();

let messageController = function() {

}();

let userController = function() {

  return {
    ValidateUserName: function(userName) {
      let userValidationResult = null;

      // Validate user name
      if (userName.length > 0) {

        // Check for whitespace
        if (/\s/.test(userName)) {

          userValidationResult = {
            validationResult: false,
            validationText: 'user name cannot contain spaces'
          };
        }

        // Character length
        if (userName.length > 25 && userValidationResult == null) {

          userValidationResult = {
            validationResult: false,
            validationText: 'user name cannot contain more than 25 characters'
          };
        }
      } else if (userValidationResult == null) {

        userValidationResult = {
          validationResult: false,
          validationText: 'You must enter a user name before you can join the chat'
        };
      }

      if (userValidationResult == null) {
        userValidationResult = {
          validationResult: true,
          validationText: ''
        };
      }

      return userValidationResult;
    },

    CreateUser: function(userName) {
      currentUser = new User(0, userName, false);

      // Joined chat message
      User.JoinChatMessage(currentUser._userName);
    },

    LogOut: function() {
      currentUser = null;
    }
  }
}();

let controller = function(messageCtrl, userCtrl, uiCtrl) {
  let DOMStrings = uiCtrl.GetDOMStrings();

  function SetUpEventListeners() {

    document.getElementById(DOMStrings.btnJoinChat)
      .addEventListener('click', SubmitUserName);

    document.getElementById(DOMStrings.txtLogOut)
      .addEventListener('click', LogOut);

    // - btnSendMessage - click submit new message
    document
      .getElementById(DOMStrings.btnSendMessage)
      .addEventListener("click", SubmitMessage);

    // txtMessage - enter button press submit new message
    document
      .getElementById(DOMStrings.txtMessage)
      .addEventListener('keypress', function onEvent(event) {
        if (event.keyCode === 13) {
          SubmitMessage();
        }
      });

    // txtMessage - key down
    document
      .getElementById(DOMStrings.txtMessage)
      .addEventListener("keydown", CurrentUserTyping);

    // txtMessage - paste
    document
      .getElementById(DOMStrings.txtMessage)
      .addEventListener("paste", CurrentUserTyping);


    // txtMessage - prevent new line on enter press
    document
      .getElementById(DOMStrings.txtMessage)
      .addEventListener('keypress', function() {
        if (event.which === 13) {
          event.preventDefault();
        }
      });

    // txtMessage - auto resize
    document
      .getElementById(DOMStrings.txtMessage)
      .addEventListener('input', uiCtrl.ResizeTextBox);

    // Emoji - click
    let btnEmojiArr = document.getElementsByClassName(DOMStrings.btnEmoji);

    for (var i = 0; i < btnEmojiArr.length; i++) {
      btnEmojiArr[i].addEventListener('click', uiCtrl.AddEmoji);
    }
  };

  function SubmitUserName() {
    let userName = document.getElementById(DOMStrings.txtUserName).value;
    let userNameValidationResult = userCtrl.ValidateUserName(userName);

    // Username validation result
    uiCtrl.SetPElementText(DOMStrings.txtValidation, userNameValidationResult.validationText);
    uiCtrl.SetElementDisplayProperty(DOMStrings.txtValidation, !userNameValidationResult.validationResult);

    if (userNameValidationResult.validationResult === true) {

      // Create user
      userCtrl.CreateUser(userName);

      uiCtrl.SetPElementText(DOMStrings.txtUserNameInfo, currentUser._userName);
      uiCtrl.SetElementDisplayProperty(DOMStrings.txtUserNameInfo, true);

      // Hide Welcome modal
      uiCtrl.ToggleModal(DOMStrings.WelcomeModal, false);
    }
  }

  function LogOut() {
    userCtrl.LogOut();

    uiCtrl.ClearTextBox(DOMStrings.txtUserNameInfo);
    uiCtrl.ClearTextBox(DOMStrings.txtUserName);

    uiCtrl.SetElementDisplayProperty(DOMStrings.txtUserNameInfo, false);

    // When user auth is fully done we should reload the page
    uiCtrl.ToggleModal(DOMStrings.WelcomeModal, true);
  }

  function SubmitMessage() {
    let txtMessage = document.getElementById(DOMStrings.txtMessage);

    if (txtMessage.innerHTML.length > 0) {
      let newMessage = new Message(txtMessage.innerHTML, currentUser._userName);

      messageArr.push(newMessage);

      uiCtrl.ClearTextBox(DOMStrings.txtMessage);
      uiCtrl.ResizeTextBox();
      uiCtrl.DisplayMessage(newMessage, true);
      uiCtrl.ScrollToBottomOfMessageContainer();

      // Submit message to server
      socket.emit('send-chat-message', newMessage);
    }
  }

  function CurrentUserTyping() {
    socket.emit('currentUserTyping', true);
  }

  function ResetTypingIndicatorTimer() {
    clearTimeout(typingIndicatorTimer);
    typingIndicatorTimer = null;
  }

  function StartTypingIndicatorTimer() {
    typingIndicatorTimer = setTimeout(function() {
      isTypingIndicatorTimerRunning = false;
      clearTimeout(typingIndicatorTimer);
      uiCtrl.DisplayUserTypingIndicator(false);
    }, 2500);

    isTypingIndicatorTimerRunning = true;
  }

  return {
    Init: function() {
      console.log('Application started');

      SetUpEventListeners();
      uiCtrl.ScrollToBottomOfMessageContainer();
      uiCtrl.ClearUserList();
      uiCtrl.OpenWelcomeModal();
    },

    OtherUserTyping: function() {
      uiCtrl.DisplayUserTypingIndicator(true);

      if (isTypingIndicatorTimerRunning == false) {
        StartTypingIndicatorTimer();
      } else {
        ResetTypingIndicatorTimer();
        isTypingIndicatorTimerRunning = false;
        StartTypingIndicatorTimer();
      }
    },

    CancelTypingAnimationTimer() {
      ResetTypingIndicatorTimer();
      isTypingIndicatorTimerRunning = false;
      uiCtrl.DisplayUserTypingIndicator(false);
    }
  }
}(messageController, userController, uiController);

controller.Init();
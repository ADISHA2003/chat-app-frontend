import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://192.168.29.247:3001');

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState('');
  const [room, setRoom] = useState('');
  const [chatIsVisible, setChatIsVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Connection status tracking
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [isConnected]);

  // Detect if the user is on a mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    setIsMobile(/android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(userAgent));
  }, []);

  // Receive message and add to the bottom of the messages list
  useEffect(() => {
    socket.on('receive_msg', (data) => {
      const msg = { text: `${data.user}: ${data.message}`, isSent: false };
      setMessages((prevState) => [...prevState, msg]);
    });

    socket.on('user_joined', (data) => {
      if (data.room === room && data.user !== user) {
        alert(`${data.user} has joined the room!`);
      }
    });

    return () => {
      socket.off('receive_msg');
      socket.off('user_joined');
    };
  }, [room, user]);

  // Scroll to the bottom of the chat after a new message
  useEffect(() => {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages]);

  // Handle entering the chat room
  const handleEnterChatRoom = () => {
    if (user !== '' && room !== '') {
      setChatIsVisible(true);
      socket.emit('join_room', { user, room });
    }
  };

  // Send message to the room
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const messageData = { room: room, user: user, message: newMessage };
      socket.emit('send_msg', messageData);
      setMessages((prevState) => [...prevState, { text: `You: ${newMessage}`, isSent: true }]);
      setNewMessage('');
    }
  };

  // Generate the SMS link
  const generateSmsLink = () => {
    const message = encodeURIComponent(`Join my chat room "${room}" at ${window.location.href}.`);
    return `sms:?&body=${message}`;
  };

  return (
    <div className="app">
      {!chatIsVisible ? (
        <div className="login-container">
          <h2>Welcome to Chat Room</h2>
          <div className="input-container">
            <input
              type="text"
              placeholder="Enter your username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Enter room name"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="input-field"
            />
            <button onClick={handleEnterChatRoom} className="enter-button">Enter Room</button>
          </div>
          {isMobile && room && (
            <a href={generateSmsLink()} className="sms-link">
              <button className="sms-button">Invite via SMS</button>
            </a>
          )}
          {!isMobile && room && (
            <p className="sms-notification">SMS invites only work on mobile devices.</p>
          )}
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-header">
            <h5>Room: {room} | User: {user}</h5>
          </div>
          <div className="messages-container" id="messages-container">
            {messages.map((el, index) => (
              <div
                key={index}
                className={`message ${el.isSent ? 'you' : 'others'}`}
              >
                {el.text}
              </div>
            ))}
          </div>
          <div className="message-input-container">
            <input
              type="text"
              placeholder="Type a message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="input-field message-input"
            />
            <button
              onClick={handleSendMessage}
              className="send-button"
              disabled={!newMessage.trim()} // Disable the button if input is empty
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

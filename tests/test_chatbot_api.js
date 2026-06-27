import fetch from 'node-fetch';

async function testChatbot() {
  const url = 'http://localhost:5000/api/chatbot';
  const data = {
    message: "Hello, how do I recycle my old phone?"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Chatbot API response:', result);
  } catch (error) {
    console.error('Error calling chatbot API:', error);
  }
}

testChatbot();

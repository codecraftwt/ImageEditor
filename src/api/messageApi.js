export const sendMessageToServer = async (messageText) => {
  try {
    const response = await fetch('https://z2x0r4x7-5000.inc1.devtunnels.ms/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: messageText }),
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Message sent successfully:', data)
    return data
  } catch (error) {
    console.error('❌ Failed to send message:', error.message)
    console.log(error.message)
    throw error
  }
}

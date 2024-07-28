import React from 'react'

const MyComponent = () => {
  const handler = () => {
    console.log('clicked from handler')
  }
  return <button onClick={handler}>Hello from MyComponent</button>
}

export default MyComponent

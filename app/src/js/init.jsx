import { createRoot } from 'react-dom/client'
import { WidgetWrapper } from '@leon-ai/aurora'

const container = document.querySelector('#init')
const root = createRoot(container)

function Init() {
  return <></>
}

root.render(<Init />)

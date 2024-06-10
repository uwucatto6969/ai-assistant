import { useLayoutEffect, useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import {
  WidgetWrapper,
  Text,
  Icon,
  Flexbox,
  List,
  ListHeader,
  ListItem,
  Loader
} from '@leon-ai/aurora'

const container = document.querySelector('#init')
const root = createRoot(container)

function Item({ children, status }) {
  if (status === 'error') {
    return <ErrorListItem>{children}</ErrorListItem>
  }
  if (status === 'warning') {
    return <WarningListItem>{children}</WarningListItem>
  }
  if (status === 'success') {
    return <SuccessListItem>{children}</SuccessListItem>
  }
  if (status === 'loading') {
    return <LoadingListItem>{children}</LoadingListItem>
  }

  return <ListItem>{children}</ListItem>
}

function LoadingListItem({ children }) {
  return (
    <ListItem>
      <Flexbox flexDirection="row" alignItems="center" gap="sm">
        <Loader size="sm" />
        <Text>{children}</Text>
      </Flexbox>
    </ListItem>
  )
}
function ErrorListItem({ children }) {
  return (
    <ListItem>
      <Flexbox flexDirection="row" alignItems="center" gap="sm">
        <Icon
          name="close"
          size="sm"
          type="fill"
          bgShape="circle"
          color="red"
          bgColor="transparent-red"
        />
        <Text>{children}</Text>
      </Flexbox>
    </ListItem>
  )
}
function WarningListItem({ children }) {
  return (
    <ListItem>
      <Flexbox flexDirection="row" alignItems="center" gap="sm">
        <Icon
          name="alert"
          size="sm"
          type="fill"
          bgShape="circle"
          color="yellow"
          bgColor="transparent-yellow"
        />
        <Text>{children}</Text>
      </Flexbox>
    </ListItem>
  )
}
function SuccessListItem({ children }) {
  return (
    <ListItem>
      <Flexbox flexDirection="row" alignItems="center" gap="sm">
        <Icon
          name="check"
          size="sm"
          type="fill"
          bgShape="circle"
          color="green"
          bgColor="transparent-green"
        />
        <Text>{children}</Text>
      </Flexbox>
    </ListItem>
  )
}

function Init() {
  const parentRef = useRef(null)
  const [config, setConfig] = useState(window.leonConfigInfo)
  const [clientCoreServerHandshakeStatus, setClientCoreServerHandshakeStatus] =
    useState('loading')
  const [tcpServerBootStatus, setTcpServerBootStatus] = useState('loading')
  const [llmStatus, setLLMStatus] = useState('loading')
  const [areAllStatusesSuccess, setAreAllStatusesSuccess] = useState(false)
  const statusSetterMap = {
    clientCoreServerHandshake: setClientCoreServerHandshakeStatus,
    tcpServerBoot: setTcpServerBootStatus,
    llm: setLLMStatus
  }
  const statuses = [
    clientCoreServerHandshakeStatus,
    tcpServerBootStatus,
    llmStatus
  ]

  useLayoutEffect(() => {
    setTimeout(() => {
      parentRef.current.classList.remove('not-initialized')
    }, 250)

    window.leonInitStatusEvent.addEventListener('initStatusChange', (event) => {
      const { statusName, statusType } = event.detail

      statusSetterMap[statusName](statusType)
    })
  }, [])

  useEffect(() => {
    const areAllStatusesSuccess = statuses.every(
      (status) => status === 'success'
    )

    setAreAllStatusesSuccess(areAllStatusesSuccess)
  }, statuses)

  useEffect(() => {
    if (window.leonConfigInfo) {
      setConfig(window.leonConfigInfo)
    }
  }, [window.leonConfigInfo])

  return (
    <div
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: 'var(--black-color)'
      }}
      ref={parentRef}
      className={areAllStatusesSuccess ? 'initialized' : 'not-initialized'}
    >
      <div
        style={{
          position: 'absolute',
          top: '33%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <WidgetWrapper noPadding>
          <List>
            <ListHeader>Leon is getting ready...</ListHeader>
            <Item status={clientCoreServerHandshakeStatus}>
              Client and core server handshaked
            </Item>
            <Item status={tcpServerBootStatus}>TCP server booted</Item>
            {config && (
              <>
                {config.llm.enabled && (
                  <Item status={llmStatus}>LLM loaded</Item>
                )}
              </>
            )}
          </List>
        </WidgetWrapper>
      </div>
    </div>
  )
}

root.render(<Init />)

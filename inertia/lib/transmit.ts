import { Transmit } from '@adonisjs/transmit-client'
import { useEffect } from 'react'

export const transmitClient = new Transmit({
  baseUrl: 'http://localhost:3333',
  onSubscription(channel) {
    // console.log(`Subscribed to ${channel}`)
  },
})

interface UseTransmitClientProps {
  channel: string
  onMessage: (data: any) => void
}

export const useRealTimeClient = ({ channel, onMessage }: UseTransmitClientProps) => {
  useEffect(() => {
    const subscription = transmitClient.subscription(channel)
    subscription.create()

    const stopListening = subscription.onMessage((data) => {
      onMessage(data)
    })

    return () => {
      stopListening()
    }
  }, [channel])
}

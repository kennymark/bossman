import type { AxiosError } from 'axios'
import { capitalizeFirstLetter } from './string'
export interface ServerErrorResponse {
  response: AxiosError<{
    type: string
    messages: {
      message: string
    }[]
  }> & {
    data: {
      type: string
      message: string
      error: string

      exists: boolean
      messages: {
        message: string
      }[]
    }
  }
}

export function serverErrorResponder(err: ServerErrorResponse, altMessageIfExists = '') {
  const data = err.response.data
  if (data instanceof Blob) {
    // @ts-expect-error
    return `${err.code}: ${err.message} `
  }
  if (data && data?.type === 'validation') {
    return (
      data?.messages?.map((res) => capitalizeFirstLetter(`${res?.message} \n`)).toString() || ''
    )
  }

  if (data?.error) {
    return data.error
  }

  if (data?.message) {
    return data.message
  }

  if (data?.exists) {
    return altMessageIfExists || data.error
  }
}

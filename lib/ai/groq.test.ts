import { afterEach, describe, expect, it } from 'vitest'
import { getGroqModel } from './groq-model'

const originalModel = process.env.GROQ_MODEL

afterEach(() => {
  if (originalModel === undefined) {
    delete process.env.GROQ_MODEL
  } else {
    process.env.GROQ_MODEL = originalModel
  }
})

describe('getGroqModel', () => {
  it('uses the current default Groq free-tier replacement model', () => {
    delete process.env.GROQ_MODEL

    expect(getGroqModel()).toBe('openai/gpt-oss-20b')
  })

  it('uses an explicitly configured Groq model', () => {
    process.env.GROQ_MODEL = 'custom-model'

    expect(getGroqModel()).toBe('custom-model')
  })
})

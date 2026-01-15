import axios from 'axios'

const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL

if (!n8nWebhookUrl) {
    console.warn('Missing N8N Webhook URL environment variable')
}

export const n8n = {
    triggerWorkflow: async (workflowName: string, data: any) => {
        if (!n8nWebhookUrl) {
            throw new Error('N8N Webhook URL not configured')
        }
        try {
            const response = await axios.post(`${n8nWebhookUrl}/${workflowName}`, data)
            return response.data
        } catch (error) {
            console.error('Error triggering N8N workflow:', error)
            throw error
        }
    }
}

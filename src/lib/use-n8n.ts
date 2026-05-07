import { useCallback } from "react"
import { triggerWorkflow } from "./n8n"
import { useClient } from "../context/client-context"
import { useUser } from "../context/user-context"

/**
 * Hook that wires triggerWorkflow into the current client + user context,
 * so service pages just supply the workflow name + payload.
 */
export function useN8n() {
    const { client, n8nWebhookBase } = useClient()
    const { user } = useUser()

    const trigger = useCallback(
        async <R = unknown>(workflowName: string, payload: Record<string, unknown>, serviceId?: string | null) => {
            if (!client) {
                return { executionId: null, response: null, error: "No client context." }
            }
            return triggerWorkflow<R>(workflowName, payload, {
                clientId: client.id,
                serviceId,
                webhookBase: n8nWebhookBase,
                triggeredBy: user?.id ?? null,
            })
        },
        [client, n8nWebhookBase, user]
    )

    return { trigger, ready: Boolean(client) }
}
